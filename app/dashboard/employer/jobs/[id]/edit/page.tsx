import { notFound } from "next/navigation";
import { jobRepository } from "@/lib/repositories/job-repository";
import { JobPostingForm } from "@/components/employer/job-posting-form";

export default async function EditJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = await jobRepository.getById(id);
  if (!job) notFound();

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Edit Job</h1>
        <p className="text-sm text-muted-foreground">{job.title}</p>
      </div>
      <JobPostingForm job={job} />
    </div>
  );
}
