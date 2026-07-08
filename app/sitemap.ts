import type { MetadataRoute } from "next";

const staticRoutes = [
  "", "jobs", "companies", "pricing", "about", "learning-center", "blog",
  "faq", "contact", "privacy", "terms", "cookies", "careers", "features",
  "success-stories", "press",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://jobmo.lk";
  return staticRoutes.map((route) => ({
    url: `${base}/${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "daily" : "weekly",
    priority: route === "" ? 1 : 0.7,
  }));
}
