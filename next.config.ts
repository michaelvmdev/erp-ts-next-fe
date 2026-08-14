import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',

  async rewrites() {
    const backendUrl = (process.env.BACKEND_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
