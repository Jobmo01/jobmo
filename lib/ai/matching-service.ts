import { createClient } from "@/lib/supabase/server";
import { computeMatchScore } from "@/lib/ai/matching";
import { jobMatchRepository } from "@/lib/repositories/job-match-repository";
import {
  educationRepository, experienceRepository, skillsRepository, applicantProfileRepository,
} from "@/lib/repositories/applicant-profile-repository";
import { jobRepository } from "@/lib/repositories/job-repository";
import { companyRepository } from "@/lib/repositories/company-repository";
import type { JobPosting } from "@/types/database.types";

const MATCH_NOTIFICATION_THRESHOLD = 75;

/**
 * Runs the matching algorithm for one job against every applicant profile
 * on the platform, stores the results, and notifies applicants who cross
 * the match threshold for the first time. Called when a job is published.
 *
 * Known scaling note: this fetches every applicant's full profile
 * (education/experience/skills) in a loop, which is fine at the scale this
 * platform is being tested at but would need batching/a queue at real
 * production volume — flagged here rather than silently glossed over.
 */
export async function runMatchingForJob(jobId: string): Promise<{ matched: number; notified: number }> {
  const job = await jobRepository.getById(jobId);
  if (!job) return { matched: 0, notified: 0 };

  const company = await companyRepository.getById(job.company_id);
  const supabase = await createClient();

  const { data: applicantProfiles, error } = await (supabase.from("profiles") as any)
    .select("id")
    .eq("role", "applicant")
    .eq("status", "active");
  if (error) throw error;

  let matched = 0;
  let notified = 0;

  for (const { id: applicantId } of applicantProfiles ?? []) {
    const [profile, education, experience, skills] = await Promise.all([
      applicantProfileRepository.get(applicantId),
      educationRepository.list(applicantId),
      experienceRepository.list(applicantId),
      skillsRepository.list(applicantId),
    ]);
    if (!profile) continue;

    // Skip profiles with essentially nothing to match against yet.
    if (skills.length === 0 && education.length === 0 && experience.length === 0) continue;

    // Defensive: one applicant's bad/unexpected data (or a transient DB
    // hiccup) shouldn't abort matching for every other applicant, and
    // shouldn't leave the publish action hanging indefinitely either.
    try {
      const { score, breakdown } = computeMatchScore({
        job: {
          required_skills: job.required_skills,
          preferred_skills: job.preferred_skills,
          experience_level: job.experience_level,
          education_requirement: job.education_requirement,
          work_type: job.work_type,
          employment_type: job.employment_type,
          salary_min: job.salary_min,
          salary_max: job.salary_max,
        },
        companyIndustry: company?.industry ?? null,
        profile: {
          remote_preference: profile.remote_preference,
          employment_type_preference: profile.employment_type_preference,
          industry_preference: profile.industry_preference,
          expected_salary_min: profile.expected_salary_min,
          expected_salary_max: profile.expected_salary_max,
          preferred_locations: profile.preferred_locations,
          district: profile.district,
        },
        skills,
        education,
        experience,
      });

      await jobMatchRepository.upsert(jobId, applicantId, score, breakdown);
      matched++;

      if (score >= MATCH_NOTIFICATION_THRESHOLD) {
        const existing = await jobMatchRepository.getForApplicantAndJob(jobId, applicantId);
        if (!existing?.notified) {
          await (supabase.rpc as any)("create_notification", {
            p_user_id: applicantId,
            p_type: "job_match",
            p_title: `${score}% match: ${job.title}`,
            p_body: `${company?.name ?? "An employer"} posted a role that fits your profile.`,
            p_link: `/dashboard/applicant/browse-jobs/${jobId}`,
          });
          await jobMatchRepository.markNotified(jobId, applicantId);
          notified++;
        }
      }
    } catch (e) {
      console.error(`Matching failed for applicant ${applicantId} on job ${jobId}:`, e);
      // Continue to the next applicant rather than aborting the whole batch.
    }
  }

  return { matched, notified };
}

