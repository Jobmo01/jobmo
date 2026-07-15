import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { ArrowLeft, Phone, Mail, Globe, Briefcase, LifeBuoy, Building2, BadgeCheck } from "lucide-react";
import { companyRepository } from "@/lib/repositories/company-repository";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const STATUS_VARIANT: Record<string, "outline" | "success" | "destructive"> = {
  pending: "outline", verified: "success", rejected: "destructive",
};

const TICKET_VARIANT: Record<string, "outline" | "secondary" | "success" | "destructive"> = {
  open: "outline", in_progress: "secondary", resolved: "success", closed: "destructive",
};

export default async function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await companyRepository.getDetailForAdmin(id);
  if (!detail) notFound();

  const { company, owner, jobs, supportTickets } = detail;

  return (
    <div className="max-w-4xl space-y-6">
      <Link href="/dashboard/admin/companies" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Companies
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {company.logo_url ? (
            <Image src={company.logo_url} alt={company.name} width={48} height={48} className="rounded-md object-cover" />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-secondary">
              <Building2 className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
          <div>
            <h1 className="inline-flex items-center gap-1.5 font-display text-2xl font-semibold">
              {company.name}
              {company.verification_status === "verified" && <BadgeCheck className="h-5 w-5 text-primary" />}
            </h1>
            <p className="text-sm text-muted-foreground">{company.tagline}</p>
          </div>
        </div>
        <Badge variant={STATUS_VARIANT[company.verification_status]}>{company.verification_status}</Badge>
      </div>

      <Card>
        <CardHeader><CardTitle>Contact & details</CardTitle></CardHeader>
        <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
          <p className="inline-flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-muted-foreground" /> {owner?.email ?? "—"}</p>
          {company.phone && <p className="inline-flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-muted-foreground" /> {company.phone}</p>}
          {company.website_url && (
            <p className="inline-flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5 text-muted-foreground" />
              <a href={company.website_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{company.website_url}</a>
            </p>
          )}
          <p><span className="text-muted-foreground">Account holder:</span> {owner?.full_name ?? "—"}</p>
          <p><span className="text-muted-foreground">Industry:</span> {company.industry ?? "—"}</p>
          <p><span className="text-muted-foreground">Company size:</span> {company.company_size ?? "—"}</p>
          <p><span className="text-muted-foreground">Founded:</span> {company.founded_year ?? "—"}</p>
          <p><span className="text-muted-foreground">Locations:</span> {company.locations?.join(", ") || "—"}</p>
        </CardContent>
      </Card>

      {company.description && (
        <Card>
          <CardHeader><CardTitle>About</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">{company.description}</p></CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Briefcase className="h-4 w-4" /> Job postings ({jobs.length})</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {jobs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No jobs posted yet.</p>
          ) : (
            jobs.map((job: any) => (
              <div key={job.id} className="flex items-center justify-between rounded-md border border-border p-3 text-sm">
                <div>
                  <p className="font-medium">{job.title}</p>
                  <p className="text-xs text-muted-foreground">Posted {format(new Date(job.created_at), "d MMM yyyy")}</p>
                </div>
                <Badge variant="outline">{job.status}</Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><LifeBuoy className="h-4 w-4" /> Support tickets ({supportTickets.length})</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {supportTickets.length === 0 ? (
            <p className="text-sm text-muted-foreground">No support tickets from this company&apos;s account.</p>
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
    </div>
  );
}
