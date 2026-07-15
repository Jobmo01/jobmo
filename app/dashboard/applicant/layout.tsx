import { redirect } from "next/navigation";
import { profileRepository } from "@/lib/repositories/profile-repository";
import { notificationsRepository } from "@/lib/repositories/notifications-repository";
import { announcementRepository } from "@/lib/repositories/announcement-repository";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const profile = await profileRepository.getCurrent();
  if (!profile) redirect("/login");

  const [unreadCount, announcement] = await Promise.all([
    notificationsRepository.unreadCount(profile.id),
    announcementRepository.getActive(profile.role),
  ]);

  return (
    <DashboardShell
      role={profile.role}
      fullName={profile.full_name}
      email={profile.email}
      unreadCount={unreadCount}
      announcement={announcement}
    >
      {children}
    </DashboardShell>
  );
}
