"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { adminUpdateJobStatusAction } from "@/app/dashboard/admin/jobs/actions";
import type { JobStatus } from "@/types/database.types";

const STATUS_VARIANT: Record<JobStatus, "outline" | "success" | "secondary" | "destructive"> = {
  draft: "outline", published: "success", closed: "secondary", archived: "destructive",
};

interface AdminJobRow {
  id: string;
  title: string;
  status: JobStatus;
  work_type: string | null;
  employment_type: string | null;
  created_at: string;
  companies: { name: string } | null;
}

export function AdminJobsManager({ jobs }: { jobs: AdminJobRow[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  async function toggleActive(job: AdminJobRow) {
    const nextStatus: JobStatus = job.status === "published" ? "closed" : "published";
    setPendingId(job.id);
    const result = await adminUpdateJobStatusAction(job.id, nextStatus);
    setPendingId(null);
    if (result.error) return toast.error(result.error);
    toast.success(nextStatus === "published" ? "Job reactivated" : "Job deactivated");
    router.refresh();
  }

  if (jobs.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        No job postings on the platform yet.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {jobs.map((job) => (
        <Card key={job.id}>
          <CardContent className="flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center">
            <div>
              <p className="font-medium">{job.title}</p>
              <p className="text-sm text-muted-foreground">
                {job.companies?.name ?? "Unknown company"} • {job.work_type ?? "—"} • {job.employment_type?.replace("_", " ") ?? "—"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={STATUS_VARIANT[job.status]}>{job.status}</Badge>
              {(job.status === "published" || job.status === "closed") && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pendingId === job.id}
                  onClick={() => toggleActive(job)}
                >
                  {job.status === "published" ? "Deactivate" : "Reactivate"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
