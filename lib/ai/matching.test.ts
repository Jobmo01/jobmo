import { describe, it, expect } from "vitest";
import { computeMatchScore } from "@/lib/ai/matching";

describe("computeMatchScore", () => {
  it("scores a strong-fit candidate highly", () => {
    const result = computeMatchScore({
      job: {
        required_skills: ["React", "TypeScript", "Node.js"],
        preferred_skills: ["GraphQL"],
        experience_level: "3+ years",
        education_requirement: "Bachelor's degree",
        work_type: "hybrid",
        employment_type: "full_time",
        salary_min: 150000,
        salary_max: 250000,
      },
      companyIndustry: "Software",
      profile: {
        remote_preference: "hybrid",
        employment_type_preference: ["full_time"],
        industry_preference: ["Software"],
        expected_salary_min: 180000,
        expected_salary_max: 220000,
        preferred_locations: ["Colombo"],
        district: "Colombo",
      },
      skills: [{ name: "React" }, { name: "TypeScript" }, { name: "Node.js" }, { name: "GraphQL" }],
      education: [{ qualification: "BSc", field_of_study: "Computer Science" }],
      experience: [{ start_date: "2020-01-01", end_date: null, is_current: true }],
    });

    expect(result.score).toBeGreaterThanOrEqual(90);
    expect(result.breakdown.missingRequiredSkills).toHaveLength(0);
    expect(result.breakdown.matchedRequiredSkills).toEqual(
      expect.arrayContaining(["React", "TypeScript", "Node.js"])
    );
  });

  it("scores a weak-fit candidate low", () => {
    const result = computeMatchScore({
      job: {
        required_skills: ["Java", "Spring Boot", "Kubernetes"],
        preferred_skills: ["AWS"],
        experience_level: "5+ years",
        education_requirement: "Bachelor's degree",
        work_type: "on_site",
        employment_type: "full_time",
        salary_min: 300000,
        salary_max: 400000,
      },
      companyIndustry: "Finance",
      profile: {
        remote_preference: "remote",
        employment_type_preference: ["contract"],
        industry_preference: ["Software"],
        expected_salary_min: 100000,
        expected_salary_max: 130000,
        preferred_locations: ["Kandy"],
        district: "Kandy",
      },
      skills: [{ name: "React" }],
      education: [],
      experience: [{ start_date: "2023-01-01", end_date: null, is_current: true }],
    });

    expect(result.score).toBeLessThan(40);
    expect(result.breakdown.missingRequiredSkills).toEqual(
      expect.arrayContaining(["Java", "Spring Boot", "Kubernetes"])
    );
  });

  it("gives full skills credit and shows no missing skills when a job lists none", () => {
    const result = computeMatchScore({
      job: {
        required_skills: [],
        preferred_skills: [],
        experience_level: null,
        education_requirement: null,
        work_type: null,
        employment_type: null,
        salary_min: null,
        salary_max: null,
      },
      companyIndustry: null,
      profile: {
        remote_preference: null,
        employment_type_preference: [],
        industry_preference: [],
        expected_salary_min: null,
        expected_salary_max: null,
        preferred_locations: [],
        district: null,
      },
      skills: [],
      education: [],
      experience: [],
    });

    expect(result.breakdown.skillsScore).toBe(40);
    expect(result.breakdown.missingRequiredSkills).toHaveLength(0);
  });

  it("never returns a score outside 0-100", () => {
    const result = computeMatchScore({
      job: {
        required_skills: ["A", "B", "C", "D", "E"],
        preferred_skills: ["F", "G"],
        experience_level: "10+ years",
        education_requirement: "PhD",
        work_type: "on_site",
        employment_type: "full_time",
        salary_min: 1000000,
        salary_max: 2000000,
      },
      companyIndustry: "Aerospace",
      profile: {
        remote_preference: "remote",
        employment_type_preference: ["internship"],
        industry_preference: ["Retail"],
        expected_salary_min: 10000,
        expected_salary_max: 20000,
        preferred_locations: ["Jaffna"],
        district: "Galle",
      },
      skills: [],
      education: [],
      experience: [],
    });

    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });
});
