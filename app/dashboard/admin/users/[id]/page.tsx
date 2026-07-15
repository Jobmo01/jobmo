import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { ArrowLeft, Phone, Mail, MapPin, Briefcase, LifeBuoy, ScrollText } from "lucide-react";
import { adminRepository } from "@/lib/repositories/admin-repository";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const STATUS_VARIANT: Record<string, "success" | "destructive" | "outline"> = {
  active: "success", suspended: "destructive", pending_verification: "outline", deleted: "destructive",
};

const TICKET_VARIANT: Record<string, "outline" | "secondary" | "success" | "destructive"> = {
  open: "outline", in_progress: "secondary", resolved: "success", closed: "destructive",
};

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await adminRepository.getUserDetail(id);
  if (!detail) notFound();

  const { profile, applicantProfile, applications, company, jobs, supportTickets, auditLogs } = detail;

  return (
    <div className="max-w-4xl space-y-6">
      <Link href="/dashboard/admin/users" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Users
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">{profile.full_name ?? "Unnamed user"}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {profile.email}</span>
            {applicantProfile?.phone && (
              <span className="inline-flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {applicantProfile.phone}</span>
            )}
            {applicantProfile?.district && (
              <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {applicantProfile.district}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{profile.role.replace("_", " ")}</Badge>
          <Badge variant={STATUS_VARIANT[profile.status]}>{profile.status.replace("_", " ")}</Badge>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">Joined {format(new Date(profile.created_at), "d MMM yyyy")}</p>

      {/* Applicant-specific: profile summary + applications */}
      {profile.role === "applicant" && applicantProfile && (
        <Card>
          <CardHeader><CardTitle>Profile summary</CardTitle></CardHeader>
          <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
            <p><span className="text-muted-foreground">NIC:</span> {applicantProfile.nic_number ?? "—"}</p>
            <p><span className="text-muted-foreground">Date of birth:</span> {applicantProfile.date_of_birth ? format(new Date(applicantProfile.date_of_birth), "d MMM yyyy") : "Not set"}</p>
            <p><span className="text-muted-foreground">Address:</span> {applicantProfile.address_line ?? "—"}</p>
            <p><span className="text-muted-foreground">Expected salary:</span> {applicantProfile.expected_salary_min ? `${applicantProfile.expected_salary_min.toLocaleString()} – ${applicantProfile.expected_salary_max?.toLocaleString() ?? "?"}` : "—"}</p>
          </CardContent>
        </Card>
      )}

      {profile.role === "applicant" && (
        <Card>
          <CardHeader><CardTitle>Applications ({applications.length})</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {applications.length === 0 ? (
              <p className="text-sm text-muted-foreground">No applications yet.</p>
            ) : (
              applications.map((app: any) => (
                <div key={app.id} className="flex items-center justify-between rounded-md border border-border p-3 text-sm">
                  <div>
                    <p className="font-medium">{app.job_postings?.title ?? "Unknown role"}</p>
                    <p className="text-xs text-muted-foreground">{app.job_postings?.companies?.name}</p>
                  </div>
                  <Badge variant="outline">{app.status.replace(/_/g, " ")}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {/* Employer-specific: company + jobs */}
      {profile.role === "employer" && (
        <Card>
          <CardHeader><CardTitle>Company</CardTitle></CardHeader>
          <CardContent>
            {company ? (
              <div className="space-y-2 text-sm">
                <p className="font-medium">{company.name}</p>
                <div className="flex flex-wrap gap-x-4 text-muted-foreground">
                  {company.phone && <span className="inline-flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {company.phone}</span>}
                  {company.industry && <span>{company.industry}</span>}
                </div>
                <Link href={`/dashboard/admin/companies/${company.id}`} className="inline-block text-primary hover:underline">
                  View full company profile →
                </Link>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No company profile set up yet.</p>
            )}
          </CardContent>
        </Card>
      )}

      {profile.role === "employer" && jobs.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Briefcase className="h-4 w-4" /> Job postings ({jobs.length})</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {jobs.map((job: any) => (
              <div key={job.id} className="flex items-center justify-between rounded-md border border-border p-3 text-sm">
                <p className="font-medium">{job.title}</p>
                <Badge variant="outline">{job.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Shared: support tickets */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><LifeBuoy className="h-4 w-4" /> Support tickets ({supportTickets.length})</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {supportTickets.length === 0 ? (
            <p className="text-sm text-muted-foreground">No support tickets from this user.</p>
          ) : (
            supportTickets.map((t: any) => (
              <Link key={t.id} href={`/dashboard/admin/support/${t.id}`} className="flex items-center justify-between rounded-md border border-border p-3 text-sm hover:bg-secondary/50">
                <div>
                  <p className="font-medium">{t.subject}</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(t.created_at), "d MMM yyyy")}</p>
                </div>
                <Badge variant={TICKET_VARIANT[t.status]}>{t.status.replace("_", " ")}</Badge>
              </Link>
            ))
          )}
        </CardContent>
      </Card>

      {/* Shared: recent audit log entries about this user */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><ScrollText className="h-4 w-4" /> Recent account activity</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {auditLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recorded activity for this account.</p>
          ) : (
            auditLogs.map((log: any) => (
              <div key={log.id} className="flex items-center justify-between text-sm">
                <span className="font-mono text-xs">{log.action}</span>
                <span className="text-xs text-muted-foreground">{format(new Date(log.created_at), "d MMM yyyy, h:mm a")}</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
