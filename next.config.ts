import type { NextConfig } from "next";

const isStaticExport = process.env.NEXT_PUBLIC_EXPORT === 'true';

const isGitHubPages = process.env.IS_GITHUB_PAGES === 'true';

const nextConfig: NextConfig = {
  output: isStaticExport ? 'export' : undefined,
  trailingSlash: isStaticExport,
  // When deploying to GitHub Pages at /kikoba, the basePath must match the repo name.
  // We only apply this for GitHub Pages, keeping the mobile build at the root.
  basePath: isGitHubPages ? '/kikoba' : '',
  assetPrefix: isGitHubPages ? '/kikoba/' : '',
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
