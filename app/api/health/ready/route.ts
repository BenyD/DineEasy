import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface ReadinessCheck {
  status: "ready" | "not_ready";
  timestamp: string;
  checks: {
    database: boolean;
    environment: boolean;
    critical_services: boolean;
  };
  details?: {
    database_error?: string;
    environment_missing?: string[];
    service_errors?: string[];
  };
}

export async function GET(req: NextRequest) {
  const readinessCheck: ReadinessCheck = {
    status: "ready",
    timestamp: new Date().toISOString(),
    checks: {
      database: false,
      environment: false,
      critical_services: false,
    },
  };

  const errors: string[] = [];

  // Check environment variables
  const requiredEnvVars = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "RESEND_API_KEY",
  ];

  const missingEnvVars = requiredEnvVars.filter(
    (envVar) => !process.env[envVar]
  );

  if (missingEnvVars.length > 0) {
    readinessCheck.checks.environment = false;
    readinessCheck.details = {
      ...readinessCheck.details,
      environment_missing: missingEnvVars,
    };
    errors.push(`Missing environment variables: ${missingEnvVars.join(", ")}`);
  } else {
    readinessCheck.checks.environment = true;
  }

  // Check database connectivity
  try {
    const supabase = createClient();

    // Simple query to test connectivity
    const { error } = await supabase.from("restaurants").select("id").limit(1);

    if (error) {
      readinessCheck.checks.database = false;
      readinessCheck.details = {
        ...readinessCheck.details,
        database_error: error.message,
      };
      errors.push(`Database error: ${error.message}`);
    } else {
      readinessCheck.checks.database = true;
    }
  } catch (error) {
    readinessCheck.checks.database = false;
    readinessCheck.details = {
      ...readinessCheck.details,
      database_error: error instanceof Error ? error.message : "Unknown error",
    };
    errors.push(
      `Database connection failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }

  // Check critical services (basic connectivity)
  try {
    // Test Stripe API key format (without making actual API call)
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey || !stripeKey.startsWith("sk_")) {
      errors.push("Invalid Stripe secret key format");
    }

    // Test Resend API key format
    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey || resendKey.length < 10) {
      errors.push("Invalid Resend API key format");
    }

    if (errors.length === 0) {
      readinessCheck.checks.critical_services = true;
    } else {
      readinessCheck.checks.critical_services = false;
      readinessCheck.details = {
        ...readinessCheck.details,
        service_errors: errors,
      };
    }
  } catch (error) {
    readinessCheck.checks.critical_services = false;
    readinessCheck.details = {
      ...readinessCheck.details,
      service_errors: [
        error instanceof Error ? error.message : "Unknown error",
      ],
    };
  }

  // Determine overall readiness
  const allChecksPassed = Object.values(readinessCheck.checks).every(
    (check) => check === true
  );

  if (!allChecksPassed) {
    readinessCheck.status = "not_ready";
  }

  // Set appropriate HTTP status code
  const statusCode = allChecksPassed ? 200 : 503;

  const response = NextResponse.json(readinessCheck, { status: statusCode });

  // Add headers
  response.headers.set("Cache-Control", "no-cache, no-store, must-revalidate");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");

  return response;
}
