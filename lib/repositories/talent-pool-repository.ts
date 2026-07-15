import { createClient } from "@/lib/supabase/server";
import type { TalentPoolEntry } from "@/types/database.types";

export const talentPoolRepository = {
  /** Lightweight — just applicant_id, for checking "is this candidate
   *  already saved?" across a whole pipeline board without a query per card. */
  async listApplicantIdsInPool(companyId: string): Promise<Set<string>> {
    const supabase = await createClient();
    const { data, error } = await (supabase.from("talent_pool") as any)
      .select("applicant_id")
      .eq("company_id", companyId);
    if (error) throw error;
    return new Set((data ?? []).map((r: any) => r.applicant_id));
  },

  async add(companyId: string, applicantId: string, addedBy: string, note: string | null, sourceApplicationId: string | null): Promise<void> {
    const supabase = await createClient();
    const { error } = await (supabase.from("talent_pool") as any).insert({
      company_id: companyId,
      applicant_id: applicantId,
      added_by: addedBy,
      note,
      source_application_id: sourceApplicationId,
    });
    if (error) throw error;
  },

  async remove(id: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await (supabase.from("talent_pool") as any).delete().eq("id", id);
    if (error) throw error;
  },

  async isInPool(companyId: string, applicantId: string): Promise<boolean> {
    const supabase = await createClient();
    const { data, error } = await (supabase.from("talent_pool") as any)
      .select("id")
      .eq("company_id", companyId)
      .eq("applicant_id", applicantId)
      .maybeSingle();
    if (error) throw error;
    return Boolean(data);
  },

  async listForCompany(companyId: string) {
    const supabase = await createClient();
    const { data, error } = await (supabase.from("talent_pool") as any)
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    if (!data || data.length === 0) return [];

    // Batched profile + applicant_profile lookup, same pattern used
    // throughout the pipeline board — one query each, not one per entry.
    const applicantIds = data.map((r: any) => r.applicant_id);
    const [{ data: profiles }, { data: applicantProfiles }] = await Promise.all([
      (supabase.from("profiles") as any).select("id, full_name, email").in("id", applicantIds),
      (supabase.from("applicant_profiles") as any).select("id, district, phone").in("id", applicantIds),
    ]);
    const profileById = new Map((profiles ?? []).map((p: any) => [p.id, p]));
    const applicantProfileById = new Map((applicantProfiles ?? []).map((p: any) => [p.id, p]));

    return data.map((r: any) => ({
      ...r,
      profile: profileById.get(r.applicant_id) ?? null,
      applicant_profile: applicantProfileById.get(r.applicant_id) ?? null,
    }));
  },
};
