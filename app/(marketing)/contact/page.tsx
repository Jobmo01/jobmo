import type { Metadata } from "next";
import { ContactForm } from "@/components/marketing/contact-form";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with the JobMo team.",
};

export default function ContactPage() {
  return (
    <div className="container py-20">
      <div className="mx-auto max-w-md text-center">
        <h1 className="font-display text-4xl font-semibold tracking-tight">Contact Us</h1>
        <p className="mt-4 text-muted-foreground">
          Questions, feedback, or something not working? Send us a message.
        </p>
        <div className="mt-8">
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
