import Link from "next/link";
import { format } from "date-fns";
import { LifeBuoy } from "lucide-react";
import { supportTicketRepository } from "@/lib/repositories/support-ticket-repository";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const STATUS_VARIANT: Record<string, "outline" | "secondary" | "success" | "destructive"> = {
  open: "outline", in_progress: "secondary", resolved: "success", closed: "destructive",
};

export default async function SupportInboxPage() {
  const tickets = await supportTicketRepository.listForAdmin();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Support Tickets</h1>
        <p className="text-sm text-muted-foreground">Messages from the Contact page and dashboards.</p>
      </div>

      {tickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border p-12 text-center">
          <LifeBuoy className="h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">No tickets yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tickets.map((t) => (
            <Link key={t.id} href={`/dashboard/admin/support/${t.id}`}>
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="flex items-center justify-between gap-3 p-4">
                  <div>
                    <p className="font-medium">{t.subject}</p>
                    <p className="text-sm text-muted-foreground">{t.email}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(t.created_at), "d MMM yyyy, h:mm a")}</p>
                  </div>
                  <Badge variant={STATUS_VARIANT[t.status]}>{t.status.replace("_", " ")}</Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
