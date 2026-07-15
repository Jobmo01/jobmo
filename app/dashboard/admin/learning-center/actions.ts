"use server";

import { revalidatePath } from "next/cache";
import { profileRepository } from "@/lib/repositories/profile-repository";
import { learningRepository } from "@/lib/repositories/learning-repository";
import { quizRepository } from "@/lib/repositories/quiz-repository";
import { categorySchema, contentSchema, quizSchema, quizQuestionSchema } from "@/lib/validations/learning";
import { getErrorMessage } from "@/lib/utils";

const PATH = "/dashboard/admin/learning-center";

export type LearningActionResult<T = unknown> = { error?: string; data?: T; success?: true };

async function requireAdminId(): Promise<string> {
  const profile = await profileRepository.getCurrent();
  if (!profile) throw new Error("Not authenticated");
  return profile.id;
}

// --- Categories --------------------------------------------------------------

export async function createCategoryAction(input: unknown): Promise<LearningActionResult> {
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  try {
    const createdBy = await requireAdminId();
    await learningRepository.createCategory({
      ...parsed.data,
      description: parsed.data.description ?? null,
      icon_name: parsed.data.icon_name ?? null,
      created_by: createdBy,
    });
    revalidatePath(PATH);
    return { success: true };
  } catch (e) {
    return { error: getErrorMessage(e, "Failed to create category") };
  }
}

export async function deleteCategoryAction(id: string): Promise<LearningActionResult> {
  try {
    await learningRepository.deleteCategory(id);
    revalidatePath(PATH);
    return { success: true };
  } catch (e) {
    return { error: getErrorMessage(e, "Failed to delete category") };
  }
}

// --- Content -------------------------------------------------------------

export async function createContentAction(input: unknown): Promise<LearningActionResult> {
  const parsed = contentSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  try {
    const createdBy = await requireAdminId();
    await learningRepository.createContent({
      ...parsed.data,
      category_id: parsed.data.category_id ?? null,
      description: parsed.data.description ?? null,
      thumbnail_url: parsed.data.thumbnail_url ?? null,
      duration_minutes: parsed.data.duration_minutes ?? null,
      created_by: createdBy,
    });
    revalidatePath(PATH);
    return { success: true };
  } catch (e) {
    return { error: getErrorMessage(e, "Failed to create content") };
  }
}

export async function updateContentAction(id: string, input: unknown): Promise<LearningActionResult> {
  const parsed = contentSchema.partial().safeParse(input);
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  try {
    await learningRepository.updateContent(id, parsed.data);
    revalidatePath(PATH);
    return { success: true };
  } catch (e) {
    return { error: getErrorMessage(e, "Failed to update content") };
  }
}

export async function deleteContentAction(id: string): Promise<LearningActionResult> {
  try {
    await learningRepository.deleteContent(id);
    revalidatePath(PATH);
    return { success: true };
  } catch (e) {
    return { error: getErrorMessage(e, "Failed to delete content") };
  }
}

// --- Quizzes ---------------------------------------------------------------

export async function createQuizAction(input: unknown): Promise<LearningActionResult<{ id: string }>> {
  const parsed = quizSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  try {
    const createdBy = await requireAdminId();
    const quiz = await quizRepository.create({
      ...parsed.data,
      category_id: parsed.data.category_id ?? null,
      description: parsed.data.description ?? null,
      created_by: createdBy,
    });
    revalidatePath(PATH);
    return { success: true, data: { id: quiz.id } };
  } catch (e) {
    return { error: getErrorMessage(e, "Failed to create quiz") };
  }
}

export async function updateQuizAction(id: string, input: unknown): Promise<LearningActionResult> {
  const parsed = quizSchema.partial().safeParse(input);
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  try {
    await quizRepository.update(id, parsed.data);
    revalidatePath(PATH);
    revalidatePath(`${PATH}/quizzes/${id}`);
    return { success: true };
  } catch (e) {
    return { error: getErrorMessage(e, "Failed to update quiz") };
  }
}

export async function deleteQuizAction(id: string): Promise<LearningActionResult> {
  try {
    await quizRepository.remove(id);
    revalidatePath(PATH);
    return { success: true };
  } catch (e) {
    return { error: getErrorMessage(e, "Failed to delete quiz") };
  }
}

export async function createQuestionAction(quizId: string, input: unknown): Promise<LearningActionResult> {
  const parsed = quizQuestionSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  try {
    await quizRepository.createQuestion({ ...parsed.data, quiz_id: quizId });
    revalidatePath(`${PATH}/quizzes/${quizId}`);
    return { success: true };
  } catch (e) {
    return { error: getErrorMessage(e, "Failed to add question") };
  }
}

export async function updateQuestionAction(id: string, quizId: string, input: unknown): Promise<LearningActionResult> {
  const parsed = quizQuestionSchema.partial().safeParse(input);
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  try {
    await quizRepository.updateQuestion(id, parsed.data);
    revalidatePath(`${PATH}/quizzes/${quizId}`);
    return { success: true };
  } catch (e) {
    return { error: getErrorMessage(e, "Failed to update question") };
  }
}

export async function deleteQuestionAction(id: string, quizId: string): Promise<LearningActionResult> {
  try {
    await quizRepository.deleteQuestion(id);
    revalidatePath(`${PATH}/quizzes/${quizId}`);
    return { success: true };
  } catch (e) {
    return { error: getErrorMessage(e, "Failed to delete question") };
  }
}
