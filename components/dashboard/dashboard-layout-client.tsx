"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function DashboardLayoutClient() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Subscribe to restaurant changes
    const channel = supabase
      .channel("restaurant_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "restaurants",
        },
        (payload) => {
          // Refresh the page to update server state
          router.refresh();

          // Show notification based on the change
          switch (payload.eventType) {
            case "UPDATE":
              toast.success("Restaurant settings updated");
              break;
            case "DELETE":
              toast.error("Restaurant deleted");
              router.push("/");
              break;
          }
        }
      )
      .subscribe();

    // Subscribe to subscription changes
    const subscriptionChannel = supabase
      .channel("subscription_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "subscriptions",
        },
        (payload) => {
          // Refresh the page to update server state
          router.refresh();

          // Show notification based on the change
          switch (payload.eventType) {
            case "UPDATE":
              const status = (payload.new as any).status;
              if (status === "active") {
                toast.success("Subscription activated");
              } else if (status === "inactive") {
                toast.error("Subscription deactivated");
                router.push("/select-plan");
              }
              break;
            case "DELETE":
              toast.error("Subscription cancelled");
              router.push("/select-plan");
              break;
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
      subscriptionChannel.unsubscribe();
    };
  }, [supabase, router]);

  return null;
}
