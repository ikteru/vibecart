import { createBrowserClient } from '@supabase/ssr';

/**
 * Create a Supabase client for use in the browser
 * Used in Client Components
 *
 * Uses placeholder values during build (prerendering) when env vars aren't available.
 * At runtime, real env vars are always present.
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'placeholder';

  return createBrowserClient(url, key);
}
