import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { jobRepository } from "@/lib/repositories/job-repository";
import { profileRepository } from "@/lib/repositories/profile-repository";
import { applicationRepository } from "@/lib/repositories/application-repository";
import { jobMatchRepository } from "@/lib/repositories/job-match-repository";
import { computeMatchForApplicant } from "@/lib/ai/matching-service";
import { getProfileCompletion } from "@/lib/repositories/applicant-profile-repository";
import { JobDetailContent } from "@/components/marketing/job-detail-content";
import { JsonLd } from "@/components/seo/json-ld";
import { buildJobPostingSchema, buildBreadcrumbSchema } from "@/lib/seo/schema";
import type { JobMatch } from "@/types/database.types";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const job = await jobRepository.getPublishedById(id);
  if (!job) return { title: "Job not found" };
  return {
    title: `${job.title} at ${job.companies?.name}`,
    description: job.description?.replace(/<[^>]+>/g, "").slice(0, 160),
  };
}

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
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

  const jobUrl = `https://jobmo.lk/jobs/${job.id}`;
  const jobPostingSchema = buildJobPostingSchema(job, job.companies, jobUrl);
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: "Home", url: "https://jobmo.lk" },
    { name: "Jobs", url: "https://jobmo.lk/jobs" },
    { name: job.title, url: jobUrl },
  ]);

  return (
    <>
      <JsonLd data={jobPostingSchema} />
      <JsonLd data={breadcrumbSchema} />
      <JobDetailContent
        job={job}
        account={account}
        alreadyApplied={alreadyApplied}
        matchScore={matchScore}
        matchedRequiredSkills={matchedRequiredSkills}
        missingRequiredSkills={missingRequiredSkills}
        profileCompletion={profileCompletion}
        backHref="/jobs"
        backLabel="Back to all jobs"
      />
    </>
  );
}
