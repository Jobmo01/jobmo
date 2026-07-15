import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

/**
 * Repository pattern: every data-access path for `profiles` goes through
 * here rather than scattering `.from("profiles")` calls across pages/actions.
 * Swapping Supabase for another store later only touches this file.
 *
 * getCurrent() and getById() are wrapped in React's cache() — this is
 * per-request memoization (torn down after each request, never shared
 * across users or requests), not a data-staleness risk. Before this,
 * a single page load like /dashboard/applicant called getCurrent() twice
 * (once in the layout, once in the page) — each doing its own network
 * round trip to Supabase's Auth server (auth.getUser()) PLUS a database
 * query, completely redundantly. cache() collapses repeated calls with
 * identical arguments within one render pass into a single actual fetch.
 */
export const profileRepository = {
  getCurrent: cache(async (): Promise<Profile | null> => {
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
  }),

  getById: cache(async (id: string): Promise<Profile | null> => {
    const supabase = await createClient();
    const { data, error } = await supabase.from("profiles").select("*").eq("id", id).single();
    if (error) return null;
    return data;
  }),
};
