/**
 * API Route Wrapper with Rate Limiting
 * 
 * Higher-order function for applying rate limiting to individual Next.js API routes.
 * Provides flexible rate limiting that can be customized per route.
 * 
 * @example
 * ```typescript
 * // Apply default rate limit (60 req/min)
 * export const GET = withRateLimit(async (request) => {
 *   return NextResponse.json({ data: 'success' });
 * });
 * 
 * // Apply custom rate limit
 * export const POST = withRateLimit(
 *   async (request) => {
 *     return NextResponse.json({ data: 'created' });
 *   },
 *   { windowSeconds: 60, maxRequests: 10 }
 * );
 * 
 * // Skip rate limiting for specific IPs
 * export const GET = withRateLimit(
 *   async (request) => {
 *     return NextResponse.json({ data: 'success' });
 *   },
 *   { skip: (request) => request.headers.get('x-internal') === 'true' }
 * );
 * ```
 */

import { NextRequest, NextResponse } from 'next/server';
import { RateLimiter, RateLimitConfig, RateLimitResult } from '@/infrastructure/utils/rateLimiter';

export interface WithRateLimitOptions extends Partial<RateLimitConfig> {
  /** Custom function to extract identifier from request (default: IP address) */
  getIdentifier?: (request: NextRequest) => string;
  /** Skip rate limiting for this request */
  skip?: (request: NextRequest) => boolean;
  /** Custom key prefix for the rate limiter (useful for different route groups) */
  keyPrefix?: string;
}

/**
 * Extract client IP from request
 * Checks various headers and fallbacks
 */
function getClientIP(request: NextRequest): string {
  // Check for forwarded IP (when behind proxy/load balancer)
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    // X-Forwarded-For can contain multiple IPs, take the first one
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

  // Fallback to socket remote address (may not be available in all environments)
  // In Next.js edge runtime, this is available via request.ip
  if (request.ip) {
    return request.ip;
  }

  // Last resort: use a hash of user agent (not ideal but better than nothing)
  const userAgent = request.headers.get('user-agent') || 'unknown';
  return `ua:${userAgent.slice(0, 50)}`;
}

/**
 * Create rate limit headers from result
 */
function createRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.floor(result.resetTime.getTime() / 1000).toString(),
  };
}

/**
 * Higher-order function to wrap API route handlers with rate limiting
 * 
 * @param handler - The API route handler function
 * @param options - Rate limiting options
 * @returns Wrapped handler with rate limiting
 */
export function withRateLimit<
  T extends (request: NextRequest, ...args: any[]) => Promise<NextResponse> | NextResponse
>(handler: T, options: WithRateLimitOptions = {}): T {
  const {
    windowSeconds = 60,
    maxRequests = 60,
    getIdentifier = getClientIP,
    skip,
    keyPrefix = '',
  } = options;

  // Create a dedicated rate limiter for this route
  const rateLimiter = new RateLimiter({ windowSeconds, maxRequests });

  return (async (request: NextRequest, ...args: any[]) => {
    // Check if rate limiting should be skipped
    if (skip?.(request)) {
      return handler(request, ...args);
    }

    // Get client identifier
    const clientIP = getIdentifier(request);
    const identifier = keyPrefix ? `${keyPrefix}:${clientIP}` : clientIP;

    // Check rate limit
    const result = rateLimiter.check(identifier);

    if (!result.allowed) {
      // Calculate retry after in seconds
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
          },
        }
      );
    }

    // Call the actual handler
    const response = await handler(request, ...args);

    // Add rate limit headers to successful response
    const headers = createRateLimitHeaders(result);
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  }) as T;
}

/**
 * Create a reusable rate limit wrapper with preset configuration
 * 
 * @example
 * ```typescript
 * // Create a custom rate limiter
 * const strictLimit = createRateLimit({ maxRequests: 5, windowSeconds: 60 });
 * 
 * // Use it on multiple routes
 * export const POST = strictLimit(async (request) => {
 *   return NextResponse.json({ success: true });
 * });
 * ```
 */
export function createRateLimit(options: WithRateLimitOptions = {}) {
  return <T extends (request: NextRequest, ...args: any[]) => Promise<NextResponse> | NextResponse>(
    handler: T
  ) => withRateLimit(handler, options);
}

// Pre-configured rate limit wrappers
export const rateLimit = {
  /** Strict: 5 requests per minute (for auth endpoints) */
  strict: createRateLimit({ maxRequests: 5, windowSeconds: 60 }),
  
  /** Standard: 60 requests per minute (for general API) */
  standard: createRateLimit({ maxRequests: 60, windowSeconds: 60 }),
  
  /** Relaxed: 100 requests per minute (for webhooks) */
  relaxed: createRateLimit({ maxRequests: 100, windowSeconds: 60 }),
  
  /** Generous: 1000 requests per minute (for internal/health checks) */
  generous: createRateLimit({ maxRequests: 1000, windowSeconds: 60 }),
};

export default withRateLimit;
