import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/marketing/legal-page-layout";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How JobMo collects, uses, and protects your data.",
};

export default function PrivacyPage() {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      description="How JobMo collects, uses, and protects your data."
      lastUpdated="14 July 2026"
    >
      <div className="rounded-lg border border-accent/30 bg-accent/5 p-4 text-sm text-muted-foreground">
        <strong className="text-foreground">A note before you rely on this:</strong> this policy describes,
        in good faith, what JobMo actually collects and how it&apos;s actually used. It hasn&apos;t been
        reviewed by a lawyer. Because JobMo handles government ID information (NIC numbers, passport and
        driving license details, and uploaded ID documents), we&apos;d strongly recommend having this
        reviewed by qualified legal counsel before relying on it for a live product.
      </div>

      <section>
        <h2>1. Introduction</h2>
        <p>
          JobMo (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) operates an AI-powered hiring platform
          connecting job seekers and employers in Sri Lanka. This policy explains what information we
          collect when you use JobMo, why we collect it, and what rights you have over it.
        </p>
      </section>

      <section>
        <h2>2. Information we collect</h2>
        <h3>Account information</h3>
        <p>When you register, we collect your full name, email address, and account role (applicant, employer, or admin).</p>

        <h3>Applicant profile information</h3>
        <p>If you create an applicant profile, you may provide:</p>
        <ul>
          <li>Personal details: date of birth, gender, nationality, NIC number, passport number, driving license number, phone number, and home address</li>
          <li>Emergency contact details</li>
          <li>Education, work experience, skills, certifications, projects, awards, volunteer experience, hobbies, and references</li>
          <li>Job preferences: expected salary, availability, preferred locations, and remote-work preference</li>
          <li>Uploaded documents (profile photo, resume, certificates, and — specifically for date-of-birth change requests — copies of your NIC, passport, or driving license)</li>
        </ul>
        <p>
          Date-of-birth changes go through an approval process reviewed by a JobMo administrator, and any
          supporting ID documents you upload for that purpose are stored in a private file store, accessible
          only via short-lived, time-limited links — never a permanent public URL.
        </p>

        <h3>Employer and company information</h3>
        <p>
          Employer accounts provide company details (name, description, industry, size, locations,
          website, and any uploaded logo or cover image) and information about the jobs they post.
        </p>

        <h3>Application data</h3>
        <p>
          When you apply to a job, your application, any cover note, your profile information, and the
          resulting hiring pipeline activity (status changes, interview scheduling, offers) become visible
          to the hiring company for that specific job.
        </p>

        <h3>Usage and technical data</h3>
        <p>
          We automatically log some technical information — such as job posting view counts, login
          timestamps, and IP addresses used for login rate-limiting (see &quot;Data security&quot; below) —
          to keep the platform working reliably and securely.
        </p>
      </section>

      <section>
        <h2>3. How we use AI</h2>
        <p>
          Some JobMo features — resume summary generation, ATS-style resume scoring, skill suggestions,
          job description improvement, salary range suggestions, and interview question generation — send
          relevant profile or job data to OpenAI&apos;s API to generate results. This only happens when you
          actively use one of these features (for example, clicking &quot;Generate insights&quot; on the
          Resume Builder) — it doesn&apos;t happen automatically or in the background. We don&apos;t use your
          data to train AI models, and OpenAI processes this data under its own API data-usage terms, which
          do not use API-submitted data for model training by default.
        </p>
      </section>

      <section>
        <h2>4. How we share information</h2>
        <p>We share information in these situations:</p>
        <ul>
          <li><strong>With employers</strong>, when you apply to their job posting — they see your profile and application details for that role</li>
          <li><strong>With applicants</strong>, when an employer schedules an interview, sends an offer, or updates an application — the applicant sees the relevant details</li>
          <li><strong>With service providers</strong> who help us run JobMo: Supabase (database and file storage), Netlify (hosting), and OpenAI (for the AI features described above)</li>
          <li><strong>When required by law</strong>, or to protect the rights, safety, or property of JobMo, our users, or the public</li>
        </ul>
        <p>We do not sell your personal information, and we do not use advertising trackers.</p>
      </section>

      <section>
        <h2>5. Data retention</h2>
        <p>
          We keep your account and profile data for as long as your account is active. If you close your
          account, we delete or anonymize your personal data within a reasonable period, except where we&apos;re
          required to retain records for legal, audit, or dispute-resolution purposes.
        </p>
      </section>

      <section>
        <h2>6. Your rights</h2>
        <p>You can, at any time:</p>
        <ul>
          <li>Access and update most of your profile information directly from your dashboard</li>
          <li>Request a copy of the personal data we hold about you</li>
          <li>Request that we delete your account and associated personal data</li>
          <li>Withdraw consent for optional features (for example, choosing not to use the AI features)</li>
        </ul>
        <p>To exercise any of these rights, contact us using the details in the &quot;Contact us&quot; section below.</p>
      </section>

      <section>
        <h2>7. Data security</h2>
        <p>
          Every table in our database has row-level access controls so users can only see data they&apos;re
          actually permitted to see. ID documents are stored in a private file store with time-limited
          access links. Login attempts are rate-limited to reduce the risk of unauthorized access. That
          said, no system is completely immune to risk, and we can&apos;t guarantee absolute security.
        </p>
      </section>

      <section>
        <h2>8. Children&apos;s privacy</h2>
        <p>
          JobMo is intended for people who are legally eligible to work. It is not directed at children,
          and we do not knowingly collect personal information from anyone under the minimum working age
          recognized under Sri Lankan law.
        </p>
      </section>

      <section>
        <h2>9. Changes to this policy</h2>
        <p>
          We may update this policy from time to time. If we make material changes, we&apos;ll update the
          &quot;Last updated&quot; date above and, where appropriate, notify you directly.
        </p>
      </section>

      <section>
        <h2>10. Contact us</h2>
        <p>
          Questions about this policy or your data? Reach out via our{" "}
          <a href="/contact">Contact page</a>.
        </p>
      </section>
    </LegalPageLayout>
  );
}
