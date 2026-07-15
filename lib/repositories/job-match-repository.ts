import { createClient } from "@/lib/supabase/server";
import type { JobMatch } from "@/types/database.types";

export const jobMatchRepository = {
  async upsert(jobId: string, applicantId: string, score: number, breakdown: unknown): Promise<void> {
    const supabase = await createClient();
    const { error } = await (supabase.from("job_matches") as any)
      .upsert(
        { job_id: jobId, applicant_id: applicantId, score, breakdown },
        { onConflict: "job_id,applicant_id" }
      );
    if (error) throw error;
  },

  /** Bulk equivalent of upsert() — one round trip for many rows instead of
   *  one call per row. PostgREST supports upserting an array directly. */
  async upsertMany(
    rows: { jobId: string; applicantId: string; score: number; breakdown: unknown }[]
  ): Promise<void> {
    if (rows.length === 0) return;
    const supabase = await createClient();
    const { error } = await (supabase.from("job_matches") as any)
      .upsert(
        rows.map((r) => ({ job_id: r.jobId, applicant_id: r.applicantId, score: r.score, breakdown: r.breakdown })),
        { onConflict: "job_id,applicant_id" }
      );
    if (error) throw error;
  },

  async markNotified(jobId: string, applicantId: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await (supabase.from("job_matches") as any)
      .update({ notified: true })
      .eq("job_id", jobId)
      .eq("applicant_id", applicantId);
    if (error) throw error;
  },

  async getForApplicantAndJob(jobId: string, applicantId: string): Promise<JobMatch | null> {
    const supabase = await createClient();
    const { data, error } = await (supabase.from("job_matches") as any)
      .select("*")
      .eq("job_id", jobId)
      .eq("applicant_id", applicantId)
      .maybeSingle();
    if (error) throw error;
    return data as JobMatch | null;
  },

  /** Batched equivalent of getForApplicantAndJob() — every cached match
   *  for this applicant across a set of jobs, in one query instead of one
   *  per job. This is the main lever for Browse Jobs: on a fully-cached
   *  visit (the common case), it turns N queries into 1. */
  async listForApplicantAcrossJobs(applicantId: string, jobIds: string[]): Promise<Map<string, JobMatch>> {
    const byJob = new Map<string, JobMatch>();
    if (jobIds.length === 0) return byJob;

    const supabase = await createClient();
    const { data, error } = await (supabase.from("job_matches") as any)
      .select("*")
      .eq("applicant_id", applicantId)
      .in("job_id", jobIds);
    if (error) throw error;

    for (const row of (data ?? []) as JobMatch[]) {
      byJob.set(row.job_id, row);
    }
    return byJob;
  },

  async listForJob(jobId: string): Promise<JobMatch[]> {
    const supabase = await createClient();
    const { data, error } = await (supabase.from("job_matches") as any)
      .select("*")
      .eq("job_id", jobId)
      .order("score", { ascending: false });
    if (error) throw error;
    return (data ?? []) as JobMatch[];
  },
};
