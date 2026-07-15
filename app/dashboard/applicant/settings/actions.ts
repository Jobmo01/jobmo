"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { profileRepository } from "@/lib/repositories/profile-repository";
import { applicantProfileRepository } from "@/lib/repositories/applicant-profile-repository";
import { changePasswordSchema, deleteAccountSchema } from "@/lib/validations/applicant-profile";
import { getErrorMessage } from "@/lib/utils";

export type SettingsActionResult = { error?: string; success?: true };

export async function changePasswordAction(input: unknown): Promise<SettingsActionResult> {
  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "Invalid input" };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.newPassword });
  if (error) return { error: error.message };
  return { success: true };
}

export async function updateNotificationPreferencesAction(prefs: {
  email: boolean;
  in_app: boolean;
}): Promise<SettingsActionResult> {
  try {
    const profile = await profileRepository.getCurrent();
    if (!profile) throw new Error("Not authenticated");
    await applicantProfileRepository.updatePersonalDetails(profile.id, {
      notification_preferences: prefs,
    });
    return { success: true };
  } catch (e) {
    return { error: getErrorMessage(e, "Failed to save preferences") };
  }
}

/**
 * Soft delete only — sets status='deleted' and deleted_at, keeps the row
 * (and its audit trail) intact rather than hard-deleting. Verifies the
 * person's password first so this can't be triggered by a hijacked session
 * alone, and logs the action before signing out.
 */
export async function deleteAccountAction(input: unknown): Promise<SettingsActionResult> {
  const parsed = deleteAccountSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "Invalid input" };

  const supabase = await createClient();
  const profile = await profileRepository.getCurrent();
  if (!profile) return { error: "Not authenticated" };

  const { error: authError } = await supabase.auth.signInWithPassword({
    email: profile.email,
    password: parsed.data.password,
  });
  if (authError) return { error: "Incorrect password." };

  const { error } = await (supabase.from("profiles") as any)
    .update({ status: "deleted", deleted_at: new Date().toISOString() })
    .eq("id", profile.id);
  if (error) return { error: error.message };

  await (supabase.rpc as any)("log_audit_event", {
    p_action: "profile.account_deleted",
    p_entity_type: "profile",
    p_entity_id: profile.id,
    p_metadata: {},
  });

  await supabase.auth.signOut();
  redirect("/");
}
