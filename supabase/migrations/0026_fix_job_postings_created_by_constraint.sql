-- =============================================================================
-- JobMo — Fix job_postings.created_by foreign key constraint
-- Name this query: "fix_job_postings_created_by_constraint"
-- Run AFTER 0025_referrals_and_job_boosts.sql
--
-- job_postings.created_by has always been NOT NULL, but its foreign key
-- was originally defined as ON DELETE SET NULL — a genuine, self-
-- contradictory bug from when the table was first created (0007): if the
-- referenced profile is deleted, Postgres tries to null this column out
-- to satisfy the FK action, and the NOT NULL constraint rejects that,
-- blocking the delete entirely. This sat unnoticed until the first time
-- a profile owning a job posting was actually deleted. Fixed by cascading
-- the delete instead — a job posting genuinely can't exist without its
-- creator, so removing it along with the deleted account is the correct,
-- consistent behavior (and matches offers.created_by, which is nullable
-- and correctly uses ON DELETE SET NULL — that one was never buggy).
-- =============================================================================

alter table public.job_postings
  drop constraint if exists job_postings_created_by_fkey;

alter table public.job_postings
  add constraint job_postings_created_by_fkey
  foreign key (created_by) references public.profiles(id) on delete cascade;
