import Link from "next/link";
import { Logo } from "@/components/marketing/logo";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const FOOTER_COLUMNS = [
  {
    heading: "Product",
    links: [
      { href: "/jobs", label: "Jobs" },
      { href: "/companies", label: "Companies" },
      { href: "/features", label: "Features" },
      { href: "/pricing", label: "Pricing" },
      { href: "/success-stories", label: "Success Stories" },
    ],
  },
  {
    heading: "Resources",
    links: [
      { href: "/learning-center", label: "Learning Center" },
      { href: "/blog", label: "Blog" },
      { href: "/faq", label: "FAQ" },
      { href: "/press", label: "Press" },
    ],
  },
  {
    heading: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/careers", label: "Careers" },
      { href: "/contact", label: "Contact" },
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
        <div className="grid gap-10 md:grid-cols-6">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <Logo className="h-7 w-7" />
              <span className="font-display text-lg font-semibold">JobMo</span>
            </Link>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              AI-powered hiring, built for Sri Lanka&apos;s job market — and
              designed to scale beyond it.
            </p>

            <form className="mt-6 max-w-xs">
              <label htmlFor="newsletter-email" className="text-sm font-medium">
                Get hiring insights in your inbox
              </label>
              <div className="mt-2 flex gap-2">
                <Input id="newsletter-email" type="email" placeholder="you@company.com" required />
                <Button type="submit" size="sm">
                  Join
                </Button>
              </div>
            </form>
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
