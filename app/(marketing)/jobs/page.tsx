import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, Briefcase } from "lucide-react";
import { jobRepository } from "@/lib/repositories/job-repository";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Jobs in Sri Lanka",
  description: "Browse open roles matched to your profile with JobMo's AI.",
};

export default async function JobsPage() {
  const jobs = await jobRepository.listPublished();

  return (
    <div className="container py-16">
      <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
        Find your next role
      </h1>
      <p className="mt-2 text-muted-foreground">
        {jobs.length} open role{jobs.length === 1 ? "" : "s"} today.
      </p>

      {jobs.length === 0 ? (
        <div className="mt-10 rounded-lg border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
          No published jobs yet — check back soon, or if you&apos;re an employer,{" "}
          <Link href="/register?type=employer" className="text-primary hover:underline">post the first one</Link>.
        </div>
      ) : (
        <div className="mt-10 grid gap-4">
          {jobs.map((job: any) => (
            <Link key={job.id} href={`/jobs/${job.id}`}>
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="flex flex-col justify-between gap-3 p-5 sm:flex-row sm:items-center">
                  <div>
                    <h2 className="font-display font-semibold">{job.title}</h2>
                    <p className="text-sm text-muted-foreground">{job.companies?.name}</p>
                    <div className="mt-2 flex gap-3 text-xs text-muted-foreground">
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
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
