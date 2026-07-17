import Link from "next/link";
import { MapPin, Briefcase, Sparkles, Award, GraduationCap, Bell } from "lucide-react";
import { profileRepository } from "@/lib/repositories/profile-repository";
import { getProfileCompletion } from "@/lib/repositories/applicant-profile-repository";
import { applicationRepository } from "@/lib/repositories/application-repository";
import { interviewRepository } from "@/lib/repositories/interview-repository";
import { jobRepository } from "@/lib/repositories/job-repository";
import { jobMatchRepository } from "@/lib/repositories/job-match-repository";
import { computeMatchesForApplicantAcrossJobs, notifyIfHighMatch } from "@/lib/ai/matching-service";
import { quizRepository, certificateRepository } from "@/lib/repositories/quiz-repository";
import { notificationsRepository } from "@/lib/repositories/notifications-repository";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PipelineStatusChart } from "@/components/applicant/pipeline-status-chart";
import { ReferFriendsCard } from "@/components/applicant/refer-friends-card";
import { formatDistanceToNow } from "date-fns";

export default async function ApplicantDashboardPage() {
  const profile = await profileRepository.getCurrent();
  if (!profile) return null;

  const [completion, applications, interviews, latestJobs, quizAttempts, certificates, notifications] = await Promise.all([
    getProfileCompletion(profile.id),
    applicationRepository.listForApplicant(profile.id),
    interviewRepository.listForApplicant(profile.id),
    jobRepository.listPublished(5),
    quizRepository.listAttemptsForApplicant(profile.id),
    certificateRepository.listForApplicant(profile.id),
    notificationsRepository.list(profile.id, 5),
  ]);

  const unlocked = completion.percentage >= 100;
  const upcomingInterviews = interviews.filter(
    (i: any) => new Date(i.scheduled_at) > new Date() && i.status !== "cancelled" && i.status !== "declined"
  );
  const quizzesPassed = new Set(quizAttempts.filter((a) => a.passed).map((a) => a.quiz_id)).size;

  // Match scores for "Open roles for you" — batched (1 cache-check query +
  // only-if-needed batched compute), same pattern as Browse Jobs.
  let matchByJob = new Map<string, number>();
  if (latestJobs.length > 0) {
    const existing = await jobMatchRepository.listForApplicantAcrossJobs(profile.id, latestJobs.map((j: any) => j.id));
    const jobById = new Map(latestJobs.map((j: any) => [j.id, j]));
    const uncached = latestJobs.filter((j: any) => !existing.has(j.id));
    if (uncached.length > 0) {
      const computed = await computeMatchesForApplicantAcrossJobs(profile.id, uncached as any);
      await jobMatchRepository.upsertMany(
        [...computed.entries()].map(([jobId, r]) => ({ jobId, applicantId: profile.id, score: r.score, breakdown: r.breakdown }))
      );
      for (const [jobId, r] of computed) existing.set(jobId, { score: r.score, notified: false } as any);
    }

    // Same fix as Browse Jobs: notify on any match crossing the threshold,
    // whether just computed or previously cached but never announced —
    // notifyIfHighMatch() is a no-op if already notified.
    for (const [jobId, m] of existing) {
      if ((m.score ?? 0) < 75) continue;
      const job = jobById.get(jobId);
      if (!job) continue;
      await notifyIfHighMatch({
        jobId, applicantId: profile.id, score: m.score,
        jobTitle: job.title, companyName: job.companies?.name ?? null,
      });
    }

    matchByJob = new Map([...existing.entries()].map(([jobId, m]) => [jobId, m.score]));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">
          Welcome{profile.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}
        </h1>
        <p className="text-sm text-muted-foreground">Here&apos;s where your job search stands today.</p>
      </div>

      {!unlocked && (
        <Card>
          <CardHeader>
            <CardTitle>Profile completion</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={completion.percentage} />
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{completion.percentage}% complete</span>
              <span className="text-muted-foreground">Reach 100% to unlock the AI Resume Builder</span>
            </div>
            <div className="mt-4 flex gap-2">
              <Button size="sm" asChild>
                <Link href="/dashboard/applicant/profile">Complete your profile</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Applications", value: applications.length, icon: Briefcase },
          { label: "Upcoming interviews", value: upcomingInterviews.length, icon: Sparkles },
          { label: "Quizzes passed", value: quizzesPassed, icon: GraduationCap },
          { label: "Certificates earned", value: certificates.length, icon: Award },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-start justify-between p-5">
              <div>
                <p className="font-display text-3xl font-semibold">{stat.value}</p>
                <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
              </div>
              <stat.icon className="h-5 w-5 text-muted-foreground/50" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Your application pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <PipelineStatusChart applications={applications as any} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {notifications.length === 0 ? (
              <div className="flex h-[180px] flex-col items-center justify-center text-center">
                <Bell className="h-6 w-6 text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">Nothing yet — activity will show up here.</p>
              </div>
            ) : (
              notifications.map((n) => (
                <Link
                  key={n.id}
                  href={n.link ?? "/dashboard/applicant/notifications"}
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

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Open roles for you</CardTitle>
          <Button size="sm" variant="outline" asChild>
            <Link href="/dashboard/applicant/browse-jobs">Browse all</Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {latestJobs.length === 0 && (
            <p className="text-sm text-muted-foreground">No open roles right now — check back soon.</p>
          )}
          {latestJobs.map((job: any) => (
            <Link
              key={job.id}
              href={`/dashboard/applicant/browse-jobs/${job.id}`}
              className="flex items-center justify-between rounded-md border border-border p-3 text-sm transition-colors hover:bg-secondary/50"
            >
              <div>
                <p className="font-medium">{job.title}</p>
                <p className="text-xs text-muted-foreground">{job.companies?.name}</p>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                {job.work_type && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> {job.work_type.replace("_", " ")}
                  </span>
                )}
                {job.employment_type && (
                  <span className="inline-flex items-center gap-1">
                    <Briefcase className="h-3.5 w-3.5" /> {job.employment_type.replace("_", " ")}
                  </span>
                )}
                {matchByJob.has(job.id) && (
                  <Badge variant="accent" className="gap-1">
                    <Sparkles className="h-3 w-3" /> {matchByJob.get(job.id)}% match
                  </Badge>
                )}
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>

      <ReferFriendsCard applicantId={profile.id} />
    </div>
  );
}
