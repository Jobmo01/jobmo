import { z } from "zod";

const optionalString = z.string().trim().optional().or(z.literal("")).transform((v) => (v === "" ? undefined : v));
const optionalUrl = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .transform((v) => (v === "" ? undefined : v))
  .refine((v) => !v || /^https?:\/\//.test(v), "Must start with http:// or https://");

export const companyProfileSchema = z.object({
  name: z.string().min(1, "Company name is required"),
  tagline: optionalString,
  description: optionalString,
  industry: optionalString,
  company_size: optionalString,
  founded_year: z.coerce.number().min(1800).max(2100).optional(),
  phone: optionalString,
  locations: z.array(z.string()).default([]),
  website_url: optionalUrl,
  linkedin_url: optionalUrl,
  facebook_url: optionalUrl,
  twitter_url: optionalUrl,
  benefits: z.array(z.string()).default([]),
  culture_description: optionalString,
  video_url: optionalUrl,
});

export const screeningQuestionSchema = z.object({
  question: z.string().min(1),
  required: z.boolean().default(false),
});

export const jobPostingSchema = z.object({
  title: z.string().min(1, "Job title is required"),
  description: z.string().min(1, "Job description is required"),
  required_skills: z.array(z.string()).default([]),
  preferred_skills: z.array(z.string()).default([]),
  experience_level: optionalString,
  education_requirement: optionalString,
  salary_min: z.coerce.number().min(0).optional(),
  salary_max: z.coerce.number().min(0).optional(),
  salary_currency: z.string().default("LKR"),
  show_salary: z.boolean().default(true),
  benefits: z.array(z.string()).default([]),
  work_type: z.enum(["on_site", "remote", "hybrid"]).optional(),
  location: optionalString,
  employment_type: z.enum(["full_time", "part_time", "contract", "internship", "freelance"]).optional(),
  application_deadline: optionalString,
  screening_questions: z.array(screeningQuestionSchema).default([]),
});

export const interviewSchema = z.object({
  mode: z.enum(["online", "offline", "hybrid"]),
  platform: optionalString,
  meeting_link: optionalUrl,
  location: optionalString,
  scheduled_at: z.string().min(1, "Pick a date and time"),
  duration_minutes: z.coerce.number().min(5).max(480).default(30),
  panel_members: z.array(z.string()).default([]),
  instructions: optionalString,
});

export const offerSchema = z.object({
  position_title: z.string().min(1, "Position title is required"),
  salary: z.coerce.number().min(0).optional(),
  currency: z.string().default("LKR"),
  start_date: optionalString,
  benefits: optionalString,
  terms: optionalString,
});
