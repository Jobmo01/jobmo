import { createClient } from "@/lib/supabase/server";
import type { JobApplication, ApplicationNote, ApplicationStatusHistoryRow } from "@/types/database.types";

export const applicationRepository = {
  /** Access-control check for the employer-facing candidate profile page —
   *  an employer should only be able to view an applicant's full profile
   *  if that applicant has actually applied to one of their jobs (talent
   *  pool membership is checked separately by the caller). Not "did they
   *  apply to job X specifically" — any job at this company is enough,
   *  since a candidate profile isn't tied to one application. */
  async hasApplicantAppliedToCompany(applicantId: string, companyId: string): Promise<boolean> {
    const supabase = await createClient();
    const { data, error } = await (supabase.from("job_applications") as any)
      .select("id, job_postings!inner ( company_id )")
      .eq("applicant_id", applicantId)
      .eq("job_postings.company_id", companyId)
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return Boolean(data);
  },

  /** Lightweight — just status + applied_at (aliased to created_at for
   *  consistency with every other table's timestamp field name) across
   *  every job at a company, for dashboard charts. Not the heavy
   *  per-application join listForJob() does; this is one query, minimal
   *  columns. */
  async listLightForCompany(jobIds: string[]): Promise<{ id: string; status: string; created_at: string }[]> {
    if (jobIds.length === 0) return [];
    const supabase = await createClient();
    const { data, error } = await (supabase.from("job_applications") as any)
      .select("id, status, job_id, created_at:applied_at")
      .in("job_id", jobIds);
    if (error) throw error;
    return (data ?? []) as any;
  },

  async listForJob(jobId: string) {
    const supabase = await createClient();
    const { data, error } = await (supabase.from("job_applications") as any)
      .select("*, profiles ( full_name, email, avatar_url )")
      .eq("job_id", jobId)
      .order("applied_at", { ascending: false });
    if (error) throw error;

    const applications = data ?? [];
    if (applications.length === 0) return applications;

    // applicant_profiles has no direct FK to job_applications (both merely
    // reference profiles independently), so PostgREST can't embed it in the
    // query above — fetch it separately and merge by applicant_id.
    const applicantIds = applications.map((a: any) => a.applicant_id);
    const { data: profiles, error: profilesError } = await (supabase.from("applicant_profiles") as any)
      .select("id, first_name, last_name, phone, district")
      .in("id", applicantIds);
    if (profilesError) throw profilesError;

    const byId = new Map((profiles ?? []).map((p: any) => [p.id, p]));
    return applications.map((a: any) => ({ ...a, applicant_profiles: byId.get(a.applicant_id) ?? null }));
  },

  /** Every application platform-wide, minimal columns — feeds the
   *  platform analytics charts (volume over time, status breakdown). */
  async listAllLight(): Promise<{ status: string; created_at: string }[]> {
    const supabase = await createClient();
    const { data, error } = await (supabase.from("job_applications") as any)
      .select("status, created_at:applied_at");
    if (error) throw error;
    return (data ?? []) as any;
  },

  /** Lightweight — just the job_id column, no joined profile data, one
   *  query total. Use this instead of calling listForJob() per job and
   *  taking .length: listForJob() fetches full application rows plus a
   *  joined applicant_profiles merge, which is a lot of unnecessary data
   *  (and an extra query per job) just to count.
   */
  async countByJobIds(jobIds: string[]): Promise<Map<string, number>> {
    const counts = new Map<string, number>();
    if (jobIds.length === 0) return counts;

    const supabase = await createClient();
    const { data, error } = await (supabase.from("job_applications") as any)
      .select("job_id")
      .in("job_id", jobIds);
    if (error) throw error;

    for (const row of (data ?? []) as { job_id: string }[]) {
      counts.set(row.job_id, (counts.get(row.job_id) ?? 0) + 1);
    }
    return counts;
  },

  async listForApplicant(applicantId: string) {
    const supabase = await createClient();
    const { data, error } = await (supabase.from("job_applications") as any)
      .select("*, job_postings ( title, work_type, employment_type, companies ( name, logo_url ) )")
      .eq("applicant_id", applicantId)
      .order("applied_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async getById(id: string) {
    const supabase = await createClient();
    const { data, error } = await (supabase.from("job_applications") as any)
      .select("*, job_postings ( *, companies ( id, name, logo_url, owner_id ) ), profiles ( full_name, email )")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;

    // Same reason as listForJob() above — fetch and attach separately.
    const { data: applicantProfile } = await (supabase.from("applicant_profiles") as any)
      .select("*")
      .eq("id", data.applicant_id)
      .maybeSingle();

    return { ...data, applicant_profiles: applicantProfile ?? null };
  },

  async getByJobAndApplicant(jobId: string, applicantId: string): Promise<JobApplication | null> {
    const supabase = await createClient();
    const { data, error } = await (supabase.from("job_applications") as any)
      .select("*")
      .eq("job_id", jobId)
      .eq("applicant_id", applicantId)
      .maybeSingle();
    if (error) throw error;
    return data as JobApplication | null;
  },

  async apply(jobId: string, applicantId: string, coverLetter?: string): Promise<JobApplication> {
    const supabase = await createClient();
    const { data, error } = await (supabase.from("job_applications") as any)
      .insert({ job_id: jobId, applicant_id: applicantId, cover_letter: coverLetter })
      .select()
      .single();
    if (error) throw error;
    return data as JobApplication;
  },

  async updateTags(applicationId: string, tags: string[]): Promise<void> {
    const supabase = await createClient();
    const { error } = await (supabase.from("job_applications") as any)
      .update({ tags })
      .eq("id", applicationId);
    if (error) throw error;
  },

  async changeStatus(applicationId: string, newStatus: string, note?: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await (supabase.rpc as any)("change_application_status", {
      p_application_id: applicationId,
      p_new_status: newStatus,
      p_note: note ?? null,
    });
    if (error) throw error;
  },

  async listNotes(applicationId: string): Promise<ApplicationNote[]> {
    const supabase = await createClient();
    const { data, error } = await (supabase.from("application_notes") as any)
      .select("*, profiles ( full_name )")
      .eq("application_id", applicationId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as ApplicationNote[];
  },

  /** Batched equivalent of listNotes() for many applications at once — see
   *  listForMany() in applicant-profile-repository.ts for the same pattern. */
  async listNotesForApplications(applicationIds: string[]): Promise<Map<string, ApplicationNote[]>> {
    const byApplication = new Map<string, ApplicationNote[]>();
    if (applicationIds.length === 0) return byApplication;

    const supabase = await createClient();
    const { data, error } = await (supabase.from("application_notes") as any)
      .select("*, profiles ( full_name )")
      .in("application_id", applicationIds)
      .order("created_at", { ascending: false });
    if (error) throw error;

    for (const row of (data ?? []) as (ApplicationNote & { application_id: string })[]) {
      const list = byApplication.get(row.application_id) ?? [];
      list.push(row);
      byApplication.set(row.application_id, list);
    }
    return byApplication;
  },

  async addNote(applicationId: string, authorId: string, note: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await (supabase.from("application_notes") as any).insert({
      application_id: applicationId,
      author_id: authorId,
      note,
    });
    if (error) throw error;
  },

  async listStatusHistory(applicationId: string): Promise<ApplicationStatusHistoryRow[]> {
    const supabase = await createClient();
    const { data, error } = await (supabase.from("application_status_history") as any)
      .select("*")
      .eq("application_id", applicationId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (data ?? []) as ApplicationStatusHistoryRow[];
  },
};
