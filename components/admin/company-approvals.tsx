"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Image from "next/image";
import { Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { reviewCompanyVerificationAction } from "@/app/dashboard/admin/actions";
import type { Company } from "@/types/database.types";

const STATUS_VARIANT: Record<string, "outline" | "success" | "destructive"> = {
  pending: "outline", verified: "success", rejected: "destructive",
};

export function CompanyApprovals({ companies }: { companies: Company[] }) {
  const router = useRouter();
  const [target, setTarget] = React.useState<Company | null>(null);
  const [comment, setComment] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  async function handleDecision(decision: "verified" | "rejected") {
    if (!target) return;
    setIsSubmitting(true);
    const result = await reviewCompanyVerificationAction(target.id, decision, comment);
    setIsSubmitting(false);
    if (result.error) return toast.error(result.error);
    toast.success(decision === "verified" ? "Verified" : "Rejected");
    setTarget(null);
    setComment("");
    router.refresh();
  }

  if (companies.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        No companies to show.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {companies.map((c) => (
        <Card key={c.id}>
          <CardContent className="flex items-start justify-between gap-3 p-4">
            <div className="flex items-start gap-3">
              {c.logo_url ? (
                <Image src={c.logo_url} alt={c.name} width={40} height={40} className="rounded-md object-cover" />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
              <div>
                <p className="font-medium">{c.name}</p>
                <p className="text-sm text-muted-foreground">{c.industry ?? "No industry listed"}</p>
                {c.description && <p className="mt-1 max-w-md text-sm text-muted-foreground line-clamp-2">{c.description}</p>}
                {c.website_url && (
                  <a href={c.website_url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-xs text-primary hover:underline">
                    {c.website_url}
                  </a>
                )}
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2">
              <Badge variant={STATUS_VARIANT[c.verification_status]}>{c.verification_status}</Badge>
              {c.verification_status === "pending" && (
                <Button size="sm" onClick={() => setTarget(c)}>Review</Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      <Dialog open={!!target} onOpenChange={(open) => !open && setTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review {target?.name}</DialogTitle>
            <DialogDescription>Decide whether to verify this company.</DialogDescription>
          </DialogHeader>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Optional comment sent to the employer"
            rows={3}
          />
          <DialogFooter>
            <Button variant="destructive" onClick={() => handleDecision("rejected")} disabled={isSubmitting}>
              Reject
            </Button>
            <Button onClick={() => handleDecision("verified")} disabled={isSubmitting}>
              Verify
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
