import { createClient } from "@/lib/supabase/server";
import { addContactToBrevo } from "@/lib/email/brevo";
import { NextResponse, type NextRequest } from "next/server";

/**
 * OAuth (Google) callback: exchanges the auth code for a session cookie,
 * then routes the user to their dashboard. handle_new_user() trigger
 * ensures a profiles row already exists by the time this runs, defaulting
 * to role='applicant' — Google OAuth has no way to carry a
 * "requested_account_type" through the identity provider's response the
 * way email/password signup does via signUp()'s options.data, so the
 * register page instead encodes the chosen type directly into this
 * callback's URL (see signInWithGoogleAction). We apply it here, but only
 * for a genuinely brand-new account — never for someone signing back in,
 * even if a `type` param were ever present on that request too (it isn't,
 * today, but this guard is what makes that safe by construction rather
 * than by convention).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const requestedType = searchParams.get("type");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // A brand-new account's first sign-in IS its creation — created_at
      // and last_sign_in_at land within a couple seconds of each other.
      // A returning user's last_sign_in_at will be far newer than their
      // original created_at. This is what actually gates the role change.
      const createdAt = new Date(data.user.created_at).getTime();
      const lastSignInAt = data.user.last_sign_in_at ? new Date(data.user.last_sign_in_at).getTime() : createdAt;
      const isNewSignup = Math.abs(lastSignInAt - createdAt) < 15_000;

      if (isNewSignup && requestedType === "employer") {
        await (supabase.from("profiles") as any)
          .update({ role: "employer" })
          .eq("id", data.user.id)
          .eq("role", "applicant"); // never overwrite an already-established role
      }

      const { data: profile } = await (supabase.from("profiles") as any)
        .select("role, full_name, email")
        .eq("id", data.user.id)
        .single();
      const role = profile?.role ?? "applicant";

      if (isNewSignup) {
        // Awaited for the same reason as the email/password path — see
        // that call site's comment. Adds a small delay before the
        // redirect, but guarantees the sync actually completes on
        // serverless rather than racing it.
        await addContactToBrevo({
          email: profile?.email ?? data.user.email ?? "",
          fullName: profile?.full_name ?? null,
          role: role === "employer" ? "employer" : "applicant",
        });
      }

      return NextResponse.redirect(`${origin}/dashboard/${role === "super_admin" ? "admin" : role}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=oauth_failed`);
}
