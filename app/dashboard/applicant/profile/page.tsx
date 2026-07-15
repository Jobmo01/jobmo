import { profileRepository } from "@/lib/repositories/profile-repository";
import {
  applicantProfileRepository,
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
  getProfileCompletion,
} from "@/lib/repositories/applicant-profile-repository";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PersonalDetailsForm } from "@/components/profile/personal-details-form";
import { DobSection } from "@/components/profile/dob-section";
import { PreferencesForm } from "@/components/profile/preferences-form";
import { RepeatableSection } from "@/components/profile/repeatable-section";
import { SkillSuggestions } from "@/components/profile/skill-suggestions";
import { SectionNaToggle } from "@/components/profile/section-na-toggle";
import {
  createEducationEntry, updateEducationEntry, deleteEducationEntry,
  createExperienceEntry, updateExperienceEntry, deleteExperienceEntry,
  createSkill, updateSkill, deleteSkill,
  createCertification, updateCertification, deleteCertification,
  createProject, updateProject, deleteProject,
  createAward, updateAward, deleteAward,
  createVolunteerEntry, updateVolunteerEntry, deleteVolunteerEntry,
  createLanguage, updateLanguage, deleteLanguage,
  createHobby, updateHobby, deleteHobby,
  createReference, updateReference, deleteReference,
} from "@/app/dashboard/applicant/profile/section-actions";

const EMPLOYMENT_TYPE_OPTIONS = [
  { value: "full_time", label: "Full-time" },
  { value: "part_time", label: "Part-time" },
  { value: "contract", label: "Contract" },
  { value: "internship", label: "Internship" },
  { value: "freelance", label: "Freelance" },
];

const PROFICIENCY_OPTIONS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
  { value: "expert", label: "Expert" },
];

