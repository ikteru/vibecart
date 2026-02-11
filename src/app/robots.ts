import { MetadataRoute } from 'next';
import { locales } from '@/i18n/config';

/**
 * Dynamic Robots.txt Generator
 *
 * Generates robots.txt with proper rules for all locales.
 * Disallows admin, API, and authentication routes.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vibecart.ma';

  // Build disallow rules for all locales
  const disallowedPaths = [
    // API routes
    '/api/',

    // Seller/admin routes for all locales
    '/seller/',
    ...locales.flatMap((locale) => [`/${locale}/seller/`]),

    // Auth routes for all locales
    '/auth/',
    ...locales.flatMap((locale) => [`/${locale}/auth/`]),

    // Internal Next.js routes
    '/_next/',

    // Query parameters (avoid duplicate content)
    '/*?',
  ];

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: disallowedPaths,
      },
      {
        // Specific rules for Googlebot
        userAgent: 'Googlebot',
        allow: ['/shop/', ...locales.flatMap((locale) => [`/${locale}/shop/`])],
        disallow: disallowedPaths,
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
