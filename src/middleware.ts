import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { locales, defaultLocale } from '@/i18n/config';

/**
 * Middleware for:
 * 1. i18n locale routing
 * 2. Authentication protection for seller routes
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') // Static files like favicon.ico
  ) {
    return NextResponse.next();
  }

  // Check if pathname already has a locale
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  // If no locale in path, detect and redirect
  if (!pathnameHasLocale) {
    const locale = detectLocale(request);
    const newUrl = new URL(`/${locale}${pathname}`, request.url);
    return NextResponse.redirect(newUrl);
  }

  // Auth protection for seller routes
  const isSellerRoute = pathname.match(/^\/[a-z-]+\/seller/);

  if (isSellerRoute) {
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

    // Use internal Docker URL for server-side API calls
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
    // Use public URL for cookie name matching (browser sets cookies with public URL hostname)
    const publicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

    // Extract hostnames to handle cookie name remapping between environments
    const serverHost = new URL(supabaseUrl).hostname;
    const publicHost = new URL(publicUrl).hostname;
    const needsCookieRemap = serverHost !== publicHost;

    const supabase = createServerClient(
      supabaseUrl,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            const cookies = request.cookies.getAll();
            // Remap cookie names from public hostname to server hostname
            // e.g., sb-localhost-auth-token -> sb-kong-auth-token
            if (needsCookieRemap) {
              return cookies.map(cookie => ({
                ...cookie,
                name: cookie.name.replace(`sb-${publicHost}`, `sb-${serverHost}`),
              }));
            }
            return cookies;
          },
          setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
            // Remap cookie names back to public hostname for browser
            const remappedCookies = needsCookieRemap
              ? cookiesToSet.map(c => ({
                  ...c,
                  name: c.name.replace(`sb-${serverHost}`, `sb-${publicHost}`),
                }))
              : cookiesToSet;

            remappedCookies.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            });
            remappedCookies.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      // Extract locale from pathname
      const locale = pathname.split('/')[1] || defaultLocale;
      const loginUrl = new URL(`/${locale}/auth/login`, request.url);
      loginUrl.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(loginUrl);
    }

    return response;
  }

  return NextResponse.next();
}

/**
 * Detect locale from request headers
 */
function detectLocale(request: NextRequest): string {
  // Check for locale cookie first
  const localeCookie = request.cookies.get('NEXT_LOCALE')?.value;
  if (localeCookie && locales.includes(localeCookie as any)) {
    return localeCookie;
  }

  // Check Accept-Language header
  const acceptLanguage = request.headers.get('accept-language') || '';

  // Priority: Moroccan Arabic > Arabic > French > English
  if (acceptLanguage.includes('ar-MA')) return 'ar-MA';
  if (acceptLanguage.includes('ar')) return 'ar';
  if (acceptLanguage.includes('fr')) return 'fr';
  if (acceptLanguage.includes('en')) return 'en';

  // Default to Darija
  return defaultLocale;
}

export const config = {
  matcher: [
    // Match all pathnames except for
    // - API routes
    // - Static files
    // - _next
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
