"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, User, Briefcase, Bell, Settings, LogOut, Search, GraduationCap,
  Building2, Users, Users2, CalendarClock,
  ShieldCheck, FileCheck2, BarChart3, Megaphone, ScrollText, LifeBuoy, FileDown,
} from "lucide-react";
import { Logo } from "@/components/marketing/logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/app/(auth)/actions";
import { cn, formatRoleLabel } from "@/lib/utils";
import type { UserRole } from "@/types/database.types";

/** super_admin reuses the admin notifications page — same pattern already
 *  established for Users/Jobs/Approvals/Audit Logs in the super_admin nav. */
function notificationsHref(role: UserRole): string {
  if (role === "super_admin") return "/dashboard/admin/notifications";
  return `/dashboard/${role}/notifications`;
}

const NAV_BY_ROLE: Record<UserRole, { href: string; label: string; icon: React.ElementType }[]> = {
  applicant: [
    { href: "/dashboard/applicant", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/applicant/profile", label: "My Profile", icon: User },
    { href: "/dashboard/applicant/resume", label: "Resume Builder", icon: FileCheck2 },
    { href: "/dashboard/applicant/browse-jobs", label: "Browse Jobs", icon: Search },
    { href: "/dashboard/applicant/jobs", label: "Applied Jobs", icon: Briefcase },
    { href: "/dashboard/applicant/learning", label: "Learning Center", icon: GraduationCap },
    { href: "/dashboard/applicant/notifications", label: "Notifications", icon: Bell },
    { href: "/dashboard/applicant/settings", label: "Settings", icon: Settings },
  ],
  employer: [
    { href: "/dashboard/employer", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/employer/company", label: "Company Profile", icon: Building2 },
    { href: "/dashboard/employer/jobs", label: "Job Postings", icon: Briefcase },
    { href: "/dashboard/employer/talent-pool", label: "Talent Pool", icon: Users2 },
    { href: "/dashboard/employer/interviews", label: "Interviews", icon: CalendarClock },
    { href: "/dashboard/employer/notifications", label: "Notifications", icon: Bell },
    { href: "/dashboard/employer/settings", label: "Settings", icon: Settings },
  ],
  admin: [
    { href: "/dashboard/admin", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/admin/users", label: "Users", icon: Users },
    { href: "/dashboard/admin/companies", label: "Companies", icon: Building2 },
    { href: "/dashboard/admin/jobs", label: "Jobs", icon: Briefcase },
    { href: "/dashboard/admin/approvals", label: "Approvals", icon: FileCheck2 },
    { href: "/dashboard/admin/learning-center", label: "Learning Center", icon: GraduationCap },
    { href: "/dashboard/admin/support", label: "Support Tickets", icon: LifeBuoy },
    { href: "/dashboard/admin/audit-logs", label: "Audit Logs", icon: ScrollText },
    { href: "/dashboard/admin/reports", label: "Reports", icon: FileDown },
    { href: "/dashboard/admin/notifications", label: "Notifications", icon: Bell },
    { href: "/dashboard/admin/analytics", label: "Analytics", icon: BarChart3 },
  ],
  super_admin: [
    { href: "/dashboard/super-admin", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/admin/users", label: "Users", icon: Users },
    { href: "/dashboard/admin/companies", label: "Companies", icon: Building2 },
    { href: "/dashboard/admin/jobs", label: "Jobs", icon: Briefcase },
    { href: "/dashboard/admin/approvals", label: "Approvals", icon: FileCheck2 },
    { href: "/dashboard/admin/learning-center", label: "Learning Center", icon: GraduationCap },
    { href: "/dashboard/admin/support", label: "Support Tickets", icon: LifeBuoy },
    { href: "/dashboard/admin/audit-logs", label: "Audit Logs", icon: ScrollText },
    { href: "/dashboard/admin/reports", label: "Reports", icon: FileDown },
    { href: "/dashboard/admin/notifications", label: "Notifications", icon: Bell },
    { href: "/dashboard/super-admin/admins", label: "Admins & Roles", icon: ShieldCheck },
    { href: "/dashboard/super-admin/cms", label: "CMS & Announcements", icon: Megaphone },
    { href: "/dashboard/super-admin/settings", label: "Platform Settings", icon: Settings },
    { href: "/dashboard/super-admin/analytics", label: "Platform Analytics", icon: BarChart3 },
  ],
};

export function DashboardShell({
  role,
  fullName,
  email,
  unreadCount = 0,
  announcement,
  children,
}: {
  role: UserRole;
  fullName: string | null;
  email: string;
  unreadCount?: number;
  announcement?: { id: string; title: string; body: string | null } | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const navItems = NAV_BY_ROLE[role];
  const [dismissedId, setDismissedId] = React.useState<string | null>(null);
  const showAnnouncement = announcement && announcement.id !== dismissedId;

  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-[240px_1fr]">
      <aside className="hidden border-r border-border bg-secondary/30 md:flex md:flex-col">
        <div className="flex h-16 items-center gap-2 border-b border-border px-5">
          <Logo className="h-7" />
          <span className="font-display font-semibold">JobMo</span>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border p-3">
          <form action={logoutAction}>
            <button
              suppressHydrationWarning
              className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </button>
          </form>
        </div>
      </aside>

      <div className="min-w-0 flex flex-col">
        <header className="flex h-16 items-center justify-between border-b border-border px-5">
          <div>
            <p className="text-sm font-medium">{fullName ?? email}</p>
            <p className="text-xs text-muted-foreground">{formatRoleLabel(role)}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`} asChild>
              <Link href={notificationsHref(role)} className="relative">
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-accent-foreground">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>
            </Button>
            <ThemeToggle />
          </div>
        </header>
        {showAnnouncement && announcement && (
          <div className="flex items-center justify-between gap-3 bg-accent/15 px-6 py-2.5 text-sm">
            <p>
              <span className="font-semibold">{announcement.title}</span>
              {announcement.body && <span className="text-muted-foreground"> — {announcement.body}</span>}
            </p>
            <button
              onClick={() => setDismissedId(announcement.id)}
              className="shrink-0 text-xs text-muted-foreground hover:text-foreground"
              aria-label="Dismiss announcement"
            >
              Dismiss
            </button>
          </div>
        )}
        <main id="main-content" className="min-w-0 flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
