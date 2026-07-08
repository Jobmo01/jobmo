import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AccountSuspendedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <ShieldAlert className="h-10 w-10 text-destructive" aria-hidden="true" />
      <h1 className="mt-4 font-display text-2xl font-semibold">Your account is suspended</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        An administrator has suspended this account. If you believe this is a
        mistake, contact support and we&apos;ll help sort it out.
      </p>
      <Button className="mt-6" asChild>
        <Link href="/contact">Contact support</Link>
      </Button>
    </div>
  );
}
