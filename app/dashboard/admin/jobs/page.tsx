import { jobRepository } from "@/lib/repositories/job-repository";
import { AdminJobsManager } from "@/components/admin/admin-jobs-manager";

export default async function AdminJobsPage() {
  const jobs = await jobRepository.listAllForAdmin();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Job Postings</h1>
        <p className="text-sm text-muted-foreground">
          Every job posting on the platform, across every company. Deactivate a
          listing to take it down immediately, or reactivate one that was closed.
        </p>
      </div>
      <AdminJobsManager jobs={jobs} />
    </div>
  );
}
