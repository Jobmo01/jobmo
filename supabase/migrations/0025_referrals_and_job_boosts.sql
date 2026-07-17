-- =============================================================================
-- JobMo — Referral tracking (candidates) and job-boost credits (employers)
-- Name this query: "referrals_and_job_boosts"
-- Run AFTER 0024_email_reminder_tracking.sql
-- =============================================================================

-- ---------------------------------------------------------------------------
-- profiles.referral_code — a short unique code every user can share
-- (jobmo.lk/register?ref=CODE). Generated lazily by the app the first time
-- someone opens their "Refer friends" section, not for every user upfront —
-- avoids touching the existing handle_new_user() trigger again.
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists referral_code text unique;

-- ---------------------------------------------------------------------------
-- profiles.pending_referral_code — bridges a real gap: crediting a
-- referral requires an authenticated session (see the referrals RLS
-- policy below), but a brand-new email/password signup may not have one
-- yet if email confirmation is required — there's no session until they
-- click the confirmation link and log in for the first time. The referral
-- code is captured immediately at signup (via the same
-- requested_account_type metadata pattern already used for role
-- assignment) and stored here; the app credits it and clears this column
-- at whichever point a real session first exists — immediately after
-- signUp() if no confirmation is needed, or at first login if it is.
-- Google OAuth doesn't need this at all: that flow always has a real
-- session the moment the callback runs, so it credits directly.
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists pending_referral_code text;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_role public.user_role;
begin
  v_role := case
    when new.raw_user_meta_data ->> 'requested_account_type' = 'employer' then 'employer'::public.user_role
    else 'applicant'::public.user_role
  end;

  insert into public.profiles (id, email, full_name, avatar_url, role, pending_referral_code)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url',
    v_role,
    new.raw_user_meta_data ->> 'referred_by_code'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- referrals — one row per successful referred signup. referred_id is
-- unique: a person can only ever be credited to one referrer (whoever's
-- link they actually signed up through), not re-attributed later.
-- The "Talent Scout" badge (3+ referrals) is computed by counting these
-- rows, not stored as a separate flag — avoids a second place that could
-- drift out of sync with the real count.
-- ---------------------------------------------------------------------------
create table if not exists public.referrals (
  id            uuid primary key default gen_random_uuid(),
  referrer_id   uuid not null references public.profiles(id) on delete cascade,
  referred_id   uuid not null references public.profiles(id) on delete cascade unique,
  created_at    timestamptz not null default now()
);

create index if not exists idx_referrals_referrer on public.referrals(referrer_id);

alter table public.referrals enable row level security;

-- The newly-signed-up person creates this row crediting whoever referred
-- them, right after their own account is created — by that point they
-- have a valid session, so this is scoped to their own id as referred_id.
drop policy if exists "referrals_insert_self" on public.referrals;
create policy "referrals_insert_self"
  on public.referrals for insert
  with check (referred_id = auth.uid());

-- Someone can see (and count) referrals they personally made.
drop policy if exists "referrals_select_own" on public.referrals;
create policy "referrals_select_own"
  on public.referrals for select
  using (referrer_id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------------
-- companies.boost_credits — earned automatically, 1 credit for every 3
-- jobs a company publishes (checked at publish time, not stored as a
-- separately-tracked "published count" column — that's computed from
-- job_postings directly to avoid a second counter that could drift).
-- ---------------------------------------------------------------------------
alter table public.companies
  add column if not exists boost_credits integer not null default 0;

-- ---------------------------------------------------------------------------
-- job_postings.is_boosted — redeemed from a boost credit, sorts the job
-- to the top of public listings for as long as it stays published.
-- ---------------------------------------------------------------------------
alter table public.job_postings
  add column if not exists is_boosted boolean not null default false;
