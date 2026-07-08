"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="container grid gap-12 pb-20 pt-16 md:grid-cols-2 md:items-center md:pb-28 md:pt-24">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <span className="inline-flex items-center rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">
            Built for Sri Lanka&apos;s hiring market
          </span>
          <h1 className="mt-5 text-balance font-display text-4xl font-semibold leading-[1.1] tracking-tight md:text-6xl">
            Hiring that actually{" "}
            <span className="text-primary underline decoration-accent decoration-4 underline-offset-8">
              matches.
            </span>
          </h1>
          <p className="mt-5 max-w-md text-balance text-lg text-muted-foreground">
            JobMo scores every applicant against every role with AI — so
            candidates see exactly why they fit, and employers spend time
            only on the people who do.
          </p>

          <form className="mt-8 flex max-w-md flex-col gap-3 sm:flex-row" role="search">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Job title, skill, or company"
                className="pl-9"
                aria-label="Search jobs"
              />
            </div>
            <Button type="submit" size="default">
              Search Jobs
            </Button>
          </form>

          <div className="mt-6 flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/register" className="inline-flex items-center gap-1 font-medium text-foreground hover:text-primary">
              Create your profile <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link href="/register?type=employer" className="hover:text-foreground">
              I&apos;m hiring →
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.15 }}
          className="relative mx-auto flex h-72 w-72 items-center justify-center md:h-96 md:w-96"
          aria-hidden="true"
        >
          <div className="facet-clip absolute inset-0 animate-facet-in bg-gradient-to-br from-primary to-primary/70" />
          <div className="facet-clip-sm absolute inset-6 flex flex-col items-center justify-center bg-background text-center">
            <span className="font-mono text-5xl font-medium text-primary md:text-6xl">92%</span>
            <span className="mt-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Match score
            </span>
          </div>
          <span className="absolute -right-2 top-6 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground shadow-lg">
            Senior Frontend Engineer
          </span>
          <span className="absolute -left-4 bottom-10 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium shadow-lg">
            Skills matched: 8/9
          </span>
        </motion.div>
      </div>
    </section>
  );
}
