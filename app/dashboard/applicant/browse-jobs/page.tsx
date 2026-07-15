import { jobRepository } from "@/lib/repositories/job-repository";
import { profileRepository } from "@/lib/repositories/profile-repository";
import { applicationRepository } from "@/lib/repositories/application-repository";
import { jobMatchRepository } from "@/lib/repositories/job-match-repository";
import { computeMatchesForApplicantAcrossJobs, notifyIfHighMatch } from "@/lib/ai/matching-service";
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
    const jobById = new Map(jobs.map((j: any) => [j.id, j]));

    const uncachedJobs = jobs.filter((j: any) => !existingMatches.has(j.id));
    if (uncachedJobs.length > 0) {
      const computed = await computeMatchesForApplicantAcrossJobs(account.id, uncachedJobs as any);
      await jobMatchRepository.upsertMany(
        [...computed.entries()].map(([jobId, result]) => ({
          jobId, applicantId: account.id, score: result.score, breakdown: result.breakdown,
        }))
      );
      for (const [jobId, result] of computed) {
        existingMatches.set(jobId, { score: result.score, notified: false } as any);
      }
    }

    // Notify on every match crossing the threshold — both ones just
    // computed above, and ones that were already cached from a previous
    // visit but never got a notification (the bug this fix addresses:
    // previously only publish-time matching could ever notify anyone, so
    // real high matches discovered here on Browse Jobs were silently
    // never announced). notifyIfHighMatch() is a no-op if already
    // notified, so this is safe to call broadly — only costs a query for
    // jobs actually crossing 75%, not the whole list.
    for (const [jobId, m] of existingMatches) {
      if ((m.score ?? 0) < 75) continue;
      const job = jobById.get(jobId);
      if (!job) continue;
      await notifyIfHighMatch({
        jobId, applicantId: account.id, score: m.score,
        jobTitle: job.title, companyName: job.companies?.name ?? null,
      });
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
