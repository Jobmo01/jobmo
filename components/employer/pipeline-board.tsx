"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import { Mail, Phone, MapPin, Send, CalendarPlus, CalendarClock, Sparkles, PartyPopper, UserPlus } from "lucide-react";
import {
  changeApplicationStatusAction, addApplicationNoteAction, updateApplicationTagsAction,
  scheduleInterviewAction, rescheduleInterviewAction, sendOfferAction, generateInterviewQuestionsAction,
  addToTalentPoolAction,
} from "@/app/dashboard/employer/jobs/[id]/pipeline/actions";
import { archiveJobAction } from "@/app/dashboard/employer/jobs/actions";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TagInput } from "@/components/ui/tag-input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import type { ApplicationStatus } from "@/types/database.types";

const COLUMNS: { key: string; label: string; statuses: ApplicationStatus[]; primaryStatus: ApplicationStatus }[] = [
  { key: "applied", label: "Applied", statuses: ["applied", "viewed"], primaryStatus: "applied" },
  { key: "shortlisted", label: "Shortlisted", statuses: ["shortlisted", "assessment"], primaryStatus: "shortlisted" },
  { key: "interview", label: "Interview", statuses: ["interview_scheduled", "interview_completed", "pending_decision"], primaryStatus: "interview_scheduled" },
  { key: "offer", label: "Offer", statuses: ["offer_sent", "offer_accepted", "offer_rejected"], primaryStatus: "offer_sent" },
  { key: "hired", label: "Hired", statuses: ["hired"], primaryStatus: "hired" },
  { key: "rejected", label: "Rejected", statuses: ["rejected"], primaryStatus: "rejected" },
];

const ALL_STATUSES: ApplicationStatus[] = [
  "applied", "viewed", "shortlisted", "assessment", "interview_scheduled",
  "interview_completed", "pending_decision", "selected", "rejected",
  "offer_sent", "offer_accepted", "offer_rejected", "hired",
];

function columnFor(status: ApplicationStatus) {
  return COLUMNS.find((c) => c.statuses.includes(status)) ?? COLUMNS[0]!;
}

type PipelineApplication = any;

