import type { Metadata } from "next";
import { Instrument_Sans, Jost } from "next/font/google";
import type { ReactNode } from "react";
import { Analytics } from "@vercel/analytics/next";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { openGraphDefaults } from "@/lib/seo";
import "./globals.css";
import { brand, brandColorCss } from "@/lib/brand";

// Self-hosted at build time by next/font (no runtime request to Google).
const instrument = Instrument_Sans({ subsets: ["latin"], variable: "--font-instrument", display: "swap" });
// Display face for the home page's oversized headlines (D-DESIGN-05).
const jost = Jost({ subsets: ["latin"], weight: ["500", "600"], variable: "--font-jost", display: "swap" });

const appUrl = process.env.NEXT_PUBLIC_APP_URL;
// Core SEO metadata (PRD 02_SCOPE): title, description, canonical base and OpenGraph basics.
export const metadata: Metadata = {
  metadataBase: appUrl && URL.canParse(appUrl) ? new URL(appUrl) : undefined,
  // Pages set a short title ("Cart"); the template adds the store name.
  title: { default: brand.name, template: `%s | ${brand.name}` },
  description: brand.description,
  openGraph: openGraphDefaults,
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className={instrument.variable + " " + jost.variable}>
      {/* Brand colors from lib/brand.ts, applied over the defaults in globals.css. */}
      <head><style dangerouslySetInnerHTML={{ __html: brandColorCss() }} /></head>
      <body className="flex min-h-svh flex-col">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-5 focus:top-4 focus:z-50 focus:rounded-sm focus:bg-field focus:px-4 focus:py-3 focus:font-medium focus:shadow-md"
        >
          Skip to content
        </a>
        <SiteHeader />
        <main id="main-content" tabIndex={-1} className="flex flex-1 flex-col">
          {children}
        </main>
        <SiteFooter />
        {/* Cookieless page views (M14-P01); inert until Web Analytics is enabled on the Vercel project. */}
        <Analytics />
      </body>
    </html>
  );
}
