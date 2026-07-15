import type { Metadata } from "next";
import { Space_Grotesk, Inter, IBM_Plex_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { Toaster } from "sonner";
import { PwaRegister } from "@/components/pwa-register";
import { JsonLd } from "@/components/seo/json-ld";
import { buildOrganizationSchema } from "@/lib/seo/schema";
import "./globals.css";

const display = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://jobmo.lk"),
  title: {
    default: "JobMo — AI-Powered Hiring, Built for Sri Lanka",
    template: "%s | JobMo",
  },
  description:
    "JobMo matches applicants and employers with AI-driven precision — resume building, job matching, interview scheduling, and hiring analytics in one platform, made for Sri Lanka.",
  keywords: [
    "jobs Sri Lanka",
    "recruitment platform",
    "AI hiring",
    "job portal Sri Lanka",
    "employer hiring platform",
  ],
  openGraph: {
    title: "JobMo — AI-Powered Hiring, Built for Sri Lanka",
    description:
      "Matching applicants and employers with AI-driven precision.",
    url: "https://jobmo.lk",
    siteName: "JobMo",
    locale: "en_LK",
    type: "website",
    images: [{ url: "/logo-full.png", width: 788, height: 292, alt: "JobMo" }],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${display.variable} ${body.variable} ${mono.variable} font-body antialiased`}
      >
        <JsonLd data={buildOrganizationSchema()} />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
        >
          Skip to main content
        </a>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster richColors position="top-right" closeButton />
          <PwaRegister />
        </ThemeProvider>
      </body>
    </html>
  );
}
