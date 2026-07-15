"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Circle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { markNotificationReadAction } from "@/app/dashboard/notifications-actions";
import type { NotificationRow } from "@/types/database.types";

export function NotificationItem({ notification }: { notification: NotificationRow }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isUnread = !notification.read_at;

  function handleOpen() {
    if (isUnread) {
      startTransition(async () => {
        await markNotificationReadAction(notification.id);
        router.refresh();
      });
    }
  }

  const content = (
    <Card className={isUnread ? "border-primary/30 bg-primary/5" : ""}>
      <CardContent className="flex items-start gap-3 p-4">
        {isUnread && <Circle className="mt-1.5 h-2 w-2 shrink-0 fill-primary text-primary" />}
        <div className="min-w-0 flex-1">
          <p className="font-medium">{notification.title}</p>
          {notification.body && <p className="mt-0.5 text-sm text-muted-foreground">{notification.body}</p>}
          <p className="mt-1 text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
          </p>
        </div>
      </CardContent>
    </Card>
  );

  if (notification.link) {
    return (
      <Link href={notification.link} onClick={handleOpen} className={isPending ? "pointer-events-none opacity-70" : ""}>
        {content}
      </Link>
    );
  }

  return (
    <button onClick={handleOpen} className={`w-full text-left ${isPending ? "pointer-events-none opacity-70" : ""}`}>
      {content}
    </button>
  );
}
