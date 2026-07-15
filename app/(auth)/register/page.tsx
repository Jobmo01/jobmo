import { Suspense } from "react";
import { RegisterForm } from "@/components/marketing/register-form";

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  );
}
