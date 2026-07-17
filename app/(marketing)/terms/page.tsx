import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/marketing/legal-page-layout";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that govern your use of JobMo.",
};

export default function TermsPage() {
  return (
    <LegalPageLayout
      title="Terms of Service"
      description="The terms that govern your use of JobMo."
      lastUpdated="17 July 2026"
    >
      <div className="rounded-lg border border-accent/30 bg-accent/5 p-4 text-sm text-muted-foreground">
        <strong className="text-foreground">A note before you rely on this:</strong> this is a good-faith
        starting template, not legal advice, and hasn&apos;t been reviewed by a lawyer. Have it reviewed by
        qualified legal counsel before relying on it for a live product with real users.
      </div>

      <section>
        <h2>1. Acceptance of terms</h2>
        <p>
          By creating an account or using JobMo, you agree to these Terms of Service. If you don&apos;t agree,
          please don&apos;t use the platform.
        </p>
      </section>

      <section>
        <h2>2. Who can use JobMo</h2>
        <p>
          You must be legally eligible to work (for applicant accounts) or legally authorized to hire on
          behalf of your organization (for employer accounts) to use JobMo. You&apos;re responsible for
          ensuring the information you provide is accurate and kept up to date.
        </p>
      </section>

      <section>
        <h2>3. Accounts and roles</h2>
        <p>
          JobMo has three account types: applicant, employer, and administrator. Each account is
          individual — don&apos;t share your login credentials, and let us know right away if you suspect
          unauthorized access to your account.
        </p>
      </section>

      <section>
        <h2>4. Applicant responsibilities</h2>
        <p>As an applicant, you agree to:</p>
        <ul>
          <li>Provide accurate information in your profile and applications</li>
          <li>Only request a date-of-birth change with genuine supporting documentation</li>
          <li>Use the platform for genuine job-seeking purposes</li>
          <li>Treat employers and their hiring processes respectfully, including interview scheduling</li>
        </ul>
      </section>

      <section>
        <h2>5. Employer responsibilities and job postings</h2>
        <p>As an employer, you agree to:</p>
        <ul>
          <li>Post only genuine, currently-open roles with accurate descriptions, requirements, and (where shown) compensation</li>
          <li>Not use job postings to collect personal data for any purpose other than genuine recruitment</li>
          <li>Not discriminate against applicants on any basis prohibited by applicable law</li>
          <li>Handle applicant data (including any documents shared during the hiring process) responsibly and only for recruitment purposes</li>
          <li>Complete the company verification process honestly — verification badges are a signal of legitimacy, not a JobMo guarantee</li>
        </ul>
        <p>
          JobMo automatically awards a job-boost credit (which prioritizes one listing at the top of search
          results) for every 3 genuine jobs a company posts. <strong>Posting fake, placeholder, or
          duplicate job listings to accumulate boost credits is a violation of these terms</strong> and will
          result in the company&apos;s account being permanently banned from the platform.
        </p>
      </section>

      <section>
        <h2>6. Prohibited uses</h2>
        <p>You may not use JobMo to:</p>
        <ul>
          <li>Post false, misleading, fraudulent, or scam job listings or applications</li>
          <li>Harass, threaten, or discriminate against any other user</li>
          <li>Attempt to access another user&apos;s account or data without authorization</li>
          <li>Scrape, reverse-engineer, or interfere with the platform&apos;s normal operation</li>
          <li>Upload malicious files or content that violates any applicable law</li>
        </ul>
      </section>

      <section>
        <h2>7. AI-generated content</h2>
        <p>
          JobMo includes AI-assisted features — resume summaries and scoring, skill suggestions, job
          description improvement, salary estimates, and interview question suggestions. These are aids,
          not guarantees of accuracy. Salary estimates in particular are general guidance, not a substitute
          for real market research. You&apos;re responsible for reviewing and using your own judgment on
          anything AI-generated before relying on it.
        </p>
      </section>

      <section>
        <h2>8. No guarantee of employment outcomes</h2>
        <p>
          JobMo is a platform that connects applicants and employers — we don&apos;t guarantee that any
          applicant will be hired, that any job posting will be filled, or that any match score, interview,
          or offer will lead to a particular outcome. Hiring decisions are made solely by employers.
        </p>
      </section>

      <section>
        <h2>9. Intellectual property</h2>
        <p>
          JobMo&apos;s branding, design, and platform code are our property. Content you upload (your
          profile, resume, job postings, company information) remains yours — by posting it on JobMo, you
          grant us the right to display and process it as needed to operate the platform and provide it to
          the relevant other party (e.g. showing your application to the employer you applied to).
        </p>
      </section>

      <section>
        <h2>10. Termination</h2>
        <p>
          You may close your account at any time. We may suspend or terminate accounts that violate these
          terms, engage in fraudulent activity, or pose a risk to other users or the platform.
        </p>
      </section>

      <section>
        <h2>11. Disclaimers and limitation of liability</h2>
        <p>
          JobMo is provided &quot;as is&quot; without warranties of any kind. To the fullest extent
          permitted by law, we are not liable for indirect, incidental, or consequential damages arising
          from your use of the platform, including hiring decisions made by employers or job outcomes
          experienced by applicants.
        </p>
      </section>

      <section>
        <h2>12. Governing law</h2>
        <p>These terms are governed by the laws of Sri Lanka.</p>
      </section>

      <section>
        <h2>13. Changes to these terms</h2>
        <p>
          We may update these terms from time to time. If we make material changes, we&apos;ll update the
          &quot;Last updated&quot; date above and, where appropriate, notify you directly.
        </p>
      </section>

      <section>
        <h2>14. Contact us</h2>
        <p>
          Questions about these terms? Reach out via our <a href="/contact">Contact page</a>.
        </p>
      </section>
    </LegalPageLayout>
  );
}