export function PipelineBoard({
  jobId, jobInfo, applications,
}: {
  jobId: string;
  jobInfo: { title: string; description: string; requiredSkills: string[] };
  applications: PipelineApplication[];
}) {
  const router = useRouter();
  const [draggedId, setDraggedId] = React.useState<string | null>(null);
  const [detailApp, setDetailApp] = React.useState<PipelineApplication | null>(null);
  const [scheduleApp, setScheduleApp] = React.useState<PipelineApplication | null>(null);
  const [offerApp, setOfferApp] = React.useState<PipelineApplication | null>(null);
  const [rescheduleTarget, setRescheduleTarget] = React.useState<{ app: PipelineApplication; interview: any } | null>(null);
  const [showHiredPrompt, setShowHiredPrompt] = React.useState(false);

  async function moveToColumn(app: PipelineApplication, columnKey: string) {
    if (columnKey === "interview") {
      setScheduleApp(app);
      return;
    }
    if (columnKey === "offer") {
      setOfferApp(app);
      return;
    }
    const column = COLUMNS.find((c) => c.key === columnKey)!;
    const result = await changeApplicationStatusAction(app.id, jobId, column.primaryStatus);
    if (result.error) toast.error(result.error);
    else {
      toast.success(`Moved to ${column.label}`);
      router.refresh();
      if (column.primaryStatus === "hired") setShowHiredPrompt(true);
    }
  }

  return (
    <>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((col) => {
          const items = applications.filter((a) => columnFor(a.status).key === col.key);
          return (
            <div
              key={col.key}
              className="w-72 shrink-0 rounded-lg bg-secondary/40 p-3"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const id = draggedId;
                setDraggedId(null);
                const app = applications.find((a) => a.id === id);
                if (app) moveToColumn(app, col.key);
              }}
            >
              <div className="mb-3 flex items-center justify-between px-1">
                <h3 className="text-sm font-semibold">{col.label}</h3>
                <Badge variant="secondary">{items.length}</Badge>
              </div>
              <div className="space-y-2">
                {items.map((app) => (
                  <Card
                    key={app.id}
                    draggable
                    onDragStart={() => setDraggedId(app.id)}
                    onClick={() => setDetailApp(app)}
                    className="cursor-pointer transition-shadow hover:shadow-md"
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate text-sm font-medium">
                          {app.profiles?.full_name ?? app.profiles?.email ?? "Applicant"}
                        </p>
                        {typeof app.matchScore === "number" && (
                          <span className="shrink-0 rounded-full bg-accent/15 px-1.5 py-0.5 text-[10px] font-semibold text-accent">
                            {app.matchScore}%
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {app.applicant_profiles?.district ?? ""}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-1">
                        <Badge variant="outline" className="text-[10px]">{app.status.replace(/_/g, " ")}</Badge>
                        {app.tags?.slice(0, 2).map((t: string) => (
                          <Badge key={t} variant="accent" className="text-[10px]">{t}</Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {items.length === 0 && (
                  <p className="rounded-md border border-dashed border-border/60 p-3 text-center text-xs text-muted-foreground">
                    Drop here
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {detailApp && (
        <ApplicationDetailDialog
          application={detailApp}
          jobId={jobId}
          jobInfo={jobInfo}
          onClose={() => setDetailApp(null)}
          onScheduleInterview={() => { setScheduleApp(detailApp); setDetailApp(null); }}
          onSendOffer={() => { setOfferApp(detailApp); setDetailApp(null); }}
          onReschedule={(interview) => { setRescheduleTarget({ app: detailApp, interview }); setDetailApp(null); }}
          onHired={() => setShowHiredPrompt(true)}
        />
      )}

      {scheduleApp && (
        <ScheduleInterviewDialog
          application={scheduleApp}
          jobId={jobId}
          onClose={() => setScheduleApp(null)}
        />
      )}

      {rescheduleTarget && (
        <ScheduleInterviewDialog
          application={rescheduleTarget.app}
          jobId={jobId}
          interview={rescheduleTarget.interview}
          onClose={() => setRescheduleTarget(null)}
        />
      )}

      {offerApp && (
        <SendOfferDialog application={offerApp} jobId={jobId} onClose={() => setOfferApp(null)} />
      )}

      {showHiredPrompt && (
        <HiredPromptDialog jobId={jobId} onClose={() => setShowHiredPrompt(false)} />
      )}
    </>
  );
}

function ApplicationDetailDialog({
  application, jobId, jobInfo, onClose, onScheduleInterview, onSendOffer, onReschedule, onHired,
}: {
  application: PipelineApplication;
  jobId: string;
  jobInfo: { title: string; description: string; requiredSkills: string[] };
  onClose: () => void;
  onScheduleInterview: () => void;
  onSendOffer: () => void;
  onReschedule: (interview: any) => void;
  onHired: () => void;
}) {
  const router = useRouter();
  const [status, setStatus] = React.useState<ApplicationStatus>(application.status);
  const [tags, setTags] = React.useState<string[]>(application.tags ?? []);
  const [newNote, setNewNote] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = React.useState(false);
  const [interviewQuestions, setInterviewQuestions] = React.useState<string[] | null>(null);
  const [showTalentPoolForm, setShowTalentPoolForm] = React.useState(false);
  const [talentPoolNote, setTalentPoolNote] = React.useState("");
  const [isSavingToPool, setIsSavingToPool] = React.useState(false);
  const [savedToPool, setSavedToPool] = React.useState(Boolean(application.isInTalentPool));

  async function handleAddToTalentPool() {
    setIsSavingToPool(true);
    const result = await addToTalentPoolAction(application.applicant_id, talentPoolNote, application.id);
    setIsSavingToPool(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Saved to Talent Pool");
    setSavedToPool(true);
    setShowTalentPoolForm(false);
  }
  const [aiUnavailableNotice, setAiUnavailableNotice] = React.useState<string | null>(null);
  const profile = application.applicant_profiles;

  async function handleGenerateQuestions() {
    setIsGeneratingQuestions(true);
    setAiUnavailableNotice(null);
    const result = await generateInterviewQuestionsAction(
      jobInfo.title,
      jobInfo.description,
      jobInfo.requiredSkills,
      (application.skills ?? []).map((s: any) => s.name),
      (application.experience ?? []).map((e: any) => `${e.position} at ${e.company}`)
    );
    setIsGeneratingQuestions(false);
    if (result.aiUnavailable) {
      setAiUnavailableNotice(result.error ?? "AI features aren't set up yet.");
      return;
    }
    if (result.error || !result.questions) {
      toast.error(result.error ?? "Failed to generate questions");
      return;
    }
    setInterviewQuestions(result.questions);
  }

  async function handleStatusChange(next: ApplicationStatus) {
    setStatus(next);
    const result = await changeApplicationStatusAction(application.id, jobId, next);
    if (result.error) toast.error(result.error);
    else {
      toast.success("Status updated");
      router.refresh();
      if (next === "hired") onHired();
    }
  }

  async function handleTagsChange(next: string[]) {
    setTags(next);
    const result = await updateApplicationTagsAction(application.id, jobId, next);
    if (result.error) toast.error(result.error);
  }

  async function handleAddNote() {
    if (!newNote.trim()) return;
    setIsSaving(true);
    const result = await addApplicationNoteAction(application.id, jobId, newNote);
    setIsSaving(false);
    if (result.error) toast.error(result.error);
    else { toast.success("Note added"); setNewNote(""); router.refresh(); }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{application.profiles?.full_name ?? "Applicant"}</DialogTitle>
          <DialogDescription className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {application.profiles?.email}</span>
            {profile?.phone && <span className="inline-flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {profile.phone}</span>}
            {profile?.district && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {profile.district}</span>}
            <Link href={`/dashboard/employer/candidates/${application.applicant_id}`} className="text-primary hover:underline">
              View full profile →
            </Link>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Pipeline status</Label>
              <Select value={status} onValueChange={(v) => handleStatusChange(v as ApplicationStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ALL_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Tags</Label>
              <TagInput value={tags} onChange={handleTagsChange} placeholder="strong-fit, senior…" />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={onScheduleInterview}>
              <CalendarPlus className="h-4 w-4" /> Schedule interview
            </Button>
            <Button size="sm" variant="outline" onClick={onSendOffer}>
              <Send className="h-4 w-4" /> Send offer
            </Button>
            <Button size="sm" variant="outline" onClick={handleGenerateQuestions} disabled={isGeneratingQuestions}>
              <Sparkles className="h-4 w-4" /> {isGeneratingQuestions ? "Thinking…" : "Generate interview questions"}
            </Button>
            {!savedToPool && (
              <Button size="sm" variant="outline" onClick={() => setShowTalentPoolForm((v) => !v)}>
                <UserPlus className="h-4 w-4" /> Save to Talent Pool
              </Button>
            )}
            {savedToPool && (
              <Button size="sm" variant="secondary" disabled>
                <UserPlus className="h-4 w-4" /> Saved to Talent Pool
              </Button>
            )}
          </div>

          {showTalentPoolForm && (
            <div className="space-y-2 rounded-md border border-border p-3">
              <Label>Note for later (optional)</Label>
              <Textarea
                value={talentPoolNote}
                onChange={(e) => setTalentPoolNote(e.target.value)}
                placeholder="e.g. Strong frontend skills — great fit if we open a senior role."
                rows={2}
              />
              <Button size="sm" onClick={handleAddToTalentPool} disabled={isSavingToPool}>
                {isSavingToPool ? "Saving…" : "Save to Talent Pool"}
              </Button>
            </div>
          )}

          {aiUnavailableNotice && (
            <p className="text-xs text-muted-foreground">{aiUnavailableNotice}</p>
          )}

          {interviewQuestions && (
            <div className="rounded-md border border-accent/30 bg-accent/5 p-3">
              <p className="text-sm font-medium">Suggested interview questions</p>
              <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm">
                {interviewQuestions.map((q, i) => <li key={i}>{q}</li>)}
              </ol>
            </div>
          )}

          {application.interviews?.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Interviews</p>
              {application.interviews.map((interview: any) => (
                <div key={interview.id} className="flex items-center justify-between rounded-md border border-border p-3">
                  <div className="text-sm">
                    <p className="font-medium">
                      {format(new Date(interview.scheduled_at), "d MMM yyyy, h:mm a")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {interview.mode}{interview.platform ? ` • ${interview.platform}` : ""}
                    </p>
                    {interview.applicant_response_note && (
                      <p className="mt-1 text-xs italic text-muted-foreground">
                        Candidate note: {interview.applicant_response_note}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        interview.status === "accepted" ? "success"
                        : interview.status === "declined" ? "destructive"
                        : interview.status === "reschedule_requested" ? "secondary"
                        : "outline"
                      }
                    >
                      {interview.status.replace(/_/g, " ")}
                    </Badge>
                    <Button size="sm" variant="outline" onClick={() => onReschedule(interview)}>
                      <CalendarClock className="h-3.5 w-3.5" /> Reschedule
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {(application.education?.length > 0 || application.experience?.length > 0 || application.skills?.length > 0) && (
            <div className="grid gap-4 rounded-md border border-border p-4 sm:grid-cols-2">
              {application.experience?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Experience</p>
                  {application.experience.map((e: any) => (
                    <p key={e.id} className="mt-1 text-sm">{e.position} — {e.company}</p>
                  ))}
                </div>
              )}
              {application.education?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Education</p>
                  {application.education.map((e: any) => (
                    <p key={e.id} className="mt-1 text-sm">{e.qualification} — {e.institution}</p>
                  ))}
                </div>
              )}
              {application.skills?.length > 0 && (
                <div className="sm:col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Skills</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {application.skills.map((s: any) => <Badge key={s.id} variant="secondary">{s.name}</Badge>)}
                  </div>
                </div>
              )}
            </div>
          )}

          <div>
            <p className="text-sm font-medium">Internal notes</p>
            <div className="mt-2 space-y-2">
              {application.notes?.map((n: any) => (
                <div key={n.id} className="rounded-md bg-secondary/50 p-2 text-sm">
                  <p>{n.note}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {n.profiles?.full_name ?? "You"} — {format(new Date(n.created_at), "d MMM yyyy, h:mm a")}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <Textarea value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Add a note visible only to your team…" rows={2} />
              <Button size="sm" onClick={handleAddNote} disabled={isSaving}>Add</Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ScheduleInterviewDialog({
  application, jobId, interview, onClose,
}: { application: PipelineApplication; jobId: string; interview?: any; onClose: () => void }) {
  const router = useRouter();
  const isReschedule = Boolean(interview);
  const [mode, setMode] = React.useState<"online" | "offline" | "hybrid">(interview?.mode ?? "online");
  const [platform, setPlatform] = React.useState(interview?.platform ?? "Google Meet");
  const [meetingLink, setMeetingLink] = React.useState(interview?.meeting_link ?? "");
  const [location, setLocation] = React.useState(interview?.location ?? "");
  const [scheduledAt, setScheduledAt] = React.useState(
    interview?.scheduled_at ? format(new Date(interview.scheduled_at), "yyyy-MM-dd'T'HH:mm") : ""
  );
  const [duration, setDuration] = React.useState(interview?.duration_minutes?.toString() ?? "30");
  const [panelMembers, setPanelMembers] = React.useState<string[]>(interview?.panel_members ?? []);
  const [instructions, setInstructions] = React.useState(interview?.instructions ?? "");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    const values = {
      mode, platform, meeting_link: meetingLink, location,
      scheduled_at: scheduledAt, duration_minutes: duration, panel_members: panelMembers, instructions,
    };
    const result = isReschedule
      ? await rescheduleInterviewAction(interview.id, jobId, values)
      : await scheduleInterviewAction(application.id, jobId, values);
    setIsSubmitting(false);
    if (result.error) return toast.error(result.error);
    toast.success(isReschedule ? "Interview rescheduled — candidate notified" : "Interview scheduled");
    router.refresh();
    onClose();
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isReschedule ? "Reschedule interview" : "Schedule interview"}</DialogTitle>
          <DialogDescription>{application.profiles?.full_name ?? "Applicant"}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Mode</Label>
            <Select value={mode} onValueChange={(v) => setMode(v as typeof mode)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="offline">Offline (in-person)</SelectItem>
                <SelectItem value="hybrid">Hybrid</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {mode !== "offline" && (
            <>
              <div className="space-y-1.5">
                <Label>Platform</Label>
                <Select value={platform} onValueChange={setPlatform}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Google Meet">Google Meet</SelectItem>
                    <SelectItem value="Zoom">Zoom</SelectItem>
                    <SelectItem value="Microsoft Teams">Microsoft Teams</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Meeting link</Label>
                <Input value={meetingLink} onChange={(e) => setMeetingLink(e.target.value)} placeholder="https://meet.google.com/…" />
              </div>
            </>
          )}
          {mode !== "online" && (
            <div className="space-y-1.5">
              <Label>Location</Label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Office address" />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Date & time</Label>
              <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Duration (minutes)</Label>
              <Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Panel members</Label>
            <TagInput value={panelMembers} onChange={setPanelMembers} placeholder="Names of interviewers…" />
          </div>
          <div className="space-y-1.5">
            <Label>Instructions for the candidate</Label>
            <Textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} rows={3} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : isReschedule ? "Save new time" : "Schedule interview"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SendOfferDialog({
  application, jobId, onClose,
}: { application: PipelineApplication; jobId: string; onClose: () => void }) {
  const router = useRouter();
  const [positionTitle, setPositionTitle] = React.useState("");
  const [salary, setSalary] = React.useState("");
  const [startDate, setStartDate] = React.useState("");
  const [benefits, setBenefits] = React.useState("");
  const [terms, setTerms] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    const result = await sendOfferAction(application.id, jobId, {
      position_title: positionTitle, salary, currency: "LKR", start_date: startDate, benefits, terms,
    });
    setIsSubmitting(false);
    if (result.error) return toast.error(result.error);
    toast.success("Offer sent");
    router.refresh();
    onClose();
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send offer</DialogTitle>
          <DialogDescription>{application.profiles?.full_name ?? "Applicant"}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Position title</Label>
            <Input value={positionTitle} onChange={(e) => setPositionTitle(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Salary (LKR)</Label>
              <Input type="number" value={salary} onChange={(e) => setSalary(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Start date</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Benefits</Label>
            <Textarea value={benefits} onChange={(e) => setBenefits(e.target.value)} rows={2} />
          </div>
          <div className="space-y-1.5">
            <Label>Terms</Label>
            <Textarea value={terms} onChange={(e) => setTerms(e.target.value)} rows={2} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Sending…" : "Send offer"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function HiredPromptDialog({ jobId, onClose }: { jobId: string; onClose: () => void }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  async function handleClose() {
    setIsSubmitting(true);
    const result = await archiveJobAction(jobId);
    setIsSubmitting(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Listing removed — no longer visible to applicants");
    router.refresh();
    onClose();
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PartyPopper className="h-5 w-5 text-accent" /> Candidate hired!
          </DialogTitle>
          <DialogDescription>
            Would you like to keep this job listing open for other candidates, or remove it now that the role is filled?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Keep it open</Button>
          <Button onClick={handleClose} disabled={isSubmitting}>
            {isSubmitting ? "Removing…" : "Remove this listing"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
