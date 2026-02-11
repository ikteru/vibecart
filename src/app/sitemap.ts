import { MetadataRoute } from 'next';
import { locales, defaultLocale } from '@/i18n/config';
import { createClient } from '@/infrastructure/auth/supabase-server';
import { createRepositories } from '@/infrastructure/persistence/supabase';

/**
 * Dynamic Sitemap Generator
 *
 * Generates sitemap entries for all public shop pages dynamically.
 * Fetches all seller handles from the database and creates URLs for each locale.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vibecart.ma';

  // Static routes with their priorities
  const staticRoutes = [
    { path: '', priority: 1.0, changefreq: 'daily' as const },
    { path: '/auth/login', priority: 0.5, changefreq: 'monthly' as const },
    { path: '/auth/onboarding', priority: 0.5, changefreq: 'monthly' as const },
    { path: '/auth/forgot-password', priority: 0.3, changefreq: 'monthly' as const },
  ];

  // Generate entries for static routes across all locales
  const staticEntries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    for (const route of staticRoutes) {
      staticEntries.push({
        url: `${baseUrl}/${locale}${route.path}`,
        priority: route.priority,
        changeFrequency: route.changefreq,
        lastModified: new Date(),
      });
    }
  }

  // Fetch dynamic shop handles
  const shopEntries = await generateShopEntries(baseUrl);

  return [...staticEntries, ...shopEntries];
}

/**
 * Generate sitemap entries for all shop pages
 */
async function generateShopEntries(baseUrl: string): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  try {
    const supabase = await createClient();
    const { sellerRepository } = createRepositories(supabase);

    // Fetch all seller handles
    // Note: We use a raw query since we need all handles for the sitemap
    const { data: sellers, error } = await supabase
      .from('sellers')
      .select('handle, updated_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching sellers for sitemap:', error);
      return entries;
    }

    if (!sellers || sellers.length === 0) {
      return entries;
    }

    // Generate entries for each shop across all locales
    for (const seller of sellers) {
      for (const locale of locales) {
        entries.push({
          url: `${baseUrl}/${locale}/shop/${seller.handle}`,
          priority: 0.8,
          changeFrequency: 'daily',
          lastModified: new Date(seller.updated_at || Date.now()),
        });
      }
    }
  } catch (error) {
    console.error('Error generating shop sitemap entries:', error);
  }

  return entries;
}
