"use server";

import { revalidatePath } from "next/cache";
import { profileRepository } from "@/lib/repositories/profile-repository";
import { supportTicketRepository } from "@/lib/repositories/support-ticket-repository";
import { getErrorMessage } from "@/lib/utils";
import type { TicketStatus } from "@/types/database.types";

export type TicketActionResult = { error?: string; success?: true };

export async function submitSupportTicketAction(input: {
  email: string;
  subject: string;
  message: string;
}): Promise<TicketActionResult> {
  if (!input.email || !input.subject.trim() || !input.message.trim()) {
    return { error: "Fill in all fields" };
  }
  try {
    const account = await profileRepository.getCurrent();
    await supportTicketRepository.create({
      userId: account?.id ?? null,
      email: input.email,
      subject: input.subject,
      message: input.message,
    });
    return { success: true };
  } catch (e) {
    return { error: getErrorMessage(e, "Failed to submit your message") };
  }
}

export async function updateTicketStatusAction(ticketId: string, status: TicketStatus): Promise<TicketActionResult> {
  try {
    await supportTicketRepository.updateStatus(ticketId, status);
    revalidatePath("/dashboard/admin/support");
    revalidatePath(`/dashboard/admin/support/${ticketId}`);
    return { success: true };
  } catch (e) {
    return { error: getErrorMessage(e, "Failed to update status") };
  }
}

export async function addTicketReplyAction(ticketId: string, message: string): Promise<TicketActionResult> {
  if (!message.trim()) return { error: "Reply can't be empty" };
  try {
    const account = await profileRepository.getCurrent();
    if (!account) throw new Error("Not authenticated");
    await supportTicketRepository.addReply(ticketId, account.id, message);
    revalidatePath(`/dashboard/admin/support/${ticketId}`);
    return { success: true };
  } catch (e) {
    return { error: getErrorMessage(e, "Failed to send reply") };
  }
}
