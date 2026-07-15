import { Wrench } from "lucide-react";

export default function MaintenancePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <Wrench className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
      <h1 className="mt-4 font-display text-2xl font-semibold">We&apos;ll be right back</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        JobMo is undergoing scheduled maintenance. Please check back shortly.
      </p>
    </div>
  );
}
