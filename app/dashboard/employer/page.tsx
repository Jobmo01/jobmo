import { profileRepository } from "@/lib/repositories/profile-repository";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function EmployerDashboardPage() {
  const profile = await profileRepository.getCurrent();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">
            Welcome{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}
          </h1>
          <p className="text-sm text-muted-foreground">Your hiring activity at a glance.</p>
        </div>
        <Button>Post a job</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: "Active jobs", value: 0 },
          { label: "Total applicants", value: 0 },
          { label: "Interviews scheduled", value: 0 },
          { label: "Offers pending", value: 0 },
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
          <CardTitle>Set up your company profile</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Company profile, job posting, the applicant pipeline, interview
          scheduling, and offer management are built out in Phase 3 —
          Employer Module.
        </CardContent>
      </Card>
    </div>
  );
}
