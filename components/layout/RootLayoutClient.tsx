"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { AuthChangeEvent, Session } from "@supabase/supabase-js";

export default function RootLayoutClient() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        if (event === "SIGNED_IN") {
          router.refresh();
          toast.success("Signed in successfully");
        }
        if (event === "SIGNED_OUT") {
          router.refresh();
          router.push("/login");
          toast.success("Signed out successfully");
        }
        if (event === "USER_UPDATED") {
          router.refresh();
          toast.success("Profile updated");
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
  }, [router, supabase]);

  return null;
}
