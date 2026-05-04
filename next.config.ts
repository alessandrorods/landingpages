import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  async redirects() {
    return [
      { source: '/', destination: '/dia-das-maes', permanent: false },
    ]
  },
  images: {
    remotePatterns: [{
        protocol: 'https',
        hostname: 'cdn.awsli.com.br',
      }],
  },
  allowedDevOrigins: ['192.168.1.5'],
};


export default nextConfig;
