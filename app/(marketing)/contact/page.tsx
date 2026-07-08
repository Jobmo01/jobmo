import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with the JobMo team.",
};

export default function Page() {
  return (
    <div className="container py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="font-display text-4xl font-semibold tracking-tight">Contact Us</h1>
        <p className="mt-4 text-muted-foreground">Get in touch with the JobMo team.</p>
        <p className="mt-8 rounded-lg border border-dashed border-border bg-secondary/40 p-6 text-sm text-muted-foreground">
          This page is scaffolded in Phase 1 with routing, layout, and SEO metadata.
          Full content and data wiring land in the phase that owns this feature area.
        </p>
      </div>
    </div>
  );
}
