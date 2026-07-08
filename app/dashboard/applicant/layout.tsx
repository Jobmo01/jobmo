import { redirect } from "next/navigation";
import { profileRepository } from "@/lib/repositories/profile-repository";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const profile = await profileRepository.getCurrent();
  if (!profile) redirect("/login");

  return (
    <DashboardShell role={profile.role} fullName={profile.full_name} email={profile.email}>
      {children}
    </DashboardShell>
  );
}
