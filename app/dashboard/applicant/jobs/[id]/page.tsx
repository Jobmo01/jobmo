import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { applicationRepository } from "@/lib/repositories/application-repository";
import { interviewRepository } from "@/lib/repositories/interview-repository";
import { offerRepository } from "@/lib/repositories/offer-repository";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InterviewCard } from "@/components/applicant/interview-card";
import { OfferCard } from "@/components/applicant/offer-card";

const STATUS_VARIANT: Record<string, "outline" | "success" | "destructive" | "secondary" | "accent"> = {
  applied: "outline", viewed: "outline", shortlisted: "accent", assessment: "accent",
  interview_scheduled: "accent", interview_completed: "accent", pending_decision: "secondary",
  selected: "success", rejected: "destructive", offer_sent: "success", offer_accepted: "success",
  offer_rejected: "destructive", hired: "success",
};

export default async function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const application = await applicationRepository.getById(id);
  if (!application) notFound();

  const [interviews, offer, history] = await Promise.all([
    interviewRepository.listForApplication(application.id),
    offerRepository.getForApplication(application.id),
    applicationRepository.listStatusHistory(application.id),
  ]);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link href="/dashboard/applicant/jobs" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to Applied Jobs
        </Link>
        <div className="mt-2 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-semibold">{application.job_postings?.title}</h1>
            <p className="text-sm text-muted-foreground">{application.job_postings?.companies?.name}</p>
          </div>
          <Badge variant={STATUS_VARIANT[application.status] ?? "outline"}>
            {application.status.replace(/_/g, " ")}
          </Badge>
        </div>
      </div>

      {offer && <OfferCard offer={offer} applicationId={application.id} />}

      {interviews.map((interview) => (
        <InterviewCard key={interview.id} interview={interview} applicationId={application.id} />
      ))}

      <Card>
        <CardHeader><CardTitle>Timeline</CardTitle></CardHeader>
        <CardContent>
          <ol className="space-y-3 border-l border-border pl-4">
            <li className="relative text-sm">
              <span className="absolute -left-[21px] top-1 h-2 w-2 rounded-full bg-primary" />
              Applied — {format(new Date(application.applied_at), "d MMM yyyy, h:mm a")}
            </li>
            {history.map((h) => (
              <li key={h.id} className="relative text-sm">
                <span className="absolute -left-[21px] top-1 h-2 w-2 rounded-full bg-primary" />
                Status changed to <strong>{h.to_status.replace(/_/g, " ")}</strong> —{" "}
                {format(new Date(h.created_at), "d MMM yyyy, h:mm a")}
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
