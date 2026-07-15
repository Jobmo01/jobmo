-- =============================================================================
-- JobMo — Phase 3 patch: fix Accept-interview bug, applicant-name visibility,
-- and notification deep-linking
-- Name this query: "phase3_pipeline_fixes"
-- Run AFTER 0009_company_assets_bucket.sql
-- =============================================================================

-- ---------------------------------------------------------------------------
-- BUG FIX 1: employers couldn't see an applicant's name/email on the
-- pipeline board (showed the literal fallback "Applicant"). applicant_profiles
-- already had an employer-visibility policy (Phase 3), but the base
-- `profiles` row (full_name, email) never got an equivalent policy — so the
-- join returned nothing. Scoped tightly: only profiles of people who have
-- actually applied to one of the employer's own jobs are visible this way
-- (unlike applicant_profiles' broader "visible to any employer" toggle,
-- since this table holds more sensitive contact info).
-- ---------------------------------------------------------------------------
drop policy if exists "profiles_select_employer_applicants" on public.profiles;
create policy "profiles_select_employer_applicants"
  on public.profiles for select
  using (
    exists (
      select 1 from public.job_applications a
      join public.job_postings j on j.id = a.job_id
      where a.applicant_id = profiles.id and public.is_company_owner(j.company_id)
    )
  );

-- ---------------------------------------------------------------------------
-- BUG FIX 2: accepting an interview failed with a generic error. Root cause:
-- respond_to_interview() (called by the APPLICANT) internally called
-- change_application_status(), which checks "is the caller the hiring
-- company?" — true for employer-initiated changes, but false here, since
-- auth.uid() still reflects the real caller even inside a SECURITY DEFINER
-- function. That check correctly blocks direct misuse, but also blocked this
-- legitimate internal transition.
--
-- Fix: split the actual status-mutation logic into a shared internal helper
-- with NO caller check, and have change_application_status() (employer path)
-- verify ownership itself before calling the helper, while
-- respond_to_interview()/respond_to_offer() (applicant path — already
-- verified the applicant owns the interview/offer before this point) call
-- the helper directly.
-- ---------------------------------------------------------------------------
create or replace function public._apply_application_status(
  p_application_id uuid,
  p_new_status public.application_status,
  p_actor uuid,
  p_note text default null
)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_applicant_id uuid;
  v_old_status public.application_status;
  v_job_title text;
begin
  select a.applicant_id, a.status, j.title
    into v_applicant_id, v_old_status, v_job_title
  from public.job_applications a
  join public.job_postings j on j.id = a.job_id
  where a.id = p_application_id;

  if v_applicant_id is null then
    raise exception 'Application not found';
  end if;

  update public.job_applications
  set status = p_new_status
  where id = p_application_id;

  insert into public.application_status_history (application_id, from_status, to_status, changed_by)
  values (p_application_id, v_old_status, p_new_status, p_actor);

  if p_note is not null then
    insert into public.application_notes (application_id, author_id, note)
    values (p_application_id, p_actor, p_note);
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
  v_company_id uuid;
begin
  select j.company_id into v_company_id
  from public.job_applications a
  join public.job_postings j on j.id = a.job_id
  where a.id = p_application_id;

  if v_company_id is null then
    raise exception 'Application not found';
  end if;

  if not public.is_company_owner(v_company_id) then
    raise exception 'Only the hiring company can change this application''s status';
  end if;

  perform public._apply_application_status(p_application_id, p_new_status, auth.uid(), p_note);
end;
$$;

