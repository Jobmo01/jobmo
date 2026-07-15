-- =============================================================================
-- JobMo — Phase 4 patch: fix missing job_matches RLS policy
-- Name this query: "phase4_job_matches_rls_fix"
-- Run AFTER 0018_rate_limiting_schema.sql
--
-- Bug: computeMatchForApplicant() is called from applicant-facing pages
-- (Browse Jobs, job detail) to compute a match on demand and persist it via
-- jobMatchRepository.upsert(). That runs under the APPLICANT's own session.
-- The only insert/update policies on job_matches checked is_company_owner(),
-- which is true when an EMPLOYER'S session triggers the batch matching on
-- publish, but false for an applicant computing their own on-demand score —
-- so the insert was rejected with "new row violates row-level security
-- policy". Fix: add a second set of policies allowing an applicant to
-- write only their own row (auth.uid() = applicant_id). Both policies
-- coexist — Postgres OR's multiple permissive policies for the same
-- command together, so neither call site's needs conflict with the other.
-- =============================================================================

drop policy if exists "job_matches_applicant_insert" on public.job_matches;
create policy "job_matches_applicant_insert"
  on public.job_matches for insert
  with check (auth.uid() = applicant_id);

drop policy if exists "job_matches_applicant_update" on public.job_matches;
create policy "job_matches_applicant_update"
  on public.job_matches for update
  using (auth.uid() = applicant_id)
  with check (auth.uid() = applicant_id);
