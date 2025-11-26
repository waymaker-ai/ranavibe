/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for better error catching
  reactStrictMode: true,

  // Image optimization
  images: {
    domains: [
      // Add your image domains here
      // 'your-supabase-project.supabase.co',
    ],
    formats: ['image/avif', 'image/webp'],
  },

  // Security headers (AADS Security Framework)
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
            value: 'DENY',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },

  // Rewrites for API routes (if needed)
  async rewrites() {
    return [];
  },

  // Redirects (if needed)
  async redirects() {
    return [];
  },

  // Enable experimental features
  experimental: {
    // Enable Server Actions
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

module.exports = nextConfig;
