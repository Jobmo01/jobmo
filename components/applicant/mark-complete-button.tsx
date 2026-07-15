"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { markContentCompleteAction } from "@/app/dashboard/applicant/learning/actions";

export function MarkCompleteButton({ contentId, alreadyCompleted }: { contentId: string; alreadyCompleted: boolean }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [completed, setCompleted] = React.useState(alreadyCompleted);

  async function handleClick() {
    setIsSubmitting(true);
    const result = await markContentCompleteAction(contentId);
    setIsSubmitting(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    setCompleted(true);
    toast.success("Marked as complete");
    router.refresh();
  }

  if (completed) {
    return (
      <Button variant="secondary" disabled>
        <CheckCircle2 className="h-4 w-4" /> Completed
      </Button>
    );
  }

  return (
    <Button onClick={handleClick} disabled={isSubmitting}>
      {isSubmitting ? "Saving…" : "Mark as complete"}
    </Button>
  );
}
