import { describe, it, expect } from "vitest";
import { jobPostingSchema } from "@/lib/validations/employer";
import { personalDetailsSchema } from "@/lib/validations/applicant-profile";

describe("jobPostingSchema", () => {
  it("accepts a minimal valid job posting", () => {
    const result = jobPostingSchema.safeParse({
      title: "Software Engineer",
      description: "Build things.",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a job posting with no title", () => {
    const result = jobPostingSchema.safeParse({ title: "", description: "Build things." });
    expect(result.success).toBe(false);
  });

  it("rejects a job posting with no description", () => {
    const result = jobPostingSchema.safeParse({ title: "Engineer", description: "" });
    expect(result.success).toBe(false);
  });

  it("defaults screening_questions to an empty array when omitted", () => {
    const result = jobPostingSchema.safeParse({ title: "Engineer", description: "Build things." });
    if (result.success) {
      expect(result.data.screening_questions).toEqual([]);
    } else {
      throw new Error("expected parse to succeed");
    }
  });
});

describe("personalDetailsSchema", () => {
  const validBase = {
    first_name: "Test",
    last_name: "Applicant",
    phone: "0771234567",
    address_line: "123 Main St",
    district: "Colombo",
  };

  it("accepts valid minimal personal details", () => {
    expect(personalDetailsSchema.safeParse(validBase).success).toBe(true);
  });

  it("rejects a phone number that's too short", () => {
    const result = personalDetailsSchema.safeParse({ ...validBase, phone: "123" });
    expect(result.success).toBe(false);
  });

  it("rejects a malformed GitHub URL", () => {
    const result = personalDetailsSchema.safeParse({ ...validBase, github_url: "not-a-url" });
    expect(result.success).toBe(false);
  });

  it("accepts an empty GitHub URL as omitted (N/A case)", () => {
    const result = personalDetailsSchema.safeParse({ ...validBase, github_url: "" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.github_url).toBeUndefined();
    }
  });

  it("requires first name, last name, and district", () => {
    expect(personalDetailsSchema.safeParse({ ...validBase, first_name: "" }).success).toBe(false);
    expect(personalDetailsSchema.safeParse({ ...validBase, last_name: "" }).success).toBe(false);
    expect(personalDetailsSchema.safeParse({ ...validBase, district: "" }).success).toBe(false);
  });
});
