"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { AuthChangeEvent, Session } from "@supabase/supabase-js";

export default function RootLayoutClient() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        if (event === "SIGNED_IN") {
          router.refresh();
          // Only show the toast if not on public pages, signup, or verify-email pages
          const isPublicPage =
            pathname === "/" ||
            pathname?.startsWith("/about") ||
            pathname?.startsWith("/contact") ||
            pathname?.startsWith("/features") ||
            pathname?.startsWith("/pricing") ||
            pathname?.startsWith("/privacy") ||
            pathname?.startsWith("/security") ||
            pathname?.startsWith("/terms") ||
            pathname?.startsWith("/setup-guide") ||
            pathname?.startsWith("/solutions");

          if (
            !isPublicPage &&
            !pathname?.includes("/signup") &&
            !pathname?.includes("/verify-email") &&
            !pathname?.includes("/login") &&
            !pathname?.includes("/forgot-password") &&
            !pathname?.includes("/reset-password")
          ) {
            toast.success("Signed in successfully");
          }
        }
        if (event === "SIGNED_OUT") {
          router.refresh();
          router.push("/login");
          toast.success("Signed out successfully");
        }
        if (event === "USER_UPDATED") {
          router.refresh();
          // Only show the toast if not on verify-email page
          if (!pathname?.includes("/verify-email")) {
            toast.success("Profile updated");
          }
        }
        if (event === "PASSWORD_RECOVERY") {
          router.push("/reset-password");
          toast.info("Please reset your password");
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [router, pathname, supabase]);

  return null;
}
