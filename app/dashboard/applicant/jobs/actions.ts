"use server";

import { revalidatePath } from "next/cache";
import { interviewRepository } from "@/lib/repositories/interview-repository";
import { offerRepository } from "@/lib/repositories/offer-repository";
import { getErrorMessage } from "@/lib/utils";

export type ApplicantJobActionResult = { error?: string; success?: true };

export async function respondToInterviewAction(
  interviewId: string,
  applicationId: string,
  response: "accepted" | "declined" | "reschedule_requested",
  note?: string
): Promise<ApplicantJobActionResult> {
  try {
    await interviewRepository.respond(interviewId, response, note);
    revalidatePath(`/dashboard/applicant/jobs/${applicationId}`);
    return { success: true };
  } catch (e) {
    return { error: getErrorMessage(e, "Failed to respond to interview") };
  }
}

export async function respondToOfferAction(
  offerId: string,
  applicationId: string,
  response: "accepted" | "rejected"
): Promise<ApplicantJobActionResult> {
  try {
    await offerRepository.respond(offerId, response);
    revalidatePath(`/dashboard/applicant/jobs/${applicationId}`);
    return { success: true };
  } catch (e) {
    return { error: getErrorMessage(e, "Failed to respond to offer") };
  }
}
