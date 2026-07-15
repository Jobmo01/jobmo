"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { loginSchema, registerSchema, forgotPasswordSchema } from "@/lib/validations/auth";
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
    .select("role")
    .eq("id", data.user.id)
    .single();

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
      },
    },
  });

  if (error) {
    return { error: error.message };
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

export async function signInWithGoogleAction() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
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
