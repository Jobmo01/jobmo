"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { updateTicketStatusAction, addTicketReplyAction } from "@/app/dashboard/admin/support/actions";
import type { SupportTicket, TicketStatus } from "@/types/database.types";

export function TicketDetail({
  ticket, replies,
}: {
  ticket: SupportTicket;
  replies: { id: string; message: string; created_at: string; author: { full_name: string | null } | null }[];
}) {
  const router = useRouter();
  const [status, setStatus] = React.useState<TicketStatus>(ticket.status);
  const [reply, setReply] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  async function handleStatusChange(next: TicketStatus) {
    setStatus(next);
    const result = await updateTicketStatusAction(ticket.id, next);
    if (result.error) toast.error(result.error);
    else { toast.success("Status updated"); router.refresh(); }
  }

  async function handleReply() {
    setIsSubmitting(true);
    const result = await addTicketReplyAction(ticket.id, reply);
    setIsSubmitting(false);
    if (result.error) return toast.error(result.error);
    toast.success("Reply sent");
    setReply("");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-md border border-border p-3">
        <span className="text-sm text-muted-foreground">Status</span>
        <Select value={status} onValueChange={(v) => handleStatusChange(v as TicketStatus)}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md bg-secondary/50 p-4 text-sm">
        <p>{ticket.message}</p>
        <p className="mt-2 text-xs text-muted-foreground">{format(new Date(ticket.created_at), "d MMM yyyy, h:mm a")}</p>
      </div>

      {replies.length > 0 && (
        <div className="space-y-2">
          {replies.map((r) => (
            <div key={r.id} className="rounded-md border border-border p-3 text-sm">
              <p>{r.message}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {r.author?.full_name ?? "Support"} — {format(new Date(r.created_at), "d MMM yyyy, h:mm a")}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2">
        <Textarea value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Write a reply…" rows={3} />
        <Button onClick={handleReply} disabled={isSubmitting}>{isSubmitting ? "Sending…" : "Send reply"}</Button>
      </div>
    </div>
  );
}
