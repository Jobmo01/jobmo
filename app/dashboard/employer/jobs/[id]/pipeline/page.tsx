import { notFound } from "next/navigation";
import { jobRepository } from "@/lib/repositories/job-repository";
import { applicationRepository } from "@/lib/repositories/application-repository";
import { interviewRepository } from "@/lib/repositories/interview-repository";
import { offerRepository } from "@/lib/repositories/offer-repository";
import { jobMatchRepository } from "@/lib/repositories/job-match-repository";
import { talentPoolRepository } from "@/lib/repositories/talent-pool-repository";
import {
  educationRepository, experienceRepository, skillsRepository,
} from "@/lib/repositories/applicant-profile-repository";
import { PipelineBoard } from "@/components/employer/pipeline-board";

export default async function PipelinePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = await jobRepository.getById(id);
  if (!job) notFound();

  const rawApplications = await applicationRepository.listForJob(job.id);
  const applicantIds = rawApplications.map((app: any) => app.applicant_id);
  const applicationIds = rawApplications.map((app: any) => app.id);

  // Batched: 7 queries total for the whole board, not 7 per applicant.
  // The N+1 version of this (one query per applicant per table) meant a
  // 10-applicant pipeline fired 60+ simultaneous queries on every load —
  // slow on its own, and a real risk of hitting connection limits.
  const [matches, educationByApplicant, experienceByApplicant, skillsByApplicant, notesByApplication, interviewsByApplication, offerByApplication, talentPoolApplicantIds] =
    await Promise.all([
      jobMatchRepository.listForJob(job.id),
      educationRepository.listForMany(applicantIds),
      experienceRepository.listForMany(applicantIds),
      skillsRepository.listForMany(applicantIds),
      applicationRepository.listNotesForApplications(applicationIds),
      interviewRepository.listForApplications(applicationIds),
      offerRepository.getForApplications(applicationIds),
      talentPoolRepository.listApplicantIdsInPool(job.company_id),
    ]);

  const matchByApplicant = new Map(matches.map((m) => [m.applicant_id, m]));

  const applications = rawApplications.map((app: any) => ({
    ...app,
    education: educationByApplicant.get(app.applicant_id) ?? [],
    experience: experienceByApplicant.get(app.applicant_id) ?? [],
    skills: skillsByApplicant.get(app.applicant_id) ?? [],
    notes: notesByApplication.get(app.id) ?? [],
    interviews: interviewsByApplication.get(app.id) ?? [],
    offer: offerByApplication.get(app.id) ?? null,
    matchScore: matchByApplicant.get(app.applicant_id)?.score ?? null,
    isInTalentPool: talentPoolApplicantIds.has(app.applicant_id),
  }));

  // Highest match score first within the "Applied" stage — candidate ranking.
  applications.sort((a: any, b: any) => (b.matchScore ?? -1) - (a.matchScore ?? -1));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">{job.title}</h1>
        <p className="text-sm text-muted-foreground">{applications.length} applicants</p>
      </div>
      <PipelineBoard
        jobId={job.id}
        jobInfo={{ title: job.title, description: job.description, requiredSkills: job.required_skills }}
        applications={applications}
      />
    </div>
  );
}
