import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // Get the locale from the URL path (e.g., /ar-MA/auth/callback)
  const locale = request.nextUrl.pathname.split('/')[1] || 'ar-MA';
  const next = searchParams.get('next') ?? `/${locale}/seller/dashboard`;

  if (code) {
    const cookieStore = await cookies();

    // Use internal Docker URL for server-side API calls
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
    // Use public URL for cookie name matching
    const publicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

    // Extract hostnames to handle cookie name remapping between environments
    const serverHost = new URL(supabaseUrl).hostname;
    const publicHost = new URL(publicUrl).hostname;
    const needsCookieRemap = serverHost !== publicHost;

    const supabase = createServerClient(
      supabaseUrl,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() {
            const allCookies = cookieStore.getAll();
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
            }
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/${locale}/auth/login?error=auth_callback_error`);
}
