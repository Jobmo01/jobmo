import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/marketing/legal-page-layout";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: "What cookies and similar technologies JobMo uses, and why.",
};

export default function CookiesPage() {
  return (
    <LegalPageLayout
      title="Cookie Policy"
      description="What cookies and similar technologies JobMo uses, and why."
      lastUpdated="14 July 2026"
    >
      <section>
        <h2>1. What cookies are</h2>
        <p>
          Cookies are small text files stored on your device when you visit a website. They help the site
          remember who you are between visits — for example, staying logged in without re-entering your
          password on every page.
        </p>
      </section>

      <section>
        <h2>2. What JobMo actually uses</h2>
        <p>We keep this simple — JobMo uses two categories, and nothing else:</p>
        <h3>Essential cookies (required)</h3>
        <p>
          JobMo uses authentication session cookies, set by our backend (Supabase), to keep you signed in
          as you move between pages. These are strictly necessary — without them, you&apos;d be logged out
          on every page load. They&apos;re cleared when you log out or when your session expires.
        </p>
        <h3>Local storage (not a cookie, but similar)</h3>
        <p>
          Your light/dark mode preference is saved in your browser&apos;s local storage, not a cookie. It
          never leaves your device and isn&apos;t sent to our servers.
        </p>
      </section>

      <section>
        <h2>3. What we don&apos;t use</h2>
        <p>
          JobMo does not use advertising cookies, third-party ad trackers, or analytics tracking scripts.
          We don&apos;t sell data to advertisers, and there&apos;s currently no analytics platform embedded
          in the site tracking your behavior across pages.
        </p>
      </section>

      <section>
        <h2>4. Controlling cookies</h2>
        <p>
          Most browsers let you block or delete cookies through their settings. Since JobMo&apos;s only
          cookie is the authentication session itself, blocking it will simply log you out and prevent you
          from staying signed in — the rest of the site&apos;s public pages will still work normally.
        </p>
      </section>

      <section>
        <h2>5. Changes to this policy</h2>
        <p>
          If what we use here changes — for example, if we add analytics in the future — we&apos;ll update
          this page and the &quot;Last updated&quot; date above.
        </p>
      </section>

      <section>
        <h2>6. Contact us</h2>
        <p>
          Questions about cookies on JobMo? Reach out via our <a href="/contact">Contact page</a>.
        </p>
      </section>
    </LegalPageLayout>
  );
}
