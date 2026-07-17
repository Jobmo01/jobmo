import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { updateBrevoContactAttributes } from "@/lib/email/brevo";

// Caps how many of each reminder type get processed per run — keeps this
// bounded and predictable regardless of how large the user base grows,
// rather than risking one run trying to process thousands of rows at
// once. Easy to raise later; plenty of headroom at current scale.
const BATCH_LIMIT = 50;

/**
 * Runs once a day (see vercel.json) and checks for the 4 conditions the
 * email reminders depend on — Brevo has no way to know about any of these
 * on its own, since they all live inside JobMo's own data.
 *
 * Uses the service-role client deliberately: this route has no logged-in
 * user (Vercel's cron caller isn't authenticated as anyone), so the
 * normal cookie-based client — which every RLS policy in this app is
 * written around — would see no session and get blocked by RLS on
 * essentially everything. The service-role client is the documented
 * escape hatch for exactly this (see its own comment in
 * lib/supabase/server.ts), and every query below is read-only or a
 * narrowly-scoped update to the tracking columns this migration added.
 *
 * Protected by CRON_SECRET so this can't be triggered by anyone who finds
 * the URL — Vercel automatically sends this as a Bearer token for its own
 * scheduled invocations once the env var is set.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceRoleClient();
  const results = { abandonedProfile: 0, highMatch: 0, interview: 0, employerFollowUp: 0 };

  // ---------------------------------------------------------------------
  // 1. Abandoned profile — account created 3+ days ago, still incomplete,
  //    never reminded before.
  // ---------------------------------------------------------------------
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
  const { data: staleApplicants } = await (supabase.from("profiles") as any)
    .select("id, email, full_name")
    .eq("role", "applicant")
    .eq("status", "active")
    .lte("created_at", threeDaysAgo)
    .limit(BATCH_LIMIT * 3); // over-fetch a bit since not all will actually be incomplete

  for (const applicant of staleApplicants ?? []) {
    if (results.abandonedProfile >= BATCH_LIMIT) break;

    const { data: profile } = await (supabase.from("applicant_profiles") as any)
      .select("*")
      .eq("id", applicant.id)
      .maybeSingle();
    if (!profile || profile.abandoned_reminder_sent_at) continue;

    const isComplete = await isProfileComplete(supabase, applicant.id, profile);
    if (isComplete) continue;

    await updateBrevoContactAttributes(applicant.email, {
      ABANDONED_PROFILE_ALERT: true,
      ABANDONED_PROFILE_DATE: new Date().toISOString().slice(0, 10),
    });
    await (supabase.from("applicant_profiles") as any)
      .update({ abandoned_reminder_sent_at: new Date().toISOString() })
      .eq("id", applicant.id);
    results.abandonedProfile++;
  }

  // ---------------------------------------------------------------------
  // 2. High match, not yet applied — echoes the in-app notification via
  //    email, for people who don't check notifications regularly.
  // ---------------------------------------------------------------------
  const { data: highMatches } = await (supabase.from("job_matches") as any)
    .select("job_id, applicant_id, score, job_postings ( title, status, companies ( name ) )")
    .gte("score", 75)
    .is("email_reminded_at", null)
    .limit(BATCH_LIMIT * 2);

  for (const match of highMatches ?? []) {
    if (results.highMatch >= BATCH_LIMIT) break;
    if (match.job_postings?.status !== "published") continue;

    const { data: existingApplication } = await (supabase.from("job_applications") as any)
      .select("id")
      .eq("job_id", match.job_id)
      .eq("applicant_id", match.applicant_id)
      .maybeSingle();
    if (existingApplication) continue;

    const { data: applicant } = await (supabase.from("profiles") as any)
      .select("email")
      .eq("id", match.applicant_id)
      .maybeSingle();
    if (!applicant?.email) continue;

    await updateBrevoContactAttributes(applicant.email, {
      HIGH_MATCH_ALERT: true,
      HIGH_MATCH_SCORE: match.score,
      HIGH_MATCH_JOB_TITLE: match.job_postings?.title ?? "",
      HIGH_MATCH_COMPANY: match.job_postings?.companies?.name ?? "",
    });
    await (supabase.from("job_matches") as any)
      .update({ email_reminded_at: new Date().toISOString() })
      .eq("job_id", match.job_id)
      .eq("applicant_id", match.applicant_id);
    results.highMatch++;
  }

  // ---------------------------------------------------------------------
  // 3. Interview reminder — scheduled roughly "tomorrow" (a 10-hour
  //    window centered ~24h out, wide enough that a once-daily check
  //    reliably catches it regardless of what hour the cron happens to
  //    run at, without ever double-sending thanks to reminder_sent_at).
  // ---------------------------------------------------------------------
  const windowStart = new Date(Date.now() + 20 * 60 * 60 * 1000).toISOString();
  const windowEnd = new Date(Date.now() + 30 * 60 * 60 * 1000).toISOString();
  const { data: upcomingInterviews } = await (supabase.from("interviews") as any)
    .select("id, scheduled_at, mode, meeting_link, location, application_id, job_applications ( applicant_id, job_postings ( title ) )")
    .eq("status", "scheduled")
    .is("reminder_sent_at", null)
    .gte("scheduled_at", windowStart)
    .lte("scheduled_at", windowEnd)
    .limit(BATCH_LIMIT);

  for (const interview of upcomingInterviews ?? []) {
    const applicantId = interview.job_applications?.applicant_id;
    if (!applicantId) continue;

    const { data: applicant } = await (supabase.from("profiles") as any)
      .select("email")
      .eq("id", applicantId)
      .maybeSingle();
    if (!applicant?.email) continue;

    const scheduled = new Date(interview.scheduled_at);
    await updateBrevoContactAttributes(applicant.email, {
      INTERVIEW_ALERT: true,
      INTERVIEW_JOB_TITLE: interview.job_applications?.job_postings?.title ?? "",
      INTERVIEW_DATE: scheduled.toISOString().slice(0, 10),
      INTERVIEW_TIME: scheduled.toISOString().slice(11, 16),
      INTERVIEW_MODE: interview.mode ?? "",
    });
    await (supabase.from("interviews") as any)
      .update({ reminder_sent_at: new Date().toISOString() })
      .eq("id", interview.id);
    results.interview++;
  }

  // ---------------------------------------------------------------------
  // 4. Employer follow-up — applications sitting unreviewed 3+ days,
  //    grouped per company, rate-limited to at most once a week so this
  //    nudges rather than nags.
  // ---------------------------------------------------------------------
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: pendingApplications } = await (supabase.from("job_applications") as any)
    .select("id, job_postings ( company_id )")
    .in("status", ["applied", "viewed"])
    .lte("applied_at", threeDaysAgo)
    .limit(500);

  const pendingCountByCompany = new Map<string, number>();
  for (const app of pendingApplications ?? []) {
    const companyId = app.job_postings?.company_id;
    if (!companyId) continue;
    pendingCountByCompany.set(companyId, (pendingCountByCompany.get(companyId) ?? 0) + 1);
  }

  for (const [companyId, pendingCount] of pendingCountByCompany) {
    if (results.employerFollowUp >= BATCH_LIMIT) break;

    const { data: company } = await (supabase.from("companies") as any)
      .select("name, owner_id, last_follow_up_email_at")
      .eq("id", companyId)
      .maybeSingle();
    if (!company) continue;
    if (company.last_follow_up_email_at && company.last_follow_up_email_at > sevenDaysAgo) continue;

    const { data: owner } = await (supabase.from("profiles") as any)
      .select("email")
      .eq("id", company.owner_id)
      .maybeSingle();
    if (!owner?.email) continue;

    await updateBrevoContactAttributes(owner.email, {
      FOLLOWUP_ALERT: true,
      FOLLOWUP_PENDING_COUNT: pendingCount,
    });
    await (supabase.from("companies") as any)
      .update({ last_follow_up_email_at: new Date().toISOString() })
      .eq("id", companyId);
    results.employerFollowUp++;
  }

  return NextResponse.json({ ok: true, results });
}

/**
 * Mirrors getProfileCompletion()'s logic (lib/repositories/applicant-profile-repository.ts)
 * but takes an explicit client instead of creating its own — the original
 * always builds a cookie-bound client internally, which would be blocked
 * by RLS in this cron context (no logged-in user). Duplicated rather than
 * refactoring the original to accept an injected client, since that
 * function is called from several existing pages and threading a client
 * parameter through it and everything it calls risks disturbing code
 * that already works correctly today.
 */
