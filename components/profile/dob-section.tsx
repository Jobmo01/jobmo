"use client";

import * as React from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import { requestDobChangeAction, setInitialDobAction } from "@/app/dashboard/applicant/profile/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import type { DobChangeRequest } from "@/types/database.types";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Submitting…" : "Submit request"}
    </Button>
  );
}

const STATUS_VARIANT: Record<DobChangeRequest["status"], "outline" | "success" | "destructive"> = {
  pending: "outline",
  approved: "success",
  rejected: "destructive",
};

export function DobSection({
  currentDob,
  requests,
}: {
  currentDob: string | null;
  requests: DobChangeRequest[];
}) {
  // No date of birth yet — let them set it directly, once. Nothing to
  // "approve" for a first-time entry; approval only applies to changing
  // an already-set date.
  if (!currentDob) {
    return <InitialDobForm />;
  }

  return <ExistingDobSection currentDob={currentDob} requests={requests} />;
}

function InitialDobForm() {
  const router = useRouter();
  const [dob, setDob] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    const result = await setInitialDobAction(dob);
    setIsSubmitting(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Date of birth saved");
    router.refresh();
  }

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-start gap-3">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
        <div className="flex-1">
          <h3 className="font-display font-semibold">Date of birth</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Set this once — after that, changing it requires admin approval and
            supporting ID documents, so double-check it&apos;s correct before saving.
          </p>
          <form onSubmit={handleSave} className="mt-3 flex flex-wrap items-end gap-2">
            <div className="space-y-1.5">
              <Label htmlFor="initial_dob" className="sr-only">Date of birth</Label>
              <Input
                id="initial_dob"
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                required
                className="w-auto"
              />
            </div>
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : "Save date of birth"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

function ExistingDobSection({
  currentDob,
  requests,
}: {
  currentDob: string;
  requests: DobChangeRequest[];
}) {
  const [open, setOpen] = React.useState(false);
  const [state, formAction] = useActionState(requestDobChangeAction, null);
  const hasPending = requests.some((r) => r.status === "pending");

  React.useEffect(() => {
    if (state?.success) setOpen(false);
  }, [state]);

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-start gap-3">
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
        <div className="flex-1">
          <h3 className="font-display font-semibold">Date of birth</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {format(new Date(currentDob), "d MMMM yyyy")} — locked for your
            protection. Changing it requires admin approval and supporting ID documents.
          </p>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="mt-3" disabled={hasPending}>
                {hasPending ? "Request pending review" : "Request a change"}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Request a date of birth change</DialogTitle>
                <DialogDescription>
                  Upload at least one government ID showing your correct date of birth. An
                  administrator reviews every request before it takes effect.
                </DialogDescription>
              </DialogHeader>

              <form action={formAction} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="requested_dob">Correct date of birth</Label>
                  <Input id="requested_dob" name="requested_dob" type="date" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="reason">Reason</Label>
                  <Textarea id="reason" name="reason" required placeholder="e.g. Typo entered at sign-up" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="nic_document">NIC (front & back, or PDF)</Label>
                  <Input id="nic_document" name="nic_document" type="file" accept="application/pdf,image/*" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="passport_document">Passport</Label>
                  <Input id="passport_document" name="passport_document" type="file" accept="application/pdf,image/*" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="driving_license_document">Driving license</Label>
                  <Input id="driving_license_document" name="driving_license_document" type="file" accept="application/pdf,image/*" />
                </div>

                {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

                <DialogFooter>
                  <SubmitButton />
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {requests.length > 0 && (
        <div className="mt-4 space-y-2 border-t border-border pt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Request history</p>
          {requests.map((r) => (
            <div key={r.id} className="flex items-center justify-between text-sm">
              <span>
                Requested {format(new Date(r.requested_dob), "d MMM yyyy")} on{" "}
                {format(new Date(r.created_at), "d MMM yyyy")}
              </span>
              <Badge variant={STATUS_VARIANT[r.status]}>{r.status}</Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
