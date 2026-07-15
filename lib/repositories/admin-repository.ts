import { createClient } from "@/lib/supabase/server";
import type { UserRole, AccountStatus } from "@/types/database.types";

export interface AdminProfileRow {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  status: AccountStatus;
  created_at: string;
  phone?: string | null;
}

export const adminRepository = {
  async listUsers(filters: { role?: UserRole; search?: string } = {}): Promise<AdminProfileRow[]> {
    const supabase = await createClient();
    let query = (supabase.from("profiles") as any)
      .select("id, email, full_name, role, status, created_at")
      .order("created_at", { ascending: false });

    if (filters.role) query = query.eq("role", filters.role);
    if (filters.search) query = query.or(`email.ilike.%${filters.search}%,full_name.ilike.%${filters.search}%`);

    const { data, error } = await query.limit(200);
    if (error) throw error;
    const users = (data ?? []) as AdminProfileRow[];
    if (users.length === 0) return users;

    // Phone lives on applicant_profiles (applicant-specific extended
    // data) — batched lookup, not one query per user.
    const applicantIds = users.filter((u) => u.role === "applicant").map((u) => u.id);
    if (applicantIds.length > 0) {
      const { data: applicantProfiles } = await (supabase.from("applicant_profiles") as any)
        .select("id, phone")
        .in("id", applicantIds);
      const phoneById = new Map<string, string | null>((applicantProfiles ?? []).map((p: any) => [p.id, p.phone]));
      for (const user of users) {
        if (user.role === "applicant") user.phone = phoneById.get(user.id) ?? null;
      }
    }

    return users;
  },

  async getUserById(id: string) {
    const supabase = await createClient();
    const { data, error } = await (supabase.from("profiles") as any).select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return data;
  },

  /**
   * Everything needed for the admin "one-stop view" of a user during a
   * phone inquiry: their profile, role-specific extended data, their
   * applications (if applicant) or company (if employer), their support
   * tickets, and recent audit log entries about them.
   */
  async getUserDetail(id: string) {
    const supabase = await createClient();
    const profile = await this.getUserById(id);
    if (!profile) return null;

    const [supportTickets, auditLogs] = await Promise.all([
      (supabase.from("support_tickets") as any).select("*").eq("user_id", id).order("created_at", { ascending: false }),
      (supabase.from("audit_logs") as any).select("*").eq("entity_id", id).order("created_at", { ascending: false }).limit(20),
    ]);

    let applicantProfile = null;
    let applications: any[] = [];
    let company = null;
    let jobs: any[] = [];

    if (profile.role === "applicant") {
      const [{ data: ap }, { data: apps }] = await Promise.all([
        (supabase.from("applicant_profiles") as any).select("*").eq("id", id).maybeSingle(),
        (supabase.from("job_applications") as any)
          .select("*, job_postings ( title, companies ( name ) )")
          .eq("applicant_id", id)
          .order("applied_at", { ascending: false }),
      ]);
      applicantProfile = ap;
      applications = apps ?? [];
    } else if (profile.role === "employer") {
      const { data: c } = await (supabase.from("companies") as any).select("*").eq("owner_id", id).maybeSingle();
      company = c;
      if (c) {
        const { data: j } = await (supabase.from("job_postings") as any)
          .select("id, title, status, created_at")
          .eq("company_id", c.id)
          .order("created_at", { ascending: false });
        jobs = j ?? [];
      }
    }

    return {
      profile,
      applicantProfile,
      applications,
      company,
      jobs,
      supportTickets: supportTickets.data ?? [],
      auditLogs: auditLogs.data ?? [],
    };
  },

  async updateStatus(userId: string, status: AccountStatus): Promise<void> {
    const supabase = await createClient();
    const { error } = await (supabase.rpc as any)("admin_update_profile_status", {
      p_target_user_id: userId,
      p_new_status: status,
    });
    if (error) throw error;
  },

  async updateRole(userId: string, role: UserRole): Promise<void> {
    const supabase = await createClient();
    const { error } = await (supabase.rpc as any)("admin_update_profile_role", {
      p_target_user_id: userId,
      p_new_role: role,
    });
    if (error) throw error;
  },

  async updatePermissions(userId: string, permissions: Record<string, boolean>): Promise<void> {
    const supabase = await createClient();
    const { error } = await (supabase.from("profiles") as any).update({ permissions }).eq("id", userId);
    if (error) throw error;
  },

  async listAdmins(): Promise<(AdminProfileRow & { permissions: Record<string, boolean> })[]> {
    const supabase = await createClient();
    const { data, error } = await (supabase.from("profiles") as any)
      .select("id, email, full_name, role, status, created_at, permissions")
      .in("role", ["admin", "super_admin"])
      .order("role", { ascending: false });
    if (error) throw error;
    return (data ?? []) as (AdminProfileRow & { permissions: Record<string, boolean> })[];
  },

  /** role + created_at for every applicant/employer — feeds the signup
   *  growth chart on the admin and platform-analytics dashboards. */
  async getSignupTimeline(): Promise<{ role: string; created_at: string }[]> {
    const supabase = await createClient();
    const { data, error } = await (supabase.from("profiles") as any)
      .select("role, created_at")
      .in("role", ["applicant", "employer"])
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (data ?? []) as any;
  },

  async getDashboardCounts() {
    const supabase = await createClient();
    const [applicants, employers, jobs, pendingDob, pendingCompanies, openTickets] = await Promise.all([
      (supabase.from("profiles") as any).select("*", { count: "exact", head: true }).eq("role", "applicant"),
      (supabase.from("profiles") as any).select("*", { count: "exact", head: true }).eq("role", "employer"),
      (supabase.from("job_postings") as any).select("*", { count: "exact", head: true }).eq("status", "published"),
      (supabase.from("dob_change_requests") as any).select("*", { count: "exact", head: true }).eq("status", "pending"),
      (supabase.from("companies") as any).select("*", { count: "exact", head: true }).eq("verification_status", "pending"),
      (supabase.from("support_tickets") as any).select("*", { count: "exact", head: true }).eq("status", "open"),
    ]);

    return {
      totalApplicants: applicants.count ?? 0,
      totalEmployers: employers.count ?? 0,
      activeJobs: jobs.count ?? 0,
      pendingDobRequests: pendingDob.count ?? 0,
      pendingCompanyVerifications: pendingCompanies.count ?? 0,
      openSupportTickets: openTickets.count ?? 0,
    };
  },
};
