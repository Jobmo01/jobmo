import { createClient } from "@/lib/supabase/server";

export interface DateRangeFilter {
  dateFrom?: string;
  dateTo?: string;
}

function applyDateRange(query: any, column: string, filters: DateRangeFilter) {
  if (filters.dateFrom) query = query.gte(column, filters.dateFrom);
  if (filters.dateTo) query = query.lte(column, `${filters.dateTo}T23:59:59`);
  return query;
}

export const reportsRepository = {
  async getJobsReport(filters: DateRangeFilter & { status?: string; workType?: string; employmentType?: string }) {
    const supabase = await createClient();
    let query = (supabase.from("job_postings") as any)
      .select("id, title, status, work_type, employment_type, experience_level, salary_min, salary_max, salary_currency, application_deadline, published_at, created_at, companies ( name )")
      .order("created_at", { ascending: false });

    if (filters.status) query = query.eq("status", filters.status);
    if (filters.workType) query = query.eq("work_type", filters.workType);
    if (filters.employmentType) query = query.eq("employment_type", filters.employmentType);
    query = applyDateRange(query, "created_at", filters);

    const { data, error } = await query;
    if (error) throw error;

    const jobIds = (data ?? []).map((j: any) => j.id);
    const countsByJob = new Map<string, number>();
    if (jobIds.length > 0) {
      const { data: apps } = await (supabase.from("job_applications") as any).select("job_id").in("job_id", jobIds);
      for (const a of apps ?? []) countsByJob.set(a.job_id, (countsByJob.get(a.job_id) ?? 0) + 1);
    }

    return (data ?? []).map((j: any) => ({
      "Job Title": j.title,
      "Company": j.companies?.name ?? "—",
      "Status": j.status,
      "Work Type": j.work_type ?? "—",
      "Employment Type": j.employment_type ?? "—",
      "Experience Level": j.experience_level ?? "—",
      "Salary Range": j.salary_min || j.salary_max ? `${j.salary_currency ?? "LKR"} ${j.salary_min ?? "?"}–${j.salary_max ?? "?"}` : "—",
      "Applicants": countsByJob.get(j.id) ?? 0,
      "Application Deadline": j.application_deadline ? j.application_deadline.slice(0, 10) : "—",
      "Published": j.published_at ? j.published_at.slice(0, 10) : "—",
      "Created": j.created_at.slice(0, 10),
    }));
  },

  async getUsersReport(filters: DateRangeFilter & { role?: string; status?: string }) {
    const supabase = await createClient();
    let query = (supabase.from("profiles") as any)
      .select("id, full_name, email, role, status, created_at")
      .order("created_at", { ascending: false });

    if (filters.role) query = query.eq("role", filters.role);
    if (filters.status) query = query.eq("status", filters.status);
    query = applyDateRange(query, "created_at", filters);

    const { data, error } = await query;
    if (error) throw error;

    const applicantIds = (data ?? []).filter((u: any) => u.role === "applicant").map((u: any) => u.id);
    const phoneById = new Map<string, string | null>();
    if (applicantIds.length > 0) {
      const { data: applicantProfiles } = await (supabase.from("applicant_profiles") as any)
        .select("id, phone, district")
        .in("id", applicantIds);
      for (const p of applicantProfiles ?? []) phoneById.set(p.id, p.phone);
    }

    return (data ?? []).map((u: any) => ({
      "Name": u.full_name ?? "—",
      "Email": u.email,
      "Phone": phoneById.get(u.id) ?? "—",
      "Role": u.role,
      "Status": u.status,
      "Joined": u.created_at.slice(0, 10),
    }));
  },

  async getApplicationsReport(filters: DateRangeFilter & { status?: string }) {
    const supabase = await createClient();
    let query = (supabase.from("job_applications") as any)
      .select("id, status, applied_at, applicant_id, job_postings ( title, companies ( name ) )")
      .order("applied_at", { ascending: false });

    if (filters.status) query = query.eq("status", filters.status);
    if (filters.dateFrom) query = query.gte("applied_at", filters.dateFrom);
    if (filters.dateTo) query = query.lte("applied_at", `${filters.dateTo}T23:59:59`);

    const { data, error } = await query;
    if (error) throw error;

    const applicantIds = [...new Set((data ?? []).map((a: any) => a.applicant_id))];
    const nameById = new Map<string, string>();
    if (applicantIds.length > 0) {
      const { data: profiles } = await (supabase.from("profiles") as any).select("id, full_name, email").in("id", applicantIds);
      for (const p of profiles ?? []) nameById.set(p.id, p.full_name ?? p.email);
    }

    return (data ?? []).map((a: any) => ({
      "Applicant": nameById.get(a.applicant_id) ?? "—",
      "Job Title": a.job_postings?.title ?? "—",
      "Company": a.job_postings?.companies?.name ?? "—",
      "Status": a.status,
      "Applied": a.applied_at.slice(0, 10),
    }));
  },

  async getCompaniesReport(filters: DateRangeFilter & { verificationStatus?: string; industry?: string }) {
    const supabase = await createClient();
    let query = (supabase.from("companies") as any)
      .select("id, name, industry, company_size, phone, website_url, verification_status, owner_id, created_at")
      .order("created_at", { ascending: false });

    if (filters.verificationStatus) query = query.eq("verification_status", filters.verificationStatus);
    if (filters.industry) query = query.eq("industry", filters.industry);
    query = applyDateRange(query, "created_at", filters);

    const { data, error } = await query;
    if (error) throw error;

    const ownerIds = (data ?? []).map((c: any) => c.owner_id);
    const ownerById = new Map<string, { full_name: string | null; email: string }>();
    if (ownerIds.length > 0) {
      const { data: owners } = await (supabase.from("profiles") as any).select("id, full_name, email").in("id", ownerIds);
      for (const o of owners ?? []) ownerById.set(o.id, o);
    }

    const companyIds = (data ?? []).map((c: any) => c.id);
    const jobCountByCompany = new Map<string, number>();
    if (companyIds.length > 0) {
      const { data: jobs } = await (supabase.from("job_postings") as any).select("company_id").in("company_id", companyIds);
      for (const j of jobs ?? []) jobCountByCompany.set(j.company_id, (jobCountByCompany.get(j.company_id) ?? 0) + 1);
    }

    return (data ?? []).map((c: any) => ({
      "Company Name": c.name,
      "Industry": c.industry ?? "—",
      "Size": c.company_size ?? "—",
      "Phone": c.phone ?? "—",
      "Website": c.website_url ?? "—",
      "Verification Status": c.verification_status,
      "Account Holder": ownerById.get(c.owner_id)?.full_name ?? ownerById.get(c.owner_id)?.email ?? "—",
      "Jobs Posted": jobCountByCompany.get(c.id) ?? 0,
      "Joined": c.created_at.slice(0, 10),
    }));
  },
};
