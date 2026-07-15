"use server";

import { revalidatePath } from "next/cache";
import { profileRepository } from "@/lib/repositories/profile-repository";
import { notificationsRepository } from "@/lib/repositories/notifications-repository";

export async function markNotificationReadAction(notificationId: string) {
  await notificationsRepository.markRead(notificationId);
  revalidatePath("/dashboard/applicant/notifications");
}

export async function markAllNotificationsReadAction() {
  const account = await profileRepository.getCurrent();
  if (!account) return;
  await notificationsRepository.markAllRead(account.id);
  revalidatePath("/dashboard/applicant/notifications");
}
