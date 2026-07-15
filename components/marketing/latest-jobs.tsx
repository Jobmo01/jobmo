"use client";

import { motion } from "framer-motion";
import { MapPin, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

interface JobPreview {
  id: string;
  title: string;
  work_type: string | null;
  employment_type: string | null;
  companies: { name: string } | null;
}

export function LatestJobs({ jobs }: { jobs: JobPreview[] }) {
  if (jobs.length === 0) return null;

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
          {jobs.map((job, i) => (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
            >
              <Link href={`/jobs/${job.id}`}>
                <Card className="transition-shadow hover:shadow-md">
                  <CardContent className="flex items-center justify-between gap-4 p-5">
                    <div>
                      <h3 className="font-display font-semibold">{job.title}</h3>
                      <p className="text-sm text-muted-foreground">{job.companies?.name}</p>
                      <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                        {job.work_type && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" /> {job.work_type.replace("_", " ")}
                          </span>
                        )}
                        {job.employment_type && (
                          <span className="inline-flex items-center gap-1">
                            <Briefcase className="h-3.5 w-3.5" /> {job.employment_type.replace("_", " ")}
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
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
