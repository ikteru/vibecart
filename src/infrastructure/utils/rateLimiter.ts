/**
 * Rate Limiter Utility
 * 
 * In-memory rate limiting using sliding window algorithm.
 * Tracks requests per IP address within configurable time windows.
 */

export interface RateLimitConfig {
  /** Time window in seconds (default: 60) */
  windowSeconds: number;
  /** Maximum number of requests allowed in the window (default: 100) */
  maxRequests: number;
}

export interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean;
  /** Number of requests remaining in the current window */
  remaining: number;
  /** When the rate limit window resets */
  resetTime: Date;
  /** Total number of requests in the current window */
  limit: number;
}

interface RequestEntry {
  /** Timestamp of the request */
  timestamp: number;
}

interface ClientData {
  /** Array of request timestamps within the current window */
  requests: RequestEntry[];
  /** When the current window started */
  windowStart: number;
}

/**
 * Rate limiter using sliding window algorithm
 * 
 * This implementation tracks each request timestamp and filters out
 * requests that fall outside the current window on each check.
 * This provides accurate rate limiting with sliding window behavior.
 */
export class RateLimiter {
  private clients: Map<string, ClientData> = new Map();
  private readonly config: RateLimitConfig;

  constructor(config: Partial<RateLimitConfig> = {}) {
    this.config = {
      windowSeconds: config.windowSeconds ?? 60,
      maxRequests: config.maxRequests ?? 100,
    };
  }

  /**
   * Check if a request from the given identifier is allowed
   * 
   * @param identifier - Unique identifier for the client (typically IP address)
   * @returns RateLimitResult with allowed status and metadata
   */
  check(identifier: string): RateLimitResult {
    const now = Date.now();
    const windowMs = this.config.windowSeconds * 1000;
    const windowStart = now - windowMs;

    // Get or create client data
    let clientData = this.clients.get(identifier);
    if (!clientData) {
      clientData = {
        requests: [],
        windowStart: now,
      };
      this.clients.set(identifier, clientData);
    }

    // Filter out requests outside the sliding window
    clientData.requests = clientData.requests.filter(
      (entry) => entry.timestamp > windowStart
    );

    // Update window start if all old requests were cleaned up
    if (clientData.requests.length === 0) {
      clientData.windowStart = now;
    }

    // Check if request is allowed
    const currentCount = clientData.requests.length;
    const allowed = currentCount < this.config.maxRequests;

    // If allowed, record this request
    if (allowed) {
      clientData.requests.push({ timestamp: now });
    }

    // Calculate reset time (when the oldest request in the window will expire)
    const oldestRequest = clientData.requests[0];
    const resetTime = oldestRequest
      ? new Date(oldestRequest.timestamp + windowMs)
      : new Date(now + windowMs);

    return {
      allowed,
      remaining: Math.max(0, this.config.maxRequests - clientData.requests.length),
      resetTime,
      limit: this.config.maxRequests,
    };
  }

  /**
   * Get current rate limit status without consuming a request
   * 
   * @param identifier - Unique identifier for the client
   * @returns RateLimitResult with current status
   */
  getStatus(identifier: string): RateLimitResult {
    const now = Date.now();
    const windowMs = this.config.windowSeconds * 1000;
    const windowStart = now - windowMs;

    const clientData = this.clients.get(identifier);
    if (!clientData) {
      return {
        allowed: true,
        remaining: this.config.maxRequests,
        resetTime: new Date(now + windowMs),
        limit: this.config.maxRequests,
      };
    }

    // Filter out old requests
    const validRequests = clientData.requests.filter(
      (entry) => entry.timestamp > windowStart
    );

    const oldestRequest = validRequests[0];
    const resetTime = oldestRequest
      ? new Date(oldestRequest.timestamp + windowMs)
      : new Date(now + windowMs);

    return {
      allowed: validRequests.length < this.config.maxRequests,
      remaining: Math.max(0, this.config.maxRequests - validRequests.length),
      resetTime,
      limit: this.config.maxRequests,
    };
  }

  /**
   * Reset rate limit for a specific client
   * 
   * @param identifier - Unique identifier for the client
   */
  reset(identifier: string): void {
    this.clients.delete(identifier);
  }

  /**
   * Reset all rate limits (useful for testing)
   */
  resetAll(): void {
    this.clients.clear();
  }

  /**
   * Get the number of tracked clients
   */
  getClientCount(): number {
    return this.clients.size;
  }

  /**
   * Clean up expired entries to prevent memory leaks
   * Should be called periodically in production
   */
  cleanup(): void {
    const now = Date.now();
    const windowMs = this.config.windowSeconds * 1000;
    const windowStart = now - windowMs;

    for (const [identifier, clientData] of Array.from(this.clients.entries())) {
      const validRequests = clientData.requests.filter(
        (entry) => entry.timestamp > windowStart
      );

      if (validRequests.length === 0) {
        this.clients.delete(identifier);
      } else {
        clientData.requests = validRequests;
      }
    }
  }
}

// Default rate limiter instance for general use
export const defaultRateLimiter = new RateLimiter();

// Pre-configured rate limiters for different use cases
export const rateLimiters = {
  /** Strict rate limiter for authentication endpoints: 5 requests per minute */
  auth: new RateLimiter({ windowSeconds: 60, maxRequests: 5 }),
  
  /** Standard rate limiter for API endpoints: 60 requests per minute */
  api: new RateLimiter({ windowSeconds: 60, maxRequests: 60 }),
  
  /** Relaxed rate limiter for webhooks: 100 requests per minute */
  webhook: new RateLimiter({ windowSeconds: 60, maxRequests: 100 }),
};
