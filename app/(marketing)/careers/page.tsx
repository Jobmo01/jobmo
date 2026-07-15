import type { Metadata } from "next";
import Link from "next/link";
import { Heart, Users, Sparkles } from "lucide-react";
import { CareersIllustration } from "@/components/marketing/careers-illustration";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Careers at JobMo",
  description: "Help us build the hiring platform Sri Lanka's job market deserves.",
};

const VALUES = [
  {
    icon: Users,
    title: "We build for real people",
    description: "Every feature starts with a question: does this actually make a job seeker's or employer's day easier?",
  },
  {
    icon: Sparkles,
    title: "Small team, real ownership",
    description: "When we do start hiring, early team members will shape the product directly — not just execute a roadmap.",
  },
  {
    icon: Heart,
    title: "Rooted in Sri Lanka",
    description: "We're building this for our own job market first, with the people and context we know best.",
  },
];

export default function CareersPage() {
  return (
    <div className="container py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="font-display text-4xl font-semibold tracking-tight">Careers at JobMo</h1>
        <p className="mt-4 text-muted-foreground">
          Help us build the hiring platform Sri Lanka&apos;s job market deserves.
        </p>
      </div>

      <div className="mx-auto mt-12 max-w-2xl">
        <CareersIllustration />
      </div>

      <div className="mx-auto mt-10 max-w-2xl rounded-lg border border-border bg-card p-8 text-center shadow-sm">
        <p className="font-display text-lg font-semibold">We&apos;re not hiring just yet — but we will be.</p>
        <p className="mt-3 text-muted-foreground">
          Right now we&apos;re heads-down building the platform. Soon enough, a team helping
          Sri Lanka hire well is going to need to hire well too — and when that day comes,
          we&apos;d love for you to already be in the loop. Check back here, or reach out now
          if you&apos;d like to be one of the first to know.
        </p>
        <Button className="mt-6" asChild>
          <Link href="/contact">Get in touch</Link>
        </Button>
      </div>

      <div className="mx-auto mt-16 max-w-4xl">
        <h2 className="text-center font-display text-2xl font-semibold">What we care about, even before we&apos;re hiring</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {VALUES.map((value) => (
            <div key={value.title} className="text-center">
              <div className="facet-clip-sm mx-auto flex h-12 w-12 items-center justify-center bg-primary/10">
                <value.icon className="h-6 w-6 text-primary" />
              </div>
              <p className="mt-4 font-display font-semibold">{value.title}</p>
              <p className="mt-1.5 text-sm text-muted-foreground">{value.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
