"use server";

import { revalidatePath } from "next/cache";
import { profileRepository } from "@/lib/repositories/profile-repository";
import { companyRepository } from "@/lib/repositories/company-repository";
import { applicationRepository } from "@/lib/repositories/application-repository";
import { interviewRepository } from "@/lib/repositories/interview-repository";
import { offerRepository } from "@/lib/repositories/offer-repository";
import { talentPoolRepository } from "@/lib/repositories/talent-pool-repository";
import { interviewSchema, offerSchema } from "@/lib/validations/employer";
import { generateInterviewQuestions } from "@/lib/ai/employer-ai";
import { AIUnavailableError } from "@/lib/ai/openai-client";
import type { ApplicationStatus } from "@/types/database.types";
import { getErrorMessage } from "@/lib/utils";

export type PipelineActionResult = { error?: string; success?: true };

function revalidatePipeline(jobId: string) {
  revalidatePath(`/dashboard/employer/jobs/${jobId}/pipeline`);
}

export async function changeApplicationStatusAction(
  applicationId: string,
  jobId: string,
  newStatus: ApplicationStatus
): Promise<PipelineActionResult> {
  try {
    await applicationRepository.changeStatus(applicationId, newStatus);
    revalidatePipeline(jobId);
    return { success: true };
  } catch (e) {
    return { error: getErrorMessage(e, "Failed to update status") };
  }
}

export async function addApplicationNoteAction(
  applicationId: string,
  jobId: string,
  note: string
): Promise<PipelineActionResult> {
  if (!note.trim()) return { error: "Note can't be empty" };
  try {
    const profile = await profileRepository.getCurrent();
    if (!profile) throw new Error("Not authenticated");
    await applicationRepository.addNote(applicationId, profile.id, note.trim());
    revalidatePipeline(jobId);
    return { success: true };
  } catch (e) {
    return { error: getErrorMessage(e, "Failed to add note") };
  }
}

export async function updateApplicationTagsAction(
  applicationId: string,
  jobId: string,
  tags: string[]
): Promise<PipelineActionResult> {
  try {
    await applicationRepository.updateTags(applicationId, tags);
    revalidatePipeline(jobId);
    return { success: true };
  } catch (e) {
    return { error: getErrorMessage(e, "Failed to update tags") };
  }
}

export async function scheduleInterviewAction(
  applicationId: string,
  jobId: string,
  input: unknown
): Promise<PipelineActionResult> {
  const parsed = interviewSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "Invalid input" };

  try {
    const profile = await profileRepository.getCurrent();
    if (!profile) throw new Error("Not authenticated");

    await interviewRepository.create({
      application_id: applicationId,
      scheduled_by: profile.id,
      mode: parsed.data.mode,
      platform: parsed.data.platform ?? null,
      meeting_link: parsed.data.meeting_link ?? null,
      location: parsed.data.location ?? null,
      scheduled_at: new Date(parsed.data.scheduled_at).toISOString(),
      duration_minutes: parsed.data.duration_minutes,
      panel_members: parsed.data.panel_members,
      instructions: parsed.data.instructions ?? null,
    });

    await applicationRepository.changeStatus(
      applicationId,
      "interview_scheduled",
      `Interview scheduled for ${new Date(parsed.data.scheduled_at).toLocaleString()}`
    );

    revalidatePipeline(jobId);
    return { success: true };
  } catch (e) {
    return { error: getErrorMessage(e, "Failed to schedule interview") };
  }
}

export async function rescheduleInterviewAction(
  interviewId: string,
  jobId: string,
  input: unknown
): Promise<PipelineActionResult> {
  const parsed = interviewSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "Invalid input" };

  try {
    await interviewRepository.reschedule(interviewId, {
      mode: parsed.data.mode,
      platform: parsed.data.platform ?? null,
      meeting_link: parsed.data.meeting_link ?? null,
      location: parsed.data.location ?? null,
      scheduled_at: new Date(parsed.data.scheduled_at).toISOString(),
      duration_minutes: parsed.data.duration_minutes,
      panel_members: parsed.data.panel_members,
      instructions: parsed.data.instructions ?? null,
    });

    revalidatePipeline(jobId);
    return { success: true };
  } catch (e) {
    return { error: getErrorMessage(e, "Failed to reschedule interview") };
  }
}

export async function sendOfferAction(
  applicationId: string,
  jobId: string,
  input: unknown
): Promise<PipelineActionResult> {
  const parsed = offerSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "Invalid input" };

  try {
    const profile = await profileRepository.getCurrent();
    if (!profile) throw new Error("Not authenticated");

    await offerRepository.create({
      application_id: applicationId,
      created_by: profile.id,
      position_title: parsed.data.position_title,
      salary: parsed.data.salary ?? null,
      currency: parsed.data.currency,
      start_date: parsed.data.start_date ?? null,
      benefits: parsed.data.benefits ?? null,
      terms: parsed.data.terms ?? null,
    });

    await applicationRepository.changeStatus(applicationId, "offer_sent");

    revalidatePipeline(jobId);
    return { success: true };
  } catch (e) {
    return { error: getErrorMessage(e, "Failed to send offer") };
  }
}

export type AiInterviewQuestionsResult = { error?: string; aiUnavailable?: true; questions?: string[] };

export async function generateInterviewQuestionsAction(
  jobTitle: string,
  jobDescription: string,
  requiredSkills: string[],
  candidateSkills: string[],
  candidateExperience: string[]
): Promise<AiInterviewQuestionsResult> {
  try {
    const result = await generateInterviewQuestions({
      jobTitle, jobDescription, requiredSkills, candidateSkills, candidateExperience,
    });
    return { questions: result.questions };
  } catch (e) {
    if (e instanceof AIUnavailableError) return { aiUnavailable: true, error: e.message };
    return { error: getErrorMessage(e, "Failed to generate interview questions") };
  }
}

export async function addToTalentPoolAction(
  applicantId: string,
  note: string,
  applicationId: string | null
): Promise<PipelineActionResult> {
  try {
    const profile = await profileRepository.getCurrent();
    if (!profile) throw new Error("Not authenticated");
    const company = await companyRepository.getByOwner(profile.id);
    if (!company) throw new Error("No company found");

    const already = await talentPoolRepository.isInPool(company.id, applicantId);
    if (already) return { error: "Already in your talent pool" };

    await talentPoolRepository.add(company.id, applicantId, profile.id, note || null, applicationId);
    revalidatePath("/dashboard/employer/talent-pool");
    return { success: true };
  } catch (e) {
    return { error: getErrorMessage(e, "Failed to add to talent pool") };
  }
}
