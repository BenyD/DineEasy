import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";

interface HealthCheckResult {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  services: {
    database: ServiceStatus;
    stripe: ServiceStatus;
    email: ServiceStatus;
    storage: ServiceStatus;
    memory: ServiceStatus;
  };
  checks: {
    total: number;
    passed: number;
    failed: number;
  };
}

interface ServiceStatus {
  status: "healthy" | "degraded" | "unhealthy";
  responseTime: number;
  error?: string;
  details?: any;
}

export async function GET(req: NextRequest) {
  const startTime = Date.now();
  const healthCheck: HealthCheckResult = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || "1.0.0",
    environment: process.env.NODE_ENV || "development",
    services: {
      database: { status: "unhealthy", responseTime: 0 },
      stripe: { status: "unhealthy", responseTime: 0 },
      email: { status: "unhealthy", responseTime: 0 },
      storage: { status: "unhealthy", responseTime: 0 },
      memory: { status: "unhealthy", responseTime: 0 },
    },
    checks: {
      total: 0,
      passed: 0,
      failed: 0,
    },
  };

  const checks: Promise<void>[] = [];

  // Database health check
  checks.push(
    (async () => {
      const dbStart = Date.now();
      try {
        const supabase = createClient();

        // Test basic connectivity
        const { data, error } = await supabase
          .from("restaurants")
          .select("count")
          .limit(1);

        const responseTime = Date.now() - dbStart;

        if (error) {
          healthCheck.services.database = {
            status: "unhealthy",
            responseTime,
            error: error.message,
          };
          healthCheck.checks.failed++;
        } else {
          healthCheck.services.database = {
            status: "healthy",
            responseTime,
            details: { connected: true },
          };
          healthCheck.checks.passed++;
        }
      } catch (error) {
        const responseTime = Date.now() - dbStart;
        healthCheck.services.database = {
          status: "unhealthy",
          responseTime,
          error: error instanceof Error ? error.message : "Unknown error",
        };
        healthCheck.checks.failed++;
      }
      healthCheck.checks.total++;
    })()
  );

  // Stripe API health check
  checks.push(
    (async () => {
      const stripeStart = Date.now();
      try {
        // Test Stripe API connectivity
        const accountsResponse = await stripe.accounts.list({ limit: 1 });
        const responseTime = Date.now() - stripeStart;

        healthCheck.services.stripe = {
          status: "healthy",
          responseTime,
          details: {
            connected: true,
            accountsCount: accountsResponse.data.length,
          },
        };
        healthCheck.checks.passed++;
      } catch (error) {
        const responseTime = Date.now() - stripeStart;
        healthCheck.services.stripe = {
          status: "unhealthy",
          responseTime,
          error: error instanceof Error ? error.message : "Unknown error",
        };
        healthCheck.checks.failed++;
      }
      healthCheck.checks.total++;
    })()
  );

  // Email service health check
  checks.push(
    (async () => {
      const emailStart = Date.now();
      try {
        // Test Resend API connectivity (without sending email)
        const response = await fetch("https://api.resend.com/domains", {
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          },
        });

        const responseTime = Date.now() - emailStart;

        if (response.ok) {
          healthCheck.services.email = {
            status: "healthy",
            responseTime,
            details: { connected: true },
          };
          healthCheck.checks.passed++;
        } else {
          healthCheck.services.email = {
            status: "degraded",
            responseTime,
            error: `HTTP ${response.status}`,
          };
          healthCheck.checks.failed++;
        }
      } catch (error) {
        const responseTime = Date.now() - emailStart;
        healthCheck.services.email = {
          status: "unhealthy",
          responseTime,
          error: error instanceof Error ? error.message : "Unknown error",
        };
        healthCheck.checks.failed++;
      }
      healthCheck.checks.total++;
    })()
  );

  // Storage health check
  checks.push(
    (async () => {
      const storageStart = Date.now();
      try {
        const supabase = createClient();

        // Test storage bucket access
        const { data, error } = await supabase.storage.listBuckets();

        const responseTime = Date.now() - storageStart;

        if (error) {
          healthCheck.services.storage = {
            status: "unhealthy",
            responseTime,
            error: error.message,
          };
          healthCheck.checks.failed++;
        } else {
          healthCheck.services.storage = {
            status: "healthy",
            responseTime,
            details: {
              buckets: data?.length || 0,
              connected: true,
            },
          };
          healthCheck.checks.passed++;
        }
      } catch (error) {
        const responseTime = Date.now() - storageStart;
        healthCheck.services.storage = {
          status: "unhealthy",
          responseTime,
          error: error instanceof Error ? error.message : "Unknown error",
        };
        healthCheck.checks.failed++;
      }
      healthCheck.checks.total++;
    })()
  );

  // Memory usage health check
  checks.push(
    (async () => {
      const memoryStart = Date.now();
      try {
        const memUsage = process.memoryUsage();
        const responseTime = Date.now() - memoryStart;

        // Check if memory usage is reasonable (less than 1GB for heap)
        const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
        const heapTotalMB = memUsage.heapTotal / 1024 / 1024;
        const rssMB = memUsage.rss / 1024 / 1024;

        let status: "healthy" | "degraded" | "unhealthy" = "healthy";

        if (heapUsedMB > 800) {
          status = "unhealthy";
        } else if (heapUsedMB > 500) {
          status = "degraded";
        }

        healthCheck.services.memory = {
          status,
          responseTime,
          details: {
            heapUsed: `${heapUsedMB.toFixed(2)} MB`,
            heapTotal: `${heapTotalMB.toFixed(2)} MB`,
            rss: `${rssMB.toFixed(2)} MB`,
            external: `${(memUsage.external / 1024 / 1024).toFixed(2)} MB`,
          },
        };

        if (status === "healthy") {
          healthCheck.checks.passed++;
        } else {
          healthCheck.checks.failed++;
        }
      } catch (error) {
        const responseTime = Date.now() - memoryStart;
        healthCheck.services.memory = {
          status: "unhealthy",
          responseTime,
          error: error instanceof Error ? error.message : "Unknown error",
        };
        healthCheck.checks.failed++;
      }
      healthCheck.checks.total++;
    })()
  );

  // Wait for all checks to complete
  await Promise.allSettled(checks);

  // Determine overall status
  const unhealthyServices = Object.values(healthCheck.services).filter(
    (service) => service.status === "unhealthy"
  ).length;

  const degradedServices = Object.values(healthCheck.services).filter(
    (service) => service.status === "degraded"
  ).length;

  if (unhealthyServices > 0) {
    healthCheck.status = "unhealthy";
  } else if (degradedServices > 0) {
    healthCheck.status = "degraded";
  }

  // Add total response time
  const totalResponseTime = Date.now() - startTime;

  // Set appropriate HTTP status code
  let statusCode = 200;
  if (healthCheck.status === "unhealthy") {
    statusCode = 503; // Service Unavailable
  } else if (healthCheck.status === "degraded") {
    statusCode = 200; // OK but with degraded status
  }

  // Add response headers
  const response = NextResponse.json(
    {
      ...healthCheck,
      responseTime: totalResponseTime,
    },
    { status: statusCode }
  );

  response.headers.set("Cache-Control", "no-cache, no-store, must-revalidate");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");

  return response;
}
