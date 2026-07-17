-- =============================================================================
-- JobMo — Add a location field to job postings
-- Name this query: "job_postings_location"
-- Run AFTER 0026_fix_job_postings_created_by_constraint.sql
--
-- Job location previously had to be inferred from the employer's company
-- profile (a general locations list), not set per-job — meaning two jobs
-- at the same company in different cities had no way to show that.
-- =============================================================================

alter table public.job_postings
  add column if not exists location text;
