import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

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
];

// Define auth routes that should redirect to dashboard if authenticated
const authRoutes = ["/login", "/signup", "/forgot-password", "/reset-password"];

// Define onboarding routes that require authentication but not a complete profile
const onboardingRoutes = ["/setup", "/select-plan"];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value: "",
            ...options,
          });
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { pathname } = request.nextUrl;

  // Allow QR client routes without auth
  if (pathname.startsWith("/qr/")) {
    return response;
  }

  // Allow public routes without auth
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return response;
  }

  // Handle auth routes (login, signup, forgot-password)
  if (authRoutes.some((route) => pathname.startsWith(route))) {
    if (session) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return response;
  }

  // Require authentication for all other routes
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Allow onboarding routes if authenticated
  if (onboardingRoutes.some((route) => pathname.startsWith(route))) {
    return response;
  }

  // For dashboard routes, check if onboarding is complete
  if (pathname.startsWith("/dashboard")) {
    // Check if user has completed onboarding
    const { data: restaurants } = await supabase
      .from("restaurants")
      .select("id, subscription_status")
      .eq("owner_id", session.user.id)
      .single();

    // If no restaurant, redirect to setup
    if (!restaurants) {
      return NextResponse.redirect(new URL("/setup", request.url));
    }

    // If no active subscription, redirect to select-plan
    if (
      !restaurants.subscription_status ||
      restaurants.subscription_status === "inactive"
    ) {
      return NextResponse.redirect(new URL("/select-plan", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images (public images)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|images).*)",
  ],
};
 