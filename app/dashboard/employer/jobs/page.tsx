import Link from "next/link";
import { Plus, Users } from "lucide-react";
import { profileRepository } from "@/lib/repositories/profile-repository";
import { companyRepository } from "@/lib/repositories/company-repository";
import { jobRepository } from "@/lib/repositories/job-repository";
import { applicationRepository } from "@/lib/repositories/application-repository";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { JobRowActions } from "@/components/employer/job-row-actions";

const STATUS_VARIANT: Record<string, "outline" | "success" | "secondary" | "destructive"> = {
  draft: "outline",
  published: "success",
  closed: "secondary",
  archived: "destructive",
};

const STATUS_LABEL: Record<string, string> = {
  draft: "draft",
  published: "published",
  closed: "closed",
  archived: "removed",
};

export default async function EmployerJobsPage() {
  const account = await profileRepository.getCurrent();
  if (!account) return null;

  const company = await companyRepository.getByOwner(account.id);
  if (!company) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border p-12 text-center">
        <p className="text-sm text-muted-foreground">
          Set up your company profile before posting your first job.
        </p>
        <Button size="sm" className="mt-4" asChild>
          <Link href="/dashboard/employer/company">Set up company profile</Link>
        </Button>
      </div>
    );
  }

  const jobs = await jobRepository.listForCompany(company.id);
  const countsByJob = await applicationRepository.countByJobIds(jobs.map((j) => j.id));
  const applicantCounts = jobs.map((j) => countsByJob.get(j.id) ?? 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Job Postings</h1>
          <p className="text-sm text-muted-foreground">Manage every role you&apos;ve listed.</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/employer/jobs/new"><Plus className="h-4 w-4" /> Post a job</Link>
        </Button>
      </div>

      {jobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">No jobs posted yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job, i) => (
            <Card key={job.id}>
              <CardContent className="flex flex-col justify-between gap-3 p-5 sm:flex-row sm:items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-display font-semibold">{job.title}</h2>
                    <Badge variant={STATUS_VARIANT[job.status]}>{STATUS_LABEL[job.status]}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {job.work_type ?? "—"} • {job.employment_type?.replace("_", " ") ?? "—"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/employer/jobs/${job.id}/pipeline`}>
                      <Users className="h-4 w-4" /> {applicantCounts[i] ?? 0} applicants
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/employer/jobs/${job.id}/edit`}>Edit</Link>
                  </Button>
                  <JobRowActions
                    jobId={job.id}
                    jobTitle={job.title}
                    status={job.status}
                    applicantCount={applicantCounts[i] ?? 0}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
