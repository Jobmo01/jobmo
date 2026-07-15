import { createClient } from "@/lib/supabase/server";
import type { SupportTicket, SupportTicketReply, TicketStatus } from "@/types/database.types";

export const supportTicketRepository = {
  async create(input: { userId: string | null; email: string; subject: string; message: string }): Promise<void> {
    const supabase = await createClient();
    const { error } = await (supabase.from("support_tickets") as any).insert({
      user_id: input.userId,
      email: input.email,
      subject: input.subject,
      message: input.message,
    });
    if (error) throw error;
  },

  async listForAdmin(status?: TicketStatus): Promise<SupportTicket[]> {
    const supabase = await createClient();
    let query = (supabase.from("support_tickets") as any).select("*").order("created_at", { ascending: false });
    if (status) query = query.eq("status", status);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as SupportTicket[];
  },

  async listForUser(userId: string): Promise<SupportTicket[]> {
    const supabase = await createClient();
    const { data, error } = await (supabase.from("support_tickets") as any)
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as SupportTicket[];
  },

  async getById(id: string): Promise<SupportTicket | null> {
    const supabase = await createClient();
    const { data, error } = await (supabase.from("support_tickets") as any).select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return data as SupportTicket | null;
  },

  async updateStatus(id: string, status: TicketStatus): Promise<void> {
    const supabase = await createClient();
    const { error } = await (supabase.from("support_tickets") as any).update({ status }).eq("id", id);
    if (error) throw error;
  },

  async listReplies(ticketId: string): Promise<(SupportTicketReply & { author: { full_name: string | null } | null })[]> {
    const supabase = await createClient();
    const { data, error } = await (supabase.from("support_ticket_replies") as any)
      .select("*")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true });
    if (error) throw error;

    if (!data || data.length === 0) return [];
    const authorIds = [...new Set(data.map((r: any) => r.author_id).filter(Boolean))];
    let byId = new Map<string, { full_name: string | null }>();
    if (authorIds.length > 0) {
      const { data: authors } = await (supabase.from("profiles") as any).select("id, full_name").in("id", authorIds);
      byId = new Map((authors ?? []).map((a: any) => [a.id, a]));
    }
    return data.map((r: any) => ({ ...r, author: r.author_id ? byId.get(r.author_id) ?? null : null }));
  },

  async addReply(ticketId: string, authorId: string, message: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await (supabase.from("support_ticket_replies") as any).insert({
      ticket_id: ticketId, author_id: authorId, message,
    });
    if (error) throw error;
  },
};
