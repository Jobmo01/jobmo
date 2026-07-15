import { createClient } from "@/lib/supabase/server";
import type { Announcement, Database } from "@/types/database.types";

export const announcementRepository = {
  async listAll(): Promise<Announcement[]> {
    const supabase = await createClient();
    const { data, error } = await (supabase.from("announcements") as any)
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Announcement[];
  },

  async getActive(role?: string): Promise<Announcement | null> {
    const supabase = await createClient();
    let query = (supabase.from("announcements") as any)
      .select("*")
      .eq("is_active", true);

    // Empty target_roles means "show to everyone"; otherwise the viewer's
    // role must be explicitly included.
    if (role) {
      query = query.or(`target_roles.eq.{},target_roles.cs.{${role}}`);
    } else {
      query = query.eq("target_roles", "{}");
    }

    const { data, error } = await query.order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (error) return null;
    return data as Announcement | null;
  },

  async create(input: Database["public"]["Tables"]["announcements"]["Insert"]): Promise<void> {
    const supabase = await createClient();
    const { error } = await (supabase.from("announcements") as any).insert(input);
    if (error) throw error;
  },

  async update(id: string, input: Database["public"]["Tables"]["announcements"]["Update"]): Promise<void> {
    const supabase = await createClient();
    const { error } = await (supabase.from("announcements") as any).update(input).eq("id", id);
    if (error) throw error;
  },

  async remove(id: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await (supabase.from("announcements") as any).delete().eq("id", id);
    if (error) throw error;
  },
};
