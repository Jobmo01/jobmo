"use server";

import { revalidatePath } from "next/cache";
import { profileRepository } from "@/lib/repositories/profile-repository";
import {
  applicantProfileRepository, educationRepository, experienceRepository, skillsRepository,
} from "@/lib/repositories/applicant-profile-repository";
import { analyzeResume } from "@/lib/ai/resume-ai";
import { AIUnavailableError } from "@/lib/ai/openai-client";
import { createClient } from "@/lib/supabase/server";
import { getErrorMessage } from "@/lib/utils";

export type ResumeAiActionResult = { error?: string; aiUnavailable?: true; success?: true };

export async function generateResumeAnalysisAction(): Promise<ResumeAiActionResult> {
  try {
    const account = await profileRepository.getCurrent();
    if (!account) throw new Error("Not authenticated");

    const [profile, education, experience, skills] = await Promise.all([
      applicantProfileRepository.get(account.id),
      educationRepository.list(account.id),
      experienceRepository.list(account.id),
      skillsRepository.list(account.id),
    ]);
    if (!profile) throw new Error("Profile not found");

    const result = await analyzeResume({
      fullName: account.full_name,
      profile: { district: profile.district, expected_salary_min: profile.expected_salary_min, expected_salary_max: profile.expected_salary_max },
      education,
      experience,
      skills,
    });

    const supabase = await createClient();
    const { error } = await (supabase.from("applicant_profiles") as any)
      .update({
        ai_summary: result.summary,
        ai_summary_generated_at: new Date().toISOString(),
        resume_score: result.atsScore,
        resume_score_feedback: { feedback: result.feedback, missingSkillSuggestions: result.missingSkillSuggestions },
      })
      .eq("id", account.id);
    if (error) throw error;

    revalidatePath("/dashboard/applicant/resume");
    return { success: true };
  } catch (e) {
    if (e instanceof AIUnavailableError) return { aiUnavailable: true, error: e.message };
    return { error: getErrorMessage(e, "Failed to analyze resume") };
  }
}
