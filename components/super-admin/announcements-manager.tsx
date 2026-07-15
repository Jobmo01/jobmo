"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { createAnnouncementAction, toggleAnnouncementAction, deleteAnnouncementAction } from "@/app/dashboard/super-admin/actions";
import { Checkbox } from "@/components/ui/checkbox";
import type { Announcement, UserRole } from "@/types/database.types";

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: "applicant", label: "Applicants" },
  { value: "employer", label: "Employers" },
  { value: "admin", label: "Admins" },
];

export function AnnouncementsManager({ announcements }: { announcements: Announcement[] }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("");
  const [targetRoles, setTargetRoles] = React.useState<UserRole[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  function toggleRole(role: UserRole, checked: boolean) {
    setTargetRoles((prev) => (checked ? [...prev, role] : prev.filter((r) => r !== role)));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    const result = await createAnnouncementAction({ title, body, targetRoles });
    setIsSubmitting(false);
    if (result.error) return toast.error(result.error);
    toast.success("Announcement created");
    setOpen(false);
    setTitle(""); setBody(""); setTargetRoles([]);
    router.refresh();
  }

  async function toggle(a: Announcement) {
    const result = await toggleAnnouncementAction(a.id, !a.is_active);
    if (result.error) return toast.error(result.error);
    toast.success(a.is_active ? "Deactivated" : "Activated");
    router.refresh();
  }

  async function remove(id: string) {
    const result = await deleteAnnouncementAction(id);
    if (result.error) return toast.error(result.error);
    toast.success("Deleted");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4" /> New announcement</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New announcement</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>Body</Label>
                <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} />
              </div>
              <div className="space-y-1.5">
                <Label>Show to</Label>
                <div className="flex flex-wrap gap-4">
                  {ROLE_OPTIONS.map((opt) => (
                    <div key={opt.value} className="flex items-center gap-1.5">
                      <Checkbox
                        id={`role-${opt.value}`}
                        checked={targetRoles.includes(opt.value)}
                        onCheckedChange={(c) => toggleRole(opt.value, Boolean(c))}
                      />
                      <Label htmlFor={`role-${opt.value}`} className="text-sm font-normal">{opt.label}</Label>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">Leave all unchecked to show to everyone.</p>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Creating…" : "Create & activate"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {announcements.length === 0 ? (
        <p className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          No announcements yet.
        </p>
      ) : (
        <div className="space-y-2">
          {announcements.map((a) => (
            <Card key={a.id}>
              <CardContent className="flex items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-medium">{a.title}</p>
                  {a.body && <p className="text-sm text-muted-foreground">{a.body}</p>}
                  <p className="text-xs text-muted-foreground">{format(new Date(a.created_at), "d MMM yyyy")}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Shown to: {a.target_roles.length === 0 ? "everyone" : a.target_roles.map((r) => ROLE_OPTIONS.find((o) => o.value === r)?.label ?? r).join(", ")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={a.is_active ? "success" : "outline"}>{a.is_active ? "Active" : "Inactive"}</Badge>
                  <Button size="sm" variant="outline" onClick={() => toggle(a)}>
                    {a.is_active ? "Deactivate" : "Activate"}
                  </Button>
                  <Button variant="ghost" size="icon" aria-label="Delete announcement" onClick={() => remove(a.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
