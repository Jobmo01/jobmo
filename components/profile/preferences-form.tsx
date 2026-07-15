"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { preferencesSchema } from "@/lib/validations/applicant-profile";
import { updatePreferencesAction } from "@/app/dashboard/applicant/profile/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import type { ApplicantProfile } from "@/types/database.types";

const EMPLOYMENT_TYPES = [
  { value: "full_time", label: "Full-time" },
  { value: "part_time", label: "Part-time" },
  { value: "contract", label: "Contract" },
  { value: "internship", label: "Internship" },
  { value: "freelance", label: "Freelance" },
] as const;

const REMOTE_OPTIONS = [
  { value: "on_site", label: "On-site" },
  { value: "hybrid", label: "Hybrid" },
  { value: "remote", label: "Remote" },
  { value: "flexible", label: "Flexible" },
];

export function PreferencesForm({ profile }: { profile: ApplicantProfile }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [salaryMin, setSalaryMin] = React.useState(profile.expected_salary_min?.toString() ?? "");
  const [salaryMax, setSalaryMax] = React.useState(profile.expected_salary_max?.toString() ?? "");
  const [availability, setAvailability] = React.useState(profile.availability_date ?? "");
  const [locations, setLocations] = React.useState(profile.preferred_locations?.join(", ") ?? "");
  const [industries, setIndustries] = React.useState(profile.industry_preference?.join(", ") ?? "");
  const [remote, setRemote] = React.useState(profile.remote_preference ?? "");
  const [employmentTypes, setEmploymentTypes] = React.useState<string[]>(
    profile.employment_type_preference ?? []
  );
  const [noticePeriod, setNoticePeriod] = React.useState(profile.notice_period_days?.toString() ?? "");
  const [visible, setVisible] = React.useState(profile.profile_visible_to_employers);

  function toggleEmploymentType(value: string, checked: boolean) {
    setEmploymentTypes((prev) => (checked ? [...prev, value] : prev.filter((v) => v !== value)));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const raw = {
      expected_salary_min: salaryMin || undefined,
      expected_salary_max: salaryMax || undefined,
      availability_date: availability || undefined,
      preferred_locations: locations.split(",").map((s) => s.trim()).filter(Boolean),
      industry_preference: industries.split(",").map((s) => s.trim()).filter(Boolean),
      remote_preference: remote || undefined,
      employment_type_preference: employmentTypes,
      notice_period_days: noticePeriod || undefined,
      profile_visible_to_employers: visible,
      salary_currency: "LKR",
    };
    const parsed = preferencesSchema.safeParse(raw);
    if (!parsed.success) {
      toast.error(parsed.error.errors[0]?.message ?? "Invalid input");
      return;
    }
    setIsSubmitting(true);
    const result = await updatePreferencesAction(parsed.data);
    setIsSubmitting(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Preferences saved");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="salaryMin">Expected salary — min (LKR)</Label>
          <Input id="salaryMin" type="number" value={salaryMin} onChange={(e) => setSalaryMin(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="salaryMax">Expected salary — max (LKR)</Label>
          <Input id="salaryMax" type="number" value={salaryMax} onChange={(e) => setSalaryMax(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="availability">Availability date</Label>
          <Input id="availability" type="date" value={availability} onChange={(e) => setAvailability(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="noticePeriod">Notice period (days)</Label>
          <Input id="noticePeriod" type="number" value={noticePeriod} onChange={(e) => setNoticePeriod(e.target.value)} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="locations">Preferred locations (comma-separated)</Label>
          <Input id="locations" value={locations} onChange={(e) => setLocations(e.target.value)}
            placeholder="Colombo, Kandy, Remote" />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="industries">Industry preference (comma-separated)</Label>
          <Input id="industries" value={industries} onChange={(e) => setIndustries(e.target.value)}
            placeholder="Software, Fintech, Telecom" />
        </div>
        <div className="space-y-1.5">
          <Label>Remote preference</Label>
          <Select value={remote} onValueChange={setRemote}>
            <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
            <SelectContent>
              {REMOTE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label>Employment type</Label>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {EMPLOYMENT_TYPES.map((type) => (
            <div key={type.value} className="flex items-center gap-2">
              <Checkbox
                id={`et-${type.value}`}
                checked={employmentTypes.includes(type.value)}
                onCheckedChange={(checked) => toggleEmploymentType(type.value, Boolean(checked))}
              />
              <Label htmlFor={`et-${type.value}`} className="font-normal">{type.label}</Label>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-md border border-border p-3">
        <Checkbox id="visible" checked={visible} onCheckedChange={(c) => setVisible(Boolean(c))} />
        <Label htmlFor="visible" className="font-normal">
          Make my profile visible to employers for matching
        </Label>
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving…" : "Save preferences"}
      </Button>
    </form>
  );
}
