"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { updateSectionNotApplicableAction } from "@/app/dashboard/applicant/profile/actions";

type NaField =
  | "education_not_applicable" | "experience_not_applicable" | "skills_not_applicable"
  | "certifications_not_applicable" | "projects_not_applicable" | "awards_not_applicable"
  | "volunteer_not_applicable" | "hobbies_not_applicable" | "references_not_applicable";

export function SectionNaToggle({
  field, label, checked,
}: {
  field: NaField;
  label: string;
  checked: boolean;
}) {
  const router = useRouter();
  const [isPending, setIsPending] = React.useState(false);

  async function handleChange(next: boolean) {
    setIsPending(true);
    const result = await updateSectionNotApplicableAction(field, next);
    setIsPending(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2 rounded-md border border-dashed border-border bg-secondary/30 p-3">
      <Checkbox id={field} checked={checked} disabled={isPending} onCheckedChange={(c) => handleChange(Boolean(c))} />
      <Label htmlFor={field} className="text-sm font-normal text-muted-foreground">{label}</Label>
    </div>
  );
}
