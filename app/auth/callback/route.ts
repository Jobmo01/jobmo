import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

/**
 * OAuth (Google) callback: exchanges the auth code for a session cookie,
 * then routes the user to their dashboard. handle_new_user() trigger
 * ensures a profiles row already exists by the time this runs.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const { data: profile } = await (supabase.from("profiles") as any)
        .select("role")
        .eq("id", data.user.id)
        .single();
      const role = profile?.role ?? "applicant";
      return NextResponse.redirect(`${origin}/dashboard/${role === "super_admin" ? "admin" : role}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=oauth_failed`);
}
