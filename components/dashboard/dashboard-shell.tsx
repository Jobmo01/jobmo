"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, User, Briefcase, Bell, Settings, LogOut,
  Building2, Users, KanbanSquare, CalendarClock,
  ShieldCheck, FileCheck2, BarChart3, Megaphone,
} from "lucide-react";
import { Logo } from "@/components/marketing/logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/app/(auth)/actions";
import { cn, formatRoleLabel } from "@/lib/utils";
import type { UserRole } from "@/types/database.types";

const NAV_BY_ROLE: Record<UserRole, { href: string; label: string; icon: React.ElementType }[]> = {
  applicant: [
    { href: "/dashboard/applicant", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/applicant/profile", label: "My Profile", icon: User },
    { href: "/dashboard/applicant/jobs", label: "Applied Jobs", icon: Briefcase },
    { href: "/dashboard/applicant/notifications", label: "Notifications", icon: Bell },
    { href: "/dashboard/applicant/settings", label: "Settings", icon: Settings },
  ],
  employer: [
    { href: "/dashboard/employer", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/employer/company", label: "Company Profile", icon: Building2 },
    { href: "/dashboard/employer/jobs", label: "Job Postings", icon: Briefcase },
    { href: "/dashboard/employer/pipeline", label: "Pipeline", icon: KanbanSquare },
    { href: "/dashboard/employer/interviews", label: "Interviews", icon: CalendarClock },
    { href: "/dashboard/employer/settings", label: "Settings", icon: Settings },
  ],
  admin: [
    { href: "/dashboard/admin", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/admin/users", label: "Users", icon: Users },
    { href: "/dashboard/admin/approvals", label: "Approvals", icon: FileCheck2 },
    { href: "/dashboard/admin/analytics", label: "Analytics", icon: BarChart3 },
  ],
  super_admin: [
    { href: "/dashboard/super-admin", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/super-admin/admins", label: "Admins & Roles", icon: ShieldCheck },
    { href: "/dashboard/super-admin/cms", label: "CMS & Announcements", icon: Megaphone },
    { href: "/dashboard/super-admin/analytics", label: "Platform Analytics", icon: BarChart3 },
  ],
};

export function DashboardShell({
  role,
  fullName,
  email,
  children,
}: {
  role: UserRole;
  fullName: string | null;
  email: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const navItems = NAV_BY_ROLE[role];

  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-[240px_1fr]">
      <aside className="hidden border-r border-border bg-secondary/30 md:flex md:flex-col">
        <div className="flex h-16 items-center gap-2 border-b border-border px-5">
          <Logo className="h-6 w-6" />
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
            <button className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
              <LogOut className="h-4 w-4" />
              Log out
            </button>
          </form>
        </div>
      </aside>

      <div className="flex flex-col">
        <header className="flex h-16 items-center justify-between border-b border-border px-5">
          <div>
            <p className="text-sm font-medium">{fullName ?? email}</p>
            <p className="text-xs text-muted-foreground">{formatRoleLabel(role)}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" aria-label="Notifications">
              <Bell className="h-4 w-4" />
            </Button>
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
