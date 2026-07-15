import Link from "next/link";
import { Building2, Phone, BadgeCheck } from "lucide-react";
import { companyRepository } from "@/lib/repositories/company-repository";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const STATUS_VARIANT: Record<string, "outline" | "success" | "destructive"> = {
  pending: "outline", verified: "success", rejected: "destructive",
};

export default async function AdminCompaniesPage() {
  const companies = await companyRepository.listForAdmin();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Companies</h1>
        <p className="text-sm text-muted-foreground">
          {companies.length} compan{companies.length === 1 ? "y" : "ies"} — click any one for their
          full profile, jobs, and support history.
        </p>
      </div>

      <div className="space-y-2">
        {companies.map((c: any) => (
          <Link key={c.id} href={`/dashboard/admin/companies/${c.id}`}>
            <Card className="transition-shadow hover:shadow-md">
              <CardContent className="flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="inline-flex items-center gap-1.5 font-medium">
                      {c.name}
                      {c.verification_status === "verified" && <BadgeCheck className="h-4 w-4 text-primary" />}
                    </p>
                    <p className="text-sm text-muted-foreground">{c.owner?.full_name ?? c.owner?.email}</p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
                      {c.phone && <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" /> {c.phone}</span>}
                      {c.industry && <span>{c.industry}</span>}
                    </div>
                  </div>
                </div>
                <Badge variant={STATUS_VARIANT[c.verification_status]}>{c.verification_status}</Badge>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
