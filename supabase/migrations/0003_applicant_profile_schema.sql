-- =============================================================================
-- JobMo — Phase 2: Applicant Profile schema
-- Name this query: "phase2_applicant_profile_schema"
-- Run AFTER Phase 1 migrations (0001, 0002).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  if not exists (select 1 from pg_type where typname = 'proficiency_level') then
    create type public.proficiency_level as enum ('beginner', 'intermediate', 'advanced', 'expert');
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_type where typname = 'employment_type') then
    create type public.employment_type as enum ('full_time', 'part_time', 'contract', 'internship', 'freelance');
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_type where typname = 'remote_preference') then
    create type public.remote_preference as enum ('on_site', 'hybrid', 'remote', 'flexible');
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_type where typname = 'dob_change_status') then
    create type public.dob_change_status as enum ('pending', 'approved', 'rejected');
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- applicant_profiles — 1:1 extension of `profiles`, for applicant-only fields.
-- Kept separate from `profiles` so employer/admin accounts never carry these
-- columns, and so date_of_birth can be locked down with its own column-level
-- discipline (see the guarded RPC below — this is the ONLY way it changes).
-- ---------------------------------------------------------------------------
create table if not exists public.applicant_profiles (
  id                    uuid primary key references public.profiles(id) on delete cascade,

  -- Personal details
  first_name            text,
  middle_name           text,
  last_name             text,
  gender                text,
  date_of_birth         date,                     -- see dob_change_requests: never updated directly
  nationality           text,
  nic_number            text,
  passport_number       text,
  driving_license_number text,
  address_line          text,
  district              text,
  province              text,
  country               text default 'Sri Lanka',
  phone                 text,
  emergency_contact_name text,
  emergency_contact_phone text,

  -- Social / portfolio
  github_url            text,
  linkedin_url          text,
  behance_url           text,
  portfolio_url         text,
  website_url           text,

  -- Job preferences
  expected_salary_min   numeric(12,2),
  expected_salary_max   numeric(12,2),
  salary_currency       text default 'LKR',
  availability_date     date,
  preferred_locations   text[] not null default '{}',
  remote_preference     public.remote_preference,
  industry_preference   text[] not null default '{}',
  employment_type_preference public.employment_type[] not null default '{}',
  notice_period_days    int,

  -- Privacy / visibility
  profile_visible_to_employers boolean not null default true,
  notification_preferences jsonb not null default '{"email": true, "in_app": true}'::jsonb,

  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

drop trigger if exists trg_applicant_profiles_updated_at on public.applicant_profiles;
create trigger trg_applicant_profiles_updated_at
  before update on public.applicant_profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- dob_change_requests — the only path by which date_of_birth ever changes.
-- ---------------------------------------------------------------------------
create table if not exists public.dob_change_requests (
  id                uuid primary key default gen_random_uuid(),
  applicant_id      uuid not null references public.profiles(id) on delete cascade,
  current_dob       date,
  requested_dob     date not null,
  reason            text not null,
  nic_document_url  text,
  passport_document_url text,
  driving_license_document_url text,
  status            public.dob_change_status not null default 'pending',
  reviewed_by        uuid references public.profiles(id) on delete set null,
  review_comment    text,
  created_at        timestamptz not null default now(),
  reviewed_at       timestamptz
);

create index if not exists idx_dob_requests_applicant on public.dob_change_requests(applicant_id);
create index if not exists idx_dob_requests_status on public.dob_change_requests(status);

-- Guarded approval RPC — callable only by admin/super_admin. Applies the
-- change to applicant_profiles.date_of_birth and writes an audit log entry.
-- The Phase 6 Admin UI calls this; it already works today via direct RPC call.
create or replace function public.review_dob_change_request(
  p_request_id uuid,
  p_decision public.dob_change_status,   -- 'approved' or 'rejected'
  p_comment text default null
)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_applicant_id uuid;
  v_new_dob date;
begin
  if not public.is_admin() then
    raise exception 'Only admin/super_admin can review DOB change requests';
  end if;
  if p_decision not in ('approved', 'rejected') then
    raise exception 'Decision must be approved or rejected';
  end if;

  select applicant_id, requested_dob into v_applicant_id, v_new_dob
  from public.dob_change_requests where id = p_request_id and status = 'pending';

  if v_applicant_id is null then
    raise exception 'Request not found or already reviewed';
  end if;

  update public.dob_change_requests
  set status = p_decision, reviewed_by = auth.uid(), review_comment = p_comment, reviewed_at = now()
  where id = p_request_id;

  if p_decision = 'approved' then
    update public.applicant_profiles set date_of_birth = v_new_dob where id = v_applicant_id;
  end if;

  perform public.log_audit_event(
    'profile.dob_change_' || p_decision,
    'dob_change_request',
    p_request_id,
    jsonb_build_object('applicant_id', v_applicant_id, 'new_dob', v_new_dob, 'comment', p_comment)
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Repeatable profile sections. All share the same shape: owned by an
-- applicant, unlimited entries, standard timestamps.
-- ---------------------------------------------------------------------------

create table if not exists public.education_entries (
  id              uuid primary key default gen_random_uuid(),
  applicant_id    uuid not null references public.profiles(id) on delete cascade,
  institution     text not null,
  qualification   text not null,
  field_of_study  text,
  grade           text,
  start_date      date,
  end_date        date,
  certificate_url text,
  transcript_url  text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists public.experience_entries (
  id              uuid primary key default gen_random_uuid(),
  applicant_id    uuid not null references public.profiles(id) on delete cascade,
  company         text not null,
  position        text not null,
  description     text,
  employment_type public.employment_type,
  is_current      boolean not null default false,
  start_date      date,
  end_date        date,
  reference_name  text,
  reference_contact text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists public.skills (
  id              uuid primary key default gen_random_uuid(),
  applicant_id    uuid not null references public.profiles(id) on delete cascade,
  name            text not null,
  proficiency     public.proficiency_level not null default 'intermediate',
  is_ai_suggested boolean not null default false, -- populated by Phase 4 skill extraction
  created_at      timestamptz not null default now(),
  unique (applicant_id, name)
);

create table if not exists public.certifications (
  id              uuid primary key default gen_random_uuid(),
  applicant_id    uuid not null references public.profiles(id) on delete cascade,
  name            text not null,
  issuer          text,
  issue_date      date,
  expiry_date     date,
  credential_url  text,
  document_url    text,
  created_at      timestamptz not null default now()
);

create table if not exists public.projects (
  id              uuid primary key default gen_random_uuid(),
  applicant_id    uuid not null references public.profiles(id) on delete cascade,
  title           text not null,
  description     text,
  project_url     text,
  start_date      date,
  end_date        date,
  created_at      timestamptz not null default now()
);

create table if not exists public.awards (
  id              uuid primary key default gen_random_uuid(),
  applicant_id    uuid not null references public.profiles(id) on delete cascade,
  title           text not null,
  issuer          text,
  award_date      date,
  description     text,
  created_at      timestamptz not null default now()
);

create table if not exists public.volunteer_experience (
  id              uuid primary key default gen_random_uuid(),
  applicant_id    uuid not null references public.profiles(id) on delete cascade,
  organization    text not null,
  role            text,
  description     text,
  start_date      date,
  end_date        date,
  created_at      timestamptz not null default now()
);

create table if not exists public.languages (
  id              uuid primary key default gen_random_uuid(),
  applicant_id    uuid not null references public.profiles(id) on delete cascade,
  name            text not null,
  proficiency     public.proficiency_level not null default 'intermediate',
  created_at      timestamptz not null default now(),
  unique (applicant_id, name)
);

create table if not exists public.hobbies (
  id              uuid primary key default gen_random_uuid(),
  applicant_id    uuid not null references public.profiles(id) on delete cascade,
  name            text not null,
  created_at      timestamptz not null default now(),
  unique (applicant_id, name)
);

create table if not exists public.applicant_references (
  id              uuid primary key default gen_random_uuid(),
  applicant_id    uuid not null references public.profiles(id) on delete cascade,
  name            text not null,
  relationship    text,
  company         text,
  email           text,
  phone           text,
  created_at      timestamptz not null default now()
);

-- Indexes shared by every repeatable-section table
do $$
declare
  t text;
begin
  foreach t in array array[
    'education_entries','experience_entries','skills','certifications',
    'projects','awards','volunteer_experience','languages','hobbies',
    'applicant_references'
  ]
  loop
    execute format('create index if not exists idx_%s_applicant on public.%I(applicant_id);', t, t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------------
create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  type        text not null,             -- e.g. 'job_match', 'application_status', 'system'
  title       text not null,
  body        text,
  link        text,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists idx_notifications_user on public.notifications(user_id, created_at desc);

create or replace function public.create_notification(
  p_user_id uuid, p_type text, p_title text, p_body text default null, p_link text default null
)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare v_id uuid;
begin
  insert into public.notifications (user_id, type, title, body, link)
  values (p_user_id, p_type, p_title, p_body, p_link)
  returning id into v_id;
  return v_id;
end;
$$;

do $$
begin
  alter publication supabase_realtime add table public.notifications;
exception
  when duplicate_object then null;
  when undefined_object then null; -- publication not yet created in some local setups
end $$;
