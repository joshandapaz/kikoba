import type { NextConfig } from "next";

const isStaticExport = process.env.NEXT_PUBLIC_EXPORT === 'true';

const nextConfig: NextConfig = {
  output: isStaticExport ? 'export' : undefined,
  trailingSlash: isStaticExport,
  // When deploying to GitHub Pages at /kikoba, the basePath must match the repo name
  basePath: isStaticExport ? '/kikoba' : '',
  assetPrefix: isStaticExport ? '/kikoba/' : '',
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
