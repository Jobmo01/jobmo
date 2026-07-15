import { JobPostingForm } from "@/components/employer/job-posting-form";

export default function NewJobPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Post a Job</h1>
        <p className="text-sm text-muted-foreground">Save as a draft anytime, or publish when it&apos;s ready.</p>
      </div>
      <JobPostingForm />
    </div>
  );
}
