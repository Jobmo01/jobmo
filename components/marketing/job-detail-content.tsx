import Link from "next/link";
import { ArrowLeft, MapPin, Briefcase, GraduationCap, Wallet, CalendarClock, BadgeCheck, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ApplyButton } from "@/components/marketing/apply-button";
import { ShareJobButton } from "@/components/marketing/share-job-button";

/**
 * Shared between the public /jobs/[id] page (SEO, logged-out visitors) and
 * the in-dashboard /dashboard/applicant/browse-jobs/[id] page (logged-in
 * applicants, so they never leave the dashboard chrome to view or apply to
 * a job — see the "back" link below, which points wherever the caller
 * came from).
 */
export function JobDetailContent({
  job,
  account,
  alreadyApplied,
  matchScore,
  matchedRequiredSkills,
  missingRequiredSkills,
  profileCompletion,
  backHref,
  backLabel,
}: {
  job: any;
  account: { role: string } | null;
  alreadyApplied: boolean;
  matchScore: number | null;
  matchedRequiredSkills: string[];
  missingRequiredSkills: string[];
  profileCompletion: { percentage: number; missingLabels: string[] } | null;
  backHref: string;
  backLabel: string;
}) {
  return (
    <div className="container max-w-3xl py-16">
      <Link href={backHref} className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> {backLabel}
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">{job.title}</h1>
          {job.companies?.id ? (
            <Link
              href={`/companies/${job.companies.id}`}
              className="mt-1 inline-flex items-center gap-1.5 text-muted-foreground hover:text-primary hover:underline"
            >
              {job.companies.name}
              {job.companies.verification_status === "verified" && (
                <BadgeCheck className="h-4 w-4 text-primary" aria-label="Verified employer" />
              )}
            </Link>
          ) : (
            <p className="mt-1 flex items-center gap-1.5 text-muted-foreground">
              {job.companies?.name}
              {job.companies?.verification_status === "verified" && (
                <BadgeCheck className="h-4 w-4 text-primary" aria-label="Verified employer" />
              )}
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-sm text-muted-foreground">
        {job.work_type && (
          <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" /> {job.work_type.replace("_", " ")}</span>
        )}
        {job.employment_type && (
          <span className="inline-flex items-center gap-1"><Briefcase className="h-4 w-4" /> {job.employment_type.replace("_", " ")}</span>
        )}
        {job.experience_level && (
          <span className="inline-flex items-center gap-1"><GraduationCap className="h-4 w-4" /> {job.experience_level}</span>
        )}
        {job.show_salary && (job.salary_min || job.salary_max) && (
          <span className="inline-flex items-center gap-1">
            <Wallet className="h-4 w-4" /> {job.salary_currency} {job.salary_min?.toLocaleString()}–{job.salary_max?.toLocaleString()}
          </span>
        )}
        {job.application_deadline && (
          <span className="inline-flex items-center gap-1">
            <CalendarClock className="h-4 w-4" /> Apply by {new Date(job.application_deadline).toLocaleDateString()}
          </span>
        )}
      </div>

      {matchScore !== null && (
        <Card className="mt-6 border-accent/30 bg-accent/5">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="inline-flex items-center gap-1.5 font-display font-semibold">
                <Sparkles className="h-4 w-4 text-accent" /> Your match score
              </p>
              <span className="font-display text-2xl font-semibold text-accent">{matchScore}%</span>
            </div>
            <Progress value={matchScore} className="mt-3" />
            {matchedRequiredSkills.length > 0 && (
              <p className="mt-3 text-sm text-muted-foreground">
                ✓ You have {matchedRequiredSkills.length} of {matchedRequiredSkills.length + missingRequiredSkills.length} required skills: {matchedRequiredSkills.join(", ")}
              </p>
            )}
            {missingRequiredSkills.length > 0 && (
              <p className="mt-1 text-sm text-muted-foreground">
                Consider adding: {missingRequiredSkills.join(", ")}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <div className="mt-8 flex flex-wrap items-start gap-3">
        <ApplyButton
          jobId={job.id}
          isLoggedIn={Boolean(account)}
          isApplicant={account?.role === "applicant"}
          alreadyApplied={alreadyApplied}
          profileCompletion={profileCompletion}
        />
        <ShareJobButton jobId={job.id} jobTitle={job.title} companyName={job.companies?.name ?? null} />
      </div>

      <div
        className="prose prose-sm mt-8 max-w-none [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-primary"
        dangerouslySetInnerHTML={{ __html: job.description }}
      />

      {job.required_skills?.length > 0 && (
        <div className="mt-8">
          <h2 className="font-display font-semibold">Required skills</h2>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {job.required_skills.map((s: string) => <Badge key={s} variant="secondary">{s}</Badge>)}
          </div>
        </div>
      )}

      {job.preferred_skills?.length > 0 && (
        <div className="mt-4">
          <h2 className="font-display font-semibold">Preferred skills</h2>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {job.preferred_skills.map((s: string) => <Badge key={s} variant="outline">{s}</Badge>)}
          </div>
        </div>
      )}

      {job.benefits?.length > 0 && (
        <div className="mt-4">
          <h2 className="font-display font-semibold">Benefits</h2>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {job.benefits.map((b: string) => <Badge key={b} variant="accent">{b}</Badge>)}
          </div>
        </div>
      )}
    </div>
  );
}
