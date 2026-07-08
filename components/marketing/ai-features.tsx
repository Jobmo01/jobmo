"use client";

import { motion } from "framer-motion";
import { FileText, Target, GraduationCap, MessageSquareText } from "lucide-react";

const FEATURES = [
  {
    icon: FileText,
    title: "AI resume builder",
    body: "Turns your profile into an ATS-optimized CV and cover letter, with a live resume score and rewrite suggestions.",
  },
  {
    icon: Target,
    title: "Explainable job matching",
    body: "Every match shows its reasoning — which skills lined up, which are missing, and what would raise your score.",
  },
  {
    icon: MessageSquareText,
    title: "Interview question generation",
    body: "Employers get role-specific interview questions drawn from the job description and the candidate's actual profile.",
  },
  {
    icon: GraduationCap,
    title: "AI career coaching",
    body: "Personalized skill and certification suggestions based on where your profile is strong and where roles you want require more.",
  },
];

export function AiFeatures() {
  return (
    <section className="container py-20">
      <div className="mx-auto max-w-xl text-center">
        <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
          AI that does the tedious part
        </h2>
        <p className="mt-3 text-muted-foreground">
          Not a chatbot bolted on top — matching, writing, and screening built into the core.
        </p>
      </div>

      <div className="mt-14 grid gap-6 sm:grid-cols-2">
        {FEATURES.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: i * 0.07 }}
            className="flex gap-4 rounded-lg border border-border bg-card p-6"
          >
            <div className="facet-clip-sm flex h-11 w-11 shrink-0 items-center justify-center bg-accent/15">
              <f.icon className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h3 className="font-display font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
