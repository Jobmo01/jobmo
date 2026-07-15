-- =============================================================================
-- JobMo — Talent pool, company contact phone, announcement role targeting
-- Name this query: "talent_pool_and_targeting_schema"
-- Run AFTER 0022_profile_extras_individual_na_flags.sql
-- =============================================================================

-- ---------------------------------------------------------------------------
-- talent_pool — an employer's saved shortlist of candidates they liked but
-- didn't hire for a specific role, kept for future openings. Independent
-- of any single job_application (an employer might add someone from a job
-- that's since closed, or in principle without a source application at
-- all), so source_application_id is nullable and ON DELETE SET NULL rather
-- than cascading — losing the original application shouldn't silently
-- drop someone from the talent pool.
-- ---------------------------------------------------------------------------
create table if not exists public.talent_pool (
  id                      uuid primary key default gen_random_uuid(),
  company_id              uuid not null references public.companies(id) on delete cascade,
  applicant_id            uuid not null references public.profiles(id) on delete cascade,
  added_by                uuid references public.profiles(id) on delete set null,
  source_application_id   uuid references public.job_applications(id) on delete set null,
  note                    text,
  created_at              timestamptz not null default now(),
  unique (company_id, applicant_id)
);

create index if not exists idx_talent_pool_company on public.talent_pool(company_id, created_at desc);

alter table public.talent_pool enable row level security;

drop policy if exists "talent_pool_company_all" on public.talent_pool;
create policy "talent_pool_company_all"
  on public.talent_pool for all
  using (public.is_company_owner(company_id))
  with check (public.is_company_owner(company_id));

drop policy if exists "talent_pool_admin_read" on public.talent_pool;
create policy "talent_pool_admin_read"
  on public.talent_pool for select
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- companies.phone — a company contact number, shown in the admin
-- companies list for phone-inquiry lookups. Distinct from any personal
-- phone number, since employer accounts don't have their own (only
-- applicant_profiles has a phone field, being applicant-specific data).
-- ---------------------------------------------------------------------------
alter table public.companies
  add column if not exists phone text;

-- ---------------------------------------------------------------------------
-- announcements.target_roles — which roles see a given announcement. An
-- empty array means "everyone" (preserves existing announcements'
-- behavior with no migration-time backfill needed — default '{}' already
-- means "show to all").
-- ---------------------------------------------------------------------------
alter table public.announcements
  add column if not exists target_roles text[] not null default '{}';
