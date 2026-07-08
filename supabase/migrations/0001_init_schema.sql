-- =============================================================================
-- JobMo — Phase 1: Foundation schema
-- Roles, profiles, audit logging, and RBAC helper functions.
-- Run this in the Supabase SQL Editor (or via `supabase db push`) in order.
-- Name this query: "phase1_init_schema"
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Extensions
-- ---------------------------------------------------------------------------
create extension if not exists "pgcrypto";      -- gen_random_uuid()
create extension if not exists "pg_trgm";        -- fuzzy search, used from Phase 2+ onward

-- ---------------------------------------------------------------------------
-- 2. Enums
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('applicant', 'employer', 'admin', 'super_admin');
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'account_status') then
    create type public.account_status as enum ('active', 'suspended', 'pending_verification', 'deleted');
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 3. profiles — 1:1 extension of auth.users
--    Every authenticated user gets exactly one profile row, created
--    automatically by the trigger below at sign-up with role = 'applicant'.
--    Role escalation to employer/admin/super_admin happens through explicit,
--    audited server-side actions — never client-writable.
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id                uuid primary key references auth.users(id) on delete cascade,
  email             text not null,
  full_name         text,
  avatar_url        text,
  role              public.user_role not null default 'applicant',
  status            public.account_status not null default 'active',
  -- Fine-grained permission grants for admin/super_admin accounts, e.g.
  -- {"manage_jobs": true, "manage_employers": true}. Ignored for applicant/employer roles.
  permissions       jsonb not null default '{}'::jsonb,
  -- Soft delete support (spec: "Delete account" + audit trail rather than hard delete)
  deleted_at        timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

comment on table public.profiles is 'One row per auth.users entry. Source of truth for role/RBAC.';
comment on column public.profiles.permissions is 'Granular permission overrides, assigned by super_admin only.';

create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_profiles_status on public.profiles(status);

-- ---------------------------------------------------------------------------
-- 4. audit_logs — append-only. Every significant state change across every
--    module writes here (DOB changes, role changes, approvals, offer
--    decisions, etc. from later phases). Insert-only from the server side.
-- ---------------------------------------------------------------------------
create table if not exists public.audit_logs (
  id            uuid primary key default gen_random_uuid(),
  actor_id      uuid references public.profiles(id) on delete set null,
  action        text not null,                 -- e.g. 'profile.dob_change_approved'
  entity_type   text not null,                 -- e.g. 'profile', 'job', 'offer'
  entity_id     uuid,
  metadata      jsonb not null default '{}'::jsonb,
  ip_address    text,
  created_at    timestamptz not null default now()
);

create index if not exists idx_audit_logs_entity on public.audit_logs(entity_type, entity_id);
create index if not exists idx_audit_logs_actor on public.audit_logs(actor_id);
create index if not exists idx_audit_logs_created_at on public.audit_logs(created_at desc);

-- ---------------------------------------------------------------------------
-- 5. updated_at trigger (reused by every future table with an updated_at column)
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 6. handle_new_user — auto-create a profile row whenever someone signs up
--    via Supabase Auth (email/password or Google OAuth).
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_on_auth_user_created on auth.users;
create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 7. RBAC helper functions — used inside RLS policies everywhere else.
--    security definer + fixed search_path so they can safely read profiles
--    without being subject to the RLS policies defined below (avoids recursion).
-- ---------------------------------------------------------------------------
create or replace function public.current_user_role()
returns public.user_role
language sql
security definer set search_path = public
stable
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'super_admin')
  );
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'super_admin'
  );
$$;

create or replace function public.has_permission(perm text)
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select coalesce(
    (select (permissions ->> perm)::boolean from public.profiles where id = auth.uid()),
    false
  ) or public.is_super_admin();
$$;
