import { createClient } from "@/lib/supabase/server";
import type {
  Quiz, QuizQuestionPublic, QuizQuestionFull, QuizAttempt, Certificate, Database,
} from "@/types/database.types";

export const quizRepository = {
  /** Platform-wide Learning Center engagement — for the analytics page. */
  async getPlatformStats() {
    const supabase = await createClient();
    const [attempts, certificates] = await Promise.all([
      (supabase.from("quiz_attempts") as any).select("passed", { count: "exact" }),
      (supabase.from("certificates") as any).select("*", { count: "exact", head: true }),
    ]);
    const totalAttempts = attempts.count ?? 0;
    const totalPassed = (attempts.data ?? []).filter((a: any) => a.passed).length;
    return { totalAttempts, totalPassed, totalCertificates: certificates.count ?? 0 };
  },

  async listPublished(): Promise<Quiz[]> {
    const supabase = await createClient();
    const { data, error } = await (supabase.from("quizzes") as any)
      .select("*")
      .eq("status", "published")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Quiz[];
  },

  async listAll(): Promise<Quiz[]> {
    const supabase = await createClient();
    const { data, error } = await (supabase.from("quizzes") as any)
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Quiz[];
  },

  async getById(id: string): Promise<Quiz | null> {
    const supabase = await createClient();
    const { data, error } = await (supabase.from("quizzes") as any).select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return data as Quiz | null;
  },

  async create(input: Database["public"]["Tables"]["quizzes"]["Insert"]): Promise<Quiz> {
    const supabase = await createClient();
    const { data, error } = await (supabase.from("quizzes") as any).insert(input).select().single();
    if (error) throw error;
    return data as Quiz;
  },

  async update(id: string, input: Database["public"]["Tables"]["quizzes"]["Update"]): Promise<void> {
    const supabase = await createClient();
    const { error } = await (supabase.from("quizzes") as any).update(input).eq("id", id);
    if (error) throw error;
  },

  async remove(id: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await (supabase.from("quizzes") as any).delete().eq("id", id);
    if (error) throw error;
  },

  /** Applicant-facing — never selects correct_option_id. */
  async getQuestionsForTaking(quizId: string): Promise<QuizQuestionPublic[]> {
    const supabase = await createClient();
    const { data, error } = await (supabase.from("quiz_questions") as any)
      .select("id, quiz_id, question_text, options, sort_order")
      .eq("quiz_id", quizId)
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return (data ?? []) as QuizQuestionPublic[];
  },

  /** Admin-facing only — includes the correct answer for editing. */
  async getQuestionsFull(quizId: string): Promise<QuizQuestionFull[]> {
    const supabase = await createClient();
    const { data, error } = await (supabase.from("quiz_questions") as any)
      .select("*")
      .eq("quiz_id", quizId)
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return (data ?? []) as QuizQuestionFull[];
  },

  async createQuestion(input: Database["public"]["Tables"]["quiz_questions"]["Insert"]): Promise<void> {
    const supabase = await createClient();
    const { error } = await (supabase.from("quiz_questions") as any).insert(input);
    if (error) throw error;
  },

  async updateQuestion(id: string, input: Database["public"]["Tables"]["quiz_questions"]["Update"]): Promise<void> {
    const supabase = await createClient();
    const { error } = await (supabase.from("quiz_questions") as any).update(input).eq("id", id);
    if (error) throw error;
  },

  async deleteQuestion(id: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await (supabase.from("quiz_questions") as any).delete().eq("id", id);
    if (error) throw error;
  },

  async submitAttempt(
    quizId: string,
    answers: { question_id: string; selected_option_id: string }[],
    timeTakenSeconds: number
  ) {
    const supabase = await createClient();
    const { data, error } = await (supabase.rpc as any)("submit_quiz_attempt", {
      p_quiz_id: quizId,
      p_answers: answers,
      p_time_taken_seconds: timeTakenSeconds,
    });
    if (error) throw error;
    return data?.[0] as { attempt_id: string; score_percent: number; correct_count: number; total_count: number; passed: boolean } | undefined;
  },

  async listAttemptsForApplicant(applicantId: string): Promise<QuizAttempt[]> {
    const supabase = await createClient();
    const { data, error } = await (supabase.from("quiz_attempts") as any)
      .select("*")
      .eq("applicant_id", applicantId)
      .order("completed_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as QuizAttempt[];
  },

  /** Top scores for a quiz — names joined client-side by the caller if needed. */
  async getLeaderboard(quizId: string, limit = 10) {
    const supabase = await createClient();
    const { data, error } = await (supabase.from("quiz_attempts") as any)
      .select("applicant_id, score_percent, time_taken_seconds, completed_at, profiles ( full_name )")
      .eq("quiz_id", quizId)
      .order("score_percent", { ascending: false })
      .order("time_taken_seconds", { ascending: true })
      .limit(limit);
    if (error) throw error;
    return data ?? [];
  },
};

export const certificateRepository = {
  async listForApplicant(applicantId: string): Promise<(Certificate & { quizzes: { title: string } | null })[]> {
    const supabase = await createClient();
    const { data, error } = await (supabase.from("certificates") as any)
      .select("*, quizzes ( title )")
      .eq("applicant_id", applicantId)
      .order("issued_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as any;
  },

  async getById(id: string): Promise<Certificate | null> {
    const supabase = await createClient();
    const { data, error } = await (supabase.from("certificates") as any).select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return data as Certificate | null;
  },
};
