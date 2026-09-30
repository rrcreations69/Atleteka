import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The repository maintains its own PRD-derived agent instructions.
  agentRules: false,
  experimental: {
    // Admin product images are up to 4 MB (M11-P01); the action itself rejects anything larger.
    serverActions: { bodySizeLimit: "5mb" },
  },
};

export default nextConfig;
