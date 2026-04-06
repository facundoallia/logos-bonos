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
          // Block search engines from indexing bonos-logos.vercel.app
          // SEO should only index logos-serviciosfinancieros.com.ar/productos/bonos
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        ],
      },
    ];
  },
};

export default nextConfig;
