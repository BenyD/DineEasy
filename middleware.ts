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

    // If user is authenticated but hasn't completed onboarding
    if (user && needsOnboarding(request.nextUrl.pathname)) {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("Profile error in middleware:", profileError);
      }

      if (!profile) {
        return NextResponse.redirect(new URL("/setup", request.url));
      }

      const { data: restaurant, error: restaurantError } = await supabase
        .from("restaurants")
        .select("subscription_status")
        .eq("owner_id", user.id)
        .single();

      if (restaurantError) {
        console.error("Restaurant error in middleware:", restaurantError);
      }

      if (!restaurant || !restaurant.subscription_status) {
        return NextResponse.redirect(new URL("/select-plan", request.url));
      }
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

function needsOnboarding(pathname: string): boolean {
  return pathname.startsWith("/dashboard");
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
