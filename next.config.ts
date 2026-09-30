import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";

const nextConfig: NextConfig = {
  // The repository maintains its own PRD-derived agent instructions.
  agentRules: false,
  experimental: {
    // Admin product images are up to 4 MB (M11-P01); the action itself rejects anything larger.
    serverActions: { bodySizeLimit: "5mb" },
  },
};

// Source-map upload is out of scope for the MVP (M14-P01); nothing is sent at build time.
export default withSentryConfig(nextConfig, { silent: true, telemetry: false, sourcemaps: { disable: true } });
