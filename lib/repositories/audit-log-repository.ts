import { createClient } from "@/lib/supabase/server";

export const auditLogRepository = {
  async list(filters: { entityType?: string; search?: string } = {}, limit = 100) {
    const supabase = await createClient();
    let query = (supabase.from("audit_logs") as any)
      .select("*")
      .order("created_at", { ascending: false });

    if (filters.entityType) query = query.eq("entity_type", filters.entityType);
    if (filters.search) query = query.ilike("action", `%${filters.search}%`);

    const { data, error } = await query.limit(limit);
    if (error) throw error;

    if (!data || data.length === 0) return [];

    const actorIds = [...new Set(data.map((r: any) => r.actor_id).filter(Boolean))];
    let actorsById = new Map<string, { full_name: string | null; email: string }>();
    if (actorIds.length > 0) {
      const { data: actors } = await (supabase.from("profiles") as any)
        .select("id, full_name, email")
        .in("id", actorIds);
      actorsById = new Map((actors ?? []).map((a: any) => [a.id, a]));
    }

    return data.map((r: any) => ({ ...r, actor: r.actor_id ? actorsById.get(r.actor_id) ?? null : null }));
  },

  async listEntityTypes(): Promise<string[]> {
    const supabase = await createClient();
    const { data, error } = await (supabase.from("audit_logs") as any)
      .select("entity_type")
      .limit(1000);
    if (error) throw error;
    return [...new Set((data ?? []).map((r: any) => r.entity_type))].sort() as string[];
  },
};
