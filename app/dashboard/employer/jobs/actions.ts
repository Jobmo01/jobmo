"use server";

import { revalidatePath } from "next/cache";
import { profileRepository } from "@/lib/repositories/profile-repository";
import { companyRepository } from "@/lib/repositories/company-repository";
import { jobRepository } from "@/lib/repositories/job-repository";
import { jobPostingSchema } from "@/lib/validations/employer";
import { runMatchingForJob } from "@/lib/ai/matching-service";
import { improveJobDescription, suggestSalaryRange } from "@/lib/ai/employer-ai";
import { AIUnavailableError } from "@/lib/ai/openai-client";
import { getErrorMessage } from "@/lib/utils";

export type AiJobActionResult<T = unknown> = { error?: string; aiUnavailable?: true; data?: T };

export async function improveJobDescriptionAction(
  title: string,
  currentDescription: string,
  requiredSkills: string[]
): Promise<AiJobActionResult<{ improvedDescription: string; addedKeywords: string[] }>> {
  try {
    const result = await improveJobDescription({ title, currentDescription, requiredSkills });
    return { data: result };
  } catch (e) {
    if (e instanceof AIUnavailableError) return { aiUnavailable: true, error: e.message };
    return { error: getErrorMessage(e, "Failed to improve description") };
  }
}

export async function suggestSalaryRangeAction(input: {
  title: string;
  experienceLevel: string;
  workType: string;
  employmentType: string;
}): Promise<AiJobActionResult<{ min: number; max: number; currency: string; reasoning: string }>> {
  try {
    const profile = await profileRepository.getCurrent();
    const company = profile ? await companyRepository.getByOwner(profile.id) : null;
    const result = await suggestSalaryRange({
      title: input.title,
      experienceLevel: input.experienceLevel || null,
      workType: input.workType || null,
      employmentType: input.employmentType || null,
      industry: company?.industry ?? null,
    });
    return { data: result };
  } catch (e) {
    if (e instanceof AIUnavailableError) return { aiUnavailable: true, error: e.message };
    return { error: getErrorMessage(e, "Failed to suggest salary range") };
  }
}

export type JobActionResult = { error?: string; success?: true; jobId?: string };

async function requireCompanyId(): Promise<{ ownerId: string; companyId: string }> {
  const profile = await profileRepository.getCurrent();
  if (!profile) throw new Error("Not authenticated");
  const company = await companyRepository.getByOwner(profile.id);
  if (!company) throw new Error("Set up your company profile first");
  return { ownerId: profile.id, companyId: company.id };
}

export async function createJobAction(input: unknown): Promise<JobActionResult> {
  const parsed = jobPostingSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "Invalid input" };

  try {
    const { ownerId, companyId } = await requireCompanyId();
    const job = await jobRepository.create({
      ...parsed.data,
      work_type: parsed.data.work_type ?? null,
      employment_type: parsed.data.employment_type ?? null,
      experience_level: parsed.data.experience_level ?? null,
      education_requirement: parsed.data.education_requirement ?? null,
      salary_min: parsed.data.salary_min ?? null,
      salary_max: parsed.data.salary_max ?? null,
      application_deadline: parsed.data.application_deadline ?? null,
      company_id: companyId,
      created_by: ownerId,
      status: "draft",
    });
    revalidatePath("/dashboard/employer/jobs");
    return { success: true, jobId: job.id };
  } catch (e) {
    return { error: getErrorMessage(e, "Failed to create job") };
  }
}

export async function updateJobAction(jobId: string, input: unknown): Promise<JobActionResult> {
  const parsed = jobPostingSchema.partial().safeParse(input);
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "Invalid input" };

  try {
    await jobRepository.update(jobId, parsed.data);
    revalidatePath("/dashboard/employer/jobs");
    revalidatePath(`/dashboard/employer/jobs/${jobId}`);
    return { success: true };
  } catch (e) {
    return { error: getErrorMessage(e, "Failed to update job") };
  }
}

