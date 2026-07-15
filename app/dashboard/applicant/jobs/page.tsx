import { profileRepository } from "@/lib/repositories/profile-repository";
import { applicationRepository } from "@/lib/repositories/application-repository";
import { AppliedJobsList } from "@/components/applicant/applied-jobs-list";

export default async function AppliedJobsPage() {
  const account = await profileRepository.getCurrent();
  if (!account) return null;

  const applications = await applicationRepository.listForApplicant(account.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Applied Jobs</h1>
        <p className="text-sm text-muted-foreground">Track every application in one place.</p>
      </div>

      <AppliedJobsList applications={applications as any} />
    </div>
  );
}
