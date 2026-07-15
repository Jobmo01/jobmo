import { format } from "date-fns";
import { CalendarClock } from "lucide-react";
import { profileRepository } from "@/lib/repositories/profile-repository";
import { companyRepository } from "@/lib/repositories/company-repository";
import { interviewRepository } from "@/lib/repositories/interview-repository";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const STATUS_VARIANT: Record<string, "outline" | "success" | "destructive" | "secondary"> = {
  proposed: "outline",
  accepted: "success",
  declined: "destructive",
  reschedule_requested: "secondary",
  completed: "secondary",
  cancelled: "destructive",
};

export default async function EmployerInterviewsPage() {
  const account = await profileRepository.getCurrent();
  if (!account) return null;

  const company = await companyRepository.getByOwner(account.id);
  const interviews = company ? await interviewRepository.listForCompany(company.id) : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Interviews</h1>
        <p className="text-sm text-muted-foreground">Every interview scheduled across all your job postings.</p>
      </div>

      {interviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border p-12 text-center">
          <CalendarClock className="h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">
            No interviews scheduled yet. Schedule one from a job&apos;s pipeline board.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {interviews.map((interview: any) => (
            <Card key={interview.id}>
              <CardContent className="flex items-center justify-between p-5">
                <div>
                  <p className="font-medium">
                    {interview.job_applications?.profiles?.full_name ?? "Applicant"} —{" "}
                    {interview.job_applications?.job_postings?.title}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {format(new Date(interview.scheduled_at), "d MMM yyyy, h:mm a")} • {interview.mode}
                    {interview.platform ? ` • ${interview.platform}` : ""}
                  </p>
                </div>
                <Badge variant={STATUS_VARIANT[interview.status]}>{interview.status.replace(/_/g, " ")}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
