/**
 * Hand-authored to match supabase/migrations/0001-0005 exactly.
 * Regenerate the authoritative version once your project is linked:
 *   npm run supabase:types
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "applicant" | "employer" | "admin" | "super_admin";
export type AccountStatus = "active" | "suspended" | "pending_verification" | "deleted";
export type ProficiencyLevel = "beginner" | "intermediate" | "advanced" | "expert";
export type EmploymentType = "full_time" | "part_time" | "contract" | "internship" | "freelance";
export type RemotePreference = "on_site" | "hybrid" | "remote" | "flexible";
export type DobChangeStatus = "pending" | "approved" | "rejected";

export type VerificationStatus = "pending" | "verified" | "rejected";
export type WorkType = "on_site" | "remote" | "hybrid";
export type JobStatus = "draft" | "published" | "closed" | "archived";
export type ApplicationStatus =
  | "applied" | "viewed" | "shortlisted" | "assessment" | "interview_scheduled"
  | "interview_completed" | "pending_decision" | "selected" | "rejected"
  | "offer_sent" | "offer_accepted" | "offer_rejected" | "hired";
export type InterviewMode = "online" | "offline" | "hybrid";
export type InterviewStatus = "proposed" | "accepted" | "declined" | "reschedule_requested" | "completed" | "cancelled";
export type OfferStatus = "sent" | "accepted" | "rejected" | "withdrawn";

export type ContentType = "video" | "article" | "pdf";
export type ContentStatus = "draft" | "published";
export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";

/** Shared shape for every repeatable profile section (education, skills, etc.) */
interface RepeatableRow {
  id: string;
  applicant_id: string;
  created_at: string;
}

export interface EducationEntry extends RepeatableRow {
  institution: string;
  qualification: string;
  field_of_study: string | null;
  grade: string | null;
  start_date: string | null;
  end_date: string | null;
  certificate_url: string | null;
  transcript_url: string | null;
  updated_at: string;
}

export interface ExperienceEntry extends RepeatableRow {
  company: string;
  position: string;
  description: string | null;
  employment_type: EmploymentType | null;
  is_current: boolean;
  start_date: string | null;
  end_date: string | null;
  reference_name: string | null;
  reference_contact: string | null;
  updated_at: string;
}

export interface Skill extends RepeatableRow {
  name: string;
  proficiency: ProficiencyLevel;
  is_ai_suggested: boolean;
}

export interface Certification extends RepeatableRow {
  name: string;
  issuer: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  credential_url: string | null;
  document_url: string | null;
}

export interface Project extends RepeatableRow {
  title: string;
  description: string | null;
  project_url: string | null;
  start_date: string | null;
  end_date: string | null;
}

export interface Award extends RepeatableRow {
  title: string;
  issuer: string | null;
  award_date: string | null;
  description: string | null;
}

export interface VolunteerExperience extends RepeatableRow {
  organization: string;
  role: string | null;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
}

export interface Language extends RepeatableRow {
  name: string;
  proficiency: ProficiencyLevel;
}

export interface Hobby extends RepeatableRow {
  name: string;
}

export interface ApplicantReference extends RepeatableRow {
  name: string;
  relationship: string | null;
  company: string | null;
  email: string | null;
  phone: string | null;
}

