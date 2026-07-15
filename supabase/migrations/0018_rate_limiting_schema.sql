-- =============================================================================
-- JobMo — Phase 7: Security hardening — login rate limiting
-- Name this query: "phase7_rate_limiting_schema"
-- Run AFTER 0017_phase6_rls_policies.sql
--
-- App-level rate limiting on top of Supabase Auth: GoTrue itself isn't
-- exposed to our RLS/SQL layer, so this tracks failed attempts ourselves
-- and blocks further tries for a cooldown window. RLS is enabled with NO
-- policies (blocking all direct client access); only the two functions
-- below (SECURITY DEFINER) can read or write this table.
-- =============================================================================

create table if not exists public.login_attempts (
  id          uuid primary key default gen_random_uuid(),
  email       text not null,
  ip_address  text,
  created_at  timestamptz not null default now()
);

create index if not exists idx_login_attempts_email_time on public.login_attempts(email, created_at desc);

alter table public.login_attempts enable row level security;
-- Intentionally no policies — direct table access is fully blocked for
-- every role; only the SECURITY DEFINER functions below can touch it.

create or replace function public.record_failed_login(p_email text, p_ip_address text default null)
returns void
language sql
security definer set search_path = public
as $$
  insert into public.login_attempts (email, ip_address) values (lower(p_email), p_ip_address);
$$;

create or replace function public.is_login_rate_limited(p_email text)
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select count(*) >= 5
  from public.login_attempts
  where email = lower(p_email) and created_at > now() - interval '15 minutes';
$$;

-- Clears the counter on a successful login, so one bad-password episode
-- doesn't linger and eventually lock someone out on a later legitimate day.
create or replace function public.clear_login_attempts(p_email text)
returns void
language sql
security definer set search_path = public
as $$
  delete from public.login_attempts where email = lower(p_email);
$$;
