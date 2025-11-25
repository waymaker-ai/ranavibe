/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  // PWA configuration
  experimental: {
    webpackBuildWorker: true,
  },

  // Optimized for production
  compress: true,

  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  },

  // Redirects for Framer integration
  async rewrites() {
    return [
      {
        source: '/features',
        destination: process.env.FRAMER_FEATURES_URL || '/features-fallback',
      },
      {
        source: '/pricing',
        destination: process.env.FRAMER_PRICING_URL || '/pricing-fallback',
      },
      {
        source: '/about',
        destination: process.env.FRAMER_ABOUT_URL || '/about-fallback',
      },
    ];
  },

  // Headers for PWA and security
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
