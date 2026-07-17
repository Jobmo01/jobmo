"use server";

import { revalidateApplicantProfilePaths } from "@/lib/revalidate-profile";
import type { z } from "zod";
import { getErrorMessage } from "@/lib/utils";
import { profileRepository } from "@/lib/repositories/profile-repository";
import {
  educationRepository,
  experienceRepository,
  skillsRepository,
  certificationsRepository,
  projectsRepository,
  awardsRepository,
  volunteerRepository,
  languagesRepository,
  hobbiesRepository,
  referencesRepository,
} from "@/lib/repositories/applicant-profile-repository";
import {
  educationSchema,
  experienceSchema,
  skillSchema,
  certificationSchema,
  projectSchema,
  awardSchema,
  volunteerSchema,
  languageSchema,
  hobbySchema,
  referenceSchema,
} from "@/lib/validations/applicant-profile";


export type SectionActionResult<T = unknown> = { data?: T; error?: string; success?: true };

async function requireApplicantId(): Promise<string> {
  const profile = await profileRepository.getCurrent();
  if (!profile) throw new Error("Not authenticated");
  return profile.id;
}

/**
 * One implementation shared by all ten "repeatable section" entities
 * (education, experience, skills, certifications, projects, awards,
 * volunteer experience, languages, hobbies, references). Each section
 * below just binds this to its own repository + Zod schema.
 */
function makeSectionActions<Schema extends z.ZodObject<z.ZodRawShape>>(repo: any, schema: Schema) {
  return {
    async create(input: unknown): Promise<SectionActionResult> {
      const parsed = schema.safeParse(input);
      if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
      try {
        const applicantId = await requireApplicantId();
        const data = await repo.create({ ...parsed.data, applicant_id: applicantId });
        revalidateApplicantProfilePaths();
        return { data };
      } catch (e) {
        return { error: getErrorMessage(e, "Failed to save") };
      }
    },
    async update(id: string, input: unknown): Promise<SectionActionResult> {
      const parsed = schema.partial().safeParse(input);
      if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
      try {
        const data = await repo.update(id, parsed.data);
        revalidateApplicantProfilePaths();
        return { data };
      } catch (e) {
        return { error: getErrorMessage(e, "Failed to save") };
      }
    },
    async remove(id: string): Promise<SectionActionResult> {
      try {
        await repo.remove(id);
        revalidateApplicantProfilePaths();
        return { success: true };
      } catch (e) {
        return { error: getErrorMessage(e, "Failed to delete") };
      }
    },
  };
}

const education = makeSectionActions(educationRepository, educationSchema);
export const createEducationEntry = education.create;
export const updateEducationEntry = education.update;
export const deleteEducationEntry = education.remove;

const experience = makeSectionActions(experienceRepository, experienceSchema);
export const createExperienceEntry = experience.create;
export const updateExperienceEntry = experience.update;
export const deleteExperienceEntry = experience.remove;

const skills = makeSectionActions(skillsRepository, skillSchema);
export const createSkill = skills.create;
export const updateSkill = skills.update;
export const deleteSkill = skills.remove;

const certifications = makeSectionActions(certificationsRepository, certificationSchema);
export const createCertification = certifications.create;
export const updateCertification = certifications.update;
export const deleteCertification = certifications.remove;

const projects = makeSectionActions(projectsRepository, projectSchema);
export const createProject = projects.create;
export const updateProject = projects.update;
export const deleteProject = projects.remove;

const awards = makeSectionActions(awardsRepository, awardSchema);
export const createAward = awards.create;
export const updateAward = awards.update;
export const deleteAward = awards.remove;

const volunteer = makeSectionActions(volunteerRepository, volunteerSchema);
export const createVolunteerEntry = volunteer.create;
export const updateVolunteerEntry = volunteer.update;
export const deleteVolunteerEntry = volunteer.remove;

const languages = makeSectionActions(languagesRepository, languageSchema);
export const createLanguage = languages.create;
export const updateLanguage = languages.update;
export const deleteLanguage = languages.remove;

const hobbies = makeSectionActions(hobbiesRepository, hobbySchema);
export const createHobby = hobbies.create;
export const updateHobby = hobbies.update;
export const deleteHobby = hobbies.remove;

const references = makeSectionActions(referencesRepository, referenceSchema);
export const createReference = references.create;
export const updateReference = references.update;
export const deleteReference = references.remove;
