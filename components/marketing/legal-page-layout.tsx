interface LegalPageLayoutProps {
  title: string;
  description: string;
  lastUpdated: string;
  children: React.ReactNode;
}

/**
 * Shared wrapper for Privacy, Terms, and Cookies — consistent heading/
 * paragraph/list styling via arbitrary child selectors (matching the
 * pattern already used for rendered HTML in job-detail-content.tsx),
 * since @tailwindcss/typography isn't installed in this project.
 */
export function LegalPageLayout({ title, description, lastUpdated, children }: LegalPageLayoutProps) {
  return (
    <div className="container py-20">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <h1 className="font-display text-4xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-4 text-muted-foreground">{description}</p>
          <p className="mt-2 text-xs text-muted-foreground">Last updated: {lastUpdated}</p>
        </div>

        <div
          className="mt-12 space-y-8
            [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:tracking-tight
            [&_h3]:font-display [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-4
            [&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-muted-foreground [&_p]:mt-2
            [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5 [&_ul]:text-sm [&_ul]:text-muted-foreground
            [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2
            [&_strong]:font-medium [&_strong]:text-foreground"
        >
          {children}
        </div>
      </div>
    </div>
  );
}
