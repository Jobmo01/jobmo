import { WifiOff } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <WifiOff className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
      <h1 className="mt-4 font-display text-2xl font-semibold">You&apos;re offline</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Check your connection and try again. Anything you were viewing should
        reload automatically once you&apos;re back online.
      </p>
    </div>
  );
}
