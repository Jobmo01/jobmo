import Link from "next/link";
import { Users2 } from "lucide-react";
import { format } from "date-fns";
import { profileRepository } from "@/lib/repositories/profile-repository";
import { companyRepository } from "@/lib/repositories/company-repository";
import { talentPoolRepository } from "@/lib/repositories/talent-pool-repository";
import { Card, CardContent } from "@/components/ui/card";
import { TalentPoolRemoveButton } from "@/components/employer/talent-pool-remove-button";

export default async function TalentPoolPage() {
  const account = await profileRepository.getCurrent();
  if (!account) return null;

  const company = await companyRepository.getByOwner(account.id);
  if (!company) return null;

  const entries = await talentPoolRepository.listForCompany(company.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Talent Pool</h1>
        <p className="text-sm text-muted-foreground">
          Candidates you&apos;ve saved for future roles — people who were a good fit but
          weren&apos;t right for the specific position they applied to.
        </p>
      </div>

      {entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border p-12 text-center">
          <Users2 className="h-8 w-8 text-muted-foreground" />
          <p className="mt-3 max-w-sm text-sm text-muted-foreground">
            Nothing here yet. From any candidate&apos;s pipeline card, click &quot;Save to
            Talent Pool&quot; to keep them in mind for a future opening.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {entries.map((entry: any) => (
            <Card key={entry.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Link
                      href={`/dashboard/employer/candidates/${entry.applicant_id}`}
                      className="font-medium hover:text-primary hover:underline"
                    >
                      {entry.profile?.full_name ?? entry.profile?.email ?? "Applicant"}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {entry.applicant_profile?.district ?? ""}
                      {entry.applicant_profile?.phone ? ` • ${entry.applicant_profile.phone}` : ""}
                    </p>
                  </div>
                  <TalentPoolRemoveButton id={entry.id} />
                </div>
                {entry.note && (
                  <p className="mt-2 rounded-md bg-secondary/50 p-2 text-sm text-muted-foreground">{entry.note}</p>
                )}
                <p className="mt-2 text-xs text-muted-foreground">
                  Added {format(new Date(entry.created_at), "d MMM yyyy")}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
