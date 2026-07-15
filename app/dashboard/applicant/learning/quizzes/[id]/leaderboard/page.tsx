import { notFound } from "next/navigation";
import Link from "next/link";
import { Trophy } from "lucide-react";
import { quizRepository } from "@/lib/repositories/quiz-repository";
import { Card, CardContent } from "@/components/ui/card";

export default async function QuizLeaderboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const quiz = await quizRepository.getById(id);
  if (!quiz) notFound();

  const leaderboard = await quizRepository.getLeaderboard(id, 20);

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <Link href={`/dashboard/applicant/learning/quizzes/${id}`} className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to quiz
        </Link>
        <h1 className="mt-2 font-display text-2xl font-semibold">{quiz.title} — Leaderboard</h1>
      </div>

      {leaderboard.length === 0 ? (
        <p className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          No attempts yet — be the first!
        </p>
      ) : (
        <Card>
          <CardContent className="divide-y divide-border p-0">
            {leaderboard.map((entry: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                    i === 0 ? "bg-accent/20 text-accent" : "bg-secondary text-muted-foreground"
                  }`}>
                    {i === 0 ? <Trophy className="h-3.5 w-3.5" /> : i + 1}
                  </span>
                  <span className="font-medium">{entry.profiles?.full_name ?? "Anonymous"}</span>
                </div>
                <span className="text-sm text-muted-foreground">{entry.score_percent}%</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
