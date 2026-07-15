import type { JobPosting, Company } from "@/types/database.types";

type JobPostingCompany = Pick<Company, "id" | "name" | "logo_url" | "locations">;

const SITE_URL = "https://www.jobmo.lk";
const SITE_NAME = "JobMo";

/**
 * Builds Google's required + recommended JobPosting structured data for one
 * job. This is what makes a listing eligible to appear in Google's dedicated
 * job search results ("Google for Jobs") — completely free, no ad spend
 * involved, and one of the highest-leverage things a job board can do for
 * search visibility.
 *
 * Required by Google: title, description, datePosted, hiringOrganization,
 * jobLocation (or jobLocationType for remote), validThrough.
 * Recommended: baseSalary, employmentType.
 */
export function buildJobPostingSchema(job: JobPosting, company: JobPostingCompany | null, jobUrl: string) {
  const employmentTypeMap: Record<string, string> = {
    full_time: "FULL_TIME",
    part_time: "PART_TIME",
    contract: "CONTRACTOR",
    internship: "INTERN",
    freelance: "OTHER",
  };

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    // Google requires the full HTML description to match what's visible on
    // the page — this is the same field rendered in the job detail view.
    description: job.description,
    datePosted: job.published_at ?? job.created_at,
    hiringOrganization: {
      "@type": "Organization",
      name: company?.name ?? SITE_NAME,
      sameAs: company ? `${SITE_URL}/companies/${company.id}` : SITE_URL,
      ...(company?.logo_url ? { logo: company.logo_url } : {}),
    },
  };

  // validThrough is mandatory for Google — a job without a deadline still
  // needs an expiry date, or the listing risks being treated as stale/ghost
  // content once it's been up a while. Default to 60 days out when the
  // employer didn't set a deadline, rather than omitting the field.
  const defaultDeadline = new Date();
  defaultDeadline.setDate(defaultDeadline.getDate() + 60);
  schema.validThrough = job.application_deadline
    ? new Date(job.application_deadline).toISOString()
    : defaultDeadline.toISOString();

  if (job.employment_type) {
    schema.employmentType = employmentTypeMap[job.employment_type] ?? "OTHER";
  }

  if (job.work_type === "remote") {
    schema.jobLocationType = "TELECOMMUTE";
    schema.applicantLocationRequirements = { "@type": "Country", name: "Sri Lanka" };
  } else {
    const locality = company?.locations?.[0] ?? "Sri Lanka";
    schema.jobLocation = {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: locality,
        addressCountry: "LK",
      },
    };
  }

  // Salary is recommended, not required — only include it if the employer
  // opted to show it and actually provided a number.
  if (job.show_salary && (job.salary_min || job.salary_max)) {
    schema.baseSalary = {
      "@type": "MonetaryAmount",
      currency: job.salary_currency ?? "LKR",
      value: {
        "@type": "QuantitativeValue",
        ...(job.salary_min ? { minValue: job.salary_min } : {}),
        ...(job.salary_max ? { maxValue: job.salary_max } : {}),
        unitText: "MONTH",
      },
    };
  }

  schema.url = jobUrl;
  return schema;
}

/** Organization schema — establishes JobMo as a real, named entity to
 *  Google. Free, sitewide, and foundational for how Google (and AI answer
 *  engines) understand who JobMo is. */
export function buildOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/icon.png`,
    description: "AI-powered hiring platform connecting job seekers and employers in Sri Lanka.",
    areaServed: { "@type": "Country", name: "Sri Lanka" },
  };
}

/** Breadcrumb schema — small effort, real click-through-rate benefit in
 *  search results (shows a path like Home > Jobs > Senior Frontend Engineer
 *  instead of a bare URL). */
export function buildBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
