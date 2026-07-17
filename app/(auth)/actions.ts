"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { loginSchema, registerSchema, forgotPasswordSchema } from "@/lib/validations/auth";
import { addContactToBrevo } from "@/lib/email/brevo";
import { referralRepository } from "@/lib/repositories/referral-repository";
import { redirect } from "next/navigation";

export type ActionState = { error?: string; success?: boolean } | null;

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();

  const { data: limited } = await (supabase.rpc as any)("is_login_rate_limited", { p_email: parsed.data.email });
  if (limited) {
    return { error: "Too many failed attempts. Please wait 15 minutes and try again." };
  }

  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    const headersList = await headers();
    const ip = headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
    await (supabase.rpc as any)("record_failed_login", { p_email: parsed.data.email, p_ip_address: ip });
    return { error: error.message === "Invalid login credentials"
      ? "Incorrect email or password."
      : error.message };
  }

  await (supabase.rpc as any)("clear_login_attempts", { p_email: parsed.data.email });

  const { data: profile } = await (supabase.from("profiles") as any)
    .select("role, pending_referral_code")
    .eq("id", data.user.id)
    .single();

  // Covers the gap for anyone who registered with a referral code but
  // needed to confirm their email first — no real session existed at
  // signup time, so the referral couldn't be credited until now, their
  // first successful login. Cheap to check every login (this query
  // already ran for the role lookup regardless) — once credited, this
  // column is cleared, so it's a no-op on every subsequent login.
  if (profile?.pending_referral_code) {
    const referrerId = await referralRepository.findReferrerIdByCode(profile.pending_referral_code);
    if (referrerId) {
      await referralRepository.recordReferral(referrerId, data.user.id);
    }
    await (supabase.from("profiles") as any).update({ pending_referral_code: null }).eq("id", data.user.id);
  }

  const role = profile?.role ?? "applicant";
  redirect(`/dashboard/${role === "super_admin" ? "admin" : role}`);
}

export async function registerAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = registerSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    accountType: formData.get("accountType"),
    agreeToTerms: formData.get("agreeToTerms") === "on",
  });
  const referralCode = (formData.get("referralCode") as string | null)?.trim() || undefined;

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.fullName,
        // The handle_new_user() trigger (Phase 3) assigns role='employer'
        // directly when this is 'employer' — verification (companies.
        // verification_status) is the trust gate, not the role itself.
        requested_account_type: parsed.data.accountType,
        // Captured into profiles.pending_referral_code by the same
        // trigger — credited below immediately if a session already
        // exists, otherwise at first login (see loginAction).
        referred_by_code: referralCode,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  // Awaited deliberately, even though it never throws — on Vercel's
  // serverless platform, a fire-and-forget network call can be killed
  // mid-flight the moment this function returns, before it actually
  // reaches Brevo. Awaiting it (its own internal try/catch already
  // guarantees this never fails the registration itself) makes sure the
  // sync genuinely completes rather than racing the response.
  await addContactToBrevo({
    email: parsed.data.email,
    fullName: parsed.data.fullName,
    role: parsed.data.accountType,
  });

  // If email confirmation isn't required, a real session exists right
  // now — credit the referral immediately rather than waiting for a
  // first login that (in this configuration) will never meaningfully
  // differ from this moment.
  if (data.session && data.user && referralCode) {
    const referrerId = await referralRepository.findReferrerIdByCode(referralCode);
    if (referrerId) {
      await referralRepository.recordReferral(referrerId, data.user.id);
      await (supabase.from("profiles") as any).update({ pending_referral_code: null }).eq("id", data.user.id);
    }
  }

  if (data.user && !data.session) {
    return { success: true }; // email confirmation required
  }

  redirect(parsed.data.accountType === "employer" ? "/dashboard/employer" : "/dashboard/applicant");
}

export async function forgotPasswordAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function signInWithGoogleAction(accountType?: "applicant" | "employer", referralCode?: string) {
  const supabase = await createClient();
  // Google OAuth has no equivalent of signUp()'s `options.data` — the
  // metadata Supabase records for an OAuth user comes entirely from
  // Google's own response, so there's no way to smuggle our own
  // "requested_account_type" into it the way email/password signup does.
  // Instead, the chosen type is encoded directly in the redirect URL,
  // which Supabase preserves through the whole OAuth round trip — the
  // callback route reads it back out and applies it, but only for
  // brand-new signups (see the callback route for why that matters).
  // The referral code rides along the same way.
  const redirectTo = new URL(`${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`);
  if (accountType) redirectTo.searchParams.set("type", accountType);
  if (referralCode) redirectTo.searchParams.set("ref", referralCode);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: redirectTo.toString(),
    },
  });

  if (error || !data.url) {
    redirect("/login?error=oauth_failed");
  }

  redirect(data.url);
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
