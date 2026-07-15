import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { jobRepository } from "@/lib/repositories/job-repository";
import { profileRepository } from "@/lib/repositories/profile-repository";
import { applicationRepository } from "@/lib/repositories/application-repository";
import { jobMatchRepository } from "@/lib/repositories/job-match-repository";
import { computeMatchForApplicant } from "@/lib/ai/matching-service";
import { getProfileCompletion } from "@/lib/repositories/applicant-profile-repository";
import { JobDetailContent } from "@/components/marketing/job-detail-content";
import type { JobMatch } from "@/types/database.types";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const job = await jobRepository.getPublishedById(id);
  return { title: job ? job.title : "Job not found" };
}

/**
 * The in-dashboard job detail view — same content as the public /jobs/[id]
 * page (reuses JobDetailContent), but rendered inside the dashboard shell
 * (sidebar/topbar stay put) instead of the public marketing layout, so
 * applicants never feel like they've left the app to view or apply to a
 * job they found via Browse Jobs. No JSON-LD here — that's only useful for
 * the public, search-indexed page.
 */
export default async function DashboardJobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = await jobRepository.getPublishedById(id);
  if (!job) notFound();

  jobRepository.incrementViews(job.id);

  const account = await profileRepository.getCurrent();
  const alreadyApplied = account
    ? Boolean(await applicationRepository.getByJobAndApplicant(job.id, account.id))
    : false;

  let matchScore: number | null = null;
  let matchedRequiredSkills: string[] = [];
  let missingRequiredSkills: string[] = [];
  let profileCompletion: { percentage: number; missingLabels: string[] } | null = null;

  if (account?.role === "applicant") {
    let match = await jobMatchRepository.getForApplicantAndJob(job.id, account.id);
    if (!match) {
      const computed = await computeMatchForApplicant(job.id, account.id);
      if (computed) {
        await jobMatchRepository.upsert(job.id, account.id, computed.score, computed.breakdown);
        match = { score: computed.score, breakdown: computed.breakdown } as JobMatch;
      }
    }
    if (match) {
      matchScore = match.score;
      matchedRequiredSkills = match.breakdown.matchedRequiredSkills ?? [];
      missingRequiredSkills = match.breakdown.missingRequiredSkills ?? [];
    }

    const completion = await getProfileCompletion(account.id);
    profileCompletion = {
      percentage: completion.percentage,
      missingLabels: completion.sections.filter((s) => !s.done).map((s) => s.label),
    };
  }

  return (
    <JobDetailContent
      job={job}
      account={account}
      alreadyApplied={alreadyApplied}
      matchScore={matchScore}
      matchedRequiredSkills={matchedRequiredSkills}
      missingRequiredSkills={missingRequiredSkills}
      profileCompletion={profileCompletion}
      backHref="/dashboard/applicant/browse-jobs"
      backLabel="Back to Browse Jobs"
    />
  );
}
