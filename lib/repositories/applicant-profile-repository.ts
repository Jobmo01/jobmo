import { createClient } from "@/lib/supabase/server";
import type { Database, ApplicantProfile } from "@/types/database.types";

type RepeatableTableName =
  | "education_entries"
  | "experience_entries"
  | "skills"
  | "certifications"
  | "projects"
  | "awards"
  | "volunteer_experience"
  | "languages"
  | "hobbies"
  | "applicant_references";

/**
 * Factory for the ten nearly-identical "repeatable section" tables
 * (education, experience, skills, certifications, ...). Each gets full
 * CRUD from this one implementation instead of ten hand-written copies —
 * the repeatable-section-form UI (components/profile/repeatable-section.tsx)
 * is built the same way, for the same reason.
 */
function createSectionRepository<K extends RepeatableTableName>(table: K) {
  type Row = Database["public"]["Tables"][K]["Row"];
  type Insert = Database["public"]["Tables"][K]["Insert"];
  type Update = Database["public"]["Tables"][K]["Update"];

  return {
    async list(applicantId: string): Promise<Row[]> {
      const supabase = await createClient();
      const { data, error } = await (supabase.from(table) as any)
        .select("*")
        .eq("applicant_id", applicantId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Row[];
    },

    async create(input: Insert): Promise<Row> {
      const supabase = await createClient();
      const { data, error } = await (supabase.from(table) as any)
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data as Row;
    },

    async update(id: string, input: Update): Promise<Row> {
      const supabase = await createClient();
      const { data, error } = await (supabase.from(table) as any)
        .update(input)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as Row;
    },

    async remove(id: string): Promise<void> {
      const supabase = await createClient();
      const { error } = await (supabase.from(table) as any).delete().eq("id", id);
      if (error) throw error;
    },

    async count(applicantId: string): Promise<number> {
      const supabase = await createClient();
      const { count, error } = await (supabase.from(table) as any)
        .select("*", { count: "exact", head: true })
        .eq("applicant_id", applicantId);
      if (error) throw error;
      return count ?? 0;
    },

    /**
     * Batched equivalent of list() for multiple applicants at once — one
     * query instead of one-per-applicant. Use this anywhere a page shows
     * several applicants together (the employer pipeline board is the
     * main case): looping list() per applicant turns a 10-applicant page
     * into 10x the queries for every one of these 10 tables, which adds
     * up fast and can hit connection limits under load.
     */
    async listForMany(applicantIds: string[]): Promise<Map<string, Row[]>> {
      const byApplicant = new Map<string, Row[]>();
      if (applicantIds.length === 0) return byApplicant;

      const supabase = await createClient();
      const { data, error } = await (supabase.from(table) as any)
        .select("*")
        .in("applicant_id", applicantIds)
        .order("created_at", { ascending: false });
      if (error) throw error;

      for (const row of (data ?? []) as (Row & { applicant_id: string })[]) {
        const list = byApplicant.get(row.applicant_id) ?? [];
        list.push(row);
        byApplicant.set(row.applicant_id, list);
      }
      return byApplicant;
    },
  };
}

export const educationRepository = createSectionRepository("education_entries");
export const experienceRepository = createSectionRepository("experience_entries");
export const skillsRepository = createSectionRepository("skills");
export const certificationsRepository = createSectionRepository("certifications");
export const projectsRepository = createSectionRepository("projects");
export const awardsRepository = createSectionRepository("awards");
export const volunteerRepository = createSectionRepository("volunteer_experience");
export const languagesRepository = createSectionRepository("languages");
export const hobbiesRepository = createSectionRepository("hobbies");
export const referencesRepository = createSectionRepository("applicant_references");

export const applicantProfileRepository = {
  async get(applicantId: string): Promise<ApplicantProfile | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("applicant_profiles")
      .select("*")
      .eq("id", applicantId)
      .single();
    if (error) return null;
    return data;
  },

  /** Creates the row if it doesn't exist yet (first visit to the profile page). */
  async ensureExists(applicantId: string): Promise<ApplicantProfile> {
    const supabase = await createClient();
    const existing = await this.get(applicantId);
    if (existing) return existing;

    const { data, error } = await (supabase.from("applicant_profiles") as any)
      .insert({ id: applicantId })
      .select()
      .single();
    if (error) throw error;
    return data as ApplicantProfile;
  },

  /** Never accepts date_of_birth — see requestDobChange() for the only sanctioned path. */
  async updatePersonalDetails(
    applicantId: string,
    input: Database["public"]["Tables"]["applicant_profiles"]["Update"]
  ): Promise<ApplicantProfile> {
    const supabase = await createClient();
    const { date_of_birth: _ignored, ...safeInput } = input as Record<string, unknown>;
    const { data, error } = await (supabase.from("applicant_profiles") as any)
      .update(safeInput)
      .eq("id", applicantId)
      .select()
      .single();
    if (error) throw error;
    return data as ApplicantProfile;
  },

  async requestDobChange(input: {
    applicantId: string;
    currentDob: string | null;
    requestedDob: string;
    reason: string;
    nicDocumentUrl?: string;
    passportDocumentUrl?: string;
    drivingLicenseDocumentUrl?: string;
  }) {
    const supabase = await createClient();
    const { error } = await (supabase.from("dob_change_requests") as any).insert({
      applicant_id: input.applicantId,
      current_dob: input.currentDob,
      requested_dob: input.requestedDob,
      reason: input.reason,
      nic_document_url: input.nicDocumentUrl,
      passport_document_url: input.passportDocumentUrl,
      driving_license_document_url: input.drivingLicenseDocumentUrl,
    });
    if (error) throw error;

    await (supabase.rpc as any)("log_audit_event", {
      p_action: "profile.dob_change_requested",
      p_entity_type: "dob_change_request",
      p_entity_id: null,
      p_metadata: { applicant_id: input.applicantId, requested_dob: input.requestedDob },
    });
  },

  async getDobChangeRequests(applicantId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("dob_change_requests")
      .select("*")
      .eq("applicant_id", applicantId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },
};

/** Weighted completion breakdown — the "profile completion %" shown on the dashboard
 *  and the gate for unlocking the Resume Builder. Weights sum to 100. */
export interface CompletionSection {
  key: string;
  label: string;
  weight: number;
  done: boolean;
}

export async function getProfileCompletion(applicantId: string): Promise<{
  percentage: number;
  sections: CompletionSection[];
}> {
  const profile = await applicantProfileRepository.get(applicantId);

  const [educationCount, experienceCount, skillsCount, certificationsCount, projectsCount, awardsCount, volunteerCount, hobbiesCount, referencesCount] =
    await Promise.all([
      educationRepository.count(applicantId),
      experienceRepository.count(applicantId),
      skillsRepository.count(applicantId),
      certificationsRepository.count(applicantId),
      projectsRepository.count(applicantId),
      awardsRepository.count(applicantId),
      volunteerRepository.count(applicantId),
      hobbiesRepository.count(applicantId),
      referencesRepository.count(applicantId),
    ]);

  const personalDetailsDone = Boolean(
    profile?.first_name &&
      profile?.last_name &&
      profile?.phone &&
      profile?.address_line &&
      profile?.district &&
      profile?.date_of_birth &&
      profile?.nic_number &&
      (profile?.passport_number || profile?.passport_not_applicable) &&
      (profile?.driving_license_number || profile?.driving_license_not_applicable)
  );

  const preferencesDone = Boolean(
    profile?.expected_salary_min &&
      profile?.availability_date &&
      (profile?.preferred_locations?.length ?? 0) > 0 &&
      profile?.remote_preference &&
      (profile?.employment_type_preference?.length ?? 0) > 0
  );

  const educationDone = educationCount > 0 || Boolean(profile?.education_not_applicable);
  const experienceDone = experienceCount > 0 || Boolean(profile?.experience_not_applicable);
  const skillsDone = skillsCount >= 3 || Boolean(profile?.skills_not_applicable);

  // "Certifications & More" — each of these 6 is judged independently now
  // (not everyone has certifications AND projects AND awards, etc.),
  // rather than one blanket toggle for the whole tab. 2.5% each, summing
  // to the same 15% the bucket has always been worth — and tracked as
  // separate sections so the "what's missing" list can point at exactly
  // which ones still need attention instead of one vague catch-all line.
  const sections: CompletionSection[] = [
    { key: "personal_details", label: "Personal details", weight: 25, done: personalDetailsDone },
    { key: "education", label: "At least one education entry (or marked N/A)", weight: 15, done: educationDone },
    { key: "experience", label: "At least one experience entry (or marked N/A)", weight: 15, done: experienceDone },
    { key: "skills", label: "At least 3 skills (or marked N/A)", weight: 15, done: skillsDone },
    { key: "preferences", label: "Job preferences", weight: 15, done: preferencesDone },
    { key: "certifications", label: "A certification (or marked N/A)", weight: 2.5, done: certificationsCount > 0 || Boolean(profile?.certifications_not_applicable) },
    { key: "projects", label: "A project (or marked N/A)", weight: 2.5, done: projectsCount > 0 || Boolean(profile?.projects_not_applicable) },
    { key: "awards", label: "An award (or marked N/A)", weight: 2.5, done: awardsCount > 0 || Boolean(profile?.awards_not_applicable) },
    { key: "volunteer", label: "Volunteer experience (or marked N/A)", weight: 2.5, done: volunteerCount > 0 || Boolean(profile?.volunteer_not_applicable) },
    { key: "hobbies", label: "A hobby (or marked N/A)", weight: 2.5, done: hobbiesCount > 0 || Boolean(profile?.hobbies_not_applicable) },
    { key: "references", label: "A reference (or marked N/A)", weight: 2.5, done: referencesCount > 0 || Boolean(profile?.references_not_applicable) },
  ];

  const percentage = Math.round(sections.reduce((sum, s) => sum + (s.done ? s.weight : 0), 0));

  return { percentage, sections };
}
