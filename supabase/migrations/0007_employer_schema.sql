-- =============================================================================
-- JobMo — Phase 3: Employer Module schema
-- Name this query: "phase3_employer_schema"
-- Run AFTER 0006_profile_na_flags.sql
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 0. Registration fix: accounts that chose "I'm hiring" at sign-up should
--    actually get role='employer', not 'applicant'. Verification (below)
--    gates trust in the company, not the role itself — an unverified
--    employer can still build a profile and draft jobs, same as most real
--    platforms. This replaces the Phase 1 trigger.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_role public.user_role;
begin
  v_role := case
    when new.raw_user_meta_data ->> 'requested_account_type' = 'employer' then 'employer'::public.user_role
    else 'applicant'::public.user_role
  end;

  insert into public.profiles (id, email, full_name, avatar_url, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url',
    v_role
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 1. Enums
-- ---------------------------------------------------------------------------
do $$ begin
  if not exists (select 1 from pg_type where typname = 'verification_status') then
    create type public.verification_status as enum ('pending', 'verified', 'rejected');
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_type where typname = 'work_type') then
    create type public.work_type as enum ('on_site', 'remote', 'hybrid');
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_type where typname = 'job_status') then
    create type public.job_status as enum ('draft', 'published', 'closed', 'archived');
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_type where typname = 'application_status') then
    create type public.application_status as enum (
      'applied', 'viewed', 'shortlisted', 'assessment', 'interview_scheduled',
      'interview_completed', 'pending_decision', 'selected', 'rejected',
      'offer_sent', 'offer_accepted', 'offer_rejected', 'hired'
    );
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_type where typname = 'interview_mode') then
    create type public.interview_mode as enum ('online', 'offline', 'hybrid');
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_type where typname = 'interview_status') then
    create type public.interview_status as enum (
      'proposed', 'accepted', 'declined', 'reschedule_requested', 'completed', 'cancelled'
    );
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_type where typname = 'offer_status') then
    create type public.offer_status as enum ('sent', 'accepted', 'rejected', 'withdrawn');
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 2. companies — single owner per company for this phase. Team/multi-
--    recruiter membership (departments, hiring managers) is deferred; the
--    schema is intentionally left easy to extend with a company_members
--    table later without touching this one.
-- ---------------------------------------------------------------------------
create table if not exists public.companies (
  id                    uuid primary key default gen_random_uuid(),
  owner_id              uuid not null unique references public.profiles(id) on delete cascade,
  name                  text not null,
  tagline               text,
  logo_url              text,
  cover_image_url       text,
  description           text,
  industry              text,
  company_size          text,             -- e.g. "1-10", "51-200"
  founded_year          int,
  locations             text[] not null default '{}',
  website_url           text,
  linkedin_url          text,
  facebook_url          text,
  twitter_url           text,
  benefits              text[] not null default '{}',
  culture_description   text,
  gallery_urls          text[] not null default '{}',
  video_url             text,
  verification_status   public.verification_status not null default 'pending',
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

drop trigger if exists trg_companies_updated_at on public.companies;
create trigger trg_companies_updated_at
  before update on public.companies
  for each row execute function public.set_updated_at();

create index if not exists idx_companies_owner on public.companies(owner_id);

create or replace function public.is_company_owner(p_company_id uuid)
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.companies where id = p_company_id and owner_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------------
-- 3. job_postings
-- ---------------------------------------------------------------------------
create table if not exists public.job_postings (
  id                    uuid primary key default gen_random_uuid(),
  company_id            uuid not null references public.companies(id) on delete cascade,
  created_by            uuid not null references public.profiles(id) on delete set null,
  title                 text not null,
  description           text not null default '',   -- rich-text HTML
  required_skills       text[] not null default '{}',
  preferred_skills      text[] not null default '{}',
  experience_level      text,
  education_requirement text,
  salary_min            numeric(12,2),
  salary_max            numeric(12,2),
  salary_currency       text default 'LKR',
  show_salary           boolean not null default true,
  benefits              text[] not null default '{}',
  work_type             public.work_type,
  employment_type       public.employment_type,
  application_deadline  date,
  screening_questions   jsonb not null default '[]'::jsonb,  -- [{ "question": "...", "required": true }]
  status                public.job_status not null default 'draft',
  published_at          timestamptz,
  views_count           int not null default 0,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

drop trigger if exists trg_job_postings_updated_at on public.job_postings;
create trigger trg_job_postings_updated_at
  before update on public.job_postings
  for each row execute function public.set_updated_at();

create index if not exists idx_job_postings_company on public.job_postings(company_id);
create index if not exists idx_job_postings_status on public.job_postings(status);

-- Simple atomic view counter — callable by anyone viewing a published job
-- (no sensitive data exposed, just a counter bump).
create or replace function public.increment_job_views(p_job_id uuid)
returns void
language sql
security definer set search_path = public
as $$
  update public.job_postings set views_count = views_count + 1
  where id = p_job_id and status = 'published';
$$;

-- ---------------------------------------------------------------------------
-- 4. job_applications, application_notes, application_status_history
-- ---------------------------------------------------------------------------
create table if not exists public.job_applications (
  id            uuid primary key default gen_random_uuid(),
  job_id        uuid not null references public.job_postings(id) on delete cascade,
  applicant_id  uuid not null references public.profiles(id) on delete cascade,
  status        public.application_status not null default 'applied',
  cover_letter  text,
  tags          text[] not null default '{}',
  applied_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (job_id, applicant_id)
);

drop trigger if exists trg_job_applications_updated_at on public.job_applications;
create trigger trg_job_applications_updated_at
  before update on public.job_applications
  for each row execute function public.set_updated_at();

create index if not exists idx_job_applications_job on public.job_applications(job_id);
create index if not exists idx_job_applications_applicant on public.job_applications(applicant_id);
create index if not exists idx_job_applications_status on public.job_applications(status);

create table if not exists public.application_notes (
  id              uuid primary key default gen_random_uuid(),
  application_id  uuid not null references public.job_applications(id) on delete cascade,
  author_id       uuid references public.profiles(id) on delete set null,
  note            text not null,
  created_at      timestamptz not null default now()
);

create index if not exists idx_application_notes_application on public.application_notes(application_id);

create table if not exists public.application_status_history (
  id              uuid primary key default gen_random_uuid(),
  application_id  uuid not null references public.job_applications(id) on delete cascade,
  from_status     public.application_status,
  to_status       public.application_status not null,
  changed_by      uuid references public.profiles(id) on delete set null,
  created_at      timestamptz not null default now()
);

create index if not exists idx_application_status_history_application on public.application_status_history(application_id);

-- The ONLY sanctioned path for an application's status to change — guarantees
-- an audit row + a notification to the applicant every time, per spec
-- ("every status change immediately notifies applicant").
create or replace function public.change_application_status(
  p_application_id uuid,
  p_new_status public.application_status,
  p_note text default null
)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_job_id uuid;
  v_company_id uuid;
  v_applicant_id uuid;
  v_old_status public.application_status;
  v_job_title text;
begin
  select a.job_id, a.applicant_id, a.status, j.company_id, j.title
    into v_job_id, v_applicant_id, v_old_status, v_company_id, v_job_title
  from public.job_applications a
  join public.job_postings j on j.id = a.job_id
  where a.id = p_application_id;

  if v_job_id is null then
    raise exception 'Application not found';
  end if;

  if not public.is_company_owner(v_company_id) then
    raise exception 'Only the hiring company can change this application''s status';
  end if;

  update public.job_applications
  set status = p_new_status
  where id = p_application_id;

  insert into public.application_status_history (application_id, from_status, to_status, changed_by)
  values (p_application_id, v_old_status, p_new_status, auth.uid());

  if p_note is not null then
    insert into public.application_notes (application_id, author_id, note)
    values (p_application_id, auth.uid(), p_note);
  end if;

  perform public.create_notification(
    v_applicant_id,
    'application_status',
    'Application update: ' || v_job_title,
    'Your application status changed to ' || replace(p_new_status::text, '_', ' '),
    '/dashboard/applicant/jobs/' || p_application_id::text
  );

  perform public.log_audit_event(
    'application.status_changed',
    'job_application',
    p_application_id,
    jsonb_build_object('from', v_old_status, 'to', p_new_status)
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- 5. interviews
-- ---------------------------------------------------------------------------
create table if not exists public.interviews (
  id                      uuid primary key default gen_random_uuid(),
  application_id          uuid not null references public.job_applications(id) on delete cascade,
  scheduled_by            uuid references public.profiles(id) on delete set null,
  mode                    public.interview_mode not null default 'online',
  platform                text,             -- 'Google Meet' | 'Zoom' | 'Teams' | 'Other'
  meeting_link            text,
  location                text,
  scheduled_at            timestamptz not null,
  duration_minutes        int not null default 30,
  panel_members           text[] not null default '{}',
  instructions            text,
  status                  public.interview_status not null default 'proposed',
  applicant_response_note text,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

drop trigger if exists trg_interviews_updated_at on public.interviews;
create trigger trg_interviews_updated_at
  before update on public.interviews
  for each row execute function public.set_updated_at();

create index if not exists idx_interviews_application on public.interviews(application_id);

create or replace function public.respond_to_interview(
  p_interview_id uuid,
  p_response public.interview_status,   -- 'accepted' | 'declined' | 'reschedule_requested'
  p_note text default null
)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_application_id uuid;
  v_applicant_id uuid;
  v_company_id uuid;
  v_job_title text;
begin
  if p_response not in ('accepted', 'declined', 'reschedule_requested') then
    raise exception 'Invalid response';
  end if;

  select i.application_id, a.applicant_id, j.company_id, j.title
    into v_application_id, v_applicant_id, v_company_id, v_job_title
  from public.interviews i
  join public.job_applications a on a.id = i.application_id
  join public.job_postings j on j.id = a.job_id
  where i.id = p_interview_id;

  if v_applicant_id is null or v_applicant_id != auth.uid() then
    raise exception 'Only the applicant can respond to this interview';
  end if;

  update public.interviews
  set status = p_response, applicant_response_note = p_note
  where id = p_interview_id;

  if p_response = 'accepted' then
    perform public.change_application_status(v_application_id, 'interview_scheduled');
  end if;

  perform public.create_notification(
    (select owner_id from public.companies where id = v_company_id),
    'interview_response',
    'Interview response: ' || v_job_title,
    'The candidate ' || replace(p_response::text, '_', ' ') || ' the interview.',
    '/dashboard/employer/jobs'
  );

  perform public.log_audit_event(
    'interview.responded', 'interview', p_interview_id,
    jsonb_build_object('response', p_response)
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- 6. offers
-- ---------------------------------------------------------------------------
create table if not exists public.offers (
  id              uuid primary key default gen_random_uuid(),
  application_id  uuid not null unique references public.job_applications(id) on delete cascade,
  created_by      uuid references public.profiles(id) on delete set null,
  position_title  text not null,
  salary          numeric(12,2),
  currency        text default 'LKR',
  start_date      date,
  benefits        text,
  terms           text,
  status          public.offer_status not null default 'sent',
  responded_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

drop trigger if exists trg_offers_updated_at on public.offers;
create trigger trg_offers_updated_at
  before update on public.offers
  for each row execute function public.set_updated_at();

create index if not exists idx_offers_application on public.offers(application_id);

create or replace function public.respond_to_offer(
  p_offer_id uuid,
  p_response public.offer_status   -- 'accepted' | 'rejected'
)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_application_id uuid;
  v_applicant_id uuid;
  v_company_id uuid;
  v_job_title text;
begin
  if p_response not in ('accepted', 'rejected') then
    raise exception 'Invalid response';
  end if;

  select o.application_id, a.applicant_id, j.company_id, j.title
    into v_application_id, v_applicant_id, v_company_id, v_job_title
  from public.offers o
  join public.job_applications a on a.id = o.application_id
  join public.job_postings j on j.id = a.job_id
  where o.id = p_offer_id;

  if v_applicant_id is null or v_applicant_id != auth.uid() then
    raise exception 'Only the applicant can respond to this offer';
  end if;

  update public.offers
  set status = p_response, responded_at = now()
  where id = p_offer_id;

  perform public.change_application_status(
    v_application_id,
    case when p_response = 'accepted' then 'offer_accepted' else 'offer_rejected' end
  );

  perform public.create_notification(
    (select owner_id from public.companies where id = v_company_id),
    'offer_response',
    'Offer response: ' || v_job_title,
    'The candidate ' || p_response::text || ' the offer.',
    '/dashboard/employer/jobs'
  );

  perform public.log_audit_event(
    'offer.responded', 'offer', p_offer_id, jsonb_build_object('response', p_response)
  );
end;
$$;
