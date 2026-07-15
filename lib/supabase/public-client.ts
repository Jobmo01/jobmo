import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

/**
 * A cookie-free Supabase client for fully public, unauthenticated read
 * paths only (public job/company listings, both governed by RLS policies
 * that don't check auth.uid() at all — see job_postings_select_published
 * and companies_select_public).
 *
 * Why this exists: lib/supabase/server.ts's createClient() calls cookies()
 * unconditionally, which opts a route into dynamic rendering in Next.js
 * regardless of a `revalidate` export — so `export const revalidate = 60`
 * on a page using the cookie-aware client silently does nothing.
 *
 * NOT CURRENTLY WIRED IN. I tried switching the public /jobs and /companies
 * listings to use this (to get genuine static generation), and it
 * surfaced a real tradeoff: making those pages static means Next.js
 * fetches their data at BUILD time, not request time — which means every
 * `next build` (including on Netlify) would need working Supabase
 * credentials and network access at build time, or the entire deployment
 * fails. That's a worse failure mode than "always dynamic, fetches on
 * request" (which only risks a single page load, not the whole build). I
 * reverted that change rather than ship something I couldn't verify end
 * to end with real credentials. Left this file in place since the
 * approach is sound for a future push — just needs a build pipeline
 * that guarantees Supabase reachability at build time first.
 *
 * Never use this for anything that should respect the current user's
 * session or RLS-gated-by-identity data — it has none.
 */
export function createPublicClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
