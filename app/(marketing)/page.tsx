import { Hero } from "@/components/marketing/hero";
import { Stats } from "@/components/marketing/stats";
import { LatestJobs } from "@/components/marketing/latest-jobs";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { AiFeatures } from "@/components/marketing/ai-features";
import { Testimonials, FinalCta } from "@/components/marketing/testimonials-cta";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Stats />
      <HowItWorks />
      <LatestJobs />
      <AiFeatures />
      <Testimonials />
      <FinalCta />
    </>
  );
}