-- respond_to_interview(): now calls the unchecked helper directly for the
-- 'accepted' transition (the applicant-ownership check earlier in this same
-- function is what makes this safe), and resolves job_id for a deep link.
create or replace function public.respond_to_interview(
  p_interview_id uuid,
  p_response public.interview_status,
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
  v_job_id uuid;
  v_job_title text;
  v_owner_id uuid;
  v_response_label text;
begin
  if p_response not in ('accepted', 'declined', 'reschedule_requested') then
    raise exception 'Invalid response';
  end if;

  select i.application_id, a.applicant_id, j.company_id, j.id, j.title
    into v_application_id, v_applicant_id, v_company_id, v_job_id, v_job_title
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
    perform public._apply_application_status(v_application_id, 'interview_scheduled', auth.uid());
  end if;

  select owner_id into v_owner_id from public.companies where id = v_company_id;

  v_response_label := case p_response
    when 'reschedule_requested' then 'requested a reschedule for'
    else replace(p_response::text, '_', ' ')
  end;

  perform public.create_notification(
    v_owner_id,
    'interview_response',
    'Interview response: ' || v_job_title,
    'The candidate ' || v_response_label || ' the interview.',
    '/dashboard/employer/jobs/' || v_job_id::text || '/pipeline'
  );

  perform public.log_audit_event(
    'interview.responded', 'interview', p_interview_id,
    jsonb_build_object('response', p_response)
  );
end;
$$;

-- respond_to_offer(): same fix — call the unchecked helper directly.
create or replace function public.respond_to_offer(
  p_offer_id uuid,
  p_response public.offer_status
)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_application_id uuid;
  v_applicant_id uuid;
  v_company_id uuid;
  v_job_id uuid;
  v_job_title text;
  v_owner_id uuid;
  v_new_status public.application_status;
begin
  if p_response not in ('accepted', 'rejected') then
    raise exception 'Invalid response';
  end if;

  select o.application_id, a.applicant_id, j.company_id, j.id, j.title
    into v_application_id, v_applicant_id, v_company_id, v_job_id, v_job_title
  from public.offers o
  join public.job_applications a on a.id = o.application_id
  join public.job_postings j on j.id = a.job_id
  where o.id = p_offer_id;

  if v_application_id is null then
    raise exception 'Offer not found';
  end if;

  if v_applicant_id is null or v_applicant_id != auth.uid() then
    raise exception 'Only the applicant can respond to this offer';
  end if;

  update public.offers
  set status = p_response, responded_at = now()
  where id = p_offer_id;

  if p_response = 'accepted' then
    v_new_status := 'offer_accepted';
  else
    v_new_status := 'offer_rejected';
  end if;

  perform public._apply_application_status(v_application_id, v_new_status, auth.uid());

  select owner_id into v_owner_id from public.companies where id = v_company_id;

  perform public.create_notification(
    v_owner_id,
    'offer_response',
    'Offer response: ' || v_job_title,
    'The candidate ' || p_response::text || ' the offer.',
    '/dashboard/employer/jobs/' || v_job_id::text || '/pipeline'
  );

  perform public.log_audit_event(
    'offer.responded', 'offer', p_offer_id, jsonb_build_object('response', p_response)
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- New: reschedule_interview() — lets the employer edit an existing
-- interview's time/details and resets it to 'proposed' so the applicant can
-- respond again. This is the missing feature: previously there was no way
-- to reschedule, only to propose a brand new interview.
-- ---------------------------------------------------------------------------
create or replace function public.reschedule_interview(
  p_interview_id uuid,
  p_mode public.interview_mode,
  p_platform text,
  p_meeting_link text,
  p_location text,
  p_scheduled_at timestamptz,
  p_duration_minutes int,
  p_panel_members text[],
  p_instructions text
)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_company_id uuid;
  v_applicant_id uuid;
  v_job_id uuid;
  v_job_title text;
begin
  select j.company_id, a.applicant_id, j.id, j.title
    into v_company_id, v_applicant_id, v_job_id, v_job_title
  from public.interviews i
  join public.job_applications a on a.id = i.application_id
  join public.job_postings j on j.id = a.job_id
  where i.id = p_interview_id;

  if v_company_id is null then
    raise exception 'Interview not found';
  end if;

  if not public.is_company_owner(v_company_id) then
    raise exception 'Only the hiring company can reschedule this interview';
  end if;

  update public.interviews
  set mode = p_mode, platform = p_platform, meeting_link = p_meeting_link,
      location = p_location, scheduled_at = p_scheduled_at,
      duration_minutes = p_duration_minutes, panel_members = p_panel_members,
      instructions = p_instructions, status = 'proposed', applicant_response_note = null
  where id = p_interview_id;

  perform public.create_notification(
    v_applicant_id,
    'interview_response',
    'Interview rescheduled: ' || v_job_title,
    'The employer proposed a new time for your interview. Please review and respond.',
    '/dashboard/applicant/jobs'
  );

  perform public.log_audit_event(
    'interview.rescheduled', 'interview', p_interview_id,
    jsonb_build_object('new_time', p_scheduled_at)
  );
end;
$$;
