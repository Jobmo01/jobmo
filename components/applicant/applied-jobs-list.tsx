"use client";

import * as React from "react";
import Link from "next/link";
import { Briefcase, Search, SlidersHorizontal } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

const STATUS_VARIANT: Record<string, "outline" | "success" | "destructive" | "secondary" | "accent"> = {
  applied: "outline", viewed: "outline", shortlisted: "accent", assessment: "accent",
  interview_scheduled: "accent", interview_completed: "accent", pending_decision: "secondary",
  selected: "success", rejected: "destructive", offer_sent: "success", offer_accepted: "success",
  offer_rejected: "destructive", hired: "success",
};

const STATUS_OPTIONS = [
  "applied", "viewed", "shortlisted", "assessment", "interview_scheduled", "interview_completed",
  "pending_decision", "selected", "offer_sent", "offer_accepted", "offer_rejected", "rejected", "hired",
];

interface ApplicationRow {
  id: string;
  status: string;
  job_postings: { title: string; companies: { name: string } | null } | null;
}

export function AppliedJobsList({ applications }: { applications: ApplicationRow[] }) {
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState("all");

  const filtered = applications.filter((app) => {
    if (status !== "all" && app.status !== status) return false;
    if (search) {
      const haystack = `${app.job_postings?.title ?? ""} ${app.job_postings?.companies?.name ?? ""}`.toLowerCase();
      if (!haystack.includes(search.toLowerCase())) return false;
    }
    return true;
  });

  const hasActiveFilters = search || status !== "all";

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
        <div className="shrink-0 sm:w-48">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any status</SelectItem>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {applications.length > 0 && (
        <p className="text-sm text-muted-foreground">
          {filtered.length} application{filtered.length === 1 ? "" : "s"}
          {hasActiveFilters ? " matching your filters" : ""}
        </p>
      )}

      {applications.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border p-12 text-center">
          <Briefcase className="h-8 w-8 text-muted-foreground" />
          <p className="mt-3 max-w-sm text-sm text-muted-foreground">
            You haven&apos;t applied to any jobs yet.{" "}
            <Link href="/dashboard/applicant/browse-jobs" className="text-primary hover:underline">Browse open roles</Link>.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border p-12 text-center">
          <SlidersHorizontal className="h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">No applications match your search or filters.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((app) => (
            <Link key={app.id} href={`/dashboard/applicant/jobs/${app.id}`}>
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="flex items-center justify-between p-5">
                  <div>
                    <p className="font-medium">{app.job_postings?.title}</p>
                    <p className="text-sm text-muted-foreground">{app.job_postings?.companies?.name}</p>
                  </div>
                  <Badge variant={STATUS_VARIANT[app.status] ?? "outline"}>{app.status.replace(/_/g, " ")}</Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
