"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import { Download } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { respondToOfferAction } from "@/app/dashboard/applicant/jobs/actions";
import type { Offer } from "@/types/database.types";

const STATUS_VARIANT: Record<string, "outline" | "success" | "destructive"> = {
  sent: "outline", accepted: "success", rejected: "destructive", withdrawn: "destructive",
};

export function OfferCard({ offer, applicationId }: { offer: Offer; applicationId: string }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  async function respond(response: "accepted" | "rejected") {
    setIsSubmitting(true);
    const result = await respondToOfferAction(offer.id, applicationId, response);
    setIsSubmitting(false);
    if (result.error) return toast.error(result.error);
    toast.success(response === "accepted" ? "Offer accepted!" : "Offer declined");
    router.refresh();
  }

  const isVoided = offer.status === "rejected" || offer.status === "withdrawn";

  if (isVoided) {
    // Once declined, the letter itself isn't relevant anymore — just a
    // small record that an offer was made and you declined it.
    return (
      <Card className="border-border">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <p className="font-medium text-muted-foreground">Offer for {offer.position_title}</p>
            <Badge variant={STATUS_VARIANT[offer.status]}>{offer.status}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {offer.status === "rejected" ? "You declined this offer." : "This offer was withdrawn."}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-accent/40">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <p className="font-display font-semibold">Offer letter</p>
          <Badge variant={STATUS_VARIANT[offer.status]}>{offer.status}</Badge>
        </div>
        <div className="mt-2 space-y-1 text-sm">
          <p><span className="text-muted-foreground">Position:</span> {offer.position_title}</p>
          {offer.salary && <p><span className="text-muted-foreground">Salary:</span> {offer.currency} {offer.salary.toLocaleString()}</p>}
          {offer.start_date && <p><span className="text-muted-foreground">Start date:</span> {format(new Date(offer.start_date), "d MMM yyyy")}</p>}
          {offer.benefits && <p><span className="text-muted-foreground">Benefits:</span> {offer.benefits}</p>}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" variant="outline" asChild>
            <a href={`/api/offer/${offer.id}`} download>
              <Download className="h-4 w-4" /> Download offer letter
            </a>
          </Button>
          {offer.status === "sent" && (
            <>
              <Button size="sm" onClick={() => respond("accepted")} disabled={isSubmitting}>Accept offer</Button>
              <Button size="sm" variant="destructive" onClick={() => respond("rejected")} disabled={isSubmitting}>Decline</Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
