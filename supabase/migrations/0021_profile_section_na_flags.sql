-- =============================================================================
-- JobMo — Profile completion: N/A flags for education, experience, skills,
-- and the certifications/extras bucket
-- Name this query: "profile_section_na_flags"
-- Run AFTER 0020_bugfix_batch.sql
--
-- Mirrors the existing passport_not_applicable / driving_license_not_applicable
-- pattern from Phase 2 (0006_profile_na_flags.sql) — same idea, applied to
-- four more sections so a profile (e.g. a fresh graduate with no work
-- history, or someone with no certifications) can still reach 100% without
-- fabricating entries.
-- =============================================================================

alter table public.applicant_profiles
  add column if not exists education_not_applicable boolean not null default false,
  add column if not exists experience_not_applicable boolean not null default false,
  add column if not exists skills_not_applicable boolean not null default false,
  add column if not exists certifications_not_applicable boolean not null default false;
