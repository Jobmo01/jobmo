import Link from "next/link";
import { ScrollText } from "lucide-react";
import { format } from "date-fns";
import { adminRepository } from "@/lib/repositories/admin-repository";
import { auditLogRepository } from "@/lib/repositories/audit-log-repository";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TimeSeriesBarChart } from "@/components/charts/time-series-bar-chart";
import { CategoryDonutChart } from "@/components/charts/category-donut-chart";
import { bucketByWeek } from "@/lib/utils";

export default async function AdminDashboardPage() {
  const [counts, signups, recentLogs] = await Promise.all([
    adminRepository.getDashboardCounts(),
    adminRepository.getSignupTimeline(),
    auditLogRepository.list({}, 8),
  ]);

  const applicantSignups = signups.filter((s) => s.role === "applicant").map((s) => s.created_at);
  const employerSignups = signups.filter((s) => s.role === "employer").map((s) => s.created_at);
  const applicantWeekly = bucketByWeek(applicantSignups);
  const employerWeekly = bucketByWeek(employerSignups);
  const growthData = applicantWeekly.map((w, i) => ({
    label: w.label,
    applicants: w.count,
    employers: employerWeekly[i]?.count ?? 0,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Admin overview</h1>
        <p className="text-sm text-muted-foreground">Platform health and pending actions.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: "Applicants", value: counts.totalApplicants },
          { label: "Employers", value: counts.totalEmployers },
          { label: "Active jobs", value: counts.activeJobs },
          { label: "Pending DOB requests", value: counts.pendingDobRequests },
          { label: "Pending verifications", value: counts.pendingCompanyVerifications },
          { label: "Open tickets", value: counts.openSupportTickets },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-5">
              <p className="font-display text-3xl font-semibold">{stat.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {(counts.pendingDobRequests > 0 || counts.pendingCompanyVerifications > 0) && (
        <Card className="border-accent/40 bg-accent/5">
          <CardHeader><CardTitle>Needs your attention</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {counts.pendingDobRequests > 0 && (
              <Button size="sm" asChild>
                <Link href="/dashboard/admin/approvals">
                  {counts.pendingDobRequests} DOB change request{counts.pendingDobRequests === 1 ? "" : "s"} to review
                </Link>
              </Button>
            )}
            {counts.pendingCompanyVerifications > 0 && (
              <Button size="sm" variant="outline" asChild>
                <Link href="/dashboard/admin/approvals?tab=companies">
                  {counts.pendingCompanyVerifications} compan{counts.pendingCompanyVerifications === 1 ? "y" : "ies"} to verify
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Platform growth (last 8 weeks)</CardTitle></CardHeader>
          <CardContent>
            <TimeSeriesBarChart
              data={growthData}
              series={[
                { key: "applicants", label: "Applicants", color: "hsl(var(--primary))" },
                { key: "employers", label: "Employers", color: "hsl(var(--accent))" },
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>User base composition</CardTitle></CardHeader>
          <CardContent>
            <CategoryDonutChart
              emptyLabel="No users yet."
              data={[
                { label: "Applicants", count: counts.totalApplicants, color: "hsl(var(--primary))" },
                { label: "Employers", count: counts.totalEmployers, color: "hsl(var(--accent))" },
              ]}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2"><ScrollText className="h-4 w-4" /> Recent platform activity</CardTitle>
          <Button size="sm" variant="outline" asChild>
            <Link href="/dashboard/admin/audit-logs">View all</Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-1.5">
          {recentLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recorded activity yet.</p>
          ) : (
            recentLogs.map((log: any) => (
              <div key={log.id} className="flex items-center justify-between text-sm">
                <span className="font-mono text-xs">{log.action}</span>
                <span className="text-xs text-muted-foreground">{format(new Date(log.created_at), "d MMM, h:mm a")}</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Quick links</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" asChild><Link href="/dashboard/admin/users">Manage users</Link></Button>
          <Button size="sm" variant="outline" asChild><Link href="/dashboard/admin/companies">Companies</Link></Button>
          <Button size="sm" variant="outline" asChild><Link href="/dashboard/admin/approvals">Approvals</Link></Button>
          <Button size="sm" variant="outline" asChild><Link href="/dashboard/admin/support">Support tickets</Link></Button>
          <Button size="sm" variant="outline" asChild><Link href="/dashboard/admin/audit-logs">Audit logs</Link></Button>
          <Button size="sm" variant="outline" asChild><Link href="/dashboard/admin/learning-center">Learning Center</Link></Button>
        </CardContent>
      </Card>
    </div>
  );
}
