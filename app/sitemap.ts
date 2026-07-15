import type { MetadataRoute } from "next";
import { jobRepository } from "@/lib/repositories/job-repository";
import { companyRepository } from "@/lib/repositories/company-repository";

const staticRoutes = [
  "", "jobs", "companies", "pricing", "about", "learning-center", "blog",
  "faq", "contact", "privacy", "terms", "cookies", "careers", "features",
  "success-stories", "press",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://www.jobmo.lk";

  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${base}/${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "daily" : "weekly",
    priority: route === "" ? 1 : 0.7,
  }));

  // Job and company pages are the actual content search engines need to
  // find — a sitemap listing only static marketing pages misses almost
  // everything on a job board. Wrapped so a database hiccup degrades to
  // "sitemap without dynamic pages" rather than crashing the sitemap route
  // entirely (which would break indexing of the static pages too).
  try {
    const [jobs, companies] = await Promise.all([
      jobRepository.listPublished(2000),
      companyRepository.listPublic(500),
    ]);

    const jobEntries: MetadataRoute.Sitemap = jobs.map((job) => ({
      url: `${base}/jobs/${job.id}`,
      lastModified: new Date(job.updated_at ?? job.published_at ?? job.created_at),
      changeFrequency: "daily",
      priority: 0.9,
    }));

    const companyEntries: MetadataRoute.Sitemap = companies.map((company) => ({
      url: `${base}/companies/${company.id}`,
      lastModified: new Date(company.updated_at ?? company.created_at),
      changeFrequency: "weekly",
      priority: 0.6,
    }));

    return [...staticEntries, ...jobEntries, ...companyEntries];
  } catch {
    return staticEntries;
  }
}
