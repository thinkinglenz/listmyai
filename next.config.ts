import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: '/privacy', destination: '/privacy-policy', permanent: true },
      { source: '/terms-of-service', destination: '/terms', permanent: true },
    ]
  },
};

export default nextConfig;
