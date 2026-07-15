"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import { CalendarClock, MapPin, Users, Video } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { respondToInterviewAction } from "@/app/dashboard/applicant/jobs/actions";
import type { Interview } from "@/types/database.types";

const STATUS_VARIANT: Record<string, "outline" | "success" | "destructive" | "secondary"> = {
  proposed: "outline", accepted: "success", declined: "destructive",
  reschedule_requested: "secondary", completed: "secondary", cancelled: "destructive",
};

export function InterviewCard({ interview, applicationId }: { interview: Interview; applicationId: string }) {
  const router = useRouter();
  const [note, setNote] = React.useState("");
  const [showReschedule, setShowReschedule] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  async function respond(response: "accepted" | "declined" | "reschedule_requested") {
    setIsSubmitting(true);
    const result = await respondToInterviewAction(interview.id, applicationId, response, note || undefined);
    setIsSubmitting(false);
    if (result.error) return toast.error(result.error);
    toast.success("Response submitted");
    setShowReschedule(false);
    router.refresh();
  }

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <p className="font-display font-semibold">Interview</p>
          <Badge variant={STATUS_VARIANT[interview.status]}>{interview.status.replace(/_/g, " ")}</Badge>
        </div>
        <div className="mt-2 space-y-1 text-sm text-muted-foreground">
          <p className="inline-flex items-center gap-1.5">
            <CalendarClock className="h-4 w-4" /> {format(new Date(interview.scheduled_at), "d MMM yyyy, h:mm a")} ({interview.duration_minutes} min)
          </p>
          {interview.meeting_link && (
            <p className="inline-flex items-center gap-1.5">
              <Video className="h-4 w-4" />
              <a href={interview.meeting_link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                {interview.platform ?? "Join meeting"}
              </a>
            </p>
          )}
          {interview.location && (
            <p className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {interview.location}</p>
          )}
          {interview.panel_members?.length > 0 && (
            <p className="inline-flex items-center gap-1.5"><Users className="h-4 w-4" /> {interview.panel_members.join(", ")}</p>
          )}
        </div>
        {interview.instructions && (
          <p className="mt-3 rounded-md bg-secondary/50 p-3 text-sm">{interview.instructions}</p>
        )}

        {interview.status === "proposed" && (
          <div className="mt-4 space-y-2">
            <div className="flex gap-2">
              <Button size="sm" onClick={() => respond("accepted")} disabled={isSubmitting}>Accept</Button>
              <Button size="sm" variant="outline" onClick={() => setShowReschedule((v) => !v)} disabled={isSubmitting}>
                Request reschedule
              </Button>
              <Button size="sm" variant="destructive" onClick={() => respond("declined")} disabled={isSubmitting}>Decline</Button>
            </div>
            {showReschedule && (
              <div className="space-y-2">
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Let them know what times work better for you…"
                  rows={2}
                />
                <Button size="sm" onClick={() => respond("reschedule_requested")} disabled={isSubmitting}>
                  Submit reschedule request
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
