// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true, //  Don't fail builds for ESLint issues
  },
  typescript: {
    ignoreBuildErrors: true, // Don't fail builds for TypeScript errors
  },
};

export default nextConfig;