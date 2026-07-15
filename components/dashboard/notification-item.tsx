"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Sparkles, Briefcase, CalendarClock, PartyPopper, CheckCircle2, type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { markNotificationReadAction } from "@/app/dashboard/notifications-actions";
import { cn } from "@/lib/utils";
import type { NotificationRow } from "@/types/database.types";

/**
 * One icon + color per notification type, so someone scanning a list of
 * notifications can tell what kind of thing happened at a glance instead
 * of having to read every title — this was the actual complaint: with
 * plain text, an "Application update" and an "Interview response" look
 * identical until you read them. Falls back to a generic bell-adjacent
 * style for any type not listed here, so a future notification type
 * added later never renders broken.
 */
const NOTIFICATION_STYLES: Record<string, { icon: LucideIcon; color: string; bg: string; label: string }> = {
  job_match: { icon: Sparkles, color: "text-accent", bg: "bg-accent/10", label: "AI Match" },
  application_status: { icon: Briefcase, color: "text-muted-foreground", bg: "bg-secondary", label: "Application" },
  interview_response: { icon: CalendarClock, color: "text-primary", bg: "bg-primary/10", label: "Interview" },
  offer_response: { icon: PartyPopper, color: "text-success", bg: "bg-success/10", label: "Offer" },
  system: { icon: CheckCircle2, color: "text-muted-foreground", bg: "bg-secondary", label: "Update" },
};
const DEFAULT_STYLE = { icon: CheckCircle2, color: "text-muted-foreground", bg: "bg-secondary", label: "Update" };

export function NotificationItem({ notification }: { notification: NotificationRow }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isUnread = !notification.read_at;
  const style = NOTIFICATION_STYLES[notification.type] ?? DEFAULT_STYLE;
  const Icon = style.icon;

  function handleOpen() {
    if (isUnread) {
      startTransition(async () => {
        await markNotificationReadAction(notification.id);
        router.refresh();
      });
    }
  }

  const content = (
    <Card className={cn("transition-colors", isUnread ? "border-primary/30 bg-primary/5" : "hover:bg-secondary/40")}>
      <CardContent className="flex items-start gap-3 p-4">
        <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full", style.bg)}>
          <Icon className={cn("h-4 w-4", style.color)} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={cn("text-[10px] font-medium uppercase tracking-wide", style.color)}>{style.label}</span>
            {isUnread && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
          </div>
          <p className="mt-0.5 font-medium leading-snug">{notification.title}</p>
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
