"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check, User, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const JOB_SEEKER_POINTS = [
  "Create one free profile — education, experience, skills, all in one place",
  "See a match score on every job, so you know why it fits before you apply",
  "Apply in one click — no repeated forms",
  "Track every application in a single, clear timeline",
];

const EMPLOYER_POINTS = [
  "Build your company page and post jobs in minutes",
  "Review every applicant on one screen — skip the messy email threads",
  "Move candidates through your pipeline with a simple drag-and-drop board",
  "Schedule interviews and send offers without leaving the platform",
];

export function AudienceSections() {
  return (
    <>
      <section id="job-seekers" className="container scroll-mt-20 py-16">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="facet-clip-sm flex h-12 w-12 items-center justify-center bg-primary/10">
              <User className="h-6 w-6 text-primary" />
            </div>
            <h2 className="mt-5 font-display text-3xl font-semibold tracking-tight">
              Looking for a job?
            </h2>
            <p className="mt-3 text-muted-foreground">
              JobMo is free for job seekers. Build one profile, and let it work for you —
              instead of filling out the same form on ten different sites.
            </p>
            <ul className="mt-6 space-y-3">
              {JOB_SEEKER_POINTS.map((point) => (
                <li key={point} className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  {point}
                </li>
              ))}
            </ul>
            <Button className="mt-6" asChild>
              <Link href="/register">Create your free profile</Link>
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-lg border border-border bg-card p-6 shadow-sm"
            aria-hidden="true"
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <p className="font-display font-semibold">Senior Frontend Engineer</p>
              <span className="rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-semibold text-accent">92% match</span>
            </div>
            <div className="mt-3 space-y-2 text-sm text-muted-foreground">
              <p>✓ 8 of 9 required skills matched</p>
              <p>✓ Experience level fits</p>
              <p>✓ Salary expectations align</p>
            </div>
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div className="h-full w-[92%] bg-primary" />
            </div>
          </motion.div>
        </div>
      </section>

      <section id="employers" className="scroll-mt-20 border-y border-border bg-secondary/30 py-16">
        <div className="container grid items-center gap-10 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="order-2 rounded-lg border border-border bg-card p-6 shadow-sm md:order-1"
            aria-hidden="true"
          >
            <div className="flex gap-2">
              {["Applied", "Shortlisted", "Interview"].map((col) => (
                <div key={col} className="flex-1 rounded-md bg-secondary/60 p-2">
                  <p className="text-xs font-semibold text-muted-foreground">{col}</p>
                  <div className="mt-2 space-y-1.5">
                    <div className="h-8 rounded bg-card shadow-sm" />
                    <div className="h-8 rounded bg-card shadow-sm" />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="order-1 md:order-2"
          >
            <div className="facet-clip-sm flex h-12 w-12 items-center justify-center bg-accent/15">
              <Building2 className="h-6 w-6 text-accent" />
            </div>
            <h2 className="mt-5 font-display text-3xl font-semibold tracking-tight">
              Hiring for your team?
            </h2>
            <p className="mt-3 text-muted-foreground">
              Post a job free during early access. Every applicant lands in one clear
              pipeline — no spreadsheets, no lost emails.
            </p>
            <ul className="mt-6 space-y-3">
              {EMPLOYER_POINTS.map((point) => (
                <li key={point} className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  {point}
                </li>
              ))}
            </ul>
            <Button className="mt-6" variant="accent" asChild>
              <Link href="/register?type=employer">Post your first job</Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </>
  );
}
