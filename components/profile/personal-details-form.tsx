"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { personalDetailsSchema } from "@/lib/validations/applicant-profile";
import { updatePersonalDetailsAction } from "@/app/dashboard/applicant/profile/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { ApplicantProfile } from "@/types/database.types";
import type { z } from "zod";

type FormValues = z.infer<typeof personalDetailsSchema>;
type NAField = "passport_not_applicable" | "driving_license_not_applicable" | "github_not_applicable" | "linkedin_not_applicable" | "behance_not_applicable" | "portfolio_not_applicable" | "website_not_applicable";

interface FieldSpec {
  name: keyof FormValues;
  label: string;
  /** If set, renders an "N/A" checkbox next to this field that disables and clears it. */
  naField?: NAField;
}

const FIELD_GROUPS: { legend: string; fields: FieldSpec[] }[] = [
  {
    legend: "Name",
    fields: [
      { name: "first_name", label: "First name" },
      { name: "middle_name", label: "Middle name" },
      { name: "last_name", label: "Last name" },
    ],
  },
  {
    legend: "Identity",
    fields: [
      { name: "gender", label: "Gender" },
      { name: "nationality", label: "Nationality" },
      { name: "nic_number", label: "NIC number" },
      { name: "passport_number", label: "Passport number", naField: "passport_not_applicable" },
      { name: "driving_license_number", label: "Driving license number", naField: "driving_license_not_applicable" },
    ],
  },
  {
    legend: "Contact",
    fields: [
      { name: "phone", label: "Phone" },
      { name: "address_line", label: "Address" },
      { name: "district", label: "District" },
      { name: "province", label: "Province" },
      { name: "country", label: "Country" },
    ],
  },
  {
    legend: "Emergency contact",
    fields: [
      { name: "emergency_contact_name", label: "Emergency contact name" },
      { name: "emergency_contact_phone", label: "Emergency contact phone" },
    ],
  },
  {
    legend: "Social & portfolio",
    fields: [
      { name: "github_url", label: "GitHub", naField: "github_not_applicable" },
      { name: "linkedin_url", label: "LinkedIn", naField: "linkedin_not_applicable" },
      { name: "behance_url", label: "Behance", naField: "behance_not_applicable" },
      { name: "portfolio_url", label: "Portfolio", naField: "portfolio_not_applicable" },
      { name: "website_url", label: "Website", naField: "website_not_applicable" },
    ],
  },
];

export function PersonalDetailsForm({ profile }: { profile: ApplicantProfile }) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(personalDetailsSchema),
    defaultValues: {
      first_name: profile.first_name ?? "",
      middle_name: profile.middle_name ?? "",
      last_name: profile.last_name ?? "",
      gender: profile.gender ?? "",
      nationality: profile.nationality ?? "",
      nic_number: profile.nic_number ?? "",
      passport_number: profile.passport_number ?? "",
      passport_not_applicable: profile.passport_not_applicable ?? false,
      driving_license_number: profile.driving_license_number ?? "",
      driving_license_not_applicable: profile.driving_license_not_applicable ?? false,
      phone: profile.phone ?? "",
      address_line: profile.address_line ?? "",
      district: profile.district ?? "",
      province: profile.province ?? "",
      country: profile.country ?? "Sri Lanka",
      emergency_contact_name: profile.emergency_contact_name ?? "",
      emergency_contact_phone: profile.emergency_contact_phone ?? "",
      github_url: profile.github_url ?? "",
      github_not_applicable: profile.github_not_applicable ?? false,
      linkedin_url: profile.linkedin_url ?? "",
      linkedin_not_applicable: profile.linkedin_not_applicable ?? false,
      behance_url: profile.behance_url ?? "",
      behance_not_applicable: profile.behance_not_applicable ?? false,
      portfolio_url: profile.portfolio_url ?? "",
      portfolio_not_applicable: profile.portfolio_not_applicable ?? false,
      website_url: profile.website_url ?? "",
      website_not_applicable: profile.website_not_applicable ?? false,
    },
  });

  async function onSubmit(values: FormValues) {
    const result = await updatePersonalDetailsAction(values);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Personal details saved");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {FIELD_GROUPS.map((group) => (
        <fieldset key={group.legend}>
          <legend className="font-display font-semibold">{group.legend}</legend>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            {group.fields.map((field) => {
              const isNA = field.naField ? watch(field.naField) : false;
              return (
                <div key={field.name} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={field.name}>{field.label}</Label>
                    {field.naField && (
                      <div className="flex items-center gap-1.5">
                        <Checkbox
                          id={field.naField}
                          checked={Boolean(isNA)}
                          onCheckedChange={(checked) => {
                            setValue(field.naField as NAField, Boolean(checked));
                            if (checked) setValue(field.name, "" as never);
                          }}
                        />
                        <Label htmlFor={field.naField} className="text-xs font-normal text-muted-foreground">
                          N/A
                        </Label>
                      </div>
                    )}
                  </div>
                  <Input
                    id={field.name}
                    disabled={Boolean(isNA)}
                    placeholder={isNA ? "Marked as not applicable" : undefined}
                    {...register(field.name)}
                  />
                  {errors[field.name] && (
                    <p className="text-xs text-destructive">{errors[field.name]?.message as string}</p>
                  )}
                </div>
              );
            })}
          </div>
        </fieldset>
      ))}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving…" : "Save personal details"}
      </Button>
    </form>
  );
}
