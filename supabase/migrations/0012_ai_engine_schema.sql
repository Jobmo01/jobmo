-- =============================================================================
-- JobMo — Phase 4: AI Engine schema
-- Name this query: "phase4_ai_engine_schema"
-- Run AFTER 0011_offer_response_fix.sql
-- =============================================================================

-- ---------------------------------------------------------------------------
-- job_matches — one row per (job, applicant) pair, computed by the
-- deterministic weighted matching algorithm (lib/ai/matching.ts) whenever a
-- job is published or an applicant's profile changes meaningfully. This is
-- real math (skills overlap, education, experience, location, salary,
-- employment type, industry), not a black-box LLM call — reliable and free
-- to compute at any volume. AI is layered on top for the natural-language
-- "why you matched" explanation and suggestions, not the score itself.
-- ---------------------------------------------------------------------------
create table if not exists public.job_matches (
  id            uuid primary key default gen_random_uuid(),
  job_id        uuid not null references public.job_postings(id) on delete cascade,
  applicant_id  uuid not null references public.profiles(id) on delete cascade,
  score         int not null check (score >= 0 and score <= 100),
  breakdown     jsonb not null default '{}'::jsonb,
  notified      boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (job_id, applicant_id)
);

drop trigger if exists trg_job_matches_updated_at on public.job_matches;
create trigger trg_job_matches_updated_at
  before update on public.job_matches
  for each row execute function public.set_updated_at();

create index if not exists idx_job_matches_job on public.job_matches(job_id, score desc);
create index if not exists idx_job_matches_applicant on public.job_matches(applicant_id, score desc);

-- ---------------------------------------------------------------------------
-- AI-generated content columns on applicant_profiles — the "AI Resume
-- Builder" spec asks for a generated professional summary and a resume/ATS
-- score. Stored so they persist and don't need regenerating on every visit.
-- ---------------------------------------------------------------------------
alter table public.applicant_profiles
  add column if not exists ai_summary text,
  add column if not exists ai_summary_generated_at timestamptz,
  add column if not exists resume_score int check (resume_score is null or (resume_score >= 0 and resume_score <= 100)),
  add column if not exists resume_score_feedback jsonb;
