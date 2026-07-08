import type { Metadata } from "next";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Pricing",
  description: "JobMo is free for applicants, and free for employers today — with plans ready for when that changes.",
};

const PLANS = [
  {
    name: "Free",
    price: "Rs. 0",
    tagline: "Applicants, always. Employers, for now.",
    features: ["Unlimited job applications", "AI resume builder (2 templates)", "1 active job posting", "Basic applicant pipeline"],
    highlighted: false,
  },
  {
    name: "Starter",
    price: "Coming soon",
    tagline: "For growing teams hiring regularly",
    features: ["5 active job postings", "AI candidate ranking", "Interview scheduling", "Email support"],
    highlighted: true,
  },
  {
    name: "Professional",
    price: "Coming soon",
    tagline: "For established hiring teams",
    features: ["Unlimited job postings", "Advanced analytics", "Recruitment CRM", "Priority support"],
    highlighted: false,
  },
  {
    name: "Enterprise",
    price: "Talk to us",
    tagline: "For large organizations",
    features: ["Custom RBAC & SSO", "Dedicated account manager", "SLA & onboarding support", "API access"],
    highlighted: false,
  },
];

export default function PricingPage() {
  return (
    <div className="container py-16">
      <div className="mx-auto max-w-xl text-center">
        <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
          Simple pricing, built to grow with you
        </h1>
        <p className="mt-3 text-muted-foreground">
          JobMo is completely free for applicants. Employers are free during
          our early access period — paid plans below reflect where we&apos;re headed.
        </p>
      </div>

      <div className="mt-12 grid gap-6 lg:grid-cols-4">
        {PLANS.map((plan) => (
          <Card
            key={plan.name}
            className={plan.highlighted ? "border-primary shadow-md ring-1 ring-primary" : ""}
          >
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <p className="font-display text-2xl font-semibold">{plan.price}</p>
              <p className="text-sm text-muted-foreground">{plan.tagline}</p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2.5 text-sm">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                className="mt-6 w-full"
                variant={plan.highlighted ? "default" : "outline"}
                disabled={plan.price === "Coming soon"}
              >
                {plan.price === "Talk to us" ? "Contact sales" : plan.price === "Rs. 0" ? "Get started" : "Coming soon"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
