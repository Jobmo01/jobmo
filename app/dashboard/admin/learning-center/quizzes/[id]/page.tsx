import { notFound } from "next/navigation";
import Link from "next/link";
import { quizRepository } from "@/lib/repositories/quiz-repository";
import { QuestionsManager } from "@/components/admin/questions-manager";

export default async function QuizQuestionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const quiz = await quizRepository.getById(id);
  if (!quiz) notFound();

  const questions = await quizRepository.getQuestionsFull(id);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link href="/dashboard/admin/learning-center" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to Learning Center
        </Link>
        <h1 className="mt-2 font-display text-2xl font-semibold">{quiz.title}</h1>
        <p className="text-sm text-muted-foreground">
          {questions.length} question{questions.length === 1 ? "" : "s"} • {quiz.passing_score_percent}% to pass
        </p>
      </div>

      <QuestionsManager quizId={quiz.id} questions={questions} />
    </div>
  );
}
