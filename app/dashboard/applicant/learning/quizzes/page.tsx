import Link from "next/link";
import { GraduationCap, Clock, CheckCircle2 } from "lucide-react";
import { profileRepository } from "@/lib/repositories/profile-repository";
import { quizRepository } from "@/lib/repositories/quiz-repository";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function QuizzesListPage() {
  const account = await profileRepository.getCurrent();
  if (!account) return null;

  const [quizzes, attempts] = await Promise.all([
    quizRepository.listPublished(),
    quizRepository.listAttemptsForApplicant(account.id),
  ]);

  const bestScoreByQuiz = new Map<string, number>();
  const passedQuizIds = new Set<string>();
  for (const a of attempts) {
    const best = bestScoreByQuiz.get(a.quiz_id) ?? 0;
    if (a.score_percent > best) bestScoreByQuiz.set(a.quiz_id, a.score_percent);
    if (a.passed) passedQuizIds.add(a.quiz_id);
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/applicant/learning" className="text-sm text-muted-foreground hover:text-foreground">
          ← Learning Center
        </Link>
        <h1 className="mt-2 font-display text-2xl font-semibold">Practice Quizzes</h1>
        <p className="text-sm text-muted-foreground">Test yourself and earn a certificate on passing.</p>
      </div>

      {quizzes.length === 0 ? (
        <p className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          No quizzes published yet.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {quizzes.map((quiz) => (
            <Link key={quiz.id} href={`/dashboard/applicant/learning/quizzes/${quiz.id}`}>
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <GraduationCap className="h-5 w-5 text-primary" />
                    {passedQuizIds.has(quiz.id) && (
                      <Badge variant="success" className="gap-1"><CheckCircle2 className="h-3 w-3" /> Passed</Badge>
                    )}
                  </div>
                  <p className="mt-3 font-medium">{quiz.title}</p>
                  {quiz.description && <p className="mt-1 text-sm text-muted-foreground">{quiz.description}</p>}
                  <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {quiz.time_limit_minutes} min</span>
                    <span>{quiz.passing_score_percent}% to pass</span>
                    {bestScoreByQuiz.has(quiz.id) && <span>Best: {bestScoreByQuiz.get(quiz.id)}%</span>}
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
