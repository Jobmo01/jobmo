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

export async function middleware(request: NextRequest) {
  const { response, supabase, user } = await updateSession(request);
  const path = request.nextUrl.pathname;

  const matchedRule = ROUTE_ROLE_MAP.find((rule) => path.startsWith(rule.prefix));

  // Not signed in and hitting a protected route -> send to login with a return path.
  if (matchedRule && !user) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("redirect", path);
    return NextResponse.redirect(redirectUrl);
  }

  // Signed in and hitting a role-gated route -> verify role via profiles table.
  if (matchedRule && user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, status")
      .eq("id", user.id)
      .single();

    const role = profile?.role;
    const allowed =
      role && (matchedRule.roles.includes(role) || role === "super_admin");

    if (profile?.status === "suspended") {
      return NextResponse.redirect(new URL("/account-suspended", request.url));
    }

    if (!allowed) {
      // Signed in, wrong role for this section -> bounce to their own dashboard.
      return NextResponse.redirect(new URL(`/dashboard/${role ?? ""}`, request.url));
    }
  }

  // Already signed in and visiting an auth page -> send them to their dashboard.
  if (AUTH_ROUTES.includes(path) && user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
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