export default async function ProfilePage() {
  const account = await profileRepository.getCurrent();
  if (!account) return null;

  const profile = await applicantProfileRepository.ensureExists(account.id);

  const [
    education, experience, skills, certifications, projects,
    awards, volunteer, languages, hobbies, references,
    dobRequests, completion,
  ] = await Promise.all([
    educationRepository.list(account.id),
    experienceRepository.list(account.id),
    skillsRepository.list(account.id),
    certificationsRepository.list(account.id),
    projectsRepository.list(account.id),
    awardsRepository.list(account.id),
    volunteerRepository.list(account.id),
    languagesRepository.list(account.id),
    hobbiesRepository.list(account.id),
    referencesRepository.list(account.id),
    applicantProfileRepository.getDobChangeRequests(account.id),
    getProfileCompletion(account.id),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">My Profile</h1>
        <p className="text-sm text-muted-foreground">
          Complete every section to unlock the AI Resume Builder.
        </p>
      </div>

      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Profile completion</span>
            <span className="text-muted-foreground">{completion.percentage}%</span>
          </div>
          <Progress value={completion.percentage} className="mt-2" />
          <ul className="mt-4 grid gap-1.5 sm:grid-cols-2">
            {completion.sections.map((s) => (
              <li key={s.key} className={`text-xs ${s.done ? "text-success" : "text-muted-foreground"}`}>
                {s.done ? "✓" : "○"} {s.label}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Tabs defaultValue="personal">
        <TabsList>
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="education">Education</TabsTrigger>
          <TabsTrigger value="experience">Experience</TabsTrigger>
          <TabsTrigger value="skills">Skills & Languages</TabsTrigger>
          <TabsTrigger value="more">Certifications & More</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="space-y-6">
          <DobSection currentDob={profile.date_of_birth} requests={dobRequests} />
          <PersonalDetailsForm profile={profile} />
        </TabsContent>

        <TabsContent value="education" className="space-y-4">
          <SectionNaToggle
            field="education_not_applicable"
            label="I don't have formal education to list (counts toward profile completion)"
            checked={profile.education_not_applicable}
          />
          <RepeatableSection
            title="Education"
            description="Add every qualification — unlimited entries."
            addLabel="Add education"
            items={education}
            fields={[
              { name: "institution", label: "Institution", type: "text", required: true },
              { name: "qualification", label: "Qualification", type: "text", required: true },
              { name: "field_of_study", label: "Field of study", type: "text" },
              { name: "grade", label: "Grade", type: "text" },
              { name: "start_date", label: "Start date", type: "date" },
              { name: "end_date", label: "End date", type: "date" },
            ]}
            summary={{ primary: ["qualification", "institution"], secondary: "field_of_study" }}
            createAction={createEducationEntry}
            updateAction={updateEducationEntry}
            deleteAction={deleteEducationEntry}
          />
        </TabsContent>

        <TabsContent value="experience" className="space-y-4">
          <SectionNaToggle
            field="experience_not_applicable"
            label="I don't have work experience to list yet (counts toward profile completion)"
            checked={profile.experience_not_applicable}
          />
          <RepeatableSection
            title="Experience"
            description="Add every role — unlimited entries."
            addLabel="Add experience"
            items={experience}
            fields={[
              { name: "position", label: "Position", type: "text", required: true },
              { name: "company", label: "Company", type: "text", required: true },
              {
                name: "employment_type", label: "Employment type", type: "select",
                options: EMPLOYMENT_TYPE_OPTIONS,
              },
              { name: "start_date", label: "Start date", type: "date" },
              { name: "end_date", label: "End date", type: "date" },
              { name: "is_current", label: "I currently work here", type: "checkbox" },
              { name: "description", label: "Description", type: "textarea" },
              { name: "reference_name", label: "Reference name", type: "text" },
              { name: "reference_contact", label: "Reference contact", type: "text" },
            ]}
            summary={{
              primary: ["position", "company"],
              secondary: "description",
              badge: { field: "is_current", trueLabel: "Current" },
            }}
            createAction={createExperienceEntry}
            updateAction={updateExperienceEntry}
            deleteAction={deleteExperienceEntry}
          />
        </TabsContent>

        <TabsContent value="skills" className="space-y-8">
          <SectionNaToggle
            field="skills_not_applicable"
            label="I don't want to list skills yet (counts toward profile completion)"
            checked={profile.skills_not_applicable}
          />
          <SkillSuggestions />
          <RepeatableSection
            title="Skills"
            description="Add at least 3 to raise your profile completion."
            addLabel="Add skill"
            items={skills}
            fields={[
              { name: "name", label: "Skill", type: "text", required: true },
              { name: "proficiency", label: "Proficiency", type: "select", options: PROFICIENCY_OPTIONS },
            ]}
            summary={{ primary: "name", badge: "proficiency" }}
            createAction={createSkill}
            updateAction={updateSkill}
            deleteAction={deleteSkill}
          />
          <RepeatableSection
            title="Languages"
            addLabel="Add language"
            items={languages}
            fields={[
              { name: "name", label: "Language", type: "text", required: true },
              { name: "proficiency", label: "Proficiency", type: "select", options: PROFICIENCY_OPTIONS },
            ]}
            summary={{ primary: "name", badge: "proficiency" }}
            createAction={createLanguage}
            updateAction={updateLanguage}
            deleteAction={deleteLanguage}
          />
        </TabsContent>

        <TabsContent value="more" className="space-y-8">
          <div className="space-y-4">
            <SectionNaToggle
              field="certifications_not_applicable"
              label="I don't have certifications to add (counts toward profile completion)"
              checked={profile.certifications_not_applicable}
            />
            <RepeatableSection
              title="Certifications"
              addLabel="Add certification"
              items={certifications}
              fields={[
                { name: "name", label: "Name", type: "text", required: true },
                { name: "issuer", label: "Issuer", type: "text" },
                { name: "issue_date", label: "Issue date", type: "date" },
                { name: "expiry_date", label: "Expiry date", type: "date" },
                { name: "credential_url", label: "Credential URL", type: "url" },
              ]}
              summary={{ primary: "name", secondary: "issuer" }}
              createAction={createCertification}
              updateAction={updateCertification}
              deleteAction={deleteCertification}
            />
          </div>

          <div className="space-y-4">
            <SectionNaToggle
              field="projects_not_applicable"
              label="I don't have projects to add (counts toward profile completion)"
              checked={profile.projects_not_applicable}
            />
            <RepeatableSection
              title="Projects"
              addLabel="Add project"
              items={projects}
              fields={[
                { name: "title", label: "Title", type: "text", required: true },
                { name: "description", label: "Description", type: "textarea" },
                { name: "project_url", label: "Project URL", type: "url" },
                { name: "start_date", label: "Start date", type: "date" },
                { name: "end_date", label: "End date", type: "date" },
              ]}
              summary={{ primary: "title", secondary: "description" }}
              createAction={createProject}
              updateAction={updateProject}
              deleteAction={deleteProject}
            />
          </div>

          <div className="space-y-4">
            <SectionNaToggle
              field="awards_not_applicable"
              label="I don't have awards to add (counts toward profile completion)"
              checked={profile.awards_not_applicable}
            />
            <RepeatableSection
              title="Awards"
              addLabel="Add award"
              items={awards}
              fields={[
                { name: "title", label: "Title", type: "text", required: true },
                { name: "issuer", label: "Issuer", type: "text" },
                { name: "award_date", label: "Date", type: "date" },
                { name: "description", label: "Description", type: "textarea" },
              ]}
              summary={{ primary: "title", secondary: "issuer" }}
              createAction={createAward}
              updateAction={updateAward}
              deleteAction={deleteAward}
            />
          </div>

          <div className="space-y-4">
            <SectionNaToggle
              field="volunteer_not_applicable"
              label="I don't have volunteer experience to add (counts toward profile completion)"
              checked={profile.volunteer_not_applicable}
            />
            <RepeatableSection
              title="Volunteer experience"
              addLabel="Add volunteer role"
              items={volunteer}
              fields={[
                { name: "organization", label: "Organization", type: "text", required: true },
                { name: "role", label: "Role", type: "text" },
                { name: "description", label: "Description", type: "textarea" },
                { name: "start_date", label: "Start date", type: "date" },
                { name: "end_date", label: "End date", type: "date" },
              ]}
              summary={{ primary: "organization", secondary: "role" }}
              createAction={createVolunteerEntry}
              updateAction={updateVolunteerEntry}
              deleteAction={deleteVolunteerEntry}
            />
          </div>

          <div className="space-y-4">
            <SectionNaToggle
              field="hobbies_not_applicable"
              label="I don't have hobbies to add (counts toward profile completion)"
              checked={profile.hobbies_not_applicable}
            />
            <RepeatableSection
              title="Hobbies"
              addLabel="Add hobby"
              items={hobbies}
              fields={[{ name: "name", label: "Hobby", type: "text", required: true }]}
              summary={{ primary: "name" }}
              createAction={createHobby}
              updateAction={updateHobby}
              deleteAction={deleteHobby}
            />
          </div>

          <div className="space-y-4">
            <SectionNaToggle
              field="references_not_applicable"
              label="I don't have references to add (counts toward profile completion)"
              checked={profile.references_not_applicable}
            />
            <RepeatableSection
              title="References"
              addLabel="Add reference"
              items={references}
              fields={[
                { name: "name", label: "Name", type: "text", required: true },
                { name: "relationship", label: "Relationship", type: "text" },
                { name: "company", label: "Company", type: "text" },
                { name: "email", label: "Email", type: "text" },
                { name: "phone", label: "Phone", type: "text" },
              ]}
              summary={{ primary: "name", secondary: "company" }}
              createAction={createReference}
              updateAction={updateReference}
              deleteAction={deleteReference}
            />
          </div>
        </TabsContent>

        <TabsContent value="preferences">
          <PreferencesForm profile={profile} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
