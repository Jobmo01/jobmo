-- =============================================================================
-- JobMo — Phase 3 patch 2: harden respond_to_offer()
-- Name this query: "phase3_offer_response_fix"
-- Run AFTER 0010_pipeline_fixes.sql
--
-- Defensive rewrite of respond_to_offer(): replaces an inline CASE
-- expression (passed directly as a function argument) with an explicitly
-- typed local variable, removing any ambiguity in how Postgres resolves the
-- literal's type against the application_status enum at the call boundary.
-- Also adds an explicit "offer not found" check for a clearer error instead
-- of silently proceeding with null values if the lookup fails.
-- =============================================================================

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
