import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";

// Product photos live in the public Supabase Storage bucket; next/image resizes them to the size shown.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const productImages = supabaseUrl && URL.canParse(supabaseUrl) ? new URL(supabaseUrl) : null;

// Preview deployments use their own branch URL (a Vercel system variable) when NEXT_PUBLIC_APP_URL is not set for them.
const branchUrl = process.env.VERCEL_BRANCH_URL;

const nextConfig: NextConfig = {
  // The repository maintains its own PRD-derived agent instructions.
  agentRules: false,
  env: { NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || (branchUrl ? `https://${branchUrl}` : "") },
  images: {
    remotePatterns: productImages ? [{
      protocol: productImages.protocol === "http:" ? "http" : "https", hostname: productImages.hostname,
      pathname: "/storage/v1/object/public/product-images/**",
    }] : [],
    formats: ["image/avif", "image/webp"],
    // Uploaded images get a new storage path, so a resized copy never goes stale.
    minimumCacheTTL: 2678400,
  },
  // M15 hardening: the site can never be framed (clickjacking) and responses are not MIME-sniffed.
  async headers() {
    return [{
      source: "/:path*",
      headers: [
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
        { key: "X-Content-Type-Options", value: "nosniff" },
      ],
    }];
  },
  // Old addresses keep working: the pre-rename domain and the demo products renamed to match their photos.
  async redirects() {
    return [
      // Store renamed to Athleteka (2026-10-09): visitors move to the new address. /api/ stays on the old one
      // because the PayMongo webhook is registered there and a redirect would not be followed.
      { source: "/:path((?!api/).*)", has: [{ type: "host" as const, value: "atleteka.vercel.app" }],
        destination: "https://athleteka.vercel.app/:path", permanent: true },
      ...[
        ["relaxed-linen-shirt", "relaxed-linen-top"], ["cotton-midi-skirt", "polka-dot-midi-skirt"],
        ["cropped-denim-jacket", "classic-denim-jacket"], ["relaxed-chino", "stretch-twill-pants"],
        ["utility-overshirt", "chambray-print-shirt"], ["drawstring-shorts", "paperbag-shorts"],
      ].map(([from, to]) => ({ source: `/products/${from}`, destination: `/products/${to}`, permanent: true })),
    ];
  },
  experimental: {
    // Admin product images are up to 4 MB (M11-P01); the action itself rejects anything larger.
    serverActions: { bodySizeLimit: "5mb" },
  },
};

// Source-map upload is out of scope for the MVP (M14-P01); nothing is sent at build time.
export default withSentryConfig(nextConfig, { silent: true, telemetry: false, sourcemaps: { disable: true } });
