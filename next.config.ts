import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Ignore TypeScript errors during build
    ignoreBuildErrors: true,
  },
  eslint: {
    // Ignore ESLint warnings and errors during build
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
