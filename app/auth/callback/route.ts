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
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}/dashboard/applicant`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=oauth_failed`);
}
