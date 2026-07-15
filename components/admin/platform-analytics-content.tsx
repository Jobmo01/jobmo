import { GraduationCap, Award, Briefcase } from "lucide-react";
import { adminRepository } from "@/lib/repositories/admin-repository";
import { jobRepository } from "@/lib/repositories/job-repository";
import { applicationRepository } from "@/lib/repositories/application-repository";
import { companyRepository } from "@/lib/repositories/company-repository";
import { supportTicketRepository } from "@/lib/repositories/support-ticket-repository";
import { quizRepository } from "@/lib/repositories/quiz-repository";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TimeSeriesBarChart } from "@/components/charts/time-series-bar-chart";
import { CategoryDonutChart } from "@/components/charts/category-donut-chart";
import { bucketByWeek } from "@/lib/utils";

const JOB_STATUS_COLORS: Record<string, string> = {
  published: "hsl(var(--success))",
  draft: "hsl(var(--muted-foreground))",
  closed: "hsl(var(--accent))",
  archived: "hsl(var(--destructive))",
};

const TICKET_STATUS_COLORS: Record<string, string> = {
  open: "hsl(var(--muted-foreground))",
  in_progress: "hsl(var(--primary))",
  resolved: "hsl(var(--success))",
  closed: "hsl(var(--destructive))",
};

/**
 * Full platform analytics dashboard — shared between /dashboard/admin/analytics
 * and /dashboard/super-admin/analytics since both roles see identical,
 * platform-wide data. Previously only the super_admin page had this; the
 * admin page was left showing the old placeholder because it was never
 * updated when this was built out.
 */
export async function PlatformAnalyticsContent() {
  const [counts, signups, jobs, applications, companies, tickets, learningStats] = await Promise.all([
    adminRepository.getDashboardCounts(),
    adminRepository.getSignupTimeline(),
    jobRepository.listAllForAdmin(),
    applicationRepository.listAllLight(),
    companyRepository.listForAdmin(),
    supportTicketRepository.listForAdmin(),
    quizRepository.getPlatformStats(),
  ]);

  const applicantWeekly = bucketByWeek(signups.filter((s) => s.role === "applicant").map((s) => s.created_at));
  const employerWeekly = bucketByWeek(signups.filter((s) => s.role === "employer").map((s) => s.created_at));
  const growthData = applicantWeekly.map((w, i) => ({
    label: w.label, applicants: w.count, employers: employerWeekly[i]?.count ?? 0,
  }));

  const applicationsWeekly = bucketByWeek(applications.map((a) => a.created_at));
  const jobsWeekly = bucketByWeek(jobs.map((j: any) => j.created_at));

  const jobStatusCounts: Record<string, number> = {};
  for (const j of jobs) jobStatusCounts[(j as any).status] = (jobStatusCounts[(j as any).status] ?? 0) + 1;
  const jobStatusData = Object.entries(jobStatusCounts).map(([label, count]) => ({
    label, count, color: JOB_STATUS_COLORS[label] ?? "hsl(var(--muted-foreground))",
  }));

  const ticketStatusCounts: Record<string, number> = {};
  for (const t of tickets) ticketStatusCounts[t.status] = (ticketStatusCounts[t.status] ?? 0) + 1;
  const ticketStatusData = Object.entries(ticketStatusCounts).map(([label, count]) => ({
    label: label.replace("_", " "), count, color: TICKET_STATUS_COLORS[label] ?? "hsl(var(--muted-foreground))",
  }));

  const jobCountByCompany = new Map<string, number>();
  for (const j of jobs) jobCountByCompany.set((j as any).company_id, (jobCountByCompany.get((j as any).company_id) ?? 0) + 1);
  const topCompanies = [...companies]
    .map((c: any) => ({ ...c, jobCount: jobCountByCompany.get(c.id) ?? 0 }))
    .sort((a, b) => b.jobCount - a.jobCount)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Platform Analytics</h1>
        <p className="text-sm text-muted-foreground">Growth, activity, and engagement across the whole platform.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: "Applicants", value: counts.totalApplicants },
          { label: "Employers", value: counts.totalEmployers },
          { label: "Active jobs", value: counts.activeJobs },
          { label: "Total applications", value: applications.length },
          { label: "Quizzes passed", value: learningStats.totalPassed },
          { label: "Certificates issued", value: learningStats.totalCertificates },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-5">
              <p className="font-display text-3xl font-semibold">{stat.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>User growth (last 8 weeks)</CardTitle></CardHeader>
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
          <CardHeader><CardTitle>Applications submitted (last 8 weeks)</CardTitle></CardHeader>
          <CardContent>
            <TimeSeriesBarChart
              data={applicationsWeekly}
              series={[{ key: "count", label: "Applications", color: "hsl(var(--primary))" }]}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Job postings (last 8 weeks)</CardTitle></CardHeader>
          <CardContent>
            <TimeSeriesBarChart
              data={jobsWeekly}
              series={[{ key: "count", label: "Jobs posted", color: "hsl(var(--accent))" }]}
              height={180}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Job status breakdown</CardTitle></CardHeader>
          <CardContent>
            <CategoryDonutChart data={jobStatusData} emptyLabel="No jobs posted yet." />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Support ticket status</CardTitle></CardHeader>
          <CardContent>
            <CategoryDonutChart data={ticketStatusData} emptyLabel="No support tickets yet." />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Briefcase className="h-4 w-4" /> Top companies by jobs posted</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {topCompanies.length === 0 || topCompanies[0].jobCount === 0 ? (
              <p className="text-sm text-muted-foreground">No jobs posted yet.</p>
            ) : (
              topCompanies.map((c) => (
                <div key={c.id} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{c.name}</span>
                  <span className="text-muted-foreground">{c.jobCount} job{c.jobCount === 1 ? "" : "s"}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><GraduationCap className="h-4 w-4" /> Learning Center engagement</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="font-display text-2xl font-semibold">{learningStats.totalAttempts}</p>
              <p className="text-xs text-muted-foreground">Quiz attempts</p>
            </div>
            <div>
              <p className="font-display text-2xl font-semibold">{learningStats.totalPassed}</p>
              <p className="text-xs text-muted-foreground">Quizzes passed</p>
            </div>
            <div>
              <p className="inline-flex items-center gap-1 font-display text-2xl font-semibold">
                <Award className="h-4 w-4 text-accent" /> {learningStats.totalCertificates}
              </p>
              <p className="text-xs text-muted-foreground">Certificates</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
