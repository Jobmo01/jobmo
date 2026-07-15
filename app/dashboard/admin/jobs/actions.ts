"use server";

import { revalidatePath } from "next/cache";
import { jobRepository } from "@/lib/repositories/job-repository";
import { getErrorMessage } from "@/lib/utils";
import type { JobStatus } from "@/types/database.types";

export type AdminJobActionResult = { error?: string; success?: true };

export async function adminUpdateJobStatusAction(jobId: string, status: JobStatus): Promise<AdminJobActionResult> {
  try {
    await jobRepository.update(jobId, { status });
    revalidatePath("/dashboard/admin/jobs");
    revalidatePath("/jobs");
    return { success: true };
  } catch (e) {
    return { error: getErrorMessage(e, "Failed to update job status") };
  }
}
