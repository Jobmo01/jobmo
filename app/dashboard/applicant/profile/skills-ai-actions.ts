"use server";

import { revalidateApplicantProfilePaths } from "@/lib/revalidate-profile";
import { profileRepository } from "@/lib/repositories/profile-repository";
import { educationRepository, experienceRepository, skillsRepository } from "@/lib/repositories/applicant-profile-repository";
import { extractSkillsFromProfile } from "@/lib/ai/skill-extraction";
import { AIUnavailableError } from "@/lib/ai/openai-client";
import { getErrorMessage } from "@/lib/utils";

export type SkillExtractionActionResult = { error?: string; aiUnavailable?: true; suggestions?: string[] };

export async function extractSkillSuggestionsAction(): Promise<SkillExtractionActionResult> {
  try {
    const account = await profileRepository.getCurrent();
    if (!account) throw new Error("Not authenticated");

    const [experience, education, existingSkills] = await Promise.all([
      experienceRepository.list(account.id),
      educationRepository.list(account.id),
      skillsRepository.list(account.id),
    ]);

    const result = await extractSkillsFromProfile({
      experienceDescriptions: experience.map((e) => `${e.position} at ${e.company}: ${e.description ?? ""}`),
      educationSummaries: education.map((e) => `${e.qualification}${e.field_of_study ? ` in ${e.field_of_study}` : ""}`),
      existingSkills: existingSkills.map((s) => s.name),
    });

    return { suggestions: result.suggestedSkills };
  } catch (e) {
    if (e instanceof AIUnavailableError) return { aiUnavailable: true, error: e.message };
    return { error: getErrorMessage(e, "Failed to suggest skills") };
  }
}

export async function addSuggestedSkillAction(name: string): Promise<{ error?: string; success?: true }> {
  try {
    const account = await profileRepository.getCurrent();
    if (!account) throw new Error("Not authenticated");
    await skillsRepository.create({ applicant_id: account.id, name, proficiency: "intermediate", is_ai_suggested: true });
    revalidateApplicantProfilePaths();
    return { success: true };
  } catch (e) {
    return { error: getErrorMessage(e, "Failed to add skill") };
  }
}
