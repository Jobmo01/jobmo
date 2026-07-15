import Link from "next/link";
import { Users2, Bell } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { profileRepository } from "@/lib/repositories/profile-repository";
import { companyRepository } from "@/lib/repositories/company-repository";
import { jobRepository } from "@/lib/repositories/job-repository";
import { applicationRepository } from "@/lib/repositories/application-repository";
import { interviewRepository } from "@/lib/repositories/interview-repository";
import { offerRepository } from "@/lib/repositories/offer-repository";
import { talentPoolRepository } from "@/lib/repositories/talent-pool-repository";
import { notificationsRepository } from "@/lib/repositories/notifications-repository";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PipelineStatusChart } from "@/components/applicant/pipeline-status-chart";
import { TimeSeriesBarChart } from "@/components/charts/time-series-bar-chart";
import { bucketByWeek } from "@/lib/utils";

export default async function EmployerDashboardPage() {
  const account = await profileRepository.getCurrent();
  if (!account) return null;

  const company = await companyRepository.getByOwner(account.id);

  if (!company) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-semibold">
            Welcome{account.full_name ? `, ${account.full_name.split(" ")[0]}` : ""}
          </h1>
          <p className="text-sm text-muted-foreground">Set up your company profile to start hiring.</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/employer/company">Set up company profile</Link>
        </Button>
      </div>
    );
  }

  const [jobs, interviews, talentPool, notifications] = await Promise.all([
    jobRepository.listForCompany(company.id),
    interviewRepository.listForCompany(company.id),
    talentPoolRepository.listForCompany(company.id),
    notificationsRepository.list(account.id, 5),
  ]);
  const activeJobs = jobs.filter((j) => j.status === "published");
  const jobIds = jobs.map((j) => j.id);
  const applications = await applicationRepository.listLightForCompany(jobIds);
  const totalApplicants = applications.length;
  const upcomingInterviews = interviews.filter((i: any) => new Date(i.scheduled_at) > new Date() && i.status !== "cancelled");
  const offersPending = await offerRepository.countPendingForApplications(applications.map((a) => a.id));

  const applicationsByWeek = bucketByWeek(applications.map((a) => a.created_at));

  const applicantCountByJob = new Map<string, number>();
  for (const app of applications) {
    const jobId = (app as any).job_id;
    applicantCountByJob.set(jobId, (applicantCountByJob.get(jobId) ?? 0) + 1);
  }
  const topJobs = [...jobs]
    .map((j) => ({ ...j, applicantCount: applicantCountByJob.get(j.id) ?? 0 }))
    .sort((a, b) => b.applicantCount - a.applicantCount)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">
            Welcome{account.full_name ? `, ${account.full_name.split(" ")[0]}` : ""}
          </h1>
          <p className="text-sm text-muted-foreground">{company.name} — your hiring activity at a glance.</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/employer/jobs/new">Post a job</Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: "Active jobs", value: activeJobs.length },
          { label: "Total applicants", value: totalApplicants },
          { label: "Interviews scheduled", value: upcomingInterviews.length },
          { label: "Offers pending", value: offersPending },
          { label: "Talent pool", value: talentPool.length },
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
          <CardHeader><CardTitle>Candidate pipeline, across all jobs</CardTitle></CardHeader>
          <CardContent>
            <PipelineStatusChart applications={applications as any} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Applications received (last 8 weeks)</CardTitle></CardHeader>
          <CardContent>
            <TimeSeriesBarChart
              data={applicationsByWeek}
              series={[{ key: "count", label: "Applications", color: "hsl(var(--primary))" }]}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Top jobs by applicants</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {topJobs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No jobs posted yet.</p>
            ) : (
              topJobs.map((job) => (
                <Link
                  key={job.id}
                  href={`/dashboard/employer/jobs/${job.id}/pipeline`}
                  className="flex items-center justify-between rounded-md p-2 text-sm transition-colors hover:bg-secondary/50"
                >
                  <span className="font-medium">{job.title}</span>
                  <span className="text-muted-foreground">{job.applicantCount} applicant{job.applicantCount === 1 ? "" : "s"}</span>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Recent activity</CardTitle></CardHeader>
          <CardContent className="space-y-1">
            {notifications.length === 0 ? (
              <div className="flex h-[140px] flex-col items-center justify-center text-center">
                <Bell className="h-6 w-6 text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">Nothing yet — activity will show up here.</p>
              </div>
            ) : (
              notifications.map((n) => (
                <Link
                  key={n.id}
                  href={n.link ?? "/dashboard/employer/notifications"}
                  className="flex items-start justify-between gap-3 rounded-md p-2.5 text-sm transition-colors hover:bg-secondary/50"
                >
                  <div>
                    <p className={n.read_at ? "text-muted-foreground" : "font-medium"}>{n.title}</p>
                    <p className="text-xs text-muted-foreground">{n.body}</p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                  </span>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {talentPool.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2"><Users2 className="h-4 w-4" /> Talent pool preview</CardTitle>
            <Button size="sm" variant="outline" asChild>
              <Link href="/dashboard/employer/talent-pool">View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {talentPool.slice(0, 3).map((entry: any) => (
              <div key={entry.id} className="flex items-center justify-between rounded-md border border-border p-3 text-sm">
                <span className="font-medium">{entry.profile?.full_name ?? entry.profile?.email}</span>
                <span className="text-xs text-muted-foreground">{entry.applicant_profile?.district}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
