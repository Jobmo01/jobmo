import { createClient } from "@/lib/supabase/server";
import type { Interview, Database } from "@/types/database.types";

export const interviewRepository = {
  async listForApplication(applicationId: string): Promise<Interview[]> {
    const supabase = await createClient();
    const { data, error } = await (supabase.from("interviews") as any)
      .select("*")
      .eq("application_id", applicationId)
      .order("scheduled_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Interview[];
  },

  /** Batched equivalent of listForApplication() for many applications at once. */
  async listForApplications(applicationIds: string[]): Promise<Map<string, Interview[]>> {
    const byApplication = new Map<string, Interview[]>();
    if (applicationIds.length === 0) return byApplication;

    const supabase = await createClient();
    const { data, error } = await (supabase.from("interviews") as any)
      .select("*")
      .in("application_id", applicationIds)
      .order("scheduled_at", { ascending: false });
    if (error) throw error;

    for (const row of (data ?? []) as (Interview & { application_id: string })[]) {
      const list = byApplication.get(row.application_id) ?? [];
      list.push(row);
      byApplication.set(row.application_id, list);
    }
    return byApplication;
  },

  async listForCompany(companyId: string) {
    const supabase = await createClient();
    const { data, error } = await (supabase.from("interviews") as any)
      .select("*, job_applications ( job_id, applicant_id, job_postings ( title, company_id ), profiles ( full_name, email ) )")
      .order("scheduled_at", { ascending: true });
    if (error) throw error;
    // Filtered client-side by company_id since it's nested two joins deep —
    // RLS already guarantees only this company's rows come back anyway.
    return ((data ?? []) as any[]).filter(
      (row) => row.job_applications?.job_postings?.company_id === companyId
    );
  },

  async listForApplicant(applicantId: string) {
    const supabase = await createClient();
    const { data, error } = await (supabase.from("interviews") as any)
      .select("*, job_applications!inner ( applicant_id, job_postings ( title, companies ( name ) ) )")
      .eq("job_applications.applicant_id", applicantId)
      .order("scheduled_at", { ascending: true });
    if (error) throw error;
    return data ?? [];
  },

  async create(input: Database["public"]["Tables"]["interviews"]["Insert"]): Promise<Interview> {
    const supabase = await createClient();
    const { data, error } = await (supabase.from("interviews") as any)
      .insert(input)
      .select()
      .single();
    if (error) throw error;
    return data as Interview;
  },

  async update(id: string, input: Database["public"]["Tables"]["interviews"]["Update"]): Promise<Interview> {
    const supabase = await createClient();
    const { data, error } = await (supabase.from("interviews") as any)
      .update(input)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data as Interview;
  },

  async respond(interviewId: string, response: string, note?: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await (supabase.rpc as any)("respond_to_interview", {
      p_interview_id: interviewId,
      p_response: response,
      p_note: note ?? null,
    });
    if (error) throw error;
  },

  async reschedule(
    interviewId: string,
    input: {
      mode: string; platform: string | null; meeting_link: string | null; location: string | null;
      scheduled_at: string; duration_minutes: number; panel_members: string[]; instructions: string | null;
    }
  ): Promise<void> {
    const supabase = await createClient();
    const { error } = await (supabase.rpc as any)("reschedule_interview", {
      p_interview_id: interviewId,
      p_mode: input.mode,
      p_platform: input.platform,
      p_meeting_link: input.meeting_link,
      p_location: input.location,
      p_scheduled_at: input.scheduled_at,
      p_duration_minutes: input.duration_minutes,
      p_panel_members: input.panel_members,
      p_instructions: input.instructions,
    });
    if (error) throw error;
  },
};
