"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { promoteUserAction, updatePermissionsAction } from "@/app/dashboard/super-admin/actions";
import type { AdminProfileRow } from "@/lib/repositories/admin-repository";
import type { UserRole } from "@/types/database.types";

const PERMISSION_KEYS = [
  { key: "manage_jobs", label: "Manage job postings" },
  { key: "manage_employers", label: "Manage employer accounts" },
  { key: "manage_content", label: "Manage Learning Center content" },
];

export function AdminsManager({ admins }: { admins: (AdminProfileRow & { permissions?: Record<string, boolean> })[] }) {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState<UserRole>("admin");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  async function handlePromote(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    const result = await promoteUserAction(email, role);
    setIsSubmitting(false);
    if (result.error) return toast.error(result.error);
    toast.success(`Promoted to ${role}`);
    setEmail("");
    router.refresh();
  }

  async function togglePermission(userId: string, currentPermissions: Record<string, boolean>, key: string, checked: boolean) {
    const next = { ...currentPermissions, [key]: checked };
    const result = await updatePermissionsAction(userId, next);
    if (result.error) return toast.error(result.error);
    toast.success("Permissions updated");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Promote a user to admin</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handlePromote} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-1.5">
              <Label>User email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@example.com" required />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                  <SelectItem value="applicant">Applicant (demote)</SelectItem>
                  <SelectItem value="employer">Employer (demote)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Updating…" : "Update role"}</Button>
          </form>
        </CardContent>
      </Card>

      <div>
        <h2 className="font-display text-lg font-semibold">Admins & Super Admins</h2>
        <div className="mt-3 space-y-2">
          {admins.map((admin) => {
            const permissions = admin.permissions ?? {};
            return (
              <Card key={admin.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{admin.full_name ?? admin.email}</p>
                      <p className="text-sm text-muted-foreground">{admin.email}</p>
                    </div>
                    <Badge variant={admin.role === "super_admin" ? "default" : "secondary"}>
                      {admin.role === "super_admin" ? "Super Admin" : "Admin"}
                    </Badge>
                  </div>
                  {admin.role === "admin" && (
                    <div className="mt-3 flex flex-wrap gap-4 border-t border-border pt-3">
                      {PERMISSION_KEYS.map((p) => (
                        <div key={p.key} className="flex items-center gap-1.5">
                          <Checkbox
                            checked={Boolean(permissions[p.key])}
                            onCheckedChange={(c) => togglePermission(admin.id, permissions, p.key, Boolean(c))}
                          />
                          <Label className="text-xs font-normal">{p.label}</Label>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
