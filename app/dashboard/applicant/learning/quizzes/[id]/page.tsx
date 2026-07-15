import { notFound } from "next/navigation";
import { quizRepository } from "@/lib/repositories/quiz-repository";
import { QuizRunner } from "@/components/applicant/quiz-runner";

export default async function QuizPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const quiz = await quizRepository.getById(id);
  if (!quiz || quiz.status !== "published") notFound();

  // Public shape only — never includes correct_option_id.
  const questions = await quizRepository.getQuestionsForTaking(id);
  if (questions.length === 0) notFound();

  return (
    <div className="max-w-2xl">
      <QuizRunner
        quizId={quiz.id}
        title={quiz.title}
        timeLimitMinutes={quiz.time_limit_minutes}
        passingScorePercent={quiz.passing_score_percent}
        questions={questions}
      />
    </div>
  );
}
