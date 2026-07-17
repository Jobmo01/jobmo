"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader,
  AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { redeemBoostAction } from "@/app/dashboard/employer/jobs/actions";

export function BoostJobButton({ jobId, jobTitle, creditsAvailable }: { jobId: string; jobTitle: string; creditsAvailable: number }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  async function handleConfirm() {
    setIsSubmitting(true);
    const result = await redeemBoostAction(jobId);
    setIsSubmitting(false);
    if (result.error) return toast.error(result.error);
    toast.success("Job boosted — it'll now show at the top of listings");
    router.refresh();
  }

  if (creditsAvailable < 1) return null;

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Rocket className="h-4 w-4" /> Boost this job
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Use a boost credit on &quot;{jobTitle}&quot;?</AlertDialogTitle>
          <AlertDialogDescription>
            This will spend 1 of your {creditsAvailable} available boost credit{creditsAvailable === 1 ? "" : "s"}
            and move this job to the top of all listings for as long as it stays published. This can&apos;t be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={isSubmitting}>
            {isSubmitting ? "Boosting…" : "Boost this job"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
