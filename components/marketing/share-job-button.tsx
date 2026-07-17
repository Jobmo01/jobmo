"use client";

import { ShareButton } from "@/components/marketing/share-button";

/** Thin, job-specific wrapper around the generic ShareButton. */
export function ShareJobButton({ jobId, jobTitle, companyName }: { jobId: string; jobTitle: string; companyName: string | null }) {
  // Always the public URL, even when shared from the in-dashboard job
  // page — a friend clicking this link almost certainly isn't logged in,
  // so they need the public page, not a /dashboard route that would just
  // redirect them to log in first.
  const jobUrl = `https://www.jobmo.lk/jobs/${jobId}`;
  const shareText = companyName ? `${jobTitle} at ${companyName} — on JobMo` : `${jobTitle} — on JobMo`;

  return (
    <ShareButton
      url={jobUrl}
      shareText={shareText}
      dialogTitle="Share this job"
      dialogDescription="Know someone who'd be a good fit? Send them the link."
    />
  );
}
