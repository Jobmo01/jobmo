import { createClient } from "@/lib/supabase/server";
import type { JobPosting, Database } from "@/types/database.types";

export const jobRepository = {
  async listForCompany(companyId: string): Promise<JobPosting[]> {
    const supabase = await createClient();
    const { data, error } = await (supabase.from("job_postings") as any)
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as JobPosting[];
  },

  /** Every job posting platform-wide, regardless of company — admin moderation view. */
  async listAllForAdmin(): Promise<(JobPosting & { companies: { name: string } | null })[]> {
    const supabase = await createClient();
    const { data, error } = await (supabase.from("job_postings") as any)
      .select("*, companies ( name )")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as any;
  },
  async getById(id: string): Promise<JobPosting | null> {
    const supabase = await createClient();
    const { data, error } = await (supabase.from("job_postings") as any)
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data as JobPosting | null;
  },

  async create(input: Database["public"]["Tables"]["job_postings"]["Insert"]): Promise<JobPosting> {
    const supabase = await createClient();
    const { data, error } = await (supabase.from("job_postings") as any)
      .insert(input)
      .select()
      .single();
    if (error) throw error;
    return data as JobPosting;
  },

  async update(
    id: string,
    input: Database["public"]["Tables"]["job_postings"]["Update"]
  ): Promise<JobPosting> {
    const supabase = await createClient();
    const { data, error } = await (supabase.from("job_postings") as any)
      .update(input)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data as JobPosting;
  },

  async remove(id: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await (supabase.from("job_postings") as any).delete().eq("id", id);
    if (error) throw error;
  },

  async countApplications(jobId: string): Promise<number> {
    const supabase = await createClient();
    const { count, error } = await (supabase.from("job_applications") as any)
      .select("*", { count: "exact", head: true })
      .eq("job_id", jobId);
    if (error) throw error;
    return count ?? 0;
  },

  /** Public job board — published jobs only, per RLS. Boosted jobs sort
   *  first (the whole point of redeeming a boost credit), newest-first
   *  within each group. */
  async listPublished(limit = 50): Promise<(JobPosting & { companies: { name: string; logo_url: string | null } | null })[]> {
    const supabase = await createClient();
    const { data, error } = await (supabase.from("job_postings") as any)
      .select("*, companies ( name, logo_url )")
      .eq("status", "published")
      .order("is_boosted", { ascending: false })
      .order("published_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as any;
  },

  async getPublishedById(id: string) {
    const supabase = await createClient();
    const { data, error } = await (supabase.from("job_postings") as any)
      .select("*, companies ( id, name, logo_url, verification_status, locations )")
      .eq("id", id)
      .eq("status", "published")
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async incrementViews(id: string): Promise<void> {
    const supabase = await createClient();
    await (supabase.rpc as any)("increment_job_views", { p_job_id: id }).then(
      () => {},
      // Non-fatal — view counting is a nice-to-have, never block the page on it.
      () => {}
    );
  },
};
