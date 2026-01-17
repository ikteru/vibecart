import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Create a Supabase client for use in Server Components
 * Used in Server Components, Route Handlers, and Server Actions
 *
 * Note: When running in Docker, SUPABASE_URL points to internal Docker network (kong:8000)
 * while NEXT_PUBLIC_SUPABASE_URL points to localhost for browser access.
 */
export async function createClient() {
  const cookieStore = await cookies();

  // Use internal Docker URL for server-side API calls
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
  // Use public URL for cookie name matching (browser sets cookies with public URL hostname)
  const publicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

  // Extract hostnames to handle cookie name remapping between environments
  const serverHost = new URL(supabaseUrl).hostname;
  const publicHost = new URL(publicUrl).hostname;
  const needsCookieRemap = serverHost !== publicHost;

  return createServerClient(
    supabaseUrl,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          const allCookies = cookieStore.getAll();
          // Remap cookie names from public hostname to server hostname
          // e.g., sb-localhost-auth-token -> sb-kong-auth-token
          if (needsCookieRemap) {
            return allCookies.map(cookie => ({
              ...cookie,
              name: cookie.name.replace(`sb-${publicHost}`, `sb-${serverHost}`),
            }));
          }
          return allCookies;
        },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          try {
            // Remap cookie names back to public hostname for browser
            const remappedCookies = needsCookieRemap
              ? cookiesToSet.map(c => ({
                  ...c,
                  name: c.name.replace(`sb-${serverHost}`, `sb-${publicHost}`),
                }))
              : cookiesToSet;

            remappedCookies.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing sessions.
          }
        },
      },
    }
  );
}

/**
 * Get the current authenticated user
 * Returns null if not authenticated
 */
export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Get the current session
 * Returns null if not authenticated
 */
export async function getSession() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}
