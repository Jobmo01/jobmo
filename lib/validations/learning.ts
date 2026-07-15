import { z } from "zod";

const optionalString = z.string().trim().optional().or(z.literal("")).transform((v) => (v === "" ? undefined : v));
const optionalUrl = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .transform((v) => (v === "" ? undefined : v))
  .refine((v) => !v || /^https?:\/\//.test(v), "Must start with http:// or https://");

export const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, and hyphens only"),
  description: optionalString,
  icon_name: optionalString,
  sort_order: z.coerce.number().default(0),
});

export const contentSchema = z.object({
  category_id: optionalString,
  type: z.enum(["video", "article", "pdf"]),
  title: z.string().min(1, "Title is required"),
  description: optionalString,
  body: z.string().min(1, "Content body/URL is required"),
  thumbnail_url: optionalUrl,
  duration_minutes: z.coerce.number().min(0).optional(),
  sort_order: z.coerce.number().default(0),
  status: z.enum(["draft", "published"]).default("draft"),
});

export const quizSchema = z.object({
  category_id: optionalString,
  title: z.string().min(1, "Title is required"),
  description: optionalString,
  time_limit_minutes: z.coerce.number().min(1, "Must be at least 1 minute").default(10),
  passing_score_percent: z.coerce.number().min(0).max(100).default(70),
  status: z.enum(["draft", "published"]).default("draft"),
});

export const quizQuestionOptionSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1, "Option text is required"),
});

export const quizQuestionSchema = z.object({
  question_text: z.string().min(1, "Question text is required"),
  options: z.array(quizQuestionOptionSchema).min(2, "At least 2 options are required"),
  correct_option_id: z.string().min(1, "Select the correct option"),
  sort_order: z.coerce.number().default(0),
});
