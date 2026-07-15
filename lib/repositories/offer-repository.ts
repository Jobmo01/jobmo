import { createClient } from "@/lib/supabase/server";
import type { Offer, Database } from "@/types/database.types";

export const offerRepository = {
  async countPendingForApplications(applicationIds: string[]): Promise<number> {
    if (applicationIds.length === 0) return 0;
    const supabase = await createClient();
    const { count, error } = await (supabase.from("offers") as any)
      .select("*", { count: "exact", head: true })
      .in("application_id", applicationIds)
      .eq("status", "sent");
    if (error) throw error;
    return count ?? 0;
  },

  async getForApplication(applicationId: string): Promise<Offer | null> {
    const supabase = await createClient();
    const { data, error } = await (supabase.from("offers") as any)
      .select("*")
      .eq("application_id", applicationId)
      .maybeSingle();
    if (error) throw error;
    return data as Offer | null;
  },

  /** Batched equivalent of getForApplication() for many applications at
   *  once. offers.application_id is unique, so at most one offer per key. */
  async getForApplications(applicationIds: string[]): Promise<Map<string, Offer>> {
    const byApplication = new Map<string, Offer>();
    if (applicationIds.length === 0) return byApplication;

    const supabase = await createClient();
    const { data, error } = await (supabase.from("offers") as any)
      .select("*")
      .in("application_id", applicationIds);
    if (error) throw error;

    for (const row of (data ?? []) as (Offer & { application_id: string })[]) {
      byApplication.set(row.application_id, row);
    }
    return byApplication;
  },

  async getById(id: string): Promise<Offer | null> {
    const supabase = await createClient();
    const { data, error } = await (supabase.from("offers") as any)
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data as Offer | null;
  },

  async create(input: Database["public"]["Tables"]["offers"]["Insert"]): Promise<Offer> {
    const supabase = await createClient();
    const { data, error } = await (supabase.from("offers") as any)
      .insert(input)
      .select()
      .single();
    if (error) throw error;
    return data as Offer;
  },

  async respond(offerId: string, response: "accepted" | "rejected"): Promise<void> {
    const supabase = await createClient();
    const { error } = await (supabase.rpc as any)("respond_to_offer", {
      p_offer_id: offerId,
      p_response: response,
    });
    if (error) throw error;
  },
};
