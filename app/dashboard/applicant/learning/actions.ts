"use server";

import { revalidatePath } from "next/cache";
import { learningRepository } from "@/lib/repositories/learning-repository";
import { quizRepository } from "@/lib/repositories/quiz-repository";
import { getErrorMessage } from "@/lib/utils";

export type LearningActionResult = { error?: string; success?: true };

export async function markContentCompleteAction(contentId: string): Promise<LearningActionResult> {
  try {
    await learningRepository.markComplete(contentId);
    revalidatePath("/dashboard/applicant/learning");
    return { success: true };
  } catch (e) {
    return { error: getErrorMessage(e, "Failed to mark as complete") };
  }
}

export type QuizSubmitResult = {
  error?: string;
  result?: { scorePercent: number; correctCount: number; totalCount: number; passed: boolean };
};

export async function submitQuizAction(
  quizId: string,
  answers: { question_id: string; selected_option_id: string }[],
  timeTakenSeconds: number
): Promise<QuizSubmitResult> {
  try {
    const result = await quizRepository.submitAttempt(quizId, answers, timeTakenSeconds);
    if (!result) return { error: "Failed to grade quiz" };
    revalidatePath("/dashboard/applicant/learning/quizzes");
    revalidatePath("/dashboard/applicant/learning/certificates");
    return {
      result: {
        scorePercent: result.score_percent,
        correctCount: result.correct_count,
        totalCount: result.total_count,
        passed: result.passed,
      },
    };
  } catch (e) {
    return { error: getErrorMessage(e, "Failed to submit quiz") };
  }
}
