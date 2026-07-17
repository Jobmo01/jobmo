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
      lastUpdated="15 July 2026"
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
        <h2>3. Analytics</h2>
        <p>
          JobMo uses Google Analytics to understand overall usage of the site — things like which pages
          are visited, roughly where visitors are located (city/country level, not a precise address), what
          device or browser they&apos;re using, and how they found the site. This helps us understand
          whether JobMo is actually working for the people using it, and to fix things that aren&apos;t.
        </p>
        <p>
          We&apos;ve turned on IP anonymization, which means Google Analytics never stores your full IP
          address — only enough to estimate general location. We have not linked Google Analytics to
          Google Ads or enabled any advertising features within it, so this data is not used to show you
          ads, on JobMo or elsewhere.
        </p>
        <p>
          Google Analytics sets its own cookies to do this (typically named things like <code>_ga</code>
          and <code>_ga_*</code>). You can opt out of Google Analytics tracking across all websites using
          the{" "}
          <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer">
            Google Analytics Opt-out Browser Add-on
          </a>
          , or block these cookies the same way described in &quot;Controlling cookies&quot; below.
        </p>
      </section>

      <section>
        <h2>4. What we don&apos;t use</h2>
        <p>
          Beyond the analytics described above, JobMo does not use advertising cookies or third-party ad
          trackers, and we don&apos;t sell data to advertisers.
        </p>
      </section>

      <section>
        <h2>5. Controlling cookies</h2>
        <p>
          Most browsers let you block or delete cookies through their settings. Blocking JobMo&apos;s
          authentication cookie will log you out and prevent you from staying signed in; blocking the
          Google Analytics cookies has no effect on using the site — you just won&apos;t be counted in our
          usage stats.
        </p>
      </section>

      <section>
        <h2>6. Changes to this policy</h2>
        <p>
          If what we use here changes, we&apos;ll update this page and the &quot;Last updated&quot; date
          above.
        </p>
      </section>

      <section>
        <h2>7. Contact us</h2>
        <p>
          Questions about cookies on JobMo? Reach out via our <a href="/contact">Contact page</a>.
        </p>
      </section>
    </LegalPageLayout>
  );
}
