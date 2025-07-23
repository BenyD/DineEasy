import { createClient } from "@/lib/supabase/server";

export interface HealthMetrics {
  timestamp: string;
  uptime: number;
  memory: {
    heapUsed: number;
    heapTotal: number;
    rss: number;
    external: number;
  };
  database: {
    connected: boolean;
    responseTime: number;
    error?: string;
  };
  services: {
    stripe: boolean;
    email: boolean;
    storage: boolean;
  };
}

export interface ServiceHealth {
  status: "healthy" | "degraded" | "unhealthy";
  responseTime: number;
  error?: string;
  details?: any;
}

/**
 * Get basic health metrics for the application
 */
export async function getHealthMetrics(): Promise<HealthMetrics> {
  const startTime = Date.now();

  // Get memory usage
  const memUsage = process.memoryUsage();

  // Test database connectivity
  let dbConnected = false;
  let dbResponseTime = 0;
  let dbError: string | undefined;

  try {
    const dbStart = Date.now();
    const supabase = createClient();
    const { error } = await supabase.from("restaurants").select("id").limit(1);

    dbResponseTime = Date.now() - dbStart;
    dbConnected = !error;
    if (error) {
      dbError = error.message;
    }
  } catch (error) {
    dbResponseTime = Date.now() - startTime;
    dbError = error instanceof Error ? error.message : "Unknown error";
  }

  // Test external services (basic checks)
  const services = {
    stripe: !!process.env.STRIPE_SECRET_KEY,
    email: !!process.env.RESEND_API_KEY,
    storage: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
  };

  return {
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      rss: memUsage.rss,
      external: memUsage.external,
    },
    database: {
      connected: dbConnected,
      responseTime: dbResponseTime,
      error: dbError,
    },
    services,
  };
}

/**
 * Check if the application is ready to serve traffic
 */
export async function isReady(): Promise<boolean> {
  try {
    const metrics = await getHealthMetrics();

    // Check critical dependencies
    const criticalChecks = [
      metrics.database.connected,
      metrics.services.stripe,
      metrics.services.email,
      metrics.services.storage,
    ];

    return criticalChecks.every((check) => check === true);
  } catch (error) {
    console.error("Readiness check failed:", error);
    return false;
  }
}

/**
 * Check if the application is alive and responding
 */
export function isAlive(): boolean {
  try {
    const memUsage = process.memoryUsage();
    const heapUsedGB = memUsage.heapUsed / 1024 / 1024 / 1024;

    // Check if memory usage is critically high
    if (heapUsedGB > 1) {
      return false;
    }

    // Check if process has been running for too long (optional)
    const uptimeHours = process.uptime() / 3600;
    if (uptimeHours > 24 * 7) {
      // 7 days
      return false;
    }

    return true;
  } catch (error) {
    console.error("Liveness check failed:", error);
    return false;
  }
}

/**
 * Get detailed service health information
 */
export async function getServiceHealth(): Promise<
  Record<string, ServiceHealth>
> {
  const services: Record<string, ServiceHealth> = {};

  // Database health
  const dbStart = Date.now();
  try {
    const supabase = createClient();
    const { error } = await supabase.from("restaurants").select("id").limit(1);

    const responseTime = Date.now() - dbStart;

    services.database = {
      status: error ? "unhealthy" : "healthy",
      responseTime,
      error: error?.message,
      details: { connected: !error },
    };
  } catch (error) {
    const responseTime = Date.now() - dbStart;
    services.database = {
      status: "unhealthy",
      responseTime,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }

  // Stripe health
  const stripeStart = Date.now();
  try {
    // Basic check without making API call
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    const responseTime = Date.now() - stripeStart;

    services.stripe = {
      status:
        stripeKey && stripeKey.startsWith("sk_") ? "healthy" : "unhealthy",
      responseTime,
      error: !stripeKey
        ? "Missing API key"
        : !stripeKey.startsWith("sk_")
          ? "Invalid API key format"
          : undefined,
      details: { configured: !!stripeKey },
    };
  } catch (error) {
    const responseTime = Date.now() - stripeStart;
    services.stripe = {
      status: "unhealthy",
      responseTime,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }

  // Email service health
  const emailStart = Date.now();
  try {
    const resendKey = process.env.RESEND_API_KEY;
    const responseTime = Date.now() - emailStart;

    services.email = {
      status: resendKey && resendKey.length >= 10 ? "healthy" : "unhealthy",
      responseTime,
      error: !resendKey
        ? "Missing API key"
        : resendKey.length < 10
          ? "Invalid API key format"
          : undefined,
      details: { configured: !!resendKey },
    };
  } catch (error) {
    const responseTime = Date.now() - emailStart;
    services.email = {
      status: "unhealthy",
      responseTime,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }

  // Storage health
  const storageStart = Date.now();
  try {
    const supabase = createClient();
    const { data, error } = await supabase.storage.listBuckets();
    const responseTime = Date.now() - storageStart;

    services.storage = {
      status: error ? "unhealthy" : "healthy",
      responseTime,
      error: error?.message,
      details: {
        buckets: data?.length || 0,
        connected: !error,
      },
    };
  } catch (error) {
    const responseTime = Date.now() - storageStart;
    services.storage = {
      status: "unhealthy",
      responseTime,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }

  return services;
}

/**
 * Format memory usage for display
 */
export function formatMemoryUsage(bytes: number): string {
  const mb = bytes / 1024 / 1024;
  return `${mb.toFixed(2)} MB`;
}

/**
 * Get environment information
 */
export function getEnvironmentInfo() {
  return {
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    environment: process.env.NODE_ENV || "development",
    uptime: process.uptime(),
    pid: process.pid,
    memoryUsage: {
      heapUsed: formatMemoryUsage(process.memoryUsage().heapUsed),
      heapTotal: formatMemoryUsage(process.memoryUsage().heapTotal),
      rss: formatMemoryUsage(process.memoryUsage().rss),
    },
  };
}
