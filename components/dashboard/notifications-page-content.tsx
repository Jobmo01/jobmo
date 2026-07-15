import { BellOff } from "lucide-react";
import { notificationsRepository } from "@/lib/repositories/notifications-repository";
import { NotificationItem } from "@/components/dashboard/notification-item";
import { Button } from "@/components/ui/button";
import { markAllNotificationsReadAction } from "@/app/dashboard/notifications-actions";

/** Shared across every role's /notifications page — the underlying data
 *  (the notifications table, keyed by user_id) works identically for
 *  applicants, employers, and admins, so there's one implementation
 *  instead of four near-identical copies. */
export async function NotificationsPageContent({ accountId }: { accountId: string }) {
  const notifications = await notificationsRepository.list(accountId);
  const hasUnread = notifications.some((n) => !n.read_at);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Notifications</h1>
          <p className="text-sm text-muted-foreground">Job matches, application updates, and system alerts.</p>
        </div>
        {hasUnread && (
          <form action={markAllNotificationsReadAction}>
            <Button type="submit" variant="outline" size="sm">Mark all as read</Button>
          </form>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border p-12 text-center">
          <BellOff className="h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">
            Nothing here yet. Updates will show up here as you use JobMo.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <NotificationItem key={n.id} notification={n} />
          ))}
        </div>
      )}
    </div>
  );
}