export async function publishJobAction(jobId: string): Promise<JobActionResult> {
  try {
    const job = await jobRepository.getById(jobId);
    if (!job) return { error: "Job not found" };

    await jobRepository.update(jobId, { status: "published", published_at: new Date().toISOString() });
    revalidatePath("/dashboard/employer/jobs");
    revalidatePath("/jobs");

    // Non-fatal by design, same reasoning as the matching call below —
    // a boost-credit bookkeeping hiccup should never block a publish.
    try {
      await companyRepository.checkAndAwardBoostCredit(job.company_id);
    } catch (e) {
      console.error("Boost credit check failed for job", jobId, e);
    }

    // Awaited deliberately: serverless functions (Netlify) can terminate
    // once a response is sent, so unawaited "background" work here could
    // silently never finish. A matching failure doesn't fail the publish
    // itself — it's logged and matches can still be computed on demand.
    try {
      await runMatchingForJob(jobId);
    } catch (e) {
      console.error("Matching failed for job", jobId, e);
    }

    return { success: true };
  } catch (e) {
    return { error: getErrorMessage(e, "Failed to publish job") };
  }
}

export async function closeJobAction(jobId: string): Promise<JobActionResult> {
  try {
    await jobRepository.update(jobId, { status: "closed" });
    revalidatePath("/dashboard/employer/jobs");
    revalidatePath("/jobs");
    return { success: true };
  } catch (e) {
    return { error: getErrorMessage(e, "Failed to close job") };
  }
}

/**
 * "Remove listing" — takes a job down from public view immediately,
 * regardless of its current status (draft, published, or closed), without
 * destroying any applications/interviews/offers tied to it. This is the
 * safe, always-available removal action: applicants who already applied
 * keep their full history, they just won't see it as an open role anymore.
 */
export async function archiveJobAction(jobId: string): Promise<JobActionResult> {
  try {
    await jobRepository.update(jobId, { status: "archived" });
    revalidatePath("/dashboard/employer/jobs");
    revalidatePath("/jobs");
    return { success: true };
  } catch (e) {
    return { error: getErrorMessage(e, "Failed to remove job listing") };
  }
}

/**
 * Permanently deletes a job posting and, via cascade, every application,
 * interview, and offer tied to it. Only allowed when there are zero
 * applications — otherwise this would silently wipe an applicant's
 * interview/offer history out from under them. Use archiveJobAction()
 * instead for anything that already has applicants.
 */
export async function deleteJobAction(jobId: string): Promise<JobActionResult> {
  try {
    const applicationCount = await jobRepository.countApplications(jobId);
    if (applicationCount > 0) {
      return {
        error: `This job has ${applicationCount} application${applicationCount === 1 ? "" : "s"} — use "Remove listing" instead to preserve applicant history, or delete is only available for jobs with no applicants.`,
      };
    }
    await jobRepository.remove(jobId);
    revalidatePath("/dashboard/employer/jobs");
    return { success: true };
  } catch (e) {
    return { error: getErrorMessage(e, "Failed to delete job") };
  }
}

/** Spends one earned boost credit to prioritize a specific job — the
 *  employer picks which job, since a credit is generic, not tied to any
 *  one posting when it's earned. */
export async function redeemBoostAction(jobId: string): Promise<JobActionResult> {
  try {
    const profile = await profileRepository.getCurrent();
    if (!profile) throw new Error("Not authenticated");
    const company = await companyRepository.getByOwner(profile.id);
    if (!company) throw new Error("No company found");

    const result = await companyRepository.redeemBoostCredit(company.id, jobId);
    if (result.error) return { error: result.error };

    revalidatePath("/dashboard/employer/jobs");
    revalidatePath("/jobs");
    return { success: true };
  } catch (e) {
    return { error: getErrorMessage(e, "Failed to boost job") };
  }
}
