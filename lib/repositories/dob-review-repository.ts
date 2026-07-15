import { createClient } from "@/lib/supabase/server";
import type { DobChangeStatus } from "@/types/database.types";

export const dobReviewRepository = {
  async listByStatus(status: DobChangeStatus | "all" = "pending") {
    const supabase = await createClient();
    let query = (supabase.from("dob_change_requests") as any)
      .select("*")
      .order("created_at", { ascending: false });
    if (status !== "all") query = query.eq("status", status);
    const { data, error } = await query;
    if (error) throw error;

    if (!data || data.length === 0) return [];

    // profiles has no direct FK path from dob_change_requests suitable for
    // a single-hop embed alongside everything else already selected here,
    // so fetch applicant names separately and merge (same pattern used in
    // applicationRepository for applicant_profiles).
    const applicantIds = data.map((r: any) => r.applicant_id);
    const { data: profiles } = await (supabase.from("profiles") as any)
      .select("id, full_name, email")
      .in("id", applicantIds);
    const byId = new Map((profiles ?? []).map((p: any) => [p.id, p]));

    return data.map((r: any) => ({ ...r, applicant: byId.get(r.applicant_id) ?? null }));
  },

  async getSignedDocumentUrl(path: string): Promise<string | null> {
    const supabase = await createClient();
    const { data, error } = await supabase.storage.from("documents").createSignedUrl(path, 300); // 5 minutes
    if (error) return null;
    return data.signedUrl;
  },

  async review(requestId: string, decision: "approved" | "rejected", comment: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await (supabase.rpc as any)("review_dob_change_request", {
      p_request_id: requestId,
      p_decision: decision,
      p_comment: comment,
    });
    if (error) throw error;
  },
};
