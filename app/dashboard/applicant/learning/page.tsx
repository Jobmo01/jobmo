import Link from "next/link";
import * as Icons from "lucide-react";
import { BookOpen, GraduationCap, Award, ChevronRight } from "lucide-react";
import { profileRepository } from "@/lib/repositories/profile-repository";
import { learningRepository } from "@/lib/repositories/learning-repository";
import { quizRepository, certificateRepository } from "@/lib/repositories/quiz-repository";
import { Card, CardContent } from "@/components/ui/card";

export default async function LearningCenterPage() {
  const account = await profileRepository.getCurrent();
  if (!account) return null;

  const [categories, allContent, completedIds, attempts, certificates] = await Promise.all([
    learningRepository.listCategories(),
    learningRepository.listPublishedContent(),
    learningRepository.listCompletedContentIds(account.id),
    quizRepository.listAttemptsForApplicant(account.id),
    certificateRepository.listForApplicant(account.id),
  ]);

  const passedQuizCount = new Set(attempts.filter((a) => a.passed).map((a) => a.quiz_id)).size;

  // Simple derived badges — no separate badge-admin system, just thresholds.
  const badges = [
    { label: "First lesson", earned: completedIds.size >= 1 },
    { label: "5 lessons completed", earned: completedIds.size >= 5 },
    { label: "First quiz passed", earned: passedQuizCount >= 1 },
    { label: "3 quizzes passed", earned: passedQuizCount >= 3 },
  ].filter((b) => b.earned);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Learning Center</h1>
        <p className="text-sm text-muted-foreground">
          Courses, quizzes, and resources to help your job search.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="font-display text-3xl font-semibold">{completedIds.size}</p>
            <p className="mt-1 text-sm text-muted-foreground">Lessons completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="font-display text-3xl font-semibold">{passedQuizCount}</p>
            <p className="mt-1 text-sm text-muted-foreground">Quizzes passed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="font-display text-3xl font-semibold">{certificates.length}</p>
            <p className="mt-1 text-sm text-muted-foreground">Certificates earned</p>
          </CardContent>
        </Card>
      </div>

      {badges.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {badges.map((b) => (
            <span key={b.label} className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1 text-xs font-medium text-accent">
              <Award className="h-3.5 w-3.5" /> {b.label}
            </span>
          ))}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <Link href="/dashboard/applicant/learning/quizzes">
          <Card className="transition-shadow hover:shadow-md">
            <CardContent className="flex items-center justify-between p-5">
              <div className="flex items-center gap-3">
                <GraduationCap className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Practice quizzes</p>
                  <p className="text-xs text-muted-foreground">Test yourself, earn certificates</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/applicant/learning/certificates">
          <Card className="transition-shadow hover:shadow-md">
            <CardContent className="flex items-center justify-between p-5">
              <div className="flex items-center gap-3">
                <Award className="h-5 w-5 text-accent" />
                <div>
                  <p className="font-medium">My certificates</p>
                  <p className="text-xs text-muted-foreground">Download what you&apos;ve earned</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
      </div>

      <div>
        <h2 className="font-display text-lg font-semibold">Browse by category</h2>
        {categories.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No categories yet — check back soon.</p>
        ) : (
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((cat) => {
              const IconComp = (Icons as any)[cat.icon_name ?? "BookOpen"] ?? BookOpen;
              const count = allContent.filter((c) => c.category_id === cat.id).length;
              return (
                <Link key={cat.id} href={`/dashboard/applicant/learning/${cat.slug}`}>
                  <Card className="transition-shadow hover:shadow-md">
                    <CardContent className="p-5">
                      <IconComp className="h-6 w-6 text-primary" />
                      <p className="mt-3 font-medium">{cat.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{count} item{count === 1 ? "" : "s"}</p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
