-- =============================================================================
-- JobMo — Phase 4: RLS policies
-- Name this query: "phase4_rls_policies"
-- Run AFTER 0012_ai_engine_schema.sql
-- =============================================================================

alter table public.job_matches enable row level security;

-- Applicant can see their own match scores (why they matched a job).
drop policy if exists "job_matches_applicant_select" on public.job_matches;
create policy "job_matches_applicant_select"
  on public.job_matches for select
  using (auth.uid() = applicant_id);

-- Employer can see match scores for applicants against their own jobs
-- (candidate ranking on the pipeline board).
drop policy if exists "job_matches_company_select" on public.job_matches;
create policy "job_matches_company_select"
  on public.job_matches for select
  using (
    exists (
      select 1 from public.job_postings j
      where j.id = job_matches.job_id and public.is_company_owner(j.company_id)
    )
  );

drop policy if exists "job_matches_admin_all" on public.job_matches;
create policy "job_matches_admin_all"
  on public.job_matches for all
  using (public.is_admin());

-- No client insert/update policy — job_matches is written exclusively by
-- server-side matching logic using the authenticated employer's session
-- when publishing a job (the employer already has full access to their own
-- job_postings row, and this table's insert doesn't need broader trust than
-- that — see runMatchingForJob() in lib/ai/matching-service.ts).
drop policy if exists "job_matches_company_insert" on public.job_matches;
create policy "job_matches_company_insert"
  on public.job_matches for insert
  with check (
    exists (
      select 1 from public.job_postings j
      where j.id = job_matches.job_id and public.is_company_owner(j.company_id)
    )
  );

drop policy if exists "job_matches_company_update" on public.job_matches;
create policy "job_matches_company_update"
  on public.job_matches for update
  using (
    exists (
      select 1 from public.job_postings j
      where j.id = job_matches.job_id and public.is_company_owner(j.company_id)
    )
  );
