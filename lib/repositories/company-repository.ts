import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Company, Database } from "@/types/database.types";

export const companyRepository = {
  // Per-request memoization — called across many employer pages (company
  // profile, job postings, interviews, etc.), often more than once within
  // a single page load. See profile-repository.ts for the full rationale.
  getByOwner: cache(async (ownerId: string): Promise<Company | null> => {
    const supabase = await createClient();
    const { data, error } = await (supabase.from("companies") as any)
      .select("*")
      .eq("owner_id", ownerId)
      .maybeSingle();
    if (error) throw error;
    return data as Company | null;
  }),

  async getById(id: string): Promise<Company | null> {
    const supabase = await createClient();
    const { data, error } = await (supabase.from("companies") as any)
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data as Company | null;
  },

  /** Batched equivalent of getById() for many companies at once. */
  async getManyByIds(ids: string[]): Promise<Map<string, Company>> {
    const byId = new Map<string, Company>();
    const uniqueIds = [...new Set(ids)];
    if (uniqueIds.length === 0) return byId;

    const supabase = await createClient();
    const { data, error } = await (supabase.from("companies") as any)
      .select("*")
      .in("id", uniqueIds);
    if (error) throw error;

    for (const row of (data ?? []) as Company[]) {
      byId.set(row.id, row);
    }
    return byId;
  },

  async ensureExists(ownerId: string, name: string): Promise<Company> {
    const existing = await this.getByOwner(ownerId);
    if (existing) return existing;

    const supabase = await createClient();
    const { data, error } = await (supabase.from("companies") as any)
      .insert({ owner_id: ownerId, name })
      .select()
      .single();
    if (error) throw error;
    return data as Company;
  },

  async update(
    id: string,
    input: Database["public"]["Tables"]["companies"]["Update"]
  ): Promise<Company> {
    const supabase = await createClient();
    const { data, error } = await (supabase.from("companies") as any)
      .update(input)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data as Company;
  },

  /**
   * Checked right after a job is published — if the company has now
   * published a number of jobs that's a fresh multiple of 3, award one
   * boost credit. Counts jobs that have ever been published
   * (published_at is set), not just currently-published ones, since a
   * job that was posted and later closed still counts as "a real job
   * they posted."
   */
  async checkAndAwardBoostCredit(companyId: string): Promise<void> {
    const supabase = await createClient();
    const { count } = await (supabase.from("job_postings") as any)
      .select("*", { count: "exact", head: true })
      .eq("company_id", companyId)
      .not("published_at", "is", null);

    if (count && count > 0 && count % 3 === 0) {
      const { data: company } = await (supabase.from("companies") as any)
        .select("boost_credits")
        .eq("id", companyId)
        .maybeSingle();
      await (supabase.from("companies") as any)
        .update({ boost_credits: (company?.boost_credits ?? 0) + 1 })
        .eq("id", companyId);
    }
  },

  /** Redeems one credit to mark a job as boosted — the actual sort-to-top
   *  happens in job listing queries, not here. */
  async redeemBoostCredit(companyId: string, jobId: string): Promise<{ error?: string }> {
    const supabase = await createClient();
    const { data: company } = await (supabase.from("companies") as any)
      .select("boost_credits")
      .eq("id", companyId)
      .maybeSingle();
    if (!company || company.boost_credits < 1) {
      return { error: "No boost credits available" };
    }

    const { error: jobError } = await (supabase.from("job_postings") as any)
      .update({ is_boosted: true })
      .eq("id", jobId)
      .eq("company_id", companyId); // can only boost your own job
    if (jobError) return { error: jobError.message };

    await (supabase.from("companies") as any)
      .update({ boost_credits: company.boost_credits - 1 })
      .eq("id", companyId);
    return {};
  },

  /** Public directory listing — used by the /companies marketing page. */
  async listPublic(limit = 30): Promise<Company[]> {
    const supabase = await createClient();
    const { data, error } = await (supabase.from("companies") as any)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as Company[];
  },

  /** Admin-facing — all companies, optionally filtered by verification status. */
  async listForAdmin(status?: "pending" | "verified" | "rejected"): Promise<(Company & { owner: { full_name: string | null; email: string } | null })[]> {
    const supabase = await createClient();
    let query = (supabase.from("companies") as any).select("*").order("created_at", { ascending: false });
    if (status) query = query.eq("verification_status", status);
    const { data, error } = await query;
    if (error) throw error;

    const companies = (data ?? []) as Company[];
    if (companies.length === 0) return [];

    const ownerIds = companies.map((c) => c.owner_id);
    const { data: owners } = await (supabase.from("profiles") as any).select("id, full_name, email").in("id", ownerIds);
    const ownerById = new Map<string, { full_name: string | null; email: string }>((owners ?? []).map((o: any) => [o.id, o]));

    return companies.map((c) => ({ ...c, owner: ownerById.get(c.owner_id) ?? null }));
  },

  /**
   * Everything needed for the admin "one-stop view" of a company during a
   * phone inquiry: the company itself, its owner's account, its jobs, and
   * the support tickets filed by its owner.
   */
  async getDetailForAdmin(id: string) {
    const supabase = await createClient();
    const { data: company } = await (supabase.from("companies") as any).select("*").eq("id", id).maybeSingle();
    if (!company) return null;

    const [{ data: owner }, { data: jobs }, { data: supportTickets }] = await Promise.all([
      (supabase.from("profiles") as any).select("*").eq("id", company.owner_id).maybeSingle(),
      (supabase.from("job_postings") as any).select("id, title, status, created_at").eq("company_id", id).order("created_at", { ascending: false }),
      (supabase.from("support_tickets") as any).select("*").eq("user_id", company.owner_id).order("created_at", { ascending: false }),
    ]);

    return { company, owner, jobs: jobs ?? [], supportTickets: supportTickets ?? [] };
  },

  async reviewVerification(companyId: string, decision: "verified" | "rejected", comment?: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await (supabase.rpc as any)("review_company_verification", {
      p_company_id: companyId,
      p_decision: decision,
      p_comment: comment ?? null,
    });
    if (error) throw error;
  },
};
