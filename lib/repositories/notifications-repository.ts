import { createClient } from "@/lib/supabase/server";
import type { NotificationRow } from "@/types/database.types";

export const notificationsRepository = {
  async list(userId: string, limit = 30): Promise<NotificationRow[]> {
    const supabase = await createClient();
    const { data, error } = await (supabase.from("notifications") as any)
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as NotificationRow[];
  },

  async unreadCount(userId: string): Promise<number> {
    const supabase = await createClient();
    const { count, error } = await (supabase.from("notifications") as any)
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .is("read_at", null);
    if (error) throw error;
    return count ?? 0;
  },

  async markRead(notificationId: string) {
    const supabase = await createClient();
    const { error } = await (supabase.from("notifications") as any)
      .update({ read_at: new Date().toISOString() })
      .eq("id", notificationId);
    if (error) throw error;
  },

  async markAllRead(userId: string) {
    const supabase = await createClient();
    const { error } = await (supabase.from("notifications") as any)
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", userId)
      .is("read_at", null);
    if (error) throw error;
  },
};
