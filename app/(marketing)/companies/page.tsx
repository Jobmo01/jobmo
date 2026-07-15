import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { BadgeCheck } from "lucide-react";
import { companyRepository } from "@/lib/repositories/company-repository";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Companies Hiring in Sri Lanka",
  description: "Browse verified employers hiring on JobMo.",
};

export default async function CompaniesPage() {
  const companies = await companyRepository.listPublic();

  return (
    <div className="container py-16">
      <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
        Companies hiring now
      </h1>
      <p className="mt-2 text-muted-foreground">Employers building their teams on JobMo.</p>

      {companies.length === 0 ? (
        <div className="mt-10 rounded-lg border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
          No company profiles yet — check back soon.
        </div>
      ) : (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {companies.map((c) => (
            <Link key={c.id} href={`/companies/${c.id}`}>
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    {c.logo_url ? (
                      <Image src={c.logo_url} alt={c.name} width={40} height={40} className="rounded-md object-cover" />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary text-sm font-semibold">
                        {c.name.charAt(0)}
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <h2 className="font-display font-semibold">{c.name}</h2>
                      {c.verification_status === "verified" && (
                        <BadgeCheck className="h-4 w-4 text-primary" aria-label="Verified employer" />
                      )}
                    </div>
                  </div>
                  {c.tagline && <p className="mt-2 text-sm text-muted-foreground">{c.tagline}</p>}
                  {c.industry && <p className="mt-3 text-xs text-muted-foreground">{c.industry}</p>}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
