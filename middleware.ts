import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  getRateLimitConfig,
  createRateLimit,
} from "@/lib/middleware/rate-limit";

// Define public routes that don't require authentication
const publicRoutes = [
  "/",
  "/about",
  "/features",
  "/pricing",
  "/contact",
  "/privacy",
  "/terms",
  "/solutions",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
];

// Define onboarding routes that should be accessible during onboarding
const onboardingRoutes = ["/setup", "/select-plan", "/setup/connect"];

// Define health check routes that should bypass rate limiting
const healthCheckRoutes = [
  "/api/health",
  "/api/health/live",
  "/api/health/ready",
];

export async function middleware(request: NextRequest) {
  const res = NextResponse.next();

  // Create supabase server client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          res.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          res.cookies.set({
            name,
            value: "",
            ...options,
          });
        },
      },
    }
  );

  try {
    // Apply rate limiting for API routes (except health checks)
    if (
      request.nextUrl.pathname.startsWith("/api/") &&
      !healthCheckRoutes.some((route) =>
        request.nextUrl.pathname.startsWith(route)
      )
    ) {
      const rateLimitConfig = getRateLimitConfig(request.nextUrl.pathname);
      const rateLimiter = createRateLimit(rateLimitConfig);

      const rateLimitResponse = await rateLimiter(request);
      if (rateLimitResponse) {
        return rateLimitResponse;
      }
    }

    // Check if it's a public route
    if (
      publicRoutes.some((route) => request.nextUrl.pathname.startsWith(route))
    ) {
      return res;
    }

    // Allow QR client routes without auth
    if (request.nextUrl.pathname.startsWith("/qr/")) {
      return res;
    }

    // Allow health check routes without auth
    if (
      healthCheckRoutes.some((route) =>
        request.nextUrl.pathname.startsWith(route)
      )
    ) {
      return res;
    }

    // Get session first
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error("Session error in middleware:", sessionError);
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // If no session and not on a public route, redirect to login
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Get user data only if we have a session
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error("User error in middleware:", userError);
      // Clear any invalid session cookies
      res.cookies.set({
        name: `sb-${process.env.NEXT_PUBLIC_SUPABASE_URL}-auth-token`,
        value: "",
        maxAge: 0,
      });
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Import the utility function dynamically (since middleware runs in edge runtime)
    const { getOnboardingStatus } = await import("./lib/utils");

    // Get user's current onboarding status
    const onboardingStatus = await getOnboardingStatus(supabase);

    // Check if user is on onboarding routes
    const isOnboardingRoute = onboardingRoutes.some((route) =>
      request.nextUrl.pathname.startsWith(route)
    );

    // If user is on onboarding route but has completed onboarding, redirect to dashboard
    if (isOnboardingRoute && onboardingStatus.completed) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // If user is not on onboarding route but hasn't completed onboarding, redirect to setup
    if (!isOnboardingRoute && !onboardingStatus.completed) {
      return NextResponse.redirect(new URL("/setup", request.url));
    }

    return res;
  } catch (error) {
    console.error("Middleware error:", error);
    // On error, redirect to login for safety
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};
