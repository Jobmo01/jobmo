import { createClient } from "@/lib/supabase/server";
import type { PlatformSetting } from "@/types/database.types";

export const platformSettingsRepository = {
  async getAll(): Promise<PlatformSetting[]> {
    const supabase = await createClient();
    const { data, error } = await (supabase.from("platform_settings") as any).select("*").order("key");
    if (error) throw error;
    return (data ?? []) as PlatformSetting[];
  },

  async get(key: string): Promise<boolean> {
    const supabase = await createClient();
    const { data, error } = await (supabase.from("platform_settings") as any)
      .select("value")
      .eq("key", key)
      .maybeSingle();
    if (error || !data) return false;
    return Boolean(data.value);
  },

  async set(key: string, value: boolean, updatedBy: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await (supabase.from("platform_settings") as any)
      .update({ value, updated_by: updatedBy })
      .eq("key", key);
    if (error) throw error;
  },
};
