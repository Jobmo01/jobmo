"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Wire this up to an error-tracking service (e.g. Sentry) in a later phase.
    console.error(error);
  }, [error]);

  return (
    <html>
      <body className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
        <AlertTriangle className="h-10 w-10 text-destructive" aria-hidden="true" />
        <h1 className="mt-4 text-2xl font-semibold">Something went wrong</h1>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          An unexpected error occurred. You can try again, and if it keeps
          happening, let us know via the Contact page.
        </p>
        <Button className="mt-6" onClick={() => reset()}>
          Try again
        </Button>
      </body>
    </html>
  );
}
