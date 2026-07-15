import { Hero } from "@/components/marketing/hero";
import { AudienceSections } from "@/components/marketing/audience-sections";
import { Stats } from "@/components/marketing/stats";
import { LatestJobs } from "@/components/marketing/latest-jobs";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { AiFeatures } from "@/components/marketing/ai-features";
import { Testimonials, FinalCta } from "@/components/marketing/testimonials-cta";
import { jobRepository } from "@/lib/repositories/job-repository";

export default async function HomePage() {
  const jobs = await jobRepository.listPublished(4);

  return (
    <>
      <Hero />
      <AudienceSections />
      <HowItWorks />
      <Stats />
      <LatestJobs jobs={jobs as any} />
      <AiFeatures />
      <Testimonials />
      <FinalCta />
    </>
  );
}
