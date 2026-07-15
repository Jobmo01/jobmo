-- =============================================================================
-- JobMo — Bug fix batch: DOB first-time set, interview decline status
-- Name this query: "phase2_3_bugfix_batch"
-- Run AFTER 0019_job_matches_rls_fix.sql
-- =============================================================================

-- ---------------------------------------------------------------------------
-- ISSUE 1 FIX: Date of birth should be settable directly the FIRST time
-- (no approval needed — there's nothing to "change" yet). Only actual
-- CHANGES to an already-set date of birth require the approval flow.
--
-- Previously the app code always stripped date_of_birth from any direct
-- update, meaning applicants had no way to set it at all except through
-- the change-request-and-approval flow — even for a first-time entry.
--
-- This trigger enforces the rule at the database level (not just in app
-- code, which could be bypassed by calling the Supabase client directly):
-- once date_of_birth is non-null, any further change is blocked UNLESS
-- the transaction explicitly flags itself as the approved-change path via
-- a session setting that only review_dob_change_request() sets.
-- ---------------------------------------------------------------------------
create or replace function public.protect_date_of_birth()
returns trigger
language plpgsql
as $$
begin
  if OLD.date_of_birth is not null
     and NEW.date_of_birth is distinct from OLD.date_of_birth
     and coalesce(current_setting('jobmo.allow_dob_change', true), 'false') <> 'true' then
    raise exception 'date_of_birth can only be changed via an approved change request';
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_protect_dob on public.applicant_profiles;
create trigger trg_protect_dob
  before update on public.applicant_profiles
  for each row execute function public.protect_date_of_birth();

-- Update the approval RPC to set the flag right before it applies an
-- approved change — set_config(..., true) scopes it to just this
-- transaction, so it can never leak into any other request.
create or replace function public.review_dob_change_request(
  p_request_id uuid,
  p_decision public.dob_change_status,
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
    perform set_config('jobmo.allow_dob_change', 'true', true);
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
-- ISSUE 8 FIX: when an applicant declines a scheduled interview, the
-- application's overall pipeline status stayed stuck on
-- "interview_scheduled" — misleading, since the interview isn't happening.
-- Now it reverts to "shortlisted" (the stage before the interview attempt),
-- with an audit note, so the employer sees it needs a decision again
-- instead of appearing to still be waiting on a scheduled interview.
-- ---------------------------------------------------------------------------
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
  elsif p_response = 'declined' then
    perform public._apply_application_status(
      v_application_id, 'shortlisted', auth.uid(),
      'Candidate declined the scheduled interview.'
    );
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
