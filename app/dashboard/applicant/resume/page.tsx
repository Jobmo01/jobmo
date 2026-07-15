import Link from "next/link";
import { Lock, Download } from "lucide-react";
import { profileRepository } from "@/lib/repositories/profile-repository";
import { getProfileCompletion, applicantProfileRepository } from "@/lib/repositories/applicant-profile-repository";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AiResumeInsights } from "@/components/applicant/ai-resume-insights";

const TEMPLATES = [
  { id: "classic", name: "Classic", description: "Single-column, ATS-safe, traditional layout.", free: true },
  { id: "modern", name: "Modern", description: "Sidebar layout with a brand-colored accent.", free: true },
  { id: "executive", name: "Executive", description: "Bold header, built for senior roles.", free: false },
  { id: "creative", name: "Creative", description: "For design and portfolio-led applications.", free: false },
  { id: "technical", name: "Technical", description: "Optimized for engineering-heavy resumes.", free: false },
];

export default async function ResumeBuilderPage() {
  const account = await profileRepository.getCurrent();
  if (!account) return null;

  const completion = await getProfileCompletion(account.id);
  const unlocked = completion.percentage >= 100;
  const profile = await applicantProfileRepository.get(account.id);
  const resumeFeedback = (profile?.resume_score_feedback as { feedback?: string[]; missingSkillSuggestions?: string[] } | null) ?? {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Resume Builder</h1>
        <p className="text-sm text-muted-foreground">
          Generate a polished PDF resume straight from your profile.
        </p>
      </div>

      {!unlocked && (
        <Card className="border-accent/40 bg-accent/5">
          <CardContent className="flex items-start gap-4 p-5">
            <Lock className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
            <div className="flex-1">
              <h2 className="font-display font-semibold">Reach 100% to unlock</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Your profile is {completion.percentage}% complete. Finish the remaining
                sections to generate your resume.
              </p>
              <Progress value={completion.percentage} className="mt-3" />
              <Button size="sm" className="mt-4" asChild>
                <Link href="/dashboard/applicant/profile">Finish my profile</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TEMPLATES.map((t) => (
          <Card key={t.id} className={!t.free ? "opacity-70" : ""}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-semibold">{t.name}</h3>
                {!t.free && <Badge variant="secondary">Coming soon</Badge>}
              </div>
              <p className="mt-1.5 text-sm text-muted-foreground">{t.description}</p>

              {t.free ? (
                <Button size="sm" className="mt-4 w-full" disabled={!unlocked} asChild={unlocked}>
                  {unlocked ? (
                    <a href={`/api/resume?template=${t.id}`} download>
                      <Download className="h-4 w-4" />
                      Download PDF
                    </a>
                  ) : (
                    <span>
                      <Lock className="h-4 w-4" />
                      Locked
                    </span>
                  )}
                </Button>
              ) : (
                <Button size="sm" variant="outline" className="mt-4 w-full" disabled>
                  Coming soon
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <AiResumeInsights
        unlocked={unlocked}
        aiSummary={profile?.ai_summary ?? null}
        resumeScore={profile?.resume_score ?? null}
        feedback={resumeFeedback.feedback ?? []}
        missingSkillSuggestions={resumeFeedback.missingSkillSuggestions ?? []}
      />
    </div>
  );
}
