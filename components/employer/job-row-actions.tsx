"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { archiveJobAction, deleteJobAction } from "@/app/dashboard/employer/jobs/actions";

export function JobRowActions({
  jobId, jobTitle, status, applicantCount,
}: {
  jobId: string;
  jobTitle: string;
  status: string;
  applicantCount: number;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  async function handleRemove() {
    setIsSubmitting(true);
    const result = await archiveJobAction(jobId);
    setIsSubmitting(false);
    if (result.error) return toast.error(result.error);
    toast.success("Listing removed — no longer visible to applicants");
    router.refresh();
  }

  async function handleDelete() {
    setIsSubmitting(true);
    const result = await deleteJobAction(jobId);
    setIsSubmitting(false);
    if (result.error) return toast.error(result.error);
    toast.success("Job deleted");
    router.refresh();
  }

  if (status === "archived") {
    return null; // already removed — nothing more to do from here
  }

  return (
    <>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" size="sm">
            <EyeOff className="h-4 w-4" /> Remove listing
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove &ldquo;{jobTitle}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>
              This takes it down from public view immediately. Any applications,
              interviews, and offers already on this job are kept — applicants
              keep their full history, they just won&apos;t see it as an open role.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemove} disabled={isSubmitting}>
              {isSubmitting ? "Removing…" : "Remove listing"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {applicantCount === 0 && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Delete job permanently">
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Permanently delete &ldquo;{jobTitle}&rdquo;?</AlertDialogTitle>
              <AlertDialogDescription>
                This job has no applicants, so this fully deletes it — this can&apos;t
                be undone. If you just want it off the public listing, use
                &ldquo;Remove listing&rdquo; instead.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} disabled={isSubmitting}>
                {isSubmitting ? "Deleting…" : "Delete permanently"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
