"use server";

import { revalidatePath } from "next/cache";
import { profileRepository } from "@/lib/repositories/profile-repository";
import { applicationRepository } from "@/lib/repositories/application-repository";
import { getProfileCompletion } from "@/lib/repositories/applicant-profile-repository";
import { getErrorMessage } from "@/lib/utils";

export type ApplyActionResult = { error?: string; success?: true; incomplete?: true };

export async function applyToJobAction(jobId: string, coverLetter?: string): Promise<ApplyActionResult> {
  try {
    const profile = await profileRepository.getCurrent();
    if (!profile) return { error: "Please log in as an applicant to apply." };
    if (profile.role !== "applicant") {
      return { error: "Only applicant accounts can apply to jobs." };
    }

    // Server-side enforcement — the Apply button already hides itself
    // behind this same check, but that's a UI convenience, not a security
    // boundary; a direct request could skip it, so it's checked again here.
    const completion = await getProfileCompletion(profile.id);
    if (completion.percentage < 100) {
      return { error: "Complete your profile to 100% before applying.", incomplete: true };
    }

    const existing = await applicationRepository.getByJobAndApplicant(jobId, profile.id);
    if (existing) return { error: "You've already applied to this job." };

    await applicationRepository.apply(jobId, profile.id, coverLetter);
    revalidatePath(`/jobs/${jobId}`);
    revalidatePath("/dashboard/applicant/jobs");
    return { success: true };
  } catch (e) {
    return { error: getErrorMessage(e, "Failed to submit application") };
  }
}
