import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { locales, defaultLocale } from '@/i18n/config';
import { RateLimiter } from '@/infrastructure/utils/rateLimiter';

// Rate limiters for different endpoint types
const rateLimiters = {
  /** Auth endpoints: 5 requests per minute (strict) */
  auth: new RateLimiter({ windowSeconds: 60, maxRequests: 5 }),
  /** Webhook endpoints: 100 requests per minute */
  webhook: new RateLimiter({ windowSeconds: 60, maxRequests: 100 }),
  /** General API endpoints: 60 requests per minute */
  default: new RateLimiter({ windowSeconds: 60, maxRequests: 60 }),
};

/**
 * Extract client IP from request
 * Checks various headers commonly set by proxies and load balancers
 */
function getClientIP(request: NextRequest): string {
  // Check for forwarded IP (when behind proxy/load balancer)
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  // Check for real IP header
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  // Check for Cloudflare connecting IP
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  // Fallback to socket remote address
  if (request.ip) {
    return request.ip;
  }

  // Last resort: use a hash of user agent
  const userAgent = request.headers.get('user-agent') || 'unknown';
  return `ua:${userAgent.slice(0, 50)}`;
}

/**
 * Check if request is to a health check endpoint
 */
function isHealthCheck(pathname: string): boolean {
  return pathname === '/api/health' || pathname === '/api/ready';
}

/**
 * Get the appropriate rate limiter for the pathname
 */
function getRateLimiter(pathname: string): RateLimiter | null {
  // Skip health checks
  if (isHealthCheck(pathname)) {
    return null;
  }

  // Auth endpoints: /api/auth/*
  if (pathname.startsWith('/api/auth/')) {
    return rateLimiters.auth;
  }

  // Webhook endpoints: /api/webhooks/*
  if (pathname.startsWith('/api/webhooks/')) {
    return rateLimiters.webhook;
  }

  // All other API endpoints
  if (pathname.startsWith('/api/')) {
    return rateLimiters.default;
  }

  return null;
}

/**
 * Create rate limit headers from result
 */
function createRateLimitHeaders(result: {
  limit: number;
  remaining: number;
  resetTime: Date;
}): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': Math.max(0, result.remaining).toString(),
    'X-RateLimit-Reset': Math.floor(result.resetTime.getTime() / 1000).toString(),
  };
}

/**
 * Middleware for:
 * 1. i18n locale routing
 * 2. Authentication protection for seller routes
 * 3. API rate limiting
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Handle API rate limiting
  if (pathname.startsWith('/api')) {
    const rateLimiter = getRateLimiter(pathname);

    if (rateLimiter) {
      const clientIP = getClientIP(request);
      const result = rateLimiter.check(clientIP);

      if (!result.allowed) {
        const retryAfter = Math.ceil((result.resetTime.getTime() - Date.now()) / 1000);

        return NextResponse.json(
          {
            error: 'Too Many Requests',
            message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
            retryAfter,
          },
          {
            status: 429,
            headers: {
              ...createRateLimitHeaders(result),
              'Retry-After': retryAfter.toString(),
              'Content-Type': 'application/json',
            },
          }
        );
      }

      // Pass through with rate limit headers
      const response = NextResponse.next();
      const headers = createRateLimitHeaders(result);
      Object.entries(headers).forEach(([key, value]) => {
        response.headers.set(key, value);
      });

      return response;
    }

    // No rate limiting for this endpoint (e.g., health checks) — pass through
    return NextResponse.next();
  }

  // Skip middleware for static files
  if (
    pathname.startsWith('/_next') ||
    pathname.includes('.') // Static files like favicon.ico
  ) {
    return NextResponse.next();
  }

  return handleNonAPIRoutes(request, pathname);
}

/**
 * Handle non-API routes (i18n and auth)
 */
async function handleNonAPIRoutes(
  request: NextRequest,
  pathname: string
): Promise<NextResponse> {
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
              return cookies.map((cookie) => ({
                ...cookie,
                name: cookie.name.replace(`sb-${publicHost}`, `sb-${serverHost}`),
              }));
            }
            return cookies;
          },
          setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
            // Remap cookie names back to public hostname for browser
            const remappedCookies = needsCookieRemap
              ? cookiesToSet.map((c) => ({
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
    // Match all pathnames except for static files and Next.js generated icons
    '/((?!_next/static|_next/image|favicon.ico|icon|apple-icon).*)',
  ],
};
