"use server";

import { revalidatePath } from "next/cache";
import { profileRepository } from "@/lib/repositories/profile-repository";
import { notificationsRepository } from "@/lib/repositories/notifications-repository";

// Notifications work identically regardless of role (applicant, employer,
// admin, super_admin all read from the same table keyed by user_id) — so
// these actions are shared rather than duplicated per role. Revalidate
// every role's notifications path; only the caller's own path actually
// had stale data, but revalidating the other three is a no-op cost-wise.
const NOTIFICATION_PATHS = [
  "/dashboard/applicant/notifications",
  "/dashboard/employer/notifications",
  "/dashboard/admin/notifications",
];

export async function markNotificationReadAction(notificationId: string) {
  await notificationsRepository.markRead(notificationId);
  NOTIFICATION_PATHS.forEach((p) => revalidatePath(p));
}

export async function markAllNotificationsReadAction() {
  const account = await profileRepository.getCurrent();
  if (!account) return;
  await notificationsRepository.markAllRead(account.id);
  NOTIFICATION_PATHS.forEach((p) => revalidatePath(p));
}
