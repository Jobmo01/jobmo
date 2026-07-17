"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { applyToJobAction } from "@/app/(marketing)/jobs/[id]/actions";

export function ApplyButton({
  jobId,
  isLoggedIn,
  isApplicant,
  alreadyApplied,
  profileCompletion,
}: {
  jobId: string;
  isLoggedIn: boolean;
  isApplicant: boolean;
  alreadyApplied: boolean;
  profileCompletion?: { percentage: number; missingLabels: string[] } | null;
}) {
  const router = useRouter();
  const [showForm, setShowForm] = React.useState(false);
  const [coverLetter, setCoverLetter] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [applied, setApplied] = React.useState(alreadyApplied);

  if (!isLoggedIn) {
    return (
      <Button asChild>
        <Link href={`/login?redirect=/jobs/${jobId}`}>Log in to apply</Link>
      </Button>
    );
  }

  if (!isApplicant) {
    return <p className="text-sm text-muted-foreground">Employer accounts can&apos;t apply to jobs.</p>;
  }

  if (applied) {
    return <Button disabled variant="secondary">Applied ✓</Button>;
  }

  if (profileCompletion && profileCompletion.percentage < 100) {
    return (
      <div className="w-full rounded-lg border border-accent/40 bg-accent/5 p-4">
        <p className="inline-flex items-center gap-1.5 font-medium">
          <AlertCircle className="h-4 w-4 text-accent" /> Complete your profile to apply
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Your profile is {profileCompletion.percentage}% complete. Employers only see
          finished profiles, so applying is unlocked at 100%.
        </p>
        {profileCompletion.missingLabels.length > 0 && (
          <ul className="mt-2 list-disc space-y-0.5 pl-5 text-sm text-muted-foreground">
            {profileCompletion.missingLabels.map((label) => <li key={label}>{label}</li>)}
          </ul>
        )}
        <Button size="sm" className="mt-3" asChild>
          <Link href="/dashboard/applicant/profile">Complete my profile</Link>
        </Button>
      </div>
    );
  }

  async function handleApply() {
    setIsSubmitting(true);
    const result = await applyToJobAction(jobId, coverLetter || undefined);
    setIsSubmitting(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Application submitted!");
    setApplied(true);
    setShowForm(false);
    router.refresh();
  }

  if (!showForm) {
    return <Button onClick={() => setShowForm(true)}>Apply now</Button>;
  }

  return (
    <div className="w-full space-y-3">
      <Textarea
        value={coverLetter}
        onChange={(e) => setCoverLetter(e.target.value)}
        placeholder="Optional: add a short note to the employer…"
        rows={4}
      />
      <div className="flex gap-2">
        <Button onClick={handleApply} disabled={isSubmitting}>
          {isSubmitting ? "Submitting…" : "Submit application"}
        </Button>
        <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
      </div>
    </div>
  );
}
