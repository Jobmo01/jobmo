"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import { Phone } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { updateUserStatusAction } from "@/app/dashboard/admin/actions";
import type { AdminProfileRow } from "@/lib/repositories/admin-repository";

const STATUS_VARIANT: Record<string, "success" | "destructive" | "outline"> = {
  active: "success", suspended: "destructive", pending_verification: "outline", deleted: "destructive",
};

const ROLE_LABEL: Record<string, string> = {
  applicant: "Applicant", employer: "Employer", admin: "Admin", super_admin: "Super Admin",
};

export function UsersManager({ initialUsers }: { initialUsers: AdminProfileRow[] }) {
  const router = useRouter();
  const [search, setSearch] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState("all");

  const filtered = initialUsers.filter((u) => {
    if (roleFilter !== "all" && u.role !== roleFilter) return false;
    if (search && !`${u.full_name ?? ""} ${u.email}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  async function toggleSuspend(user: AdminProfileRow) {
    const nextStatus = user.status === "suspended" ? "active" : "suspended";
    const result = await updateUserStatusAction(user.id, nextStatus);
    if (result.error) return toast.error(result.error);
    toast.success(nextStatus === "suspended" ? "User suspended" : "User reactivated");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="min-w-0 flex-1">
          <Input placeholder="Search by name or email…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="shrink-0 sm:w-48">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              <SelectItem value="applicant">Applicant</SelectItem>
              <SelectItem value="employer">Employer</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="super_admin">Super Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        {filtered.length} user{filtered.length === 1 ? "" : "s"} — click anyone for their full profile, applications, and support history
      </p>

      <div className="space-y-2">
        {filtered.map((user) => (
          <Card key={user.id}>
            <CardContent className="flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center">
              <Link href={`/dashboard/admin/users/${user.id}`} className="min-w-0 flex-1 hover:opacity-80">
                <p className="font-medium">{user.full_name ?? "—"}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
                  {user.phone && (
                    <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" /> {user.phone}</span>
                  )}
                  <span>Joined {format(new Date(user.created_at), "d MMM yyyy")}</span>
                </div>
              </Link>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{ROLE_LABEL[user.role]}</Badge>
                <Badge variant={STATUS_VARIANT[user.status]}>{user.status.replace("_", " ")}</Badge>
                {user.role !== "super_admin" && (
                  <Button size="sm" variant="outline" onClick={() => toggleSuspend(user)}>
                    {user.status === "suspended" ? "Reactivate" : "Suspend"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
