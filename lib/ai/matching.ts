import type {
  ApplicantProfile, EducationEntry, ExperienceEntry, Skill, JobPosting, MatchBreakdown,
} from "@/types/database.types";

export interface MatchInput {
  job: Pick<
    JobPosting,
    "required_skills" | "preferred_skills" | "experience_level" | "education_requirement" |
    "work_type" | "employment_type" | "salary_min" | "salary_max"
  >;
  companyIndustry: string | null;
  profile: Pick<
    ApplicantProfile,
    "remote_preference" | "employment_type_preference" | "industry_preference" |
    "expected_salary_min" | "expected_salary_max" | "preferred_locations" | "district"
  >;
  skills: Pick<Skill, "name">[];
  education: Pick<EducationEntry, "qualification" | "field_of_study">[];
  experience: Pick<ExperienceEntry, "start_date" | "end_date" | "is_current">[];
}

function normalize(s: string) {
  return s.trim().toLowerCase();
}

function scoreSkills(job: MatchInput["job"], applicantSkills: string[]) {
  const applicantSet = new Set(applicantSkills.map(normalize));
  const required = job.required_skills.map(normalize);
  const preferred = job.preferred_skills.map(normalize);

  const matchedRequired = job.required_skills.filter((s) => applicantSet.has(normalize(s)));
  const missingRequired = job.required_skills.filter((s) => !applicantSet.has(normalize(s)));
  const matchedPreferred = job.preferred_skills.filter((s) => applicantSet.has(normalize(s)));

  const requiredRatio = required.length > 0 ? matchedRequired.length / required.length : 1;
  const preferredRatio = preferred.length > 0 ? matchedPreferred.length / preferred.length : 1;

  // Required skills weighted far more heavily than preferred (30 of 40 points).
  const skillsScore = Math.round(requiredRatio * 30 + preferredRatio * 10);

  return { skillsScore, matchedRequired, missingRequired, matchedPreferred };
}

function totalExperienceYears(experience: MatchInput["experience"]): number {
  let totalMonths = 0;
  for (const e of experience) {
    if (!e.start_date) continue;
    const start = new Date(e.start_date);
    const end = e.is_current || !e.end_date ? new Date() : new Date(e.end_date);
    const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    if (months > 0) totalMonths += months;
  }
  return totalMonths / 12;
}

function parseMinYearsRequired(experienceLevel: string | null): number | null {
  if (!experienceLevel) return null;
  const match = experienceLevel.match(/(\d+)/);
  return match ? Number(match[1]) : null;
}

function scoreExperience(job: MatchInput["job"], experience: MatchInput["experience"]): number {
  const requiredYears = parseMinYearsRequired(job.experience_level);
  if (requiredYears === null) return 15; // no parseable requirement — don't penalize
  const actualYears = totalExperienceYears(experience);
  if (actualYears >= requiredYears) return 15;
  if (requiredYears === 0) return 15;
  return Math.round(Math.max(0, actualYears / requiredYears) * 15);
}

function scoreEducation(job: MatchInput["job"], education: MatchInput["education"]): number {
  if (!job.education_requirement || job.education_requirement.trim() === "") return 10;
  return education.length > 0 ? 10 : 3; // has some formal education, however specific requirement compares
}

function scoreLocation(job: MatchInput["job"], profile: MatchInput["profile"]): number {
  if (job.work_type === "remote") return 15; // remote roles fit everyone location-wise
  if (!profile.remote_preference) return 8; // neutral — unknown preference

  if (job.work_type === "on_site" || job.work_type === "hybrid") {
    const remoteOk = profile.remote_preference === "flexible" ||
      profile.remote_preference === job.work_type ||
      (profile.remote_preference === "hybrid" && job.work_type === "on_site");
    const locationOk =
      profile.preferred_locations.length === 0 ||
      profile.preferred_locations.some((l) => normalize(l) === normalize(profile.district ?? ""));
    if (remoteOk && locationOk) return 15;
    if (remoteOk || locationOk) return 9;
    return 4;
  }
  return 8;
}

function scoreSalary(job: MatchInput["job"], profile: MatchInput["profile"]): number {
  if (!job.salary_min && !job.salary_max) return 10; // not specified — neutral
  if (!profile.expected_salary_min && !profile.expected_salary_max) return 7; // applicant hasn't specified

  const jobMin = job.salary_min ?? 0;
  const jobMax = job.salary_max ?? Number.MAX_SAFE_INTEGER;
  const wantMin = profile.expected_salary_min ?? 0;
  const wantMax = profile.expected_salary_max ?? Number.MAX_SAFE_INTEGER;

  const overlap = Math.min(jobMax, wantMax) - Math.max(jobMin, wantMin);
  return overlap >= 0 ? 10 : Math.max(0, 10 + overlap / 10000); // gentle falloff if ranges are close but don't overlap
}

function scoreEmploymentType(job: MatchInput["job"], profile: MatchInput["profile"]): number {
  if (!job.employment_type) return 5;
  if (profile.employment_type_preference.length === 0) return 4;
  return profile.employment_type_preference.includes(job.employment_type) ? 5 : 1;
}

function scoreIndustry(companyIndustry: string | null, profile: MatchInput["profile"]): number {
  if (!companyIndustry) return 5;
  if (profile.industry_preference.length === 0) return 4;
  const match = profile.industry_preference.some((i) => normalize(i) === normalize(companyIndustry));
  return match ? 5 : 2;
}

export function computeMatchScore(input: MatchInput): { score: number; breakdown: MatchBreakdown } {
  const applicantSkillNames = input.skills.map((s) => s.name);
  const { skillsScore, matchedRequired, missingRequired, matchedPreferred } = scoreSkills(input.job, applicantSkillNames);
  const experienceScore = scoreExperience(input.job, input.experience);
  const educationScore = scoreEducation(input.job, input.education);
  const locationScore = scoreLocation(input.job, input.profile);
  const salaryScore = scoreSalary(input.job, input.profile);
  const employmentTypeScore = scoreEmploymentType(input.job, input.profile);
  const industryScore = scoreIndustry(input.companyIndustry, input.profile);

  const total = Math.round(
    skillsScore + experienceScore + educationScore + locationScore + salaryScore + employmentTypeScore + industryScore
  );

  return {
    score: Math.min(100, Math.max(0, total)),
    breakdown: {
      skillsScore,
      experienceScore,
      educationScore,
      locationScore,
      salaryScore,
      employmentTypeScore,
      industryScore,
      matchedRequiredSkills: matchedRequired,
      missingRequiredSkills: missingRequired,
      matchedPreferredSkills: matchedPreferred,
    },
  };
}
