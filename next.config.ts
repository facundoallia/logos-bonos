import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value:
              "frame-ancestors 'self' https://logos-serviciosfinancieros.com.ar https://www.logos-serviciosfinancieros.com.ar",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
