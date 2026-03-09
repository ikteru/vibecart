const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const isDev = process.env.NODE_ENV === 'development';

// In dev, allow localhost Supabase + ngrok origins.
// In prod, lock down to known HTTPS endpoints only.
const connectSrc = isDev
  ? "connect-src 'self' http://localhost:* ws://localhost:* https://*.supabase.co https://graph.instagram.com https://graph.facebook.com https://*.upstash.io https://*.ngrok-free.dev https://*.ngrok.io"
  : "connect-src 'self' https://*.supabase.co https://graph.instagram.com https://graph.facebook.com https://*.upstash.io";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable gzip compression
  compress: true,

  // Remove X-Powered-By header for security
  poweredByHeader: false,

  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self'; ${connectSrc}; media-src 'self' https://*.fbcdn.net https://*.cdninstagram.com; object-src 'none'; frame-ancestors 'self'; base-uri 'self'; form-action 'self';`,
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
        ],
      },
    ];
  },

  // Image configuration
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: '*.cdninstagram.com',
      },
      {
        protocol: 'https',
        hostname: '*.fbcdn.net',
      },
    ],
  },

  // Allow ngrok dev origins (avoids cross-origin warnings + enables server actions)
  ...(process.env.NODE_ENV === 'development' && {
    allowedDevOrigins: [
      '*.ngrok-free.dev',
      '*.ngrok.io',
    ],
  }),

  // In dev, proxy Supabase through Next.js to avoid mixed-content blocking
  // (browser makes HTTPS requests to ngrok → Next.js rewrites → http://localhost:8000)
  ...(isDev && {
    async rewrites() {
      return [
        {
          source: '/supabase-proxy/:path*',
          destination: 'http://localhost:8000/:path*',
        },
      ];
    },
  }),

  // Experimental settings
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

module.exports = withNextIntl(nextConfig);
