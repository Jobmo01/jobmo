import { callAIForJSON } from "@/lib/ai/openai-client";

export interface JobDescriptionImprovement {
  improvedDescription: string; // HTML, matching the rich text editor's format
  addedKeywords: string[];
}

export async function improveJobDescription(input: {
  title: string;
  currentDescription: string;
  requiredSkills: string[];
}): Promise<JobDescriptionImprovement> {
  return callAIForJSON<JobDescriptionImprovement>(
    `You are an expert technical recruiter helping an employer in Sri Lanka write a
compelling, clear, keyword-optimized job description. Improve the wording, structure, and
clarity of the description they provide — keep their intent and requirements, don't invent
new responsibilities. Use simple HTML formatting only: <p>, <ul>, <li>, <strong>, <em> — no
other tags, no markdown. Respond ONLY with a JSON object matching this exact shape:
{
  "improvedDescription": "the rewritten description as simple HTML",
  "addedKeywords": ["2-5 relevant keywords/skills you incorporated or emphasized for ATS/search visibility"]
}`,
    `Job title: ${input.title}\nRequired skills: ${input.requiredSkills.join(", ") || "none listed"}\n\nCurrent description:\n${input.currentDescription || "(empty — write a solid draft from the title and required skills)"}`
  );
}

export interface SalarySuggestion {
  min: number;
  max: number;
  currency: string;
  reasoning: string;
}

export async function suggestSalaryRange(input: {
  title: string;
  experienceLevel: string | null;
  workType: string | null;
  employmentType: string | null;
  industry: string | null;
}): Promise<SalarySuggestion> {
  return callAIForJSON<SalarySuggestion>(
    `You are a compensation analyst familiar with the Sri Lankan job market. Suggest a
realistic monthly salary range in LKR for the role described, based on general market
knowledge. Be clear this is an estimate, not a guarantee — note that in your reasoning.
Respond ONLY with a JSON object matching this exact shape:
{
  "min": <integer, monthly LKR>,
  "max": <integer, monthly LKR>,
  "currency": "LKR",
  "reasoning": "1-2 sentences explaining the estimate and noting it's a general guideline, not exact market data"
}`,
    `Title: ${input.title}\nExperience level: ${input.experienceLevel ?? "not specified"}\nWork type: ${input.workType ?? "not specified"}\nEmployment type: ${input.employmentType ?? "not specified"}\nIndustry: ${input.industry ?? "not specified"}`
  );
}

export interface InterviewQuestionSet {
  questions: string[];
}

export async function generateInterviewQuestions(input: {
  jobTitle: string;
  jobDescription: string;
  requiredSkills: string[];
  candidateSkills: string[];
  candidateExperience: string[];
}): Promise<InterviewQuestionSet> {
  return callAIForJSON<InterviewQuestionSet>(
    `You are helping a hiring manager prepare for a candidate interview. Generate specific,
role-relevant interview questions based on the job requirements AND what's known about this
particular candidate — mix technical, behavioral, and experience-verification questions.
Avoid generic questions that could apply to any role. Respond ONLY with a JSON object
matching this exact shape:
{ "questions": ["6-8 specific interview questions"] }`,
    `Job title: ${input.jobTitle}\nRequired skills: ${input.requiredSkills.join(", ") || "none listed"}\nJob description: ${input.jobDescription.replace(/<[^>]+>/g, " ").slice(0, 800)}\n\nCandidate's listed skills: ${input.candidateSkills.join(", ") || "none listed"}\nCandidate's experience: ${input.candidateExperience.join("; ") || "none listed"}`
  );
}
