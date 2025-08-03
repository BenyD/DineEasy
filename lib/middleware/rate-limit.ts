import { NextRequest, NextResponse } from "next/server";

// In-memory store for development (replace with Redis in production)
class MemoryStore {
  private store: Map<string, { count: number; resetTime: number }> = new Map();

  async get(key: string): Promise<{ count: number; resetTime: number } | null> {
    const data = this.store.get(key);
    if (!data) return null;

    // Check if window has expired
    if (Date.now() > data.resetTime) {
      this.store.delete(key);
      return null;
    }

    return data;
  }

  async set(key: string, count: number, windowMs: number): Promise<void> {
    this.store.set(key, {
      count,
      resetTime: Date.now() + windowMs,
    });
  }

  async increment(
    key: string,
    windowMs: number
  ): Promise<{ count: number; resetTime: number }> {
    const existing = await this.get(key);

    if (!existing) {
      const newData = { count: 1, resetTime: Date.now() + windowMs };
      await this.set(key, newData.count, windowMs);
      return newData;
    }

    const updatedData = { ...existing, count: existing.count + 1 };
    await this.set(key, updatedData.count, windowMs);
    return updatedData;
  }

  // Clean up expired entries (call periodically)
  cleanup(): void {
    const now = Date.now();
    for (const [key, data] of this.store.entries()) {
      if (now > data.resetTime) {
        this.store.delete(key);
      }
    }
  }
}

// Rate limit configuration
interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (req: NextRequest) => string; // Custom key generator
  skipSuccessfulRequests?: boolean; // Skip rate limiting for successful requests
  skipFailedRequests?: boolean; // Skip rate limiting for failed requests
  handler?: (req: NextRequest, res: NextResponse) => NextResponse; // Custom handler
}

// Default configurations
const DEFAULT_CONFIGS: Record<string, RateLimitConfig> = {
  // API endpoints
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    keyGenerator: (req) =>
      `api:${req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown"}`,
  },

  // Authentication endpoints
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    keyGenerator: (req) =>
      `auth:${req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown"}`,
  },

  // Webhook endpoints (Note: Webhooks are now excluded from rate limiting in middleware)
  webhook: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // Increased from 10 to 100 to handle Stripe webhook bursts
    keyGenerator: (req) =>
      `webhook:${req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown"}`,
  },

  // File upload endpoints
  upload: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5,
    keyGenerator: (req) =>
      `upload:${req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown"}`,
  },

  // QR code generation
  qr: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 20,
    keyGenerator: (req) =>
      `qr:${req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown"}`,
  },

  // General endpoints
  default: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30,
    keyGenerator: (req) =>
      `default:${req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown"}`,
  },
};

// Store instance
const store = new MemoryStore();

// Clean up expired entries every 5 minutes
if (typeof window === "undefined") {
  setInterval(() => store.cleanup(), 5 * 60 * 1000);
}

export function createRateLimit(config: RateLimitConfig) {
  return async function rateLimit(
    req: NextRequest
  ): Promise<NextResponse | null> {
    try {
      // Generate rate limit key
      const key = config.keyGenerator
        ? config.keyGenerator(req)
        : `default:${req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown"}`;

      // Get current rate limit data
      const data = await store.increment(key, config.windowMs);

      // Check if limit exceeded
      if (data.count > config.maxRequests) {
        // Calculate retry after time
        const retryAfter = Math.ceil((data.resetTime - Date.now()) / 1000);

        // Create rate limit response
        const response = NextResponse.json(
          {
            error: "Too many requests",
            message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
            retryAfter,
            limit: config.maxRequests,
            remaining: 0,
            reset: new Date(data.resetTime).toISOString(),
          },
          { status: 429 }
        );

        // Add rate limit headers
        response.headers.set(
          "X-RateLimit-Limit",
          config.maxRequests.toString()
        );
        response.headers.set("X-RateLimit-Remaining", "0");
        response.headers.set(
          "X-RateLimit-Reset",
          new Date(data.resetTime).toISOString()
        );
        response.headers.set("Retry-After", retryAfter.toString());

        return response;
      }

      // Add rate limit headers to successful requests
      const response = NextResponse.next();
      response.headers.set("X-RateLimit-Limit", config.maxRequests.toString());
      response.headers.set(
        "X-RateLimit-Remaining",
        Math.max(0, config.maxRequests - data.count).toString()
      );
      response.headers.set(
        "X-RateLimit-Reset",
        new Date(data.resetTime).toISOString()
      );

      return null; // Continue with request
    } catch (error) {
      console.error("Rate limiting error:", error);
      // On error, allow the request to proceed
      return null;
    }
  };
}

// Pre-configured rate limiters
export const rateLimiters = {
  api: createRateLimit(DEFAULT_CONFIGS.api),
  auth: createRateLimit(DEFAULT_CONFIGS.auth),
  webhook: createRateLimit(DEFAULT_CONFIGS.webhook),
  upload: createRateLimit(DEFAULT_CONFIGS.upload),
  qr: createRateLimit(DEFAULT_CONFIGS.qr),
  default: createRateLimit(DEFAULT_CONFIGS.default),
};

// Helper function to get rate limit config based on path
export function getRateLimitConfig(pathname: string): RateLimitConfig {
  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/login") ||
    pathname.startsWith("/api/signup")
  ) {
    return DEFAULT_CONFIGS.auth;
  }

  if (pathname.startsWith("/api/webhooks")) {
    return DEFAULT_CONFIGS.webhook;
  }

  if (pathname.startsWith("/api/upload") || pathname.includes("/upload")) {
    return DEFAULT_CONFIGS.upload;
  }

  if (pathname.startsWith("/api/qr") || pathname.includes("/qr")) {
    return DEFAULT_CONFIGS.qr;
  }

  if (pathname.startsWith("/api/")) {
    return DEFAULT_CONFIGS.api;
  }

  return DEFAULT_CONFIGS.default;
}

// Export for use in middleware
export { store as rateLimitStore };
