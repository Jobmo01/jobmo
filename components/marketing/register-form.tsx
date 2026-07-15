"use client";

import { useState } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { registerAction, signInWithGoogleAction } from "@/app/(auth)/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Creating account…" : "Create account"}
    </Button>
  );
}

export function RegisterForm() {
  const searchParams = useSearchParams();
  const [accountType, setAccountType] = useState<"applicant" | "employer">(
    searchParams.get("type") === "employer" ? "employer" : "applicant"
  );
  const [state, formAction] = useActionState(registerAction, null);

  if (state?.success) {
    return (
      <div className="text-center">
        <h1 className="font-display text-2xl font-semibold">Check your inbox</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We&apos;ve sent a confirmation link to your email. Click it to activate your account.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold">Create your account</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Free for applicants. Free for employers during early access.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-2 rounded-md bg-secondary p-1">
        {(["applicant", "employer"] as const).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setAccountType(type)}
            className={cn(
              "rounded-sm py-2 text-sm font-medium transition-colors",
              accountType === type
                ? "bg-card shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {type === "applicant" ? "I'm looking for a job" : "I'm hiring"}
          </button>
        ))}
      </div>

      <form action={signInWithGoogleAction} className="mt-6">
        <Button type="submit" variant="outline" className="w-full">
          Continue with Google
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">OR</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="accountType" value={accountType} />

        <div className="space-y-1.5">
          <Label htmlFor="fullName">Full name</Label>
          <Input id="fullName" name="fullName" required autoComplete="name" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required autoComplete="email" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" required autoComplete="new-password" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <Input id="confirmPassword" name="confirmPassword" type="password" required autoComplete="new-password" />
        </div>

        <div className="flex items-start gap-2">
          <input
            id="agreeToTerms"
            name="agreeToTerms"
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-input"
            required
          />
          <Label htmlFor="agreeToTerms" className="text-xs font-normal text-muted-foreground">
            I agree to the{" "}
            <Link href="/terms" className="text-primary hover:underline">Terms</Link> and{" "}
            <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
          </Label>
        </div>

        {state?.error && (
          <p role="alert" className="text-sm text-destructive">
            {state.error}
          </p>
        )}

        <SubmitButton />
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
