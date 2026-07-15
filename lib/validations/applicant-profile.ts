import { z } from "zod";

const optionalString = z.string().trim().optional().or(z.literal("")).transform((v) => (v === "" ? undefined : v));
const optionalDate = z.string().trim().optional().or(z.literal("")).transform((v) => (v === "" ? undefined : v));
const optionalUrl = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .transform((v) => (v === "" ? undefined : v))
  .refine((v) => !v || /^https?:\/\//.test(v), "Must start with http:// or https://");

export const personalDetailsSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  middle_name: optionalString,
  last_name: z.string().min(1, "Last name is required"),
  gender: optionalString,
  nationality: optionalString,
  nic_number: optionalString,
  passport_number: optionalString,
  passport_not_applicable: z.boolean().default(false),
  driving_license_number: optionalString,
  driving_license_not_applicable: z.boolean().default(false),
  phone: z.string().min(7, "Enter a valid phone number"),
  address_line: z.string().min(1, "Address is required"),
  district: z.string().min(1, "District is required"),
  province: optionalString,
  country: optionalString,
  emergency_contact_name: optionalString,
  emergency_contact_phone: optionalString,
  github_url: optionalUrl,
  github_not_applicable: z.boolean().default(false),
  linkedin_url: optionalUrl,
  linkedin_not_applicable: z.boolean().default(false),
  behance_url: optionalUrl,
  behance_not_applicable: z.boolean().default(false),
  portfolio_url: optionalUrl,
  portfolio_not_applicable: z.boolean().default(false),
  website_url: optionalUrl,
  website_not_applicable: z.boolean().default(false),
});

export const dobChangeRequestSchema = z.object({
  requested_dob: z.string().min(1, "Select a date of birth"),
  reason: z.string().min(10, "Explain the reason in at least 10 characters"),
});

export const preferencesSchema = z.object({
  expected_salary_min: z.coerce.number().min(0).optional(),
  expected_salary_max: z.coerce.number().min(0).optional(),
  salary_currency: z.string().default("LKR"),
  availability_date: optionalDate,
  preferred_locations: z.array(z.string()).default([]),
  remote_preference: z.enum(["on_site", "hybrid", "remote", "flexible"]).optional(),
  industry_preference: z.array(z.string()).default([]),
  employment_type_preference: z
    .array(z.enum(["full_time", "part_time", "contract", "internship", "freelance"]))
    .default([]),
  notice_period_days: z.coerce.number().min(0).optional(),
  profile_visible_to_employers: z.boolean().default(true),
});

export const educationSchema = z.object({
  institution: z.string().min(1, "Institution is required"),
  qualification: z.string().min(1, "Qualification is required"),
  field_of_study: optionalString,
  grade: optionalString,
  start_date: optionalDate,
  end_date: optionalDate,
});

export const experienceSchema = z.object({
  company: z.string().min(1, "Company is required"),
  position: z.string().min(1, "Position is required"),
  description: optionalString,
  employment_type: z.enum(["full_time", "part_time", "contract", "internship", "freelance"]).optional(),
  is_current: z.boolean().default(false),
  start_date: optionalDate,
  end_date: optionalDate,
  reference_name: optionalString,
  reference_contact: optionalString,
});

export const skillSchema = z.object({
  name: z.string().min(1, "Skill name is required"),
  proficiency: z.enum(["beginner", "intermediate", "advanced", "expert"]).default("intermediate"),
});

export const certificationSchema = z.object({
  name: z.string().min(1, "Certification name is required"),
  issuer: optionalString,
  issue_date: optionalDate,
  expiry_date: optionalDate,
  credential_url: optionalUrl,
});

export const projectSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: optionalString,
  project_url: optionalUrl,
  start_date: optionalDate,
  end_date: optionalDate,
});

export const awardSchema = z.object({
  title: z.string().min(1, "Title is required"),
  issuer: optionalString,
  award_date: optionalDate,
  description: optionalString,
});

export const volunteerSchema = z.object({
  organization: z.string().min(1, "Organization is required"),
  role: optionalString,
  description: optionalString,
  start_date: optionalDate,
  end_date: optionalDate,
});

export const languageSchema = z.object({
  name: z.string().min(1, "Language is required"),
  proficiency: z.enum(["beginner", "intermediate", "advanced", "expert"]).default("intermediate"),
});

export const hobbySchema = z.object({
  name: z.string().min(1, "Hobby is required"),
});

export const referenceSchema = z.object({
  name: z.string().min(1, "Name is required"),
  relationship: optionalString,
  company: optionalString,
  email: z.string().email().optional().or(z.literal("")).transform((v) => (v === "" ? undefined : v)),
  phone: optionalString,
});

export const deleteAccountSchema = z.object({
  password: z.string().min(1, "Enter your password to confirm"),
  confirmation: z.literal("DELETE", { errorMap: () => ({ message: 'Type "DELETE" to confirm' }) }),
});

export const changePasswordSchema = z
  .object({
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
