"use server";

import { revalidatePath } from "next/cache";
import { adminRepository } from "@/lib/repositories/admin-repository";
import { dobReviewRepository } from "@/lib/repositories/dob-review-repository";
import { companyRepository } from "@/lib/repositories/company-repository";
import { getErrorMessage } from "@/lib/utils";
import type { AccountStatus, UserRole } from "@/types/database.types";

export type AdminActionResult = { error?: string; success?: true };

export async function updateUserStatusAction(userId: string, status: AccountStatus): Promise<AdminActionResult> {
  try {
    await adminRepository.updateStatus(userId, status);
    revalidatePath("/dashboard/admin/users");
    return { success: true };
  } catch (e) {
    return { error: getErrorMessage(e, "Failed to update user status") };
  }
}

export async function reviewDobRequestAction(
  requestId: string,
  decision: "approved" | "rejected",
  comment: string
): Promise<AdminActionResult> {
  if (!comment.trim()) return { error: "Add a comment explaining the decision" };
  try {
    await dobReviewRepository.review(requestId, decision, comment);
    revalidatePath("/dashboard/admin/approvals");
    return { success: true };
  } catch (e) {
    return { error: getErrorMessage(e, "Failed to review request") };
  }
}

export async function getSignedDocumentUrlAction(path: string): Promise<{ url?: string; error?: string }> {
  const url = await dobReviewRepository.getSignedDocumentUrl(path);
  if (!url) return { error: "Failed to load document" };
  return { url };
}

export async function reviewCompanyVerificationAction(
  companyId: string,
  decision: "verified" | "rejected",
  comment: string
): Promise<AdminActionResult> {
  try {
    await companyRepository.reviewVerification(companyId, decision, comment || undefined);
    revalidatePath("/dashboard/admin/approvals");
    return { success: true };
  } catch (e) {
    return { error: getErrorMessage(e, "Failed to review company") };
  }
}
