import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, Globe, MapPin } from "lucide-react";
import { companyRepository } from "@/lib/repositories/company-repository";
import { createClient } from "@/lib/supabase/server";
import { JsonLd } from "@/components/seo/json-ld";
import { buildBreadcrumbSchema } from "@/lib/seo/schema";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const company = await companyRepository.getById(id);
  if (!company) return { title: "Company not found" };
  return { title: company.name, description: company.tagline ?? company.description ?? undefined };
}

export default async function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const company = await companyRepository.getById(id);
  if (!company) notFound();

  const supabase = await createClient();
  const { data: jobs } = await (supabase.from("job_postings") as any)
    .select("id, title, work_type, employment_type")
    .eq("company_id", company.id)
    .eq("status", "published")
    .order("published_at", { ascending: false });

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: "Home", url: "https://www.jobmo.lk" },
    { name: "Companies", url: "https://www.jobmo.lk/companies" },
    { name: company.name, url: `https://www.jobmo.lk/companies/${company.id}` },
  ]);

  return (
    <div>
      <JsonLd data={breadcrumbSchema} />
      {company.cover_image_url && (
        <div className="h-48 w-full bg-secondary sm:h-64">
          <Image src={company.cover_image_url} alt="" width={1600} height={400} className="h-full w-full object-cover" />
        </div>
      )}

      <div className="container max-w-3xl py-10">
        <div className="flex items-center gap-4">
          {company.logo_url ? (
            <Image src={company.logo_url} alt={company.name} width={64} height={64} className="rounded-lg border border-border object-cover" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-secondary text-xl font-semibold">
              {company.name.charAt(0)}
            </div>
          )}
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-display text-2xl font-semibold">{company.name}</h1>
              {company.verification_status === "verified" && (
                <BadgeCheck className="h-5 w-5 text-primary" aria-label="Verified employer" />
              )}
            </div>
            {company.tagline && <p className="text-muted-foreground">{company.tagline}</p>}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3 text-sm text-muted-foreground">
          {company.industry && <span>{company.industry}</span>}
          {company.company_size && <span>{company.company_size} employees</span>}
          {company.locations?.length > 0 && (
            <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" /> {company.locations.join(", ")}</span>
          )}
          {company.website_url && (
            <a href={company.website_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-foreground">
              <Globe className="h-4 w-4" /> Website
            </a>
          )}
        </div>

        {company.description && <p className="mt-6 leading-relaxed text-foreground">{company.description}</p>}

        {company.benefits?.length > 0 && (
          <div className="mt-6">
            <h2 className="font-display font-semibold">Benefits</h2>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {company.benefits.map((b) => <Badge key={b} variant="accent">{b}</Badge>)}
            </div>
          </div>
        )}

        {company.culture_description && (
          <div className="mt-6">
            <h2 className="font-display font-semibold">Culture</h2>
            <p className="mt-2 leading-relaxed text-muted-foreground">{company.culture_description}</p>
          </div>
        )}

        {company.gallery_urls?.length > 0 && (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {company.gallery_urls.map((url) => (
              <Image key={url} src={url} alt="" width={200} height={150} className="h-28 w-full rounded-md object-cover" />
            ))}
          </div>
        )}

        <div className="mt-10">
          <h2 className="font-display text-xl font-semibold">Open roles</h2>
          <div className="mt-4 space-y-3">
            {(jobs ?? []).map((job: any) => (
              <Link key={job.id} href={`/jobs/${job.id}`}>
                <Card className="transition-shadow hover:shadow-md">
                  <CardContent className="p-4">
                    <p className="font-medium">{job.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {job.work_type?.replace("_", " ")} • {job.employment_type?.replace("_", " ")}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
            {(!jobs || jobs.length === 0) && (
              <p className="text-sm text-muted-foreground">No open roles right now.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
