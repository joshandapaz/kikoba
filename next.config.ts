import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: process.env.NODE_ENV === 'production' ? 'export' : undefined,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
