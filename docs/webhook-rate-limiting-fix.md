# Webhook Rate Limiting Fix

## Problem

Stripe webhooks were receiving HTTP 429 (Too Many Requests) errors due to rate limiting:

```
2025-08-02 16:46:01  <--  [429] POST http://localhost:3000/api/webhooks/stripe [evt_1RrdPwBWA9jXM2AKQC7tt9r5]
2025-08-02 16:46:02  <--  [200] POST http://localhost:3000/api/webhooks/stripe [evt_1RrdPwBWA9jXM2AK0oGj5T4c]
2025-08-02 16:46:02  <--  [200] POST http://localhost:3000/api/webhooks/stripe [evt_1RrdPwBWA9jXM2AKcDlsxI5E]
```

## Root Cause

The middleware was applying rate limiting to all API routes, including webhooks. The webhook rate limit was set to:
- **Window**: 60 seconds (1 minute)
- **Max Requests**: 10 requests per minute

This was too restrictive for Stripe webhooks, which can send multiple events rapidly in bursts (payment events, account updates, etc.).

## Solution

### 1. Exclude Webhooks from Rate Limiting

Updated `middleware.ts` to exclude webhook routes from rate limiting:

```typescript
// Define webhook routes that should bypass rate limiting
// Webhooks (especially Stripe) can send multiple events rapidly and should not be rate limited
const webhookRoutes = ["/api/webhooks"];

// Apply rate limiting for API routes (except health checks and webhooks)
if (
  request.nextUrl.pathname.startsWith("/api/") &&
  !healthCheckRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  ) &&
  !webhookRoutes.some((route) => request.nextUrl.pathname.startsWith(route))
) {
  // Rate limiting logic
}
```

### 2. Increased Webhook Rate Limit (Backup)

Also increased the webhook rate limit from 10 to 100 requests per minute as a backup measure:

```typescript
// Webhook endpoints (Note: Webhooks are now excluded from rate limiting in middleware)
webhook: {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100, // Increased from 10 to 100 to handle Stripe webhook bursts
  keyGenerator: (req) =>
    `webhook:${req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown"}`,
},
```

## Why This Approach?

1. **Webhooks are Critical**: Payment processing depends on webhook events
2. **Stripe's Behavior**: Stripe sends multiple events rapidly (payment events, account updates, etc.)
3. **Idempotency**: Webhooks are designed to be idempotent, so duplicate processing is safe
4. **Security**: Webhook signature verification provides security, not rate limiting

## Testing

After the fix:
- Stripe webhooks should receive HTTP 200 responses
- No more 429 errors for webhook events
- Payment processing should work reliably
- Other API routes still have appropriate rate limiting

## Monitoring

Monitor webhook logs to ensure:
- All webhook events are processed successfully
- No 429 errors in webhook responses
- Payment processing continues to work correctly 