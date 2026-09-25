import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The repository maintains its own PRD-derived agent instructions.
  agentRules: false,
};

export default nextConfig;
