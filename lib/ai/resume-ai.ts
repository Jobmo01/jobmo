import { callAIForJSON } from "@/lib/ai/openai-client";
import type {
  ApplicantProfile, EducationEntry, ExperienceEntry, Skill,
} from "@/types/database.types";

export interface ResumeAnalysisInput {
  fullName: string | null;
  profile: Pick<ApplicantProfile, "district" | "expected_salary_min" | "expected_salary_max">;
  education: Pick<EducationEntry, "qualification" | "institution" | "field_of_study">[];
  experience: Pick<ExperienceEntry, "position" | "company" | "description" | "is_current">[];
  skills: Pick<Skill, "name" | "proficiency">[];
}

export interface ResumeAnalysisResult {
  summary: string;
  atsScore: number;
  feedback: string[];
  missingSkillSuggestions: string[];
}

function buildProfileText(input: ResumeAnalysisInput): string {
  const lines: string[] = [];
  lines.push(`Name: ${input.fullName ?? "Candidate"}`);
  lines.push("");
  lines.push("Experience:");
  for (const e of input.experience) {
    lines.push(`- ${e.position} at ${e.company}${e.is_current ? " (current)" : ""}: ${e.description ?? "no description"}`);
  }
  lines.push("");
  lines.push("Education:");
  for (const ed of input.education) {
    lines.push(`- ${ed.qualification} at ${ed.institution}${ed.field_of_study ? ` (${ed.field_of_study})` : ""}`);
  }
  lines.push("");
  lines.push("Skills: " + input.skills.map((s) => `${s.name} (${s.proficiency})`).join(", "));
  return lines.join("\n");
}

/**
 * Generates a professional summary, an ATS-style resume score (0-100), and
 * concrete feedback — the core of the spec's "AI Resume Builder" (grammar,
 * professional summary, missing skills, ATS optimization, resume score).
 * Throws AIUnavailableError if OPENAI_API_KEY isn't configured — callers
 * should catch that specifically and show a friendly message.
 */
export async function analyzeResume(input: ResumeAnalysisInput): Promise<ResumeAnalysisResult> {
  const profileText = buildProfileText(input);

  return callAIForJSON<ResumeAnalysisResult>(
    `You are a professional resume writer and ATS (Applicant Tracking System) expert helping a
job seeker in Sri Lanka improve their resume. Be encouraging but honest and specific — no
generic filler advice. Respond ONLY with a JSON object matching this exact shape:
{
  "summary": "a 2-3 sentence professional summary written in first person, ready to paste into a resume",
  "atsScore": <integer 0-100 reflecting how complete and ATS-friendly this profile currently is>,
  "feedback": ["3-5 short, specific, actionable suggestions to improve the resume"],
  "missingSkillSuggestions": ["2-4 skills commonly expected for this candidate's apparent role/level that aren't listed"]
}`,
    profileText
  );
}
