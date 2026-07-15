-- =============================================================================
-- JobMo — Per-section N/A flags for the "Certifications & More" tab
-- Name this query: "profile_extras_individual_na_flags"
-- Run AFTER 0021_profile_section_na_flags.sql
--
-- The previous migration added one blanket certifications_not_applicable
-- flag covering the whole tab (certifications/projects/awards/volunteer/
-- hobbies/references) at once. That's too broad — someone might genuinely
-- have projects to list but no certifications, and a single "N/A for
-- everything" checkbox forces an all-or-nothing choice. This gives each
-- of the 6 sub-sections its own independent flag instead.
--
-- certifications_not_applicable already exists (0021) and is reused here
-- for the Certifications sub-section specifically, rather than the whole
-- bucket — a clean reinterpretation, no rename needed.
-- =============================================================================

alter table public.applicant_profiles
  add column if not exists projects_not_applicable boolean not null default false,
  add column if not exists awards_not_applicable boolean not null default false,
  add column if not exists volunteer_not_applicable boolean not null default false,
  add column if not exists hobbies_not_applicable boolean not null default false,
  add column if not exists references_not_applicable boolean not null default false;
