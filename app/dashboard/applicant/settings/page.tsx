"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { changePasswordSchema, deleteAccountSchema } from "@/lib/validations/applicant-profile";
import {
  changePasswordAction, updateNotificationPreferencesAction, deleteAccountAction,
} from "@/app/dashboard/applicant/settings/actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel,
} from "@/components/ui/alert-dialog";

export default function SettingsPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your password, notifications, and account.</p>
      </div>

      <ChangePasswordCard />
      <NotificationPreferencesCard />
      <DangerZoneCard />
    </div>
  );
}

function ChangePasswordCard() {
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = changePasswordSchema.safeParse({ newPassword, confirmPassword });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0]?.message ?? "Invalid input");
      return;
    }
    setIsSubmitting(true);
    const result = await changePasswordAction(parsed.data);
    setIsSubmitting(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Password updated");
    setNewPassword("");
    setConfirmPassword("");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change password</CardTitle>
        <CardDescription>Choose a new password at least 8 characters long.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="newPassword">New password</Label>
            <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Confirm new password</Label>
            <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Updating…" : "Update password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function NotificationPreferencesCard() {
  const router = useRouter();
  const [email, setEmail] = React.useState(true);
  const [inApp, setInApp] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    const result = await updateNotificationPreferencesAction({ email, in_app: inApp });
    setIsSubmitting(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Notification preferences saved");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification preferences</CardTitle>
        <CardDescription>Choose how JobMo reaches you.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="flex items-center gap-2">
            <Checkbox id="email-notifs" checked={email} onCheckedChange={(c) => setEmail(Boolean(c))} />
            <Label htmlFor="email-notifs" className="font-normal">Email notifications</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="inapp-notifs" checked={inApp} onCheckedChange={(c) => setInApp(Boolean(c))} />
            <Label htmlFor="inapp-notifs" className="font-normal">In-app notifications</Label>
          </div>
          <Button type="submit" size="sm" disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : "Save preferences"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function DangerZoneCard() {
  const [password, setPassword] = React.useState("");
  const [confirmation, setConfirmation] = React.useState("");
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  async function handleDelete() {
    const parsed = deleteAccountSchema.safeParse({ password, confirmation });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0]?.message ?? "Invalid input");
      return;
    }
    setIsDeleting(true);
    const result = await deleteAccountAction(parsed.data);
    setIsDeleting(false);
    if (result?.error) {
      toast.error(result.error);
    }
    // On success, deleteAccountAction redirects to "/" itself.
  }

  return (
    <Card className="border-destructive/30">
      <CardHeader>
        <CardTitle className="text-destructive">Danger zone</CardTitle>
        <CardDescription>Deleting your account deactivates it immediately. This can&apos;t be undone by you.</CardDescription>
      </CardHeader>
      <CardContent>
        <AlertDialog open={open} onOpenChange={setOpen}>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm">Delete my account</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete your JobMo account?</AlertDialogTitle>
              <AlertDialogDescription>
                Enter your password and type DELETE to confirm. Your data is
                deactivated, not erased — this preserves the audit trail required
                by our records policy.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="delete-password">Password</Label>
                <Input id="delete-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="delete-confirmation">Type DELETE to confirm</Label>
                <Input id="delete-confirmation" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} />
              </div>
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? "Deleting…" : "Delete account"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
