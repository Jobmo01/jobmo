-- =============================================================================
-- JobMo — Phase 3: RLS policies
-- Name this query: "phase3_rls_policies"
-- Run AFTER 0007_employer_schema.sql
-- =============================================================================

alter table public.companies enable row level security;
alter table public.job_postings enable row level security;
alter table public.job_applications enable row level security;
alter table public.application_notes enable row level security;
alter table public.application_status_history enable row level security;
alter table public.interviews enable row level security;
alter table public.offers enable row level security;

-- ---------------------------------------------------------------------------
-- companies — public read (company culture/profile pages are public
-- marketing pages, verified or not — the badge communicates trust, not RLS).
-- Owner full access. Admin full read.
-- ---------------------------------------------------------------------------
drop policy if exists "companies_select_public" on public.companies;
create policy "companies_select_public"
  on public.companies for select
  using (true);

drop policy if exists "companies_owner_all" on public.companies;
create policy "companies_owner_all"
  on public.companies for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

drop policy if exists "companies_admin_all" on public.companies;
create policy "companies_admin_all"
  on public.companies for all
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- job_postings — public read for published jobs (job board). Owner full
-- access to their own company's postings regardless of status. Admin all.
-- ---------------------------------------------------------------------------
drop policy if exists "job_postings_select_published" on public.job_postings;
create policy "job_postings_select_published"
  on public.job_postings for select
  using (status = 'published');

drop policy if exists "job_postings_owner_all" on public.job_postings;
create policy "job_postings_owner_all"
  on public.job_postings for all
  using (public.is_company_owner(company_id))
  with check (public.is_company_owner(company_id));

drop policy if exists "job_postings_admin_all" on public.job_postings;
create policy "job_postings_admin_all"
  on public.job_postings for all
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- job_applications — applicant can insert/read their own. Company owner can
-- read applications to their own jobs, and update tags directly (status
-- changes go exclusively through change_application_status()). Admin all.
-- ---------------------------------------------------------------------------
drop policy if exists "job_applications_applicant_select" on public.job_applications;
create policy "job_applications_applicant_select"
  on public.job_applications for select
  using (auth.uid() = applicant_id);

drop policy if exists "job_applications_applicant_insert" on public.job_applications;
create policy "job_applications_applicant_insert"
  on public.job_applications for insert
  with check (auth.uid() = applicant_id);

drop policy if exists "job_applications_company_select" on public.job_applications;
create policy "job_applications_company_select"
  on public.job_applications for select
  using (
    exists (
      select 1 from public.job_postings j
      where j.id = job_applications.job_id and public.is_company_owner(j.company_id)
    )
  );

drop policy if exists "job_applications_company_update" on public.job_applications;
create policy "job_applications_company_update"
  on public.job_applications for update
  using (
    exists (
      select 1 from public.job_postings j
      where j.id = job_applications.job_id and public.is_company_owner(j.company_id)
    )
  );

drop policy if exists "job_applications_admin_all" on public.job_applications;
create policy "job_applications_admin_all"
  on public.job_applications for all
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- application_notes — company owner (via the job's company) only. Admin read.
-- ---------------------------------------------------------------------------
drop policy if exists "application_notes_company_all" on public.application_notes;
create policy "application_notes_company_all"
  on public.application_notes for all
  using (
    exists (
      select 1 from public.job_applications a
      join public.job_postings j on j.id = a.job_id
      where a.id = application_notes.application_id and public.is_company_owner(j.company_id)
    )
  );

drop policy if exists "application_notes_admin_read" on public.application_notes;
create policy "application_notes_admin_read"
  on public.application_notes for select
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- application_status_history — read-only for the applicant (their own) and
-- the hiring company; written exclusively by change_application_status().
-- ---------------------------------------------------------------------------
drop policy if exists "status_history_applicant_select" on public.application_status_history;
create policy "status_history_applicant_select"
  on public.application_status_history for select
  using (
    exists (
      select 1 from public.job_applications a
      where a.id = application_status_history.application_id and a.applicant_id = auth.uid()
    )
  );

drop policy if exists "status_history_company_select" on public.application_status_history;
create policy "status_history_company_select"
  on public.application_status_history for select
  using (
    exists (
      select 1 from public.job_applications a
      join public.job_postings j on j.id = a.job_id
      where a.id = application_status_history.application_id and public.is_company_owner(j.company_id)
    )
  );

drop policy if exists "status_history_admin_select" on public.application_status_history;
create policy "status_history_admin_select"
  on public.application_status_history for select
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- interviews — applicant reads their own (updates only via
-- respond_to_interview() RPC). Company owner full access (schedule/update).
-- ---------------------------------------------------------------------------
drop policy if exists "interviews_applicant_select" on public.interviews;
create policy "interviews_applicant_select"
  on public.interviews for select
  using (
    exists (
      select 1 from public.job_applications a
      where a.id = interviews.application_id and a.applicant_id = auth.uid()
    )
  );

drop policy if exists "interviews_company_all" on public.interviews;
create policy "interviews_company_all"
  on public.interviews for all
  using (
    exists (
      select 1 from public.job_applications a
      join public.job_postings j on j.id = a.job_id
      where a.id = interviews.application_id and public.is_company_owner(j.company_id)
    )
  );

drop policy if exists "interviews_admin_select" on public.interviews;
create policy "interviews_admin_select"
  on public.interviews for select
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Employer visibility into applicant profile sections — consistent with the
-- Phase 2 policy on applicant_profiles itself (any employer can read any
-- profile that opted into visibility; this is the same "visible to
-- employers" toggle, not narrowed to "only applicants who applied to me" —
-- that broader visibility is what Phase 4's matching/search features need).
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
    execute format('drop policy if exists "%s_employer_read_visible" on public.%I;', t, t);
    execute format(
      'create policy "%s_employer_read_visible" on public.%I for select using (
         public.current_user_role() = ''employer''
         and exists (
           select 1 from public.applicant_profiles ap
           where ap.id = %I.applicant_id and ap.profile_visible_to_employers = true
         )
       );',
      t, t, t
    );
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- offers — applicant reads their own (updates only via respond_to_offer()
-- RPC). Company owner full access (create/read).
-- ---------------------------------------------------------------------------
drop policy if exists "offers_applicant_select" on public.offers;
create policy "offers_applicant_select"
  on public.offers for select
  using (
    exists (
      select 1 from public.job_applications a
      where a.id = offers.application_id and a.applicant_id = auth.uid()
    )
  );

drop policy if exists "offers_company_all" on public.offers;
create policy "offers_company_all"
  on public.offers for all
  using (
    exists (
      select 1 from public.job_applications a
      join public.job_postings j on j.id = a.job_id
      where a.id = offers.application_id and public.is_company_owner(j.company_id)
    )
  );

drop policy if exists "offers_admin_select" on public.offers;
create policy "offers_admin_select"
  on public.offers for select
  using (public.is_admin());
