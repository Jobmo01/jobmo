import Link from "next/link";
import { adminRepository } from "@/lib/repositories/admin-repository";
import { platformSettingsRepository } from "@/lib/repositories/platform-settings-repository";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function SuperAdminDashboardPage() {
  const [counts, admins, allSettings] = await Promise.all([
    adminRepository.getDashboardCounts(),
    adminRepository.listAdmins(),
    platformSettingsRepository.getAll(),
  ]);
  const activeFlagCount = allSettings.filter((s) => Boolean(s.value)).length;
  const maintenanceOn = Boolean(allSettings.find((s) => s.key === "maintenance_mode")?.value);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Super Admin</h1>
        <p className="text-sm text-muted-foreground">
          Full platform control — roles, permissions, and system settings.
        </p>
      </div>

      {maintenanceOn && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="p-4 text-sm text-destructive">
            Maintenance mode is currently ON — non-admin visitors are seeing a maintenance page.{" "}
            <Link href="/dashboard/super-admin/settings" className="underline">Turn it off</Link>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: "Admins & Super Admins", value: admins.length },
          { label: "Total users", value: counts.totalApplicants + counts.totalEmployers },
          { label: "Feature flags active", value: activeFlagCount },
          { label: "Open support tickets", value: counts.openSupportTickets },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-5">
              <p className="font-display text-3xl font-semibold">{stat.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>Quick links</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" asChild><Link href="/dashboard/super-admin/admins">Admins &amp; Roles</Link></Button>
          <Button size="sm" variant="outline" asChild><Link href="/dashboard/super-admin/cms">CMS &amp; Announcements</Link></Button>
          <Button size="sm" variant="outline" asChild><Link href="/dashboard/super-admin/settings">Platform Settings</Link></Button>
          <Button size="sm" variant="outline" asChild><Link href="/dashboard/admin/audit-logs">Audit Logs</Link></Button>
        </CardContent>
      </Card>
    </div>
  );
}