/** On-demand score for a single applicant viewing a single job — used for
 *  the "why you matched" display without needing the full batch job to have run. */
export async function computeMatchForApplicant(jobId: string, applicantId: string) {
  const job = await jobRepository.getById(jobId);
  if (!job) return null;

  const company = await companyRepository.getById(job.company_id);
  const [profile, education, experience, skills] = await Promise.all([
    applicantProfileRepository.get(applicantId),
    educationRepository.list(applicantId),
    experienceRepository.list(applicantId),
    skillsRepository.list(applicantId),
  ]);
  if (!profile) return null;

  return computeMatchScore({
    job: {
      required_skills: job.required_skills,
      preferred_skills: job.preferred_skills,
      experience_level: job.experience_level,
      education_requirement: job.education_requirement,
      work_type: job.work_type,
      employment_type: job.employment_type,
      salary_min: job.salary_min,
      salary_max: job.salary_max,
    },
    companyIndustry: company?.industry ?? null,
    profile: {
      remote_preference: profile.remote_preference,
      employment_type_preference: profile.employment_type_preference,
      industry_preference: profile.industry_preference,
      expected_salary_min: profile.expected_salary_min,
      expected_salary_max: profile.expected_salary_max,
      preferred_locations: profile.preferred_locations,
      district: profile.district,
    },
    skills,
    education,
    experience,
  });
}

/**
 * Batched version of computeMatchForApplicant() for scoring one applicant
 * against MANY jobs at once (Browse Jobs' primary use case). The
 * single-job version does ~6 queries per call; calling it once per job in
 * a loop turns a 10-job page into ~60 queries. This does the applicant's
 * own profile/education/experience/skills fetch exactly ONCE, batches the
 * company lookups into one query, and then runs the actual scoring
 * (computeMatchScore itself is pure — no I/O) per job in memory.
 *
 * Callers pass in jobs they've already fetched (e.g. from
 * jobRepository.listPublished()) rather than this re-querying them.
 */
export async function computeMatchesForApplicantAcrossJobs(
  applicantId: string,
  jobs: Pick<
    JobPosting,
    "id" | "company_id" | "required_skills" | "preferred_skills" | "experience_level" |
    "education_requirement" | "work_type" | "employment_type" | "salary_min" | "salary_max"
  >[]
): Promise<Map<string, { score: number; breakdown: ReturnType<typeof computeMatchScore>["breakdown"] }>> {
  const results = new Map<string, { score: number; breakdown: ReturnType<typeof computeMatchScore>["breakdown"] }>();
  if (jobs.length === 0) return results;

  const [profile, education, experience, skills, companiesById] = await Promise.all([
    applicantProfileRepository.get(applicantId),
    educationRepository.list(applicantId),
    experienceRepository.list(applicantId),
    skillsRepository.list(applicantId),
    companyRepository.getManyByIds(jobs.map((j) => j.company_id)),
  ]);
  if (!profile) return results;

  const applicantInput = {
    remote_preference: profile.remote_preference,
    employment_type_preference: profile.employment_type_preference,
    industry_preference: profile.industry_preference,
    expected_salary_min: profile.expected_salary_min,
    expected_salary_max: profile.expected_salary_max,
    preferred_locations: profile.preferred_locations,
    district: profile.district,
  };

  for (const job of jobs) {
    const company = companiesById.get(job.company_id);
    const result = computeMatchScore({
      job: {
        required_skills: job.required_skills,
        preferred_skills: job.preferred_skills,
        experience_level: job.experience_level,
        education_requirement: job.education_requirement,
        work_type: job.work_type,
        employment_type: job.employment_type,
        salary_min: job.salary_min,
        salary_max: job.salary_max,
      },
      companyIndustry: company?.industry ?? null,
      profile: applicantInput,
      skills,
      education,
      experience,
    });
    results.set(job.id, result);
  }

  return results;
}
