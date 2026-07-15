-- =============================================================================
-- JobMo — Phase 2: RLS policies
-- Name this query: "phase2_rls_policies"
-- Run AFTER 0003_applicant_profile_schema.sql
-- =============================================================================

alter table public.applicant_profiles enable row level security;
alter table public.dob_change_requests enable row level security;
alter table public.education_entries enable row level security;
alter table public.experience_entries enable row level security;
alter table public.skills enable row level security;
alter table public.certifications enable row level security;
alter table public.projects enable row level security;
alter table public.awards enable row level security;
alter table public.volunteer_experience enable row level security;
alter table public.languages enable row level security;
alter table public.hobbies enable row level security;
alter table public.applicant_references enable row level security;
alter table public.notifications enable row level security;

-- ---------------------------------------------------------------------------
-- applicant_profiles: owner full access; admins read all; employers read
-- only profiles that have opted into visibility (used starting Phase 3/4
-- for matching — harmless to have ready now).
-- ---------------------------------------------------------------------------
drop policy if exists "applicant_profiles_owner_all" on public.applicant_profiles;
create policy "applicant_profiles_owner_all"
  on public.applicant_profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "applicant_profiles_admin_read" on public.applicant_profiles;
create policy "applicant_profiles_admin_read"
  on public.applicant_profiles for select
  using (public.is_admin());

drop policy if exists "applicant_profiles_employer_read_visible" on public.applicant_profiles;
create policy "applicant_profiles_employer_read_visible"
  on public.applicant_profiles for select
  using (
    profile_visible_to_employers = true
    and public.current_user_role() = 'employer'
  );

-- ---------------------------------------------------------------------------
-- dob_change_requests: applicant can create + read their own; cannot update
-- (only the guarded RPC, running as security definer, can change status).
-- Admins can read all.
-- ---------------------------------------------------------------------------
drop policy if exists "dob_requests_owner_select" on public.dob_change_requests;
create policy "dob_requests_owner_select"
  on public.dob_change_requests for select
  using (auth.uid() = applicant_id);

drop policy if exists "dob_requests_owner_insert" on public.dob_change_requests;
create policy "dob_requests_owner_insert"
  on public.dob_change_requests for insert
  with check (auth.uid() = applicant_id);

drop policy if exists "dob_requests_admin_select" on public.dob_change_requests;
create policy "dob_requests_admin_select"
  on public.dob_change_requests for select
  using (public.is_admin());

-- No UPDATE policy for any role — status changes only via review_dob_change_request().

-- ---------------------------------------------------------------------------
-- Generic owner-only policy, applied to every repeatable section table.
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'education_entries','experience_entries','skills','certifications',
    'projects','awards','volunteer_experience','languages','hobbies',
    'applicant_references'
  ]
  loop
    execute format(
      'drop policy if exists "%s_owner_all" on public.%I;', t, t
    );
    execute format(
      'create policy "%s_owner_all" on public.%I for all using (auth.uid() = applicant_id) with check (auth.uid() = applicant_id);',
      t, t
    );
    execute format(
      'drop policy if exists "%s_admin_read" on public.%I;', t, t
    );
    execute format(
      'create policy "%s_admin_read" on public.%I for select using (public.is_admin());',
      t, t
    );
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- notifications: owner can read + mark their own as read; no client insert
-- (only via create_notification() RPC, called from trusted server contexts).
-- ---------------------------------------------------------------------------
drop policy if exists "notifications_owner_select" on public.notifications;
create policy "notifications_owner_select"
  on public.notifications for select
  using (auth.uid() = user_id);

drop policy if exists "notifications_owner_update" on public.notifications;
create policy "notifications_owner_update"
  on public.notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
