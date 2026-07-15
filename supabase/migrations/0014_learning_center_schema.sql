-- =============================================================================
-- JobMo — Phase 5: Learning Center schema
-- Name this query: "phase5_learning_center_schema"
-- Run AFTER 0013_phase4_rls_policies.sql
-- =============================================================================

do $$ begin
  if not exists (select 1 from pg_type where typname = 'content_type') then
    create type public.content_type as enum ('video', 'article', 'pdf');
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_type where typname = 'content_status') then
    create type public.content_status as enum ('draft', 'published');
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- learning_categories — e.g. "Interview Preparation", "Resume Tips",
-- "Soft Skills", "Technical Skills" per spec.
-- ---------------------------------------------------------------------------
create table if not exists public.learning_categories (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  slug          text not null unique,
  description   text,
  icon_name     text,               -- a lucide-react icon name, rendered client-side
  sort_order    int not null default 0,
  created_by    uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

drop trigger if exists trg_learning_categories_updated_at on public.learning_categories;
create trigger trg_learning_categories_updated_at
  before update on public.learning_categories
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- learning_content — videos, articles, PDFs. `body` holds an external URL
-- for video/pdf, or the article's own rich-text HTML for type='article'.
-- ---------------------------------------------------------------------------
create table if not exists public.learning_content (
  id                uuid primary key default gen_random_uuid(),
  category_id       uuid references public.learning_categories(id) on delete set null,
  type              public.content_type not null,
  title             text not null,
  description       text,
  body              text not null default '',
  thumbnail_url     text,
  duration_minutes  int,
  sort_order        int not null default 0,
  status            public.content_status not null default 'draft',
  created_by        uuid references public.profiles(id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

drop trigger if exists trg_learning_content_updated_at on public.learning_content;
create trigger trg_learning_content_updated_at
  before update on public.learning_content
  for each row execute function public.set_updated_at();

create index if not exists idx_learning_content_category on public.learning_content(category_id);
create index if not exists idx_learning_content_status on public.learning_content(status);

-- ---------------------------------------------------------------------------
-- quizzes + quiz_questions. correct_option_id is NEVER selected by the
-- applicant-facing quiz-taking UI (enforced by application code — the
-- grading itself happens server-side in submit_quiz_attempt() below, so
-- correct answers never need to reach the client at all during grading).
-- ---------------------------------------------------------------------------
create table if not exists public.quizzes (
  id                    uuid primary key default gen_random_uuid(),
  category_id           uuid references public.learning_categories(id) on delete set null,
  title                 text not null,
  description           text,
  time_limit_minutes    int not null default 10,
  passing_score_percent int not null default 70,
  status                public.content_status not null default 'draft',
  created_by            uuid references public.profiles(id) on delete set null,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

drop trigger if exists trg_quizzes_updated_at on public.quizzes;
create trigger trg_quizzes_updated_at
  before update on public.quizzes
  for each row execute function public.set_updated_at();

create table if not exists public.quiz_questions (
  id                uuid primary key default gen_random_uuid(),
  quiz_id           uuid not null references public.quizzes(id) on delete cascade,
  question_text     text not null,
  options           jsonb not null default '[]'::jsonb,  -- [{ "id": "a", "text": "..." }, ...]
  correct_option_id text not null,
  sort_order        int not null default 0
);

create index if not exists idx_quiz_questions_quiz on public.quiz_questions(quiz_id);

-- ---------------------------------------------------------------------------
-- quiz_attempts, learning_progress, certificates
-- ---------------------------------------------------------------------------
create table if not exists public.quiz_attempts (
  id                  uuid primary key default gen_random_uuid(),
  quiz_id             uuid not null references public.quizzes(id) on delete cascade,
  applicant_id        uuid not null references public.profiles(id) on delete cascade,
  score_percent       int not null,
  correct_count       int not null,
  total_count         int not null,
  time_taken_seconds  int,
  passed              boolean not null default false,
  completed_at        timestamptz not null default now()
);

create index if not exists idx_quiz_attempts_quiz on public.quiz_attempts(quiz_id, score_percent desc);
create index if not exists idx_quiz_attempts_applicant on public.quiz_attempts(applicant_id);

create table if not exists public.learning_progress (
  id            uuid primary key default gen_random_uuid(),
  applicant_id  uuid not null references public.profiles(id) on delete cascade,
  content_id    uuid not null references public.learning_content(id) on delete cascade,
  completed_at  timestamptz not null default now(),
  unique (applicant_id, content_id)
);

create index if not exists idx_learning_progress_applicant on public.learning_progress(applicant_id);

create table if not exists public.certificates (
  id            uuid primary key default gen_random_uuid(),
  applicant_id  uuid not null references public.profiles(id) on delete cascade,
  quiz_id       uuid references public.quizzes(id) on delete set null,
  title         text not null,
  issued_at     timestamptz not null default now()
);

create index if not exists idx_certificates_applicant on public.certificates(applicant_id);

-- ---------------------------------------------------------------------------
-- submit_quiz_attempt() — grades server-side so correct answers never need
-- to be sent to the client for the quiz-taking flow, awards a certificate
-- on first pass, and notifies the applicant.
-- ---------------------------------------------------------------------------
create or replace function public.submit_quiz_attempt(
  p_quiz_id uuid,
  p_answers jsonb,  -- [{ "question_id": "...", "selected_option_id": "..." }]
  p_time_taken_seconds int default null
)
returns table (attempt_id uuid, score_percent int, correct_count int, total_count int, passed boolean)
language plpgsql
security definer set search_path = public
as $$
declare
  v_passing_score int;
  v_total int;
  v_correct int := 0;
  v_question record;
  v_answer jsonb;
  v_score int;
  v_passed boolean;
  v_attempt_id uuid;
  v_already_certified boolean;
  v_quiz_title text;
begin
  select passing_score_percent, title into v_passing_score, v_quiz_title
  from public.quizzes where id = p_quiz_id and status = 'published';
  if v_passing_score is null then
    raise exception 'Quiz not found or not published';
  end if;

  select count(*) into v_total from public.quiz_questions where quiz_id = p_quiz_id;

  for v_question in select id, correct_option_id from public.quiz_questions where quiz_id = p_quiz_id loop
    select ans into v_answer
    from jsonb_array_elements(coalesce(p_answers, '[]'::jsonb)) ans
    where (ans->>'question_id')::uuid = v_question.id
    limit 1;

    if v_answer is not null and (v_answer->>'selected_option_id') = v_question.correct_option_id then
      v_correct := v_correct + 1;
    end if;
  end loop;

  v_score := case when v_total > 0 then round((v_correct::numeric / v_total) * 100) else 0 end;
  v_passed := v_score >= v_passing_score;

  insert into public.quiz_attempts (quiz_id, applicant_id, score_percent, correct_count, total_count, time_taken_seconds, passed)
  values (p_quiz_id, auth.uid(), v_score, v_correct, v_total, p_time_taken_seconds, v_passed)
  returning id into v_attempt_id;

  if v_passed then
    select exists(
      select 1 from public.certificates where applicant_id = auth.uid() and quiz_id = p_quiz_id
    ) into v_already_certified;

    if not v_already_certified then
      insert into public.certificates (applicant_id, quiz_id, title)
      values (auth.uid(), p_quiz_id, 'Certificate of Completion — ' || v_quiz_title);

      perform public.create_notification(
        auth.uid(), 'system', 'Certificate earned!',
        'You passed "' || v_quiz_title || '" and earned a certificate.',
        '/dashboard/applicant/learning/certificates'
      );
    end if;
  end if;

  return query select v_attempt_id, v_score, v_correct, v_total, v_passed;
end;
$$;

-- Mark a piece of content (video/article/pdf) as completed.
create or replace function public.mark_content_complete(p_content_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.learning_progress (applicant_id, content_id)
  values (auth.uid(), p_content_id)
  on conflict (applicant_id, content_id) do nothing;
end;
$$;
