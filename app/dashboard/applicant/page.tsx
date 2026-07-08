import { profileRepository } from "@/lib/repositories/profile-repository";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function ApplicantDashboardPage() {
  const profile = await profileRepository.getCurrent();

  // Profile completion is computed for real once the full profile schema
  // (education, experience, skills, etc.) lands in Phase 2. Placeholder here.
  const completion = 20;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">
          Welcome{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}
        </h1>
        <p className="text-sm text-muted-foreground">Here&apos;s where your job search stands today.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile completion</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div className="h-full bg-primary transition-all" style={{ width: `${completion}%` }} />
          </div>
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{completion}% complete</span>
            <span className="text-muted-foreground">Reach 100% to unlock the AI Resume Builder</span>
          </div>
          <Button size="sm" className="mt-4" asChild>
            <Link href="/dashboard/applicant/profile">Complete your profile</Link>
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Applications", value: 0 },
          { label: "Saved jobs", value: 0 },
          { label: "Interviews", value: 0 },
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
        <CardHeader>
          <CardTitle>What&apos;s next</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Full profile sections (education, experience, skills, AI resume
          builder, job matching, and application tracking) are built out in
          Phase 2 — Applicant Module.
        </CardContent>
      </Card>
    </div>
  );
}
