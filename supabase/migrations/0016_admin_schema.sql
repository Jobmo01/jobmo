-- =============================================================================
-- JobMo — Phase 6: Administration schema
-- Name this query: "phase6_admin_schema"
-- Run AFTER 0015_phase5_rls_policies.sql
-- =============================================================================

do $$ begin
  if not exists (select 1 from pg_type where typname = 'ticket_status') then
    create type public.ticket_status as enum ('open', 'in_progress', 'resolved', 'closed');
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- platform_settings — generic key/value store for feature toggles and
-- maintenance mode. Deliberately NOT used for secrets (API keys, payment
-- credentials) — those stay in environment variables, where they belong.
-- This is for booleans/small config the app itself checks at runtime.
-- ---------------------------------------------------------------------------
create table if not exists public.platform_settings (
  key         text primary key,
  value       jsonb not null,
  updated_by  uuid references public.profiles(id) on delete set null,
  updated_at  timestamptz not null default now()
);

drop trigger if exists trg_platform_settings_updated_at on public.platform_settings;
create trigger trg_platform_settings_updated_at
  before update on public.platform_settings
  for each row execute function public.set_updated_at();

insert into public.platform_settings (key, value)
values
  ('maintenance_mode', 'false'::jsonb),
  ('google_oauth_enabled', 'true'::jsonb),
  ('registrations_enabled', 'true'::jsonb)
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- announcements — the "CMS & Announcements" super_admin feature. Shown as a
-- dismissible-per-session banner to signed-in users while active.
-- ---------------------------------------------------------------------------
create table if not exists public.announcements (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  body        text,
  is_active   boolean not null default true,
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

drop trigger if exists trg_announcements_updated_at on public.announcements;
create trigger trg_announcements_updated_at
  before update on public.announcements
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- support_tickets + support_ticket_replies
-- ---------------------------------------------------------------------------
create table if not exists public.support_tickets (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.profiles(id) on delete set null,
  email       text not null,          -- captured even for logged-out Contact submissions
  subject     text not null,
  message     text not null,
  status      public.ticket_status not null default 'open',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

drop trigger if exists trg_support_tickets_updated_at on public.support_tickets;
create trigger trg_support_tickets_updated_at
  before update on public.support_tickets
  for each row execute function public.set_updated_at();

create index if not exists idx_support_tickets_status on public.support_tickets(status);
create index if not exists idx_support_tickets_user on public.support_tickets(user_id);

create table if not exists public.support_ticket_replies (
  id          uuid primary key default gen_random_uuid(),
  ticket_id   uuid not null references public.support_tickets(id) on delete cascade,
  author_id   uuid references public.profiles(id) on delete set null,
  message     text not null,
  created_at  timestamptz not null default now()
);

create index if not exists idx_support_ticket_replies_ticket on public.support_ticket_replies(ticket_id);

-- ---------------------------------------------------------------------------
-- review_company_verification() — the missing piece: companies.
-- verification_status has existed since Phase 3, but nothing except a raw
-- admin-privileged UPDATE could change it. This guarantees an audit trail
-- and a notification every time, matching every other approval flow.
-- ---------------------------------------------------------------------------
create or replace function public.review_company_verification(
  p_company_id uuid,
  p_decision public.verification_status,  -- 'verified' or 'rejected'
  p_comment text default null
)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_owner_id uuid;
  v_company_name text;
begin
  if not public.is_admin() then
    raise exception 'Only admin/super_admin can review company verification';
  end if;
  if p_decision not in ('verified', 'rejected') then
    raise exception 'Decision must be verified or rejected';
  end if;

  select owner_id, name into v_owner_id, v_company_name
  from public.companies where id = p_company_id;

  if v_owner_id is null then
    raise exception 'Company not found';
  end if;

  update public.companies
  set verification_status = p_decision
  where id = p_company_id;

  perform public.create_notification(
    v_owner_id,
    'system',
    'Company verification: ' || (case when p_decision = 'verified' then 'Approved' else 'Not approved' end),
    coalesce(p_comment, case when p_decision = 'verified' then 'Your company has been verified.' else 'Your company verification was not approved.' end),
    '/dashboard/employer/company'
  );

  perform public.log_audit_event(
    'company.verification_' || p_decision,
    'company',
    p_company_id,
    jsonb_build_object('company_name', v_company_name, 'comment', p_comment)
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- admin_update_profile_status() — suspend/reactivate a user account, with
-- the same audit-log discipline as every other admin action.
-- ---------------------------------------------------------------------------
create or replace function public.admin_update_profile_status(
  p_target_user_id uuid,
  p_new_status public.account_status
)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admin/super_admin can change account status';
  end if;

  update public.profiles
  set status = p_new_status
  where id = p_target_user_id;

  perform public.log_audit_event(
    'profile.status_changed',
    'profile',
    p_target_user_id,
    jsonb_build_object('new_status', p_new_status, 'changed_by', auth.uid())
  );
end;
$$;
