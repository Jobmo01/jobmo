import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Formats a UUID-bearing role string into a readable label, e.g. "super_admin" -> "Super Admin" */
export function formatRoleLabel(role: string) {
  return role
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * Buckets a list of ISO timestamps into weekly counts over the trailing N
 * weeks — used to build "signups over time" / "applications over time"
 * style chart data from raw created_at columns without needing a
 * dedicated analytics table.
 */
export function bucketByWeek(timestamps: string[], weeks = 8): { label: string; count: number }[] {
  const now = new Date();
  const buckets: { label: string; count: number; start: Date }[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const start = new Date(now);
    start.setDate(start.getDate() - i * 7);
    start.setHours(0, 0, 0, 0);
    buckets.push({ label: `${start.getMonth() + 1}/${start.getDate()}`, count: 0, start });
  }
  for (const ts of timestamps) {
    const d = new Date(ts);
    for (let i = buckets.length - 1; i >= 0; i--) {
      const bucketEntry = buckets[i];
      if (bucketEntry && d >= bucketEntry.start) {
        bucketEntry.count++;
        break;
      }
    }
  }
  return buckets.map(({ label, count }) => ({ label, count }));
}

/**
 * Extracts a human-readable message from any thrown value. Supabase's
 * PostgrestError (thrown by .rpc()/.from() calls) is a plain object with a
 * `message` string property — it is NOT an instance of the native `Error`
 * class, so `e instanceof Error` silently misses it everywhere and falls
 * back to a generic message, hiding the actual database error (including
 * permission-check exceptions raised inside SQL functions). Always use this
 * instead of `e instanceof Error ? e.message : "fallback"`.
 */
export function getErrorMessage(e: unknown, fallback: string): string {
  if (e instanceof Error) return e.message;
  if (e && typeof e === "object" && "message" in e && typeof (e as { message: unknown }).message === "string") {
    return (e as { message: string }).message;
  }
  return fallback;
}
