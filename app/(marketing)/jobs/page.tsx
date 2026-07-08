import type { Metadata } from "next";
import { MapPin, Briefcase, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Jobs in Sri Lanka",
  description: "Browse open roles matched to your profile with JobMo's AI.",
};

// Placeholder data — replaced by a live, filterable Supabase query in Phase 3/4.
const JOBS = [
  { title: "Senior Frontend Engineer", company: "Dialog Axiata", location: "Colombo", type: "Full-time" },
  { title: "Product Designer", company: "Sysco LABS", location: "Colombo", type: "Full-time" },
  { title: "Data Analyst", company: "Cargills", location: "Colombo", type: "Full-time" },
  { title: "DevOps Engineer", company: "WSO2", location: "Colombo", type: "Contract" },
  { title: "QA Automation Engineer", company: "Virtusa", location: "Kandy", type: "Full-time" },
  { title: "Business Analyst", company: "MAS Holdings", location: "Colombo", type: "Full-time" },
];

export default function JobsPage() {
  return (
    <div className="container py-16">
      <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
        Find your next role
      </h1>
      <p className="mt-2 text-muted-foreground">
        {JOBS.length} open roles today. Sign in to see your match score on each.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search jobs, companies, or skills" className="pl-9" />
        </div>
        <Input placeholder="Location" className="sm:max-w-[200px]" />
        <Button>Search</Button>
      </div>

      <div className="mt-10 grid gap-4">
        {JOBS.map((job) => (
          <Card key={job.title + job.company} className="transition-shadow hover:shadow-md">
            <CardContent className="flex flex-col justify-between gap-3 p-5 sm:flex-row sm:items-center">
              <div>
                <h2 className="font-display font-semibold">{job.title}</h2>
                <p className="text-sm text-muted-foreground">{job.company}</p>
                <div className="mt-2 flex gap-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> {job.location}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Briefcase className="h-3.5 w-3.5" /> {job.type}
                  </span>
                </div>
              </div>
              <Button variant="outline" size="sm">
                View role
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
