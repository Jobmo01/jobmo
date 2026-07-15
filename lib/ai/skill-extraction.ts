import { callAIForJSON } from "@/lib/ai/openai-client";

export interface SkillExtractionResult {
  suggestedSkills: string[];
}

/**
 * Reads the applicant's experience and education descriptions and suggests
 * skills they likely have but haven't listed — the spec's "Skill extraction"
 * feature. Suggestions are additive only: the applicant chooses which to
 * add, each one flagged is_ai_suggested for transparency.
 */
export async function extractSkillsFromProfile(input: {
  experienceDescriptions: string[];
  educationSummaries: string[];
  existingSkills: string[];
}): Promise<SkillExtractionResult> {
  return callAIForJSON<SkillExtractionResult>(
    `You extract likely professional skills from a candidate's work experience and education
descriptions. Only suggest skills clearly implied by what they wrote — don't invent generic
skills unrelated to the text. Do NOT repeat any skill already in their existing list.
Respond ONLY with a JSON object matching this exact shape:
{ "suggestedSkills": ["3-8 specific skill names not already listed"] }`,
    `Existing skills: ${input.existingSkills.join(", ") || "none"}\n\nExperience:\n${input.experienceDescriptions.join("\n") || "none provided"}\n\nEducation:\n${input.educationSummaries.join("\n") || "none provided"}`
  );
}
