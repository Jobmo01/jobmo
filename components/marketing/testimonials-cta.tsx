"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const TESTIMONIALS = [
  {
    quote:
      "We shortlisted our first developer hire in under a week — the AI ranking actually matched what we would have picked manually.",
    name: "Head of Talent",
    company: "Colombo-based fintech",
  },
  {
    quote:
      "The match explanation is the feature I didn't know I needed. I finally understood which skill gap was costing me interviews.",
    name: "Recent graduate",
    company: "Applicant, IT graduate",
  },
];

export function Testimonials() {
  return (
    <section className="bg-primary py-20 text-primary-foreground">
      <div className="container">
        <h2 className="text-center font-display text-3xl font-semibold tracking-tight md:text-4xl">
          Trusted by hiring teams and job seekers alike
        </h2>
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {TESTIMONIALS.map((t, i) => (
            <motion.blockquote
              key={t.name}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="rounded-lg border border-primary-foreground/15 bg-primary-foreground/5 p-6"
            >
              <p className="text-balance text-lg leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
              <footer className="mt-4 text-sm text-primary-foreground/70">
                {t.name} — {t.company}
              </footer>
            </motion.blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FinalCta() {
  return (
    <section className="container py-24 text-center">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="mx-auto max-w-lg text-balance font-display text-3xl font-semibold tracking-tight md:text-4xl">
          Your next hire — or your next role — is a match score away.
        </h2>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button size="lg" asChild>
            <Link href="/register">Create your profile — it&apos;s free</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/register?type=employer">Post your first job</Link>
          </Button>
        </div>
      </motion.div>
    </section>
  );
}
