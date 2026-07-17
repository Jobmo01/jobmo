"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, Sparkles } from "lucide-react";
import { jobPostingSchema, type screeningQuestionSchema } from "@/lib/validations/employer";
import {
  createJobAction, updateJobAction, publishJobAction,
  improveJobDescriptionAction, suggestSalaryRangeAction,
} from "@/app/dashboard/employer/jobs/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { TagInput } from "@/components/ui/tag-input";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { JobPosting } from "@/types/database.types";
import type { z } from "zod";

type FormValues = z.infer<typeof jobPostingSchema>;
type ScreeningQuestion = z.infer<typeof screeningQuestionSchema>;

const WORK_TYPES = [
  { value: "on_site", label: "On-site" },
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
];
const EMPLOYMENT_TYPES = [
  { value: "full_time", label: "Full-time" },
  { value: "part_time", label: "Part-time" },
  { value: "contract", label: "Contract" },
  { value: "internship", label: "Internship" },
  { value: "freelance", label: "Freelance" },
];

export function JobPostingForm({ job }: { job?: JobPosting }) {
  const router = useRouter();
  const [title, setTitle] = React.useState(job?.title ?? "");
  const [description, setDescription] = React.useState(job?.description ?? "");
  // Bumped whenever the description is replaced from outside the editor
  // (currently: the AI rewrite) — see RichTextEditor's key prop below and
  // its own comment for why a remount is more reliable here than trying
  // to diff "did this change come from typing or from outside" on a
  // contentEditable-based editor.
  const [descriptionResetKey, setDescriptionResetKey] = React.useState(0);
  const [requiredSkills, setRequiredSkills] = React.useState<string[]>(job?.required_skills ?? []);
  const [preferredSkills, setPreferredSkills] = React.useState<string[]>(job?.preferred_skills ?? []);
  const [experienceLevel, setExperienceLevel] = React.useState(job?.experience_level ?? "");
  const [educationRequirement, setEducationRequirement] = React.useState(job?.education_requirement ?? "");
  const [salaryMin, setSalaryMin] = React.useState(job?.salary_min?.toString() ?? "");
  const [salaryMax, setSalaryMax] = React.useState(job?.salary_max?.toString() ?? "");
  const [showSalary, setShowSalary] = React.useState(job?.show_salary ?? true);
  const [benefits, setBenefits] = React.useState<string[]>(job?.benefits ?? []);
  const [workType, setWorkType] = React.useState(job?.work_type ?? "");
  const [location, setLocation] = React.useState(job?.location ?? "");
  const [employmentType, setEmploymentType] = React.useState(job?.employment_type ?? "");
  const [deadline, setDeadline] = React.useState(job?.application_deadline ?? "");
  const [questions, setQuestions] = React.useState<ScreeningQuestion[]>(job?.screening_questions ?? []);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isImprovingDescription, setIsImprovingDescription] = React.useState(false);
  const [isSuggestingSalary, setIsSuggestingSalary] = React.useState(false);
  const [aiUnavailableNotice, setAiUnavailableNotice] = React.useState<string | null>(null);

  async function handleImproveDescription() {
    if (!title.trim()) {
      toast.error("Add a job title first so the AI has context");
      return;
    }
    setIsImprovingDescription(true);
    setAiUnavailableNotice(null);
    const result = await improveJobDescriptionAction(title, description, requiredSkills);
    setIsImprovingDescription(false);
    if (result.aiUnavailable) {
      setAiUnavailableNotice(result.error ?? "AI features aren't set up yet.");
      return;
    }
    if (result.error || !result.data) {
      toast.error(result.error ?? "Failed to improve description");
      return;
    }
    setDescription(result.data.improvedDescription);
    setDescriptionResetKey((k) => k + 1);
    toast.success(
      result.data.addedKeywords.length > 0
        ? `Description improved — emphasized: ${result.data.addedKeywords.join(", ")}`
        : "Description improved"
    );
  }

  async function handleSuggestSalary() {
    if (!title.trim()) {
      toast.error("Add a job title first so the AI has context");
      return;
    }
    setIsSuggestingSalary(true);
    setAiUnavailableNotice(null);
    const result = await suggestSalaryRangeAction({
      title, experienceLevel, workType, employmentType,
    });
    setIsSuggestingSalary(false);
    if (result.aiUnavailable) {
      setAiUnavailableNotice(result.error ?? "AI features aren't set up yet.");
      return;
    }
    if (result.error || !result.data) {
      toast.error(result.error ?? "Failed to suggest salary range");
      return;
    }
    setSalaryMin(result.data.min.toString());
    setSalaryMax(result.data.max.toString());
    toast.success(result.data.reasoning);
  }

  function buildValues(): FormValues | null {
    const raw = {
      title, description,
      required_skills: requiredSkills, preferred_skills: preferredSkills,
      experience_level: experienceLevel || undefined,
      education_requirement: educationRequirement || undefined,
      salary_min: salaryMin || undefined, salary_max: salaryMax || undefined,
      salary_currency: "LKR", show_salary: showSalary,
      benefits,
      work_type: workType || undefined,
      location: location || undefined,
      employment_type: employmentType || undefined,
      application_deadline: deadline || undefined,
      screening_questions: questions,
    };
    const parsed = jobPostingSchema.safeParse(raw);
    if (!parsed.success) {
      toast.error(parsed.error.errors[0]?.message ?? "Invalid input");
      return null;
    }
    return parsed.data;
  }

  async function handleSaveDraft() {
    const values = buildValues();
    if (!values) return;
    setIsSubmitting(true);
    const result = job ? await updateJobAction(job.id, values) : await createJobAction(values);
    setIsSubmitting(false);
    if (result.error) return toast.error(result.error);
    toast.success("Saved as draft");
    if (!job && result.jobId) router.push(`/dashboard/employer/jobs/${result.jobId}/edit`);
    else router.refresh();
  }

  async function handlePublish() {
    const values = buildValues();
    if (!values) return;
    setIsSubmitting(true);
    const saveResult = job ? await updateJobAction(job.id, values) : await createJobAction(values);
    if (saveResult.error) {
      setIsSubmitting(false);
      return toast.error(saveResult.error);
    }
    const targetId = job?.id ?? saveResult.jobId;
    if (targetId) {
      const publishResult = await publishJobAction(targetId);
      setIsSubmitting(false);
      if (publishResult.error) return toast.error(publishResult.error);
      toast.success("Job published");
      router.push("/dashboard/employer/jobs");
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Job details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title">Job title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>Description</Label>
              <Button type="button" variant="outline" size="sm" onClick={handleImproveDescription} disabled={isImprovingDescription}>
                <Sparkles className="h-3.5 w-3.5" />
                {isImprovingDescription ? "Improving…" : "Improve with AI"}
              </Button>
            </div>
            <RichTextEditor key={descriptionResetKey} value={description} onChange={setDescription} placeholder="Describe the role, responsibilities, and what makes it a great opportunity…" />
            {aiUnavailableNotice && (
              <p className="text-xs text-muted-foreground">{aiUnavailableNotice}</p>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Work type</Label>
              <Select value={workType} onValueChange={(v) => setWorkType(v as typeof workType)}>
                <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                <SelectContent>
                  {WORK_TYPES.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder={workType === "remote" ? "e.g. Remote (Sri Lanka)" : "e.g. Colombo"}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Employment type</Label>
              <Select value={employmentType} onValueChange={(v) => setEmploymentType(v as typeof employmentType)}>
                <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                <SelectContent>
                  {EMPLOYMENT_TYPES.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="experience_level">Experience level</Label>
              <Input id="experience_level" placeholder="e.g. 2-4 years" value={experienceLevel} onChange={(e) => setExperienceLevel(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="education_requirement">Education requirement</Label>
              <Input id="education_requirement" placeholder="e.g. BSc in Computer Science" value={educationRequirement} onChange={(e) => setEducationRequirement(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="deadline">Application deadline</Label>
              <Input id="deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Skills</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Required skills</Label>
            <TagInput value={requiredSkills} onChange={setRequiredSkills} placeholder="React, TypeScript…" />
          </div>
          <div className="space-y-1.5">
            <Label>Preferred skills</Label>
            <TagInput value={preferredSkills} onChange={setPreferredSkills} placeholder="GraphQL, AWS…" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Compensation & benefits</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={handleSuggestSalary} disabled={isSuggestingSalary}>
            <Sparkles className="h-3.5 w-3.5" />
            {isSuggestingSalary ? "Thinking…" : "Suggest salary range"}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="salaryMin">Salary min (LKR)</Label>
              <Input id="salaryMin" type="number" value={salaryMin} onChange={(e) => setSalaryMin(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="salaryMax">Salary max (LKR)</Label>
              <Input id="salaryMax" type="number" value={salaryMax} onChange={(e) => setSalaryMax(e.target.value)} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="showSalary" checked={showSalary} onCheckedChange={(c) => setShowSalary(Boolean(c))} />
            <Label htmlFor="showSalary" className="font-normal">Show salary range publicly</Label>
          </div>
          <div className="space-y-1.5">
            <Label>Benefits</Label>
            <TagInput value={benefits} onChange={setBenefits} placeholder="Health insurance, flexible hours…" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Screening questions</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {questions.map((q, i) => (
            <div key={i} className="flex items-start gap-2">
              <Input
                value={q.question}
                onChange={(e) => setQuestions((prev) => prev.map((p, idx) => idx === i ? { ...p, question: e.target.value } : p))}
                placeholder="e.g. How many years of React experience do you have?"
              />
              <div className="flex items-center gap-1.5 whitespace-nowrap pt-2">
                <Checkbox
                  checked={q.required}
                  onCheckedChange={(c) => setQuestions((prev) => prev.map((p, idx) => idx === i ? { ...p, required: Boolean(c) } : p))}
                />
                <Label className="text-xs font-normal">Required</Label>
              </div>
              <Button type="button" variant="ghost" size="icon" aria-label="Remove question" onClick={() => setQuestions((prev) => prev.filter((_, idx) => idx !== i))}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={() => setQuestions((prev) => [...prev, { question: "", required: false }])}>
            <Plus className="h-4 w-4" /> Add question
          </Button>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button variant="outline" onClick={handleSaveDraft} disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : "Save as draft"}
        </Button>
        <Button onClick={handlePublish} disabled={isSubmitting}>
          {isSubmitting ? "Publishing…" : "Publish job"}
        </Button>
      </div>
    </div>
  );
}
