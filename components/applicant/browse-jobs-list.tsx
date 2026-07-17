"use client";

import * as React from "react";
import Link from "next/link";
import { MapPin, Briefcase, Search, Sparkles, SlidersHorizontal } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

const WORK_TYPE_OPTIONS = [
  { value: "on_site", label: "On-site" },
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
];

const EMPLOYMENT_TYPE_OPTIONS = [
  { value: "full_time", label: "Full-time" },
  { value: "part_time", label: "Part-time" },
  { value: "contract", label: "Contract" },
  { value: "internship", label: "Internship" },
  { value: "freelance", label: "Freelance" },
];

interface JobRow {
  id: string;
  title: string;
  work_type: string | null;
  location: string | null;
  employment_type: string | null;
  matchScore: number | null;
  companies: { name: string } | null;
}

export function BrowseJobsList({ jobs, appliedJobIds }: { jobs: JobRow[]; appliedJobIds: string[] }) {
  const [search, setSearch] = React.useState("");
  const [workType, setWorkType] = React.useState("all");
  const [employmentType, setEmploymentType] = React.useState("all");
  const appliedSet = React.useMemo(() => new Set(appliedJobIds), [appliedJobIds]);

  const filtered = jobs.filter((job) => {
    if (workType !== "all" && job.work_type !== workType) return false;
    if (employmentType !== "all" && job.employment_type !== employmentType) return false;
    if (search) {
      const haystack = `${job.title} ${job.companies?.name ?? ""} ${job.location ?? ""}`.toLowerCase();
      if (!haystack.includes(search.toLowerCase())) return false;
    }
    return true;
  });

  const hasActiveFilters = search || workType !== "all" || employmentType !== "all";

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by job title or company…"
            className="pl-9"
          />
        </div>
        <div className="shrink-0 sm:w-40">
          <Select value={workType} onValueChange={setWorkType}>
            <SelectTrigger><SelectValue placeholder="Work type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any work type</SelectItem>
              {WORK_TYPE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="shrink-0 sm:w-44">
          <Select value={employmentType} onValueChange={setEmploymentType}>
            <SelectTrigger><SelectValue placeholder="Employment type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any employment type</SelectItem>
              {EMPLOYMENT_TYPE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        {filtered.length} role{filtered.length === 1 ? "" : "s"}
        {hasActiveFilters ? " matching your filters" : ""}
      </p>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border p-12 text-center">
          <SlidersHorizontal className="h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">
            {jobs.length === 0 ? "No open roles yet — check back soon." : "No jobs match your search or filters."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((job) => (
            <Link key={job.id} href={`/dashboard/applicant/browse-jobs/${job.id}`}>
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="flex items-center justify-between gap-4 p-5">
                  <div>
                    <h2 className="font-display font-semibold">{job.title}</h2>
                    <p className="text-sm text-muted-foreground">{job.companies?.name}</p>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                      {(job.location || job.work_type) && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {job.location ?? job.work_type?.replace("_", " ")}
                          {job.location && job.work_type && ` (${job.work_type.replace("_", " ")})`}
                        </span>
                      )}
                      {job.employment_type && (
                        <span className="inline-flex items-center gap-1">
                          <Briefcase className="h-3.5 w-3.5" /> {job.employment_type.replace("_", " ")}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {typeof job.matchScore === "number" && (
                      <Badge variant="accent" className="gap-1">
                        <Sparkles className="h-3 w-3" /> {job.matchScore}% match
                      </Badge>
                    )}
                    {appliedSet.has(job.id) && <Badge variant="secondary">Applied</Badge>}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
