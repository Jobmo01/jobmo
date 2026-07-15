"use server";

import { revalidatePath } from "next/cache";
import { talentPoolRepository } from "@/lib/repositories/talent-pool-repository";
import { getErrorMessage } from "@/lib/utils";

export type TalentPoolActionResult = { error?: string; success?: true };

export async function removeFromTalentPoolAction(id: string): Promise<TalentPoolActionResult> {
  try {
    await talentPoolRepository.remove(id);
    revalidatePath("/dashboard/employer/talent-pool");
    return { success: true };
  } catch (e) {
    return { error: getErrorMessage(e, "Failed to remove from talent pool") };
  }
}
