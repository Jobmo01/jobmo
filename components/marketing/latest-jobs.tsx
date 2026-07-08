"use client";

import { motion } from "framer-motion";
import { MapPin, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

// Placeholder data — replaced by a live Supabase query in Phase 3 (Employer Module).
const JOBS = [
  { title: "Senior Frontend Engineer", company: "Dialog Axiata", location: "Colombo", type: "Full-time", tag: "Remote friendly" },
  { title: "Product Designer", company: "Sysco LABS", location: "Colombo", type: "Full-time", tag: "Hybrid" },
  { title: "Data Analyst", company: "Cargills", location: "Colombo", type: "Full-time", tag: "On-site" },
  { title: "DevOps Engineer", company: "WSO2", location: "Colombo", type: "Contract", tag: "Remote" },
];

export function LatestJobs() {
  return (
    <section className="border-y border-border bg-secondary/30 py-20">
      <div className="container">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
              Latest roles
            </h2>
            <p className="mt-2 text-muted-foreground">Freshly posted, freshly matched.</p>
          </div>
          <Button variant="outline" size="sm" asChild className="hidden sm:inline-flex">
            <Link href="/jobs">View all jobs</Link>
          </Button>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {JOBS.map((job, i) => (
            <motion.div
              key={job.title}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
            >
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="flex items-center justify-between gap-4 p-5">
                  <div>
                    <h3 className="font-display font-semibold">{job.title}</h3>
                    <p className="text-sm text-muted-foreground">{job.company}</p>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" /> {job.location}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Briefcase className="h-3.5 w-3.5" /> {job.type}
                      </span>
                    </div>
                  </div>
                  <span className="whitespace-nowrap rounded-full bg-accent/15 px-3 py-1 text-xs font-medium text-accent">
                    {job.tag}
                  </span>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <Button variant="outline" size="sm" asChild className="mt-8 w-full sm:hidden">
          <Link href="/jobs">View all jobs</Link>
        </Button>
      </div>
    </section>
  );
}
