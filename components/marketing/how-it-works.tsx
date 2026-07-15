"use client";

import { motion } from "framer-motion";
import { UserCircle2, Sparkles, Handshake } from "lucide-react";

const STEPS = [
  {
    icon: UserCircle2,
    title: "Build a profile once",
    body: "Add your education, experience, and skills. Our AI extracts and tags skills automatically as you go — no manual keyword-stuffing.",
  },
  {
    icon: Sparkles,
    title: "Get matched, not buried",
    body: "Every new role is scored against your profile the moment it's posted. Cross 75% and you're notified before most applicants even see the listing.",
  },
  {
    icon: Handshake,
    title: "Track it end to end",
    body: "Applied, shortlisted, interviewing, offer — one timeline, real-time, with reminders so nothing depends on refreshing your inbox.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="container scroll-mt-20 py-20">
      <div className="mx-auto max-w-xl text-center">
        <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
          How JobMo works
        </h2>
        <p className="mt-3 text-muted-foreground">
          Three steps between your profile and your next offer.
        </p>
      </div>

      <div className="mt-14 grid gap-8 md:grid-cols-3">
        {STEPS.map((step, i) => (
          <motion.div
            key={step.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="rounded-lg border border-border bg-card p-6"
          >
            <div className="facet-clip-sm flex h-12 w-12 items-center justify-center bg-primary/10">
              <step.icon className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mt-5 font-display text-lg font-semibold">{step.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
