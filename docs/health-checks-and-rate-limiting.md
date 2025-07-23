# Health Checks and Rate Limiting

## Overview

DineEasy now includes comprehensive health check endpoints and API rate limiting to ensure production readiness and protect against abuse.

## Health Check Endpoints

### 1. **Full Health Check** - `/api/health`

Comprehensive health check that monitors all critical services.

**Response:**

```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600,
  "version": "1.0.0",
  "environment": "production",
  "services": {
    "database": {
      "status": "healthy",
      "responseTime": 45,
      "details": { "connected": true }
    },
    "stripe": {
      "status": "healthy",
      "responseTime": 120,
      "details": { "connected": true, "livemode": false }
    },
    "email": {
      "status": "healthy",
      "responseTime": 85,
      "details": { "connected": true }
    },
    "storage": {
      "status": "healthy",
      "responseTime": 65,
      "details": { "buckets": 3, "connected": true }
    },
    "memory": {
      "status": "healthy",
      "responseTime": 1,
      "details": {
        "heapUsed": "45.23 MB",
        "heapTotal": "67.89 MB",
        "rss": "89.12 MB",
        "external": "12.34 MB"
      }
    }
  },
  "checks": {
    "total": 5,
    "passed": 5,
    "failed": 0
  },
  "responseTime": 316
}
```

**HTTP Status Codes:**

- `200` - All services healthy
- `200` - Some services degraded (but still operational)
- `503` - One or more services unhealthy

### 2. **Readiness Probe** - `/api/health/ready`

Checks if the application is ready to serve traffic.

**Response:**

```json
{
  "status": "ready",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "checks": {
    "database": true,
    "environment": true,
    "critical_services": true
  }
}
```

**HTTP Status Codes:**

- `200` - Application ready
- `503` - Application not ready

### 3. **Liveness Probe** - `/api/health/live`

Checks if the application is alive and responding.

**Response:**

```json
{
  "status": "alive",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600,
  "memory": {
    "heapUsed": "45.23 MB",
    "heapTotal": "67.89 MB",
    "rss": "89.12 MB"
  },
  "process": {
    "pid": 12345,
    "version": "v18.17.0",
    "platform": "linux"
  }
}
```

**HTTP Status Codes:**

- `200` - Application alive
- `503` - Application dead

## Rate Limiting

### Configuration

Rate limiting is configured with different limits for different endpoint types:

```typescript
const DEFAULT_CONFIGS = {
  // API endpoints
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    keyGenerator: (req) => `api:${req.ip || "unknown"}`,
  },

  // Authentication endpoints
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    keyGenerator: (req) => `auth:${req.ip || "unknown"}`,
  },

  // Webhook endpoints
  webhook: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
    keyGenerator: (req) => `webhook:${req.ip || "unknown"}`,
  },

  // File upload endpoints
  upload: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5,
    keyGenerator: (req) => `upload:${req.ip || "unknown"}`,
  },

  // QR code generation
  qr: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 20,
    keyGenerator: (req) => `qr:${req.ip || "unknown"}`,
  },

  // General endpoints
  default: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30,
    keyGenerator: (req) => `default:${req.ip || "unknown"}`,
  },
};
```

### Rate Limit Response

When rate limit is exceeded:

```json
{
  "error": "Too many requests",
  "message": "Rate limit exceeded. Try again in 45 seconds.",
  "retryAfter": 45,
  "limit": 100,
  "remaining": 0,
  "reset": "2024-01-15T10:45:00.000Z"
}
```

**HTTP Status Code:** `429 Too Many Requests`

**Headers:**

- `X-RateLimit-Limit`: Maximum requests per window
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: When the rate limit resets
- `Retry-After`: Seconds to wait before retrying

### Exempted Routes

The following routes are exempted from rate limiting:

- `/api/health`
- `/api/health/live`
- `/api/health/ready`
- All webhook endpoints (handled separately)

## Implementation Details

### Storage

Currently uses in-memory storage for development. For production, consider:

1. **Redis** for distributed rate limiting
2. **Database** for persistent rate limiting
3. **Cloud provider** rate limiting (Vercel, AWS, etc.)