async function isProfileComplete(supabase: any, applicantId: string, profile: any): Promise<boolean> {
  const personalDetailsDone = Boolean(
    profile?.first_name && profile?.last_name && profile?.phone && profile?.address_line &&
    profile?.district && profile?.date_of_birth && profile?.nic_number &&
    (profile?.passport_number || profile?.passport_not_applicable) &&
    (profile?.driving_license_number || profile?.driving_license_not_applicable)
  );
  const preferencesDone = Boolean(
    profile?.expected_salary_min && profile?.availability_date &&
    (profile?.preferred_locations?.length ?? 0) > 0 && profile?.remote_preference &&
    (profile?.employment_type_preference?.length ?? 0) > 0
  );
  if (!personalDetailsDone || !preferencesDone) return false;

  const countFor = async (table: string) => {
    const { count } = await supabase.from(table).select("*", { count: "exact", head: true }).eq("applicant_id", applicantId);
    return count ?? 0;
  };

  const [education, experience, skills, certifications, projects, awards, volunteer, hobbies, references] = await Promise.all(
    ["education", "experience", "skills", "certifications", "projects", "awards", "volunteer_experience", "hobbies", "applicant_references"].map(countFor)
  );

  if (education === 0 && !profile.education_not_applicable) return false;
  if (experience === 0 && !profile.experience_not_applicable) return false;
  if (skills < 3 && !profile.skills_not_applicable) return false;

  const extras = [
    certifications > 0 || profile.certifications_not_applicable,
    projects > 0 || profile.projects_not_applicable,
    awards > 0 || profile.awards_not_applicable,
    volunteer > 0 || profile.volunteer_not_applicable,
    hobbies > 0 || profile.hobbies_not_applicable,
    references > 0 || profile.references_not_applicable,
  ];
  return extras.every(Boolean);
}