export interface ApplicantProfile {
  id: string;
  first_name: string | null;
  middle_name: string | null;
  last_name: string | null;
  gender: string | null;
  date_of_birth: string | null;
  nationality: string | null;
  nic_number: string | null;
  passport_number: string | null;
  passport_not_applicable: boolean;
  driving_license_number: string | null;
  driving_license_not_applicable: boolean;
  education_not_applicable: boolean;
  experience_not_applicable: boolean;
  skills_not_applicable: boolean;
  certifications_not_applicable: boolean;
  projects_not_applicable: boolean;
  awards_not_applicable: boolean;
  volunteer_not_applicable: boolean;
  hobbies_not_applicable: boolean;
  references_not_applicable: boolean;
  address_line: string | null;
  district: string | null;
  province: string | null;
  country: string | null;
  phone: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  github_url: string | null;
  github_not_applicable: boolean;
  linkedin_url: string | null;
  linkedin_not_applicable: boolean;
  behance_url: string | null;
  behance_not_applicable: boolean;
  portfolio_url: string | null;
  portfolio_not_applicable: boolean;
  website_url: string | null;
  website_not_applicable: boolean;
  expected_salary_min: number | null;
  expected_salary_max: number | null;
  salary_currency: string | null;
  availability_date: string | null;
  preferred_locations: string[];
  remote_preference: RemotePreference | null;
  industry_preference: string[];
  employment_type_preference: EmploymentType[];
  notice_period_days: number | null;
  profile_visible_to_employers: boolean;
  notification_preferences: Json;
  ai_summary: string | null;
  ai_summary_generated_at: string | null;
  resume_score: number | null;
  resume_score_feedback: Json;
  abandoned_reminder_sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DobChangeRequest {
  id: string;
  applicant_id: string;
  current_dob: string | null;
  requested_dob: string;
  reason: string;
  nic_document_url: string | null;
  passport_document_url: string | null;
  driving_license_document_url: string | null;
  status: DobChangeStatus;
  reviewed_by: string | null;
  review_comment: string | null;
  created_at: string;
  reviewed_at: string | null;
}

export interface Company {
  id: string;
  owner_id: string;
  name: string;
  tagline: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  description: string | null;
  industry: string | null;
  company_size: string | null;
  founded_year: number | null;
  phone: string | null;
  locations: string[];
  website_url: string | null;
  linkedin_url: string | null;
  facebook_url: string | null;
  twitter_url: string | null;
  benefits: string[];
  culture_description: string | null;
  gallery_urls: string[];
  video_url: string | null;
  verification_status: VerificationStatus;
  last_follow_up_email_at: string | null;
  boost_credits: number;
  created_at: string;
  updated_at: string;
}

export interface ScreeningQuestion {
  question: string;
  required: boolean;
}

export interface JobPosting {
  id: string;
  company_id: string;
  created_by: string;
  title: string;
  description: string;
  required_skills: string[];
  preferred_skills: string[];
  experience_level: string | null;
  education_requirement: string | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
  show_salary: boolean;
  benefits: string[];
  work_type: WorkType | null;
  location: string | null;
  employment_type: EmploymentType | null;
  application_deadline: string | null;
  screening_questions: ScreeningQuestion[];
  status: JobStatus;
  published_at: string | null;
  views_count: number;
  is_boosted: boolean;
  created_at: string;
  updated_at: string;
}

export interface JobApplication {
  id: string;
  job_id: string;
  applicant_id: string;
  status: ApplicationStatus;
  cover_letter: string | null;
  tags: string[];
  applied_at: string;
  updated_at: string;
}

export interface ApplicationNote {
  id: string;
  application_id: string;
  author_id: string | null;
  note: string;
  created_at: string;
}

export interface ApplicationStatusHistoryRow {
  id: string;
  application_id: string;
  from_status: ApplicationStatus | null;
  to_status: ApplicationStatus;
  changed_by: string | null;
  created_at: string;
}

export interface Interview {
  id: string;
  application_id: string;
  scheduled_by: string | null;
  mode: InterviewMode;
  platform: string | null;
  meeting_link: string | null;
  location: string | null;
  scheduled_at: string;
  duration_minutes: number;
  panel_members: string[];
  instructions: string | null;
  status: InterviewStatus;
  applicant_response_note: string | null;
  reminder_sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Offer {
  id: string;
  application_id: string;
  created_by: string | null;
  position_title: string;
  salary: number | null;
  currency: string | null;
  start_date: string | null;
  benefits: string | null;
  terms: string | null;
  status: OfferStatus;
  responded_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MatchBreakdown {
  skillsScore: number;
  experienceScore: number;
  educationScore: number;
  locationScore: number;
  salaryScore: number;
  employmentTypeScore: number;
  industryScore: number;
  matchedRequiredSkills: string[];
  missingRequiredSkills: string[];
  matchedPreferredSkills: string[];
}

export interface JobMatch {
  id: string;
  job_id: string;
  applicant_id: string;
  score: number;
  breakdown: MatchBreakdown;
  notified: boolean;
  email_reminded_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface LearningCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon_name: string | null;
  sort_order: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface LearningContentItem {
  id: string;
  category_id: string | null;
  type: ContentType;
  title: string;
  description: string | null;
  body: string;
  thumbnail_url: string | null;
  duration_minutes: number | null;
  sort_order: number;
  status: ContentStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface QuizOption {
  id: string;
  text: string;
}

export interface Quiz {
  id: string;
  category_id: string | null;
  title: string;
  description: string | null;
  time_limit_minutes: number;
  passing_score_percent: number;
  status: ContentStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

/** The applicant-facing shape — never includes correct_option_id. */
export interface QuizQuestionPublic {
  id: string;
  quiz_id: string;
  question_text: string;
  options: QuizOption[];
  sort_order: number;
}

/** The admin-facing shape, used only in content-management screens. */
export interface QuizQuestionFull extends QuizQuestionPublic {
  correct_option_id: string;
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  applicant_id: string;
  score_percent: number;
  correct_count: number;
  total_count: number;
  time_taken_seconds: number | null;
  passed: boolean;
  completed_at: string;
}

export interface LearningProgressRow {
  id: string;
  applicant_id: string;
  content_id: string;
  completed_at: string;
}

export interface Certificate {
  id: string;
  applicant_id: string;
  quiz_id: string | null;
  title: string;
  issued_at: string;
}

export interface PlatformSetting {
  key: string;
  value: Json;
  updated_by: string | null;
  updated_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  body: string | null;
  is_active: boolean;
  target_roles: UserRole[];
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface TalentPoolEntry {
  id: string;
  company_id: string;
  applicant_id: string;
  added_by: string | null;
  source_application_id: string | null;
  note: string | null;
  created_at: string;
}

export interface Referral {
  id: string;
  referrer_id: string;
  referred_id: string;
  created_at: string;
}

export interface SupportTicket {
  id: string;
  user_id: string | null;
  email: string;
  subject: string;
  message: string;
  status: TicketStatus;
  created_at: string;
  updated_at: string;
}

export interface SupportTicketReply {
  id: string;
  ticket_id: string;
  author_id: string | null;
  message: string;
  created_at: string;
}

export interface NotificationRow {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          role: UserRole;
          status: AccountStatus;
          permissions: Json;
          referral_code: string | null;
          pending_referral_code: string | null;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
          status?: AccountStatus;
          permissions?: Json;
          referral_code?: string | null;
          pending_referral_code?: string | null;
          deleted_at?: string | null;
        };
        Update: {
          full_name?: string | null;
          avatar_url?: string | null;
          status?: AccountStatus;
          referral_code?: string | null;
          pending_referral_code?: string | null;
          deleted_at?: string | null;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          actor_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          metadata: Json;
          ip_address: string | null;
          created_at: string;
        };
        Insert: {
          actor_id?: string | null;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          metadata?: Json;
          ip_address?: string | null;
        };
        Update: never;
        Relationships: [];
      };
      applicant_profiles: {
        Row: ApplicantProfile;
        Insert: Partial<ApplicantProfile> & { id: string };
        Update: Partial<Omit<ApplicantProfile, "id" | "date_of_birth">>;
        Relationships: [];
      };
      dob_change_requests: {
        Row: DobChangeRequest;
        Insert: Pick<DobChangeRequest, "applicant_id" | "requested_dob" | "reason"> &
          Partial<Pick<DobChangeRequest, "current_dob" | "nic_document_url" | "passport_document_url" | "driving_license_document_url">>;
        Update: never; // status only changes via review_dob_change_request() RPC
        Relationships: [];
      };
      education_entries: {
        Row: EducationEntry;
        Insert: Omit<EducationEntry, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<EducationEntry, "id" | "applicant_id" | "created_at" | "updated_at">>;
        Relationships: [];
      };
      experience_entries: {
        Row: ExperienceEntry;
        Insert: Omit<ExperienceEntry, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<ExperienceEntry, "id" | "applicant_id" | "created_at" | "updated_at">>;
        Relationships: [];
      };
      skills: {
        Row: Skill;
        Insert: Omit<Skill, "id" | "created_at">;
        Update: Partial<Omit<Skill, "id" | "applicant_id" | "created_at">>;
        Relationships: [];
      };
      certifications: {
        Row: Certification;
        Insert: Omit<Certification, "id" | "created_at">;
        Update: Partial<Omit<Certification, "id" | "applicant_id" | "created_at">>;
        Relationships: [];
      };
      projects: {
        Row: Project;
        Insert: Omit<Project, "id" | "created_at">;
        Update: Partial<Omit<Project, "id" | "applicant_id" | "created_at">>;
        Relationships: [];
      };
      awards: {
        Row: Award;
        Insert: Omit<Award, "id" | "created_at">;
        Update: Partial<Omit<Award, "id" | "applicant_id" | "created_at">>;
        Relationships: [];
      };
      volunteer_experience: {
        Row: VolunteerExperience;
        Insert: Omit<VolunteerExperience, "id" | "created_at">;
        Update: Partial<Omit<VolunteerExperience, "id" | "applicant_id" | "created_at">>;
        Relationships: [];
      };
      languages: {
        Row: Language;
        Insert: Omit<Language, "id" | "created_at">;
        Update: Partial<Omit<Language, "id" | "applicant_id" | "created_at">>;
        Relationships: [];
      };
      hobbies: {
        Row: Hobby;
        Insert: Omit<Hobby, "id" | "created_at">;
        Update: Partial<Omit<Hobby, "id" | "applicant_id" | "created_at">>;
        Relationships: [];
      };
      applicant_references: {
        Row: ApplicantReference;
        Insert: Omit<ApplicantReference, "id" | "created_at">;
        Update: Partial<Omit<ApplicantReference, "id" | "applicant_id" | "created_at">>;
        Relationships: [];
      };
      notifications: {
        Row: NotificationRow;
        Insert: Omit<NotificationRow, "id" | "created_at" | "read_at">;
        Update: Pick<Partial<NotificationRow>, "read_at">;
        Relationships: [];
      };
      companies: {
        Row: Company;
        Insert: Omit<Company, "id" | "created_at" | "updated_at" | "verification_status" | "last_follow_up_email_at" | "boost_credits"> & { verification_status?: VerificationStatus };
        Update: Partial<Omit<Company, "id" | "owner_id" | "created_at" | "updated_at">>;
        Relationships: [];
      };
      job_postings: {
        Row: JobPosting;
        Insert: Omit<JobPosting, "id" | "created_at" | "updated_at" | "views_count" | "published_at" | "is_boosted"> & { views_count?: number; published_at?: string | null };
        Update: Partial<Omit<JobPosting, "id" | "company_id" | "created_by" | "created_at" | "updated_at">>;
        Relationships: [];
      };
      job_applications: {
        Row: JobApplication;
        Insert: Pick<JobApplication, "job_id" | "applicant_id"> & Partial<Pick<JobApplication, "cover_letter" | "status" | "tags">>;
        Update: Partial<Pick<JobApplication, "tags">>; // status changes only via change_application_status() RPC
        Relationships: [];
      };
      application_notes: {
        Row: ApplicationNote;
        Insert: Omit<ApplicationNote, "id" | "created_at">;
        Update: never;
        Relationships: [];
      };
      application_status_history: {
        Row: ApplicationStatusHistoryRow;
        Insert: never; // insert only via change_application_status() RPC
        Update: never;
        Relationships: [];
      };
      interviews: {
        Row: Interview;
        Insert: Omit<Interview, "id" | "created_at" | "updated_at" | "status" | "applicant_response_note" | "reminder_sent_at"> & { status?: InterviewStatus };
        Update: Partial<Omit<Interview, "id" | "application_id" | "created_at" | "updated_at">>;
        Relationships: [];
      };
      offers: {
        Row: Offer;
        Insert: Omit<Offer, "id" | "created_at" | "updated_at" | "status" | "responded_at"> & { status?: OfferStatus };
        Update: Partial<Omit<Offer, "id" | "application_id" | "created_at" | "updated_at">>;
        Relationships: [];
      };
      job_matches: {
        Row: JobMatch;
        Insert: Omit<JobMatch, "id" | "created_at" | "updated_at" | "notified" | "email_reminded_at"> & { notified?: boolean };
        Update: Partial<Pick<JobMatch, "score" | "breakdown" | "notified" | "email_reminded_at">>;
        Relationships: [];
      };
      learning_categories: {
        Row: LearningCategory;
        Insert: Omit<LearningCategory, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<LearningCategory, "id" | "created_at" | "updated_at">>;
        Relationships: [];
      };
      learning_content: {
        Row: LearningContentItem;
        Insert: Omit<LearningContentItem, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<LearningContentItem, "id" | "created_at" | "updated_at">>;
        Relationships: [];
      };
      quizzes: {
        Row: Quiz;
        Insert: Omit<Quiz, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Quiz, "id" | "created_at" | "updated_at">>;
        Relationships: [];
      };
      quiz_questions: {
        Row: QuizQuestionFull;
        Insert: Omit<QuizQuestionFull, "id">;
        Update: Partial<Omit<QuizQuestionFull, "id" | "quiz_id">>;
        Relationships: [];
      };
      quiz_attempts: {
        Row: QuizAttempt;
        Insert: never; // insert only via submit_quiz_attempt() RPC
        Update: never;
        Relationships: [];
      };
      learning_progress: {
        Row: LearningProgressRow;
        Insert: Omit<LearningProgressRow, "id" | "completed_at">;
        Update: never;
        Relationships: [];
      };
      certificates: {
        Row: Certificate;
        Insert: never; // insert only via submit_quiz_attempt() RPC
        Update: never;
        Relationships: [];
      };
      platform_settings: {
        Row: PlatformSetting;
        Insert: Omit<PlatformSetting, "updated_at">;
        Update: Partial<Pick<PlatformSetting, "value" | "updated_by">>;
        Relationships: [];
      };
      announcements: {
        Row: Announcement;
        Insert: Omit<Announcement, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Announcement, "id" | "created_at" | "updated_at">>;
        Relationships: [];
      };
      support_tickets: {
        Row: SupportTicket;
        Insert: Omit<SupportTicket, "id" | "created_at" | "updated_at" | "status"> & { status?: TicketStatus };
        Update: Partial<Pick<SupportTicket, "status">>;
        Relationships: [];
      };
      support_ticket_replies: {
        Row: SupportTicketReply;
        Insert: Omit<SupportTicketReply, "id" | "created_at">;
        Update: never;
        Relationships: [];
      };
      talent_pool: {
        Row: TalentPoolEntry;
        Insert: Omit<TalentPoolEntry, "id" | "created_at">;
        Update: Partial<Pick<TalentPoolEntry, "note">>;
        Relationships: [];
      };
      referrals: {
        Row: Referral;
        Insert: Omit<Referral, "id" | "created_at">;
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
    Functions: {
      current_user_role: { Args: Record<string, never>; Returns: UserRole };
      is_admin: { Args: Record<string, never>; Returns: boolean };
      is_super_admin: { Args: Record<string, never>; Returns: boolean };
      has_permission: { Args: { perm: string }; Returns: boolean };
      log_audit_event: {
        Args: { p_action: string; p_entity_type: string; p_entity_id: string | null; p_metadata?: Json };
        Returns: string;
      };
      admin_update_profile_role: { Args: { p_target_user_id: string; p_new_role: UserRole }; Returns: void };
      review_dob_change_request: {
        Args: { p_request_id: string; p_decision: DobChangeStatus; p_comment?: string | null };
        Returns: void;
      };
      create_notification: {
        Args: { p_user_id: string; p_type: string; p_title: string; p_body?: string | null; p_link?: string | null };
        Returns: string;
      };
      is_company_owner: {
        Args: { p_company_id: string };
        Returns: boolean;
      };
      increment_job_views: {
        Args: { p_job_id: string };
        Returns: void;
      };
      submit_quiz_attempt: {
        Args: { p_quiz_id: string; p_answers: Json; p_time_taken_seconds?: number | null };
        Returns: { attempt_id: string; score_percent: number; correct_count: number; total_count: number; passed: boolean }[];
      };
      mark_content_complete: {
        Args: { p_content_id: string };
        Returns: void;
      };
      review_company_verification: {
        Args: { p_company_id: string; p_decision: VerificationStatus; p_comment?: string | null };
        Returns: void;
      };
      admin_update_profile_status: {
        Args: { p_target_user_id: string; p_new_status: AccountStatus };
        Returns: void;
      };
      record_failed_login: {
        Args: { p_email: string; p_ip_address?: string | null };
        Returns: void;
      };
      is_login_rate_limited: {
        Args: { p_email: string };
        Returns: boolean;
      };
      clear_login_attempts: {
        Args: { p_email: string };
        Returns: void;
      };
      change_application_status: {
        Args: { p_application_id: string; p_new_status: ApplicationStatus; p_note?: string | null };
        Returns: void;
      };
      respond_to_interview: {
        Args: { p_interview_id: string; p_response: InterviewStatus; p_note?: string | null };
        Returns: void;
      };
      reschedule_interview: {
        Args: {
          p_interview_id: string; p_mode: InterviewMode; p_platform: string | null;
          p_meeting_link: string | null; p_location: string | null; p_scheduled_at: string;
          p_duration_minutes: number; p_panel_members: string[]; p_instructions: string | null;
        };
        Returns: void;
      };
      respond_to_offer: {
        Args: { p_offer_id: string; p_response: OfferStatus };
        Returns: void;
      };
    };
  };
}
