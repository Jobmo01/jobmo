import { notFound } from "next/navigation";
import Link from "next/link";
import { supportTicketRepository } from "@/lib/repositories/support-ticket-repository";
import { TicketDetail } from "@/components/admin/ticket-detail";

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ticket = await supportTicketRepository.getById(id);
  if (!ticket) notFound();

  const replies = await supportTicketRepository.listReplies(id);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link href="/dashboard/admin/support" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to Support Tickets
        </Link>
        <h1 className="mt-2 font-display text-2xl font-semibold">{ticket.subject}</h1>
        <p className="text-sm text-muted-foreground">{ticket.email}</p>
      </div>
      <TicketDetail ticket={ticket} replies={replies} />
    </div>
  );
}
