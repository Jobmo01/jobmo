import { revalidatePath } from "next/cache";

/**
 * Revalidates every page whose UI depends on profile-completion status —
 * the Profile page itself, and the applicant dashboard Overview page
 * (which shows a "complete your profile" banner based on the same
 * completion percentage). Previously, actions that change completion
 * (adding an experience entry, checking an N/A box, etc.) only
 * revalidated the Profile page, so the Overview page's banner could keep
 * showing "incomplete" for a while after the profile actually reached
 * 100% — not a logic bug, a caching gap. Call this instead of
 * revalidating the profile path alone anywhere completion could change.
 */
export function revalidateApplicantProfilePaths(): void {
  revalidatePath("/dashboard/applicant/profile");
  revalidatePath("/dashboard/applicant");
}
