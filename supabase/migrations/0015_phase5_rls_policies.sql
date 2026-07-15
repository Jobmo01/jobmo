-- =============================================================================
-- JobMo — Phase 5: RLS policies
-- Name this query: "phase5_rls_policies"
-- Run AFTER 0014_learning_center_schema.sql
-- =============================================================================

alter table public.learning_categories enable row level security;
alter table public.learning_content enable row level security;
alter table public.quizzes enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.learning_progress enable row level security;
alter table public.certificates enable row level security;

-- ---------------------------------------------------------------------------
-- learning_categories — any authenticated user can read; admin/super_admin
-- manage. (Full content-moderation UI arrives in Phase 6; admins can
-- already manage this today via the pages this migration's app-layer adds.)
-- ---------------------------------------------------------------------------
drop policy if exists "learning_categories_select_authenticated" on public.learning_categories;
create policy "learning_categories_select_authenticated"
  on public.learning_categories for select
  using (auth.uid() is not null);

drop policy if exists "learning_categories_admin_all" on public.learning_categories;
create policy "learning_categories_admin_all"
  on public.learning_categories for all
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- learning_content — published content readable by any authenticated user;
-- admins see and manage everything including drafts.
-- ---------------------------------------------------------------------------
drop policy if exists "learning_content_select_published" on public.learning_content;
create policy "learning_content_select_published"
  on public.learning_content for select
  using (status = 'published' and auth.uid() is not null);

drop policy if exists "learning_content_admin_all" on public.learning_content;
create policy "learning_content_admin_all"
  on public.learning_content for all
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- quizzes — same pattern as learning_content.
-- ---------------------------------------------------------------------------
drop policy if exists "quizzes_select_published" on public.quizzes;
create policy "quizzes_select_published"
  on public.quizzes for select
  using (status = 'published' and auth.uid() is not null);

drop policy if exists "quizzes_admin_all" on public.quizzes;
create policy "quizzes_admin_all"
  on public.quizzes for all
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- quiz_questions — any authenticated user can read (application code is
-- responsible for never sending correct_option_id to the quiz-taking UI;
-- grading itself happens inside submit_quiz_attempt(), so the correct
-- answer never needs to leave the database during a real quiz attempt).
-- Admins manage.
-- ---------------------------------------------------------------------------
drop policy if exists "quiz_questions_select_authenticated" on public.quiz_questions;
create policy "quiz_questions_select_authenticated"
  on public.quiz_questions for select
  using (auth.uid() is not null);

drop policy if exists "quiz_questions_admin_all" on public.quiz_questions;
create policy "quiz_questions_admin_all"
  on public.quiz_questions for all
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- quiz_attempts — applicant reads their own; also readable platform-wide
-- for the leaderboard (score/name only, via a view-like select in app
-- code — no sensitive data on this table). Admin all. No direct insert
-- policy: attempts are written exclusively by submit_quiz_attempt().
-- ---------------------------------------------------------------------------
drop policy if exists "quiz_attempts_select_own" on public.quiz_attempts;
create policy "quiz_attempts_select_own"
  on public.quiz_attempts for select
  using (auth.uid() = applicant_id);

drop policy if exists "quiz_attempts_select_leaderboard" on public.quiz_attempts;
create policy "quiz_attempts_select_leaderboard"
  on public.quiz_attempts for select
  using (auth.uid() is not null);

drop policy if exists "quiz_attempts_admin_all" on public.quiz_attempts;
create policy "quiz_attempts_admin_all"
  on public.quiz_attempts for all
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- learning_progress — applicant manages their own only.
-- ---------------------------------------------------------------------------
drop policy if exists "learning_progress_owner_all" on public.learning_progress;
create policy "learning_progress_owner_all"
  on public.learning_progress for all
  using (auth.uid() = applicant_id)
  with check (auth.uid() = applicant_id);

drop policy if exists "learning_progress_admin_read" on public.learning_progress;
create policy "learning_progress_admin_read"
  on public.learning_progress for select
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- certificates — applicant reads their own; written exclusively by
-- submit_quiz_attempt(), no client insert policy.
-- ---------------------------------------------------------------------------
drop policy if exists "certificates_select_own" on public.certificates;
create policy "certificates_select_own"
  on public.certificates for select
  using (auth.uid() = applicant_id);

drop policy if exists "certificates_admin_read" on public.certificates;
create policy "certificates_admin_read"
  on public.certificates for select
  using (public.is_admin());
