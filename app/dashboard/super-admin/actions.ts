"use server";

import { revalidatePath } from "next/cache";
import { adminRepository } from "@/lib/repositories/admin-repository";
import { announcementRepository } from "@/lib/repositories/announcement-repository";
import { platformSettingsRepository } from "@/lib/repositories/platform-settings-repository";
import { profileRepository } from "@/lib/repositories/profile-repository";
import { getErrorMessage } from "@/lib/utils";
import type { UserRole } from "@/types/database.types";

export type SuperAdminActionResult = { error?: string; success?: true };

export async function promoteUserAction(email: string, role: UserRole): Promise<SuperAdminActionResult> {
  try {
    const users = await adminRepository.listUsers({ search: email });
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return { error: "No user found with that email" };

    await adminRepository.updateRole(user.id, role);
    revalidatePath("/dashboard/super-admin/admins");
    return { success: true };
  } catch (e) {
    return { error: getErrorMessage(e, "Failed to update role") };
  }
}

export async function updatePermissionsAction(
  userId: string,
  permissions: Record<string, boolean>
): Promise<SuperAdminActionResult> {
  try {
    await adminRepository.updatePermissions(userId, permissions);
    revalidatePath("/dashboard/super-admin/admins");
    return { success: true };
  } catch (e) {
    return { error: getErrorMessage(e, "Failed to update permissions") };
  }
}

// --- Announcements -----------------------------------------------------------

export async function createAnnouncementAction(input: { title: string; body: string; targetRoles: UserRole[] }): Promise<SuperAdminActionResult> {
  if (!input.title.trim()) return { error: "Title is required" };
  try {
    const account = await profileRepository.getCurrent();
    if (!account) throw new Error("Not authenticated");
    await announcementRepository.create({
      title: input.title, body: input.body, is_active: true, created_by: account.id, target_roles: input.targetRoles,
    });
    revalidatePath("/dashboard/super-admin/cms");
    return { success: true };
  } catch (e) {
    return { error: getErrorMessage(e, "Failed to create announcement") };
  }
}

export async function toggleAnnouncementAction(id: string, isActive: boolean): Promise<SuperAdminActionResult> {
  try {
    await announcementRepository.update(id, { is_active: isActive });
    revalidatePath("/dashboard/super-admin/cms");
    return { success: true };
  } catch (e) {
    return { error: getErrorMessage(e, "Failed to update announcement") };
  }
}

export async function deleteAnnouncementAction(id: string): Promise<SuperAdminActionResult> {
  try {
    await announcementRepository.remove(id);
    revalidatePath("/dashboard/super-admin/cms");
    return { success: true };
  } catch (e) {
    return { error: getErrorMessage(e, "Failed to delete announcement") };
  }
}

// --- Platform settings -------------------------------------------------------

export async function updatePlatformSettingAction(key: string, value: boolean): Promise<SuperAdminActionResult> {
  try {
    const account = await profileRepository.getCurrent();
    if (!account) throw new Error("Not authenticated");
    await platformSettingsRepository.set(key, value, account.id);
    revalidatePath("/dashboard/super-admin/settings");
    return { success: true };
  } catch (e) {
    return { error: getErrorMessage(e, "Failed to update setting") };
  }
}
