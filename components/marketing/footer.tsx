import Link from "next/link";
import { Logo } from "@/components/marketing/logo";

const FOOTER_COLUMNS = [
  {
    heading: "Explore",
    links: [
      { href: "/#job-seekers", label: "For Job Seekers" },
      { href: "/#employers", label: "For Employers" },
      { href: "/#how-it-works", label: "How it Works" },
    ],
  },
  {
    heading: "Company",
    links: [
      { href: "/contact", label: "Contact" },
      { href: "/careers", label: "Careers" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
      { href: "/cookies", label: "Cookies" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-secondary/30">
      <div className="container py-16">
        <div className="grid gap-10 md:grid-cols-5">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <Logo className="h-8" />
              <span className="font-display text-lg font-semibold">JobMo</span>
            </Link>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              AI-powered hiring, built for Sri Lanka&apos;s job market — matching
              the right people to the right roles, faster.
            </p>
          </div>

          {FOOTER_COLUMNS.map((col) => (
            <div key={col.heading}>
              <h4 className="text-sm font-semibold">{col.heading}</h4>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} JobMo. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">Made in Sri Lanka 🇱🇰</p>
        </div>
      </div>
    </footer>
  );
}
