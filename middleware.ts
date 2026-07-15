import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Maps each protected route prefix to the roles allowed to access it.
 * super_admin is implicitly allowed everywhere an admin is allowed —
 * enforced below, not repeated in this table.
 */
const ROUTE_ROLE_MAP: { prefix: string; roles: string[] }[] = [
  { prefix: "/dashboard/applicant", roles: ["applicant"] },
  { prefix: "/dashboard/employer", roles: ["employer"] },
  { prefix: "/dashboard/admin", roles: ["admin", "super_admin"] },
  { prefix: "/dashboard/super-admin", roles: ["super_admin"] },
];

const AUTH_ROUTES = ["/login", "/register", "/forgot-password"];
const MAINTENANCE_EXEMPT_PATHS = ["/maintenance", "/login", "/account-suspended"];

// Maintenance mode changes maybe a few times a year, not per-request — no
// reason to hit the database for it on every single page load. A short TTL
// (rather than no expiry) means a toggle in the Super Admin settings still
// takes effect within seconds, not "requires a redeploy." Module-level state
// persists across requests on a warm middleware instance (Node/Edge runtimes
// both keep warm instances between invocations); worst case if a cold start
// clears it, the next request just re-fetches — never a correctness issue,
// only ever a cache-miss.
let maintenanceCache: { value: boolean; expiresAt: number } | null = null;
const MAINTENANCE_CACHE_TTL_MS = 15_000;

async function isMaintenanceModeOn(supabase: Awaited<ReturnType<typeof updateSession>>["supabase"]): Promise<boolean> {
  if (maintenanceCache && maintenanceCache.expiresAt > Date.now()) {
    return maintenanceCache.value;
  }
  const { data: setting } = await supabase
    .from("platform_settings")
    .select("value")
    .eq("key", "maintenance_mode")
    .maybeSingle();
  const value = Boolean(setting?.value);
  maintenanceCache = { value, expiresAt: Date.now() + MAINTENANCE_CACHE_TTL_MS };
  return value;
}

export async function middleware(request: NextRequest) {
  const { response, supabase, user } = await updateSession(request);
  const path = request.nextUrl.pathname;
  const needsMaintenanceCheck = !MAINTENANCE_EXEMPT_PATHS.some((p) => path.startsWith(p));

  // These two are independent of each other — run them concurrently
  // instead of one-after-another. The maintenance check also usually hits
  // the in-memory cache above rather than the database at all.
  const [profile, maintenanceOn] = await Promise.all([
    user
      ? (supabase.from("profiles") as any)
          .select("role, status")
          .eq("id", user.id)
          .single()
          .then((r: any) => r.data as { role: string; status: string } | null)
      : Promise.resolve(null),
    needsMaintenanceCheck ? isMaintenanceModeOn(supabase) : Promise.resolve(false),
  ]);

  // Maintenance mode: non-admins (including logged-out visitors) get bounced
  // to a maintenance page. Admins/super_admins can still use the whole site
  // so they can actually turn maintenance mode back off.
  if (needsMaintenanceCheck && maintenanceOn) {
    const isAdmin = profile?.role === "admin" || profile?.role === "super_admin";
    if (!isAdmin) {
      return NextResponse.redirect(new URL("/maintenance", request.url));
    }
  }

  const matchedRule = ROUTE_ROLE_MAP.find((rule) => path.startsWith(rule.prefix));

  // Not signed in and hitting a protected route -> send to login with a return path.
  if (matchedRule && !user) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("redirect", path);
    return NextResponse.redirect(redirectUrl);
  }

  // Signed in and hitting a role-gated route -> verify role via profiles table.
  if (matchedRule && user) {
    const role = profile?.role;
    const allowed =
      role && (matchedRule.roles.includes(role) || role === "super_admin");

    if (profile?.status === "suspended" || profile?.status === "deleted") {
      return NextResponse.redirect(new URL("/account-suspended", request.url));
    }

    if (!allowed) {
      // Signed in, wrong role for this section -> bounce to their own dashboard.
      return NextResponse.redirect(new URL(`/dashboard/${role ?? ""}`, request.url));
    }
  }

  // Already signed in and visiting an auth page -> send them to their dashboard.
  if (AUTH_ROUTES.includes(path) && user) {
    const target = profile?.role === "super_admin" ? "admin" : profile?.role;
    return NextResponse.redirect(new URL(`/dashboard/${target ?? "applicant"}`, request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static, _next/image (Next internals)
     * - favicon, images, fonts
     * - api routes handle their own auth checks
     */
    "/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|webp|gif|woff2?)$).*)",
  ],
};
