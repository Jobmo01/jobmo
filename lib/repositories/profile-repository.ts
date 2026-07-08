import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

/**
 * Repository pattern: every data-access path for `profiles` goes through
 * here rather than scattering `.from("profiles")` calls across pages/actions.
 * Swapping Supabase for another store later only touches this file.
 */
export const profileRepository = {
  async getCurrent(): Promise<Profile | null> {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) return null;
    return data;
  },

  async getById(id: string): Promise<Profile | null> {
    const supabase = await createClient();
    const { data, error } = await supabase.from("profiles").select("*").eq("id", id).single();
    if (error) return null;
    return data;
  },
};
