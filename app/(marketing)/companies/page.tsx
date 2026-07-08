import type { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";
import { BadgeCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Companies Hiring in Sri Lanka",
  description: "Browse verified employers hiring on JobMo.",
};

// Placeholder data — replaced by live employer profiles in Phase 3 (Employer Module).
const COMPANIES = [
  { name: "Dialog Axiata", industry: "Telecommunications", openRoles: 12, verified: true },
  { name: "WSO2", industry: "Software", openRoles: 8, verified: true },
  { name: "Sysco LABS", industry: "Retail Tech", openRoles: 5, verified: true },
  { name: "Virtusa", industry: "IT Services", openRoles: 21, verified: true },
  { name: "MAS Holdings", industry: "Apparel Manufacturing", openRoles: 6, verified: false },
  { name: "Cargills", industry: "Retail", openRoles: 4, verified: true },
];

export default function CompaniesPage() {
  return (
    <div className="container py-16">
      <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
        Companies hiring now
      </h1>
      <p className="mt-2 text-muted-foreground">
        Verified employers with active openings on JobMo.
      </p>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {COMPANIES.map((c) => (
          <Card key={c.name} className="transition-shadow hover:shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <h2 className="font-display font-semibold">{c.name}</h2>
                {c.verified && (
                  <BadgeCheck className="h-4 w-4 text-primary" aria-label="Verified employer" />
                )}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{c.industry}</p>
              <p className="mt-4 text-sm font-medium text-accent">{c.openRoles} open roles</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
