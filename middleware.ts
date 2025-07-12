import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

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

    // If user is on an onboarding route but shouldn't be there, redirect them
    if (
      onboardingRoutes.some((route) =>
        request.nextUrl.pathname.startsWith(route)
      )
    ) {
      const currentRoute = request.nextUrl.pathname;
      let shouldRedirect = false;
      let redirectTo = "";

      // Check if user is on the wrong onboarding step
      if (onboardingStatus.step === "auth") {
        shouldRedirect = true;
        redirectTo = "/login";
      } else if (
        onboardingStatus.step === "setup" &&
        !currentRoute.startsWith("/setup")
      ) {
        shouldRedirect = true;
        redirectTo = "/setup";
      } else if (
        onboardingStatus.step === "select-plan" &&
        !currentRoute.startsWith("/select-plan")
      ) {
        shouldRedirect = true;
        redirectTo = "/select-plan";
      } else if (
        onboardingStatus.step === "connect-stripe" &&
        !currentRoute.startsWith("/setup/connect")
      ) {
        shouldRedirect = true;
        redirectTo = "/setup/connect";
      } else if (
        onboardingStatus.step === "complete" &&
        onboardingRoutes.some((route) => currentRoute.startsWith(route))
      ) {
        shouldRedirect = true;
        redirectTo = "/dashboard";
      }

      if (shouldRedirect) {
        return NextResponse.redirect(new URL(redirectTo, request.url));
      }
    }

    // If user is trying to access dashboard but hasn't completed onboarding
    if (
      request.nextUrl.pathname.startsWith("/dashboard") &&
      onboardingStatus.step !== "complete"
    ) {
      let redirectTo = "";
      switch (onboardingStatus.step) {
        case "auth":
          redirectTo = "/login";
          break;
        case "setup":
          redirectTo = "/setup";
          break;
        case "select-plan":
          redirectTo = "/select-plan";
          break;
        case "connect-stripe":
          redirectTo = "/setup/connect";
          break;
        default:
          redirectTo = "/login";
      }
      return NextResponse.redirect(new URL(redirectTo, request.url));
    }

    return res;
  } catch (error) {
    console.error("Middleware error:", error);
    // On any error, redirect to login but preserve the intended URL
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     * - api/webhooks (webhook endpoints)
     */
    "/((?!_next/static|_next/image|favicon.ico|public|api/webhooks).*)",
  ],
};
