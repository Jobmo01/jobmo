"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { profileRepository } from "@/lib/repositories/profile-repository";
import { applicantProfileRepository } from "@/lib/repositories/applicant-profile-repository";
import { personalDetailsSchema, preferencesSchema, dobChangeRequestSchema } from "@/lib/validations/applicant-profile";
import { getErrorMessage } from "@/lib/utils";

const PROFILE_PATH = "/dashboard/applicant/profile";

export type ProfileActionResult = { error?: string; success?: true };

async function requireApplicantId(): Promise<string> {
  const profile = await profileRepository.getCurrent();
  if (!profile) throw new Error("Not authenticated");
  return profile.id;
}

export async function updatePersonalDetailsAction(input: unknown): Promise<ProfileActionResult> {
  const parsed = personalDetailsSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "Invalid input" };

  try {
    const applicantId = await requireApplicantId();
    await applicantProfileRepository.updatePersonalDetails(applicantId, parsed.data);
    revalidatePath(PROFILE_PATH);
    return { success: true };
  } catch (e) {
    return { error: getErrorMessage(e, "Failed to save personal details") };
  }
}

/**
 * Sets date_of_birth directly, but ONLY the first time — there's nothing
 * to "change" yet, so no approval should be needed. Once set, any further
 * change must go through requestDobChangeAction() + admin approval; the
 * database trigger protect_date_of_birth() enforces this even if this
 * action were somehow called again (it would just get rejected by the DB).
 */
export async function setInitialDobAction(dob: string): Promise<ProfileActionResult> {
  if (!dob) return { error: "Select a date of birth" };

  try {
    const applicantId = await requireApplicantId();
    const current = await applicantProfileRepository.get(applicantId);
    if (current?.date_of_birth) {
      return { error: "Date of birth is already set — use \"Request a change\" instead." };
    }

    const supabase = await createClient();
    const { error } = await (supabase.from("applicant_profiles") as any)
      .update({ date_of_birth: dob })
      .eq("id", applicantId);
    if (error) throw error;

    revalidatePath(PROFILE_PATH);
    return { success: true };
  } catch (e) {
    return { error: getErrorMessage(e, "Failed to save date of birth") };
  }
}

export async function updatePreferencesAction(input: unknown): Promise<ProfileActionResult> {
  const parsed = preferencesSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "Invalid input" };

  try {
    const applicantId = await requireApplicantId();
    await applicantProfileRepository.updatePersonalDetails(applicantId, parsed.data);
    revalidatePath(PROFILE_PATH);
    return { success: true };
  } catch (e) {
    return { error: getErrorMessage(e, "Failed to save preferences") };
  }
}

/**
 * Uploads any of the three supporting ID documents to the private
 * `documents` bucket under `${userId}/dob-changes/...`, then files the
 * change request. Nothing here updates date_of_birth directly — only the
 * guarded `review_dob_change_request()` RPC (called from the Phase 6 Admin
 * UI) can do that, and only after human review.
 */
export async function requestDobChangeAction(
  _prevState: ProfileActionResult | null,
  formData: FormData
): Promise<ProfileActionResult> {
  const parsed = dobChangeRequestSchema.safeParse({
    requested_dob: formData.get("requested_dob"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "Invalid input" };

  try {
    const applicantId = await requireApplicantId();
    const supabase = await createClient();
    const currentProfile = await applicantProfileRepository.get(applicantId);

    async function uploadIfPresent(field: string): Promise<string | undefined> {
      const file = formData.get(field);
      if (!(file instanceof File) || file.size === 0) return undefined;
      const path = `${applicantId}/dob-changes/${Date.now()}-${field}-${file.name}`;
      const { error } = await supabase.storage.from("documents").upload(path, file, { upsert: false });
      if (error) throw new Error(`Failed to upload ${field}: ${error.message}`);
      return path;
    }

    const [nicPath, passportPath, licensePath] = await Promise.all([
      uploadIfPresent("nic_document"),
      uploadIfPresent("passport_document"),
      uploadIfPresent("driving_license_document"),
    ]);

    if (!nicPath && !passportPath && !licensePath) {
      return { error: "Upload at least one supporting document (NIC, passport, or driving license)" };
    }

    await applicantProfileRepository.requestDobChange({
      applicantId,
      currentDob: currentProfile?.date_of_birth ?? null,
      requestedDob: parsed.data.requested_dob,
      reason: parsed.data.reason,
      nicDocumentUrl: nicPath,
      passportDocumentUrl: passportPath,
      drivingLicenseDocumentUrl: licensePath,
    });

    revalidatePath(PROFILE_PATH);
    return { success: true };
  } catch (e) {
    return { error: getErrorMessage(e, "Failed to submit request") };
  }
}

const NA_FIELDS = [
  "education_not_applicable",
  "experience_not_applicable",
  "skills_not_applicable",
  "certifications_not_applicable",
  "projects_not_applicable",
  "awards_not_applicable",
  "volunteer_not_applicable",
  "hobbies_not_applicable",
  "references_not_applicable",
] as const;
type NaField = (typeof NA_FIELDS)[number];

/**
 * Toggles one of the nine section-level "N/A" flags — education,
 * experience, skills, and each of the six individual sub-sections under
 * "Certifications & More" (certifications, projects, awards, volunteer,
 * hobbies, references) — lets a profile reach 100% completion without
 * fabricating entries for a section that genuinely doesn't apply. Each
 * sub-section is independent: someone might have projects to list but
 * genuinely no certifications, so there's no single blanket toggle for
 * the whole tab.
 */
export async function updateSectionNotApplicableAction(field: NaField, value: boolean): Promise<ProfileActionResult> {
  if (!NA_FIELDS.includes(field)) return { error: "Invalid field" };
  try {
    const applicantId = await requireApplicantId();
    const supabase = await createClient();
    const { error } = await (supabase.from("applicant_profiles") as any)
      .update({ [field]: value })
      .eq("id", applicantId);
    if (error) throw error;
    revalidatePath(PROFILE_PATH);
    return { success: true };
  } catch (e) {
    return { error: getErrorMessage(e, "Failed to update") };
  }
}
