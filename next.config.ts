import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The Instagram card reads these with fs at request time.
  outputFileTracingIncludes: {
    '/api/tool-social/[slug]': ['./assets/fonts/**/*'],
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
  async redirects() {
    return [
      { source: '/privacy', destination: '/privacy-policy', permanent: true },
      { source: '/terms-of-service', destination: '/terms', permanent: true },
    ]
  },
};

export default nextConfig;
