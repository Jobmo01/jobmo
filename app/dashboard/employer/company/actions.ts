"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { profileRepository } from "@/lib/repositories/profile-repository";
import { companyRepository } from "@/lib/repositories/company-repository";
import { companyProfileSchema } from "@/lib/validations/employer";
import { getErrorMessage } from "@/lib/utils";

const COMPANY_PATH = "/dashboard/employer/company";

export type CompanyActionResult = { error?: string; success?: true };

async function requireEmployerId(): Promise<string> {
  const profile = await profileRepository.getCurrent();
  if (!profile) throw new Error("Not authenticated");
  return profile.id;
}

export async function updateCompanyProfileAction(input: unknown): Promise<CompanyActionResult> {
  const parsed = companyProfileSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "Invalid input" };

  try {
    const ownerId = await requireEmployerId();
    const company = await companyRepository.ensureExists(ownerId, parsed.data.name);
    await companyRepository.update(company.id, parsed.data);
    revalidatePath(COMPANY_PATH);
    return { success: true };
  } catch (e) {
    return { error: getErrorMessage(e, "Failed to save company profile") };
  }
}

async function uploadCompanyAsset(
  ownerId: string,
  file: File,
  kind: "logo" | "cover" | "gallery"
): Promise<string> {
  const supabase = await createClient();
  const path = `${ownerId}/${kind}-${Date.now()}-${file.name}`;
  const { error } = await supabase.storage.from("company-assets").upload(path, file, { upsert: false });
  if (error) throw new Error(`Failed to upload ${kind}: ${error.message}`);
  const { data } = supabase.storage.from("company-assets").getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadCompanyLogoAction(formData: FormData): Promise<CompanyActionResult> {
  const file = formData.get("logo");
  if (!(file instanceof File) || file.size === 0) return { error: "No file provided" };

  try {
    const ownerId = await requireEmployerId();
    const company = await companyRepository.getByOwner(ownerId);
    if (!company) return { error: "Save your company name first" };
    const url = await uploadCompanyAsset(ownerId, file, "logo");
    await companyRepository.update(company.id, { logo_url: url });
    revalidatePath(COMPANY_PATH);
    return { success: true };
  } catch (e) {
    return { error: getErrorMessage(e, "Failed to upload logo") };
  }
}

export async function uploadCompanyCoverAction(formData: FormData): Promise<CompanyActionResult> {
  const file = formData.get("cover");
  if (!(file instanceof File) || file.size === 0) return { error: "No file provided" };

  try {
    const ownerId = await requireEmployerId();
    const company = await companyRepository.getByOwner(ownerId);
    if (!company) return { error: "Save your company name first" };
    const url = await uploadCompanyAsset(ownerId, file, "cover");
    await companyRepository.update(company.id, { cover_image_url: url });
    revalidatePath(COMPANY_PATH);
    return { success: true };
  } catch (e) {
    return { error: getErrorMessage(e, "Failed to upload cover image") };
  }
}

export async function addCompanyGalleryImageAction(formData: FormData): Promise<CompanyActionResult> {
  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) return { error: "No file provided" };

  try {
    const ownerId = await requireEmployerId();
    const company = await companyRepository.getByOwner(ownerId);
    if (!company) return { error: "Save your company name first" };
    const url = await uploadCompanyAsset(ownerId, file, "gallery");
    await companyRepository.update(company.id, { gallery_urls: [...company.gallery_urls, url] });
    revalidatePath(COMPANY_PATH);
    return { success: true };
  } catch (e) {
    return { error: getErrorMessage(e, "Failed to upload image") };
  }
}

export async function removeCompanyGalleryImageAction(url: string): Promise<CompanyActionResult> {
  try {
    const ownerId = await requireEmployerId();
    const company = await companyRepository.getByOwner(ownerId);
    if (!company) return { error: "Company not found" };
    await companyRepository.update(company.id, {
      gallery_urls: company.gallery_urls.filter((u) => u !== url),
    });
    revalidatePath(COMPANY_PATH);
    return { success: true };
  } catch (e) {
    return { error: getErrorMessage(e, "Failed to remove image") };
  }
}
