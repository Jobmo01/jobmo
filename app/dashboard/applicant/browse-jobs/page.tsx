import { jobRepository } from "@/lib/repositories/job-repository";
import { profileRepository } from "@/lib/repositories/profile-repository";
import { applicationRepository } from "@/lib/repositories/application-repository";
import { jobMatchRepository } from "@/lib/repositories/job-match-repository";
import { computeMatchesForApplicantAcrossJobs } from "@/lib/ai/matching-service";
import { BrowseJobsList } from "@/components/applicant/browse-jobs-list";

export default async function BrowseJobsPage() {
  const account = await profileRepository.getCurrent();
  const jobs = await jobRepository.listPublished();

  const appliedJobIds = account
    ? (await applicationRepository.listForApplicant(account.id)).map((a: any) => a.job_id)
    : [];

  // Attach match scores (using persisted matches where available, computing
  // on demand otherwise) so applicants can see their best-fit roles first.
  // Batched: 1 query to check what's already cached, then — only for
  // whatever's missing — one batched compute (not one query set per job)
  // and one bulk upsert. On a fully-cached visit (the common case after
  // the first time), this is a single query for the whole page instead of
  // up to ~70 for a 10-job list.
  let jobsWithScores = jobs as any[];
  if (account?.role === "applicant") {
    const jobIds = jobs.map((j: any) => j.id);
    const existingMatches = await jobMatchRepository.listForApplicantAcrossJobs(account.id, jobIds);

    const uncachedJobs = jobs.filter((j: any) => !existingMatches.has(j.id));
    if (uncachedJobs.length > 0) {
      const computed = await computeMatchesForApplicantAcrossJobs(account.id, uncachedJobs as any);
      await jobMatchRepository.upsertMany(
        [...computed.entries()].map(([jobId, result]) => ({
          jobId, applicantId: account.id, score: result.score, breakdown: result.breakdown,
        }))
      );
      for (const [jobId, result] of computed) {
        existingMatches.set(jobId, { score: result.score } as any);
      }
    }

    jobsWithScores = jobs.map((job: any) => ({ ...job, matchScore: existingMatches.get(job.id)?.score ?? null }));
    jobsWithScores.sort((a, b) => (b.matchScore ?? -1) - (a.matchScore ?? -1));
  } else {
    jobsWithScores = jobs.map((job: any) => ({ ...job, matchScore: null }));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Browse Jobs</h1>
        <p className="text-sm text-muted-foreground">
          {jobs.length} open role{jobs.length === 1 ? "" : "s"} right now
          {account?.role === "applicant" ? " — sorted by your best match" : ""}.
        </p>
      </div>

      <BrowseJobsList jobs={jobsWithScores} appliedJobIds={appliedJobIds} />
    </div>
  );
}
