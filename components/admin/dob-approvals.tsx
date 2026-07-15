"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import { FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { reviewDobRequestAction, getSignedDocumentUrlAction } from "@/app/dashboard/admin/actions";

const STATUS_VARIANT: Record<string, "outline" | "success" | "destructive"> = {
  pending: "outline", approved: "success", rejected: "destructive",
};

export function DobApprovals({ requests }: { requests: any[] }) {
  const router = useRouter();
  const [target, setTarget] = React.useState<any>(null);
  const [comment, setComment] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  async function viewDocument(path: string) {
    const result = await getSignedDocumentUrlAction(path);
    if (result.error || !result.url) {
      toast.error(result.error ?? "Failed to load document");
      return;
    }
    window.open(result.url, "_blank", "noopener,noreferrer");
  }

  async function handleDecision(decision: "approved" | "rejected") {
    if (!target) return;
    setIsSubmitting(true);
    const result = await reviewDobRequestAction(target.id, decision, comment);
    setIsSubmitting(false);
    if (result.error) return toast.error(result.error);
    toast.success(decision === "approved" ? "Approved" : "Rejected");
    setTarget(null);
    setComment("");
    router.refresh();
  }

  if (requests.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        No requests to show.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map((r) => (
        <Card key={r.id}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">{r.applicant?.full_name ?? r.applicant?.email ?? "Applicant"}</p>
                <p className="text-sm text-muted-foreground">
                  Requested {format(new Date(r.requested_dob), "d MMM yyyy")}
                  {r.current_dob && ` (currently ${format(new Date(r.current_dob), "d MMM yyyy")})`}
                </p>
                <p className="mt-1 text-sm">{r.reason}</p>
              </div>
              <Badge variant={STATUS_VARIANT[r.status]}>{r.status}</Badge>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {r.nic_document_url && (
                <Button size="sm" variant="outline" onClick={() => viewDocument(r.nic_document_url)}>
                  <FileText className="h-3.5 w-3.5" /> NIC
                </Button>
              )}
              {r.passport_document_url && (
                <Button size="sm" variant="outline" onClick={() => viewDocument(r.passport_document_url)}>
                  <FileText className="h-3.5 w-3.5" /> Passport
                </Button>
              )}
              {r.driving_license_document_url && (
                <Button size="sm" variant="outline" onClick={() => viewDocument(r.driving_license_document_url)}>
                  <FileText className="h-3.5 w-3.5" /> Driving license
                </Button>
              )}
            </div>

            {r.status === "pending" && (
              <Button size="sm" className="mt-3" onClick={() => setTarget(r)}>Review</Button>
            )}
            {r.status !== "pending" && r.review_comment && (
              <p className="mt-2 text-xs text-muted-foreground">Comment: {r.review_comment}</p>
            )}
          </CardContent>
        </Card>
      ))}

      <Dialog open={!!target} onOpenChange={(open) => !open && setTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review DOB change request</DialogTitle>
            <DialogDescription>
              {target?.applicant?.full_name ?? target?.applicant?.email} — requesting{" "}
              {target && format(new Date(target.requested_dob), "d MMM yyyy")}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Comment (required) — reason for your decision"
            rows={3}
          />
          <DialogFooter>
            <Button variant="destructive" onClick={() => handleDecision("rejected")} disabled={isSubmitting}>
              Reject
            </Button>
            <Button onClick={() => handleDecision("approved")} disabled={isSubmitting}>
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