### Key Generation

Rate limit keys are generated based on:

- IP address (primary)
- User ID (if authenticated)
- Endpoint type (api, auth, webhook, etc.)

### Cleanup

Expired rate limit entries are automatically cleaned up every 5 minutes to prevent memory leaks.

## Monitoring and Alerting

### Health Check Monitoring

Set up monitoring for health check endpoints:

```bash
# Check health every 30 seconds
curl -f http://your-app.com/api/health

# Check readiness every 10 seconds
curl -f http://your-app.com/api/health/ready

# Check liveness every 5 seconds
curl -f http://your-app.com/api/health/live
```

### Rate Limit Monitoring

Monitor rate limit violations:

```typescript
// Log rate limit violations
console.log("Rate limit exceeded:", {
  ip: req.ip,
  path: req.nextUrl.pathname,
  limit: config.maxRequests,
  windowMs: config.windowMs,
});
```

### Alerting Setup

1. **Health Check Failures**: Alert when any health check fails
2. **Rate Limit Violations**: Alert on excessive rate limit violations
3. **Service Degradation**: Alert when services are degraded
4. **Memory Usage**: Alert when memory usage is high

## Production Deployment

### Environment Variables

Ensure these environment variables are set:

```bash
# Required for health checks
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
STRIPE_SECRET_KEY=your_stripe_key
RESEND_API_KEY=your_resend_key

# Optional for enhanced monitoring
NODE_ENV=production
npm_package_version=1.0.0
```

### Load Balancer Configuration

Configure your load balancer to use health checks:

```nginx
# Nginx configuration
upstream dineeasy {
    server 127.0.0.1:3000;
}

server {
    listen 80;
    server_name your-app.com;

    location / {
        proxy_pass http://dineeasy;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Health check endpoint
    location /api/health {
        proxy_pass http://dineeasy;
        access_log off;
    }
}
```

### Kubernetes Configuration

For Kubernetes deployments:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: dineeasy
spec:
  template:
    spec:
      containers:
        - name: dineeasy
          image: your-app:latest
          ports:
            - containerPort: 3000
          livenessProbe:
            httpGet:
              path: /api/health/live
              port: 3000
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /api/health/ready
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 5
```

## Testing

### Health Check Testing

```bash
# Test full health check
curl http://localhost:3000/api/health

# Test readiness probe
curl http://localhost:3000/api/health/ready

# Test liveness probe
curl http://localhost:3000/api/health/live
```

### Rate Limiting Testing

```bash
# Test rate limiting
for i in {1..110}; do
  curl -w "%{http_code}\n" http://localhost:3000/api/auth/login
done

# Should see 429 after 5 requests for auth endpoints
```

### Load Testing

```bash
# Test with Apache Bench
ab -n 1000 -c 10 http://localhost:3000/api/health

# Test with Artillery
artillery quick --count 100 --num 10 http://localhost:3000/api/health
```

## Troubleshooting

### Common Issues

1. **Health Check Failing**
   - Check environment variables
   - Verify database connectivity
   - Check external service APIs

2. **Rate Limiting Too Aggressive**
   - Adjust limits in configuration
   - Check IP address detection
   - Verify key generation logic

3. **Memory Leaks**
   - Monitor memory usage over time
   - Check cleanup intervals
   - Verify store cleanup logic

### Debug Information

Enable debug logging:

```typescript
// Add to your environment
((DEBUG = rate - limit), health - check);

// Or enable in code
console.log("Rate limit debug:", { key, count, resetTime });
console.log("Health check debug:", { service, status, responseTime });
```

## Future Enhancements

### Planned Improvements

1. **Redis Integration**: Replace in-memory storage with Redis
2. **Advanced Metrics**: Add detailed rate limiting metrics
3. **Dynamic Limits**: Adjust limits based on user tier
4. **Geographic Limits**: Different limits by region
5. **Whitelist/Blacklist**: IP-based allow/deny lists

### Monitoring Dashboard

Consider building a monitoring dashboard that shows:

- Real-time health status
- Rate limit usage
- Service response times
- Error rates and types
- System resource usage
