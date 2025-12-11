import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['c2pa-node', 'sharp'],
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
};

export default nextConfig;
