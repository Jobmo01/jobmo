-- =============================================================================
-- JobMo — Phase 2 patch: "Not applicable" flags
-- Name this query: "phase2_profile_na_flags"
-- Run AFTER 0005_storage_buckets.sql
--
-- Passport, driving license, and the five social/portfolio links are
-- optional in real life (not everyone has a passport or a Behance page).
-- Rather than force a value, applicants can mark these "N/A" — a real
-- boolean flag, not a magic string stuffed into the text column — which
-- counts as "answered" for profile completion purposes.
-- =============================================================================

alter table public.applicant_profiles
  add column if not exists passport_not_applicable boolean not null default false,
  add column if not exists driving_license_not_applicable boolean not null default false,
  add column if not exists github_not_applicable boolean not null default false,
  add column if not exists linkedin_not_applicable boolean not null default false,
  add column if not exists behance_not_applicable boolean not null default false,
  add column if not exists portfolio_not_applicable boolean not null default false,
  add column if not exists website_not_applicable boolean not null default false;
