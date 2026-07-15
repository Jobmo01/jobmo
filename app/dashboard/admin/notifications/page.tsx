import { profileRepository } from "@/lib/repositories/profile-repository";
import { NotificationsPageContent } from "@/components/dashboard/notifications-page-content";

export default async function AdminNotificationsPage() {
  const account = await profileRepository.getCurrent();
  if (!account) return null;
  return <NotificationsPageContent accountId={account.id} />;
}
