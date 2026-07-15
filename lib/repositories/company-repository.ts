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
