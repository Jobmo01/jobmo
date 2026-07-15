import { createClient } from "@/lib/supabase/server";
import type { LearningCategory, LearningContentItem, Database } from "@/types/database.types";

export const learningRepository = {
  async listCategories(): Promise<LearningCategory[]> {
    const supabase = await createClient();
    const { data, error } = await (supabase.from("learning_categories") as any)
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return (data ?? []) as LearningCategory[];
  },

  async getCategoryBySlug(slug: string): Promise<LearningCategory | null> {
    const supabase = await createClient();
    const { data, error } = await (supabase.from("learning_categories") as any)
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    if (error) throw error;
    return data as LearningCategory | null;
  },

  async createCategory(input: Database["public"]["Tables"]["learning_categories"]["Insert"]): Promise<LearningCategory> {
    const supabase = await createClient();
    const { data, error } = await (supabase.from("learning_categories") as any).insert(input).select().single();
    if (error) throw error;
    return data as LearningCategory;
  },

  async updateCategory(id: string, input: Database["public"]["Tables"]["learning_categories"]["Update"]): Promise<void> {
    const supabase = await createClient();
    const { error } = await (supabase.from("learning_categories") as any).update(input).eq("id", id);
    if (error) throw error;
  },

  async deleteCategory(id: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await (supabase.from("learning_categories") as any).delete().eq("id", id);
    if (error) throw error;
  },

  async listPublishedContent(categoryId?: string): Promise<LearningContentItem[]> {
    const supabase = await createClient();
    let query = (supabase.from("learning_content") as any).select("*").eq("status", "published");
    if (categoryId) query = query.eq("category_id", categoryId);
    const { data, error } = await query.order("sort_order", { ascending: true });
    if (error) throw error;
    return (data ?? []) as LearningContentItem[];
  },

  async listAllContent(): Promise<LearningContentItem[]> {
    const supabase = await createClient();
    const { data, error } = await (supabase.from("learning_content") as any)
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return (data ?? []) as LearningContentItem[];
  },

  async getContentById(id: string): Promise<LearningContentItem | null> {
    const supabase = await createClient();
    const { data, error } = await (supabase.from("learning_content") as any)
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data as LearningContentItem | null;
  },

  async createContent(input: Database["public"]["Tables"]["learning_content"]["Insert"]): Promise<LearningContentItem> {
    const supabase = await createClient();
    const { data, error } = await (supabase.from("learning_content") as any).insert(input).select().single();
    if (error) throw error;
    return data as LearningContentItem;
  },

  async updateContent(id: string, input: Database["public"]["Tables"]["learning_content"]["Update"]): Promise<void> {
    const supabase = await createClient();
    const { error } = await (supabase.from("learning_content") as any).update(input).eq("id", id);
    if (error) throw error;
  },

  async deleteContent(id: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await (supabase.from("learning_content") as any).delete().eq("id", id);
    if (error) throw error;
  },

  async listCompletedContentIds(applicantId: string): Promise<Set<string>> {
    const supabase = await createClient();
    const { data, error } = await (supabase.from("learning_progress") as any)
      .select("content_id")
      .eq("applicant_id", applicantId);
    if (error) throw error;
    return new Set((data ?? []).map((r: any) => r.content_id));
  },

  async markComplete(contentId: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await (supabase.rpc as any)("mark_content_complete", { p_content_id: contentId });
    if (error) throw error;
  },
};
