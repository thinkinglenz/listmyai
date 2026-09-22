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
      // The old advertise page quoted an audience we do not have; /pricing is
      // the real offer, built from the package catalogue.
      { source: '/advertise', destination: '/pricing', permanent: true },
      { source: '/terms-of-service', destination: '/terms', permanent: true },
    ]
  },
};

export default nextConfig;
