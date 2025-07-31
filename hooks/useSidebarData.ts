"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRestaurantSettings } from "@/lib/store/restaurant-settings";
import { useRestaurantWebSocket } from "@/hooks/useRestaurantWebSocket";

interface SidebarData {
  restaurant: {
    name: string;
    logo_url: string | null;
    status: "open" | "closed";
    subscription_plan: string | null;
    type: string | null;
  } | null;
  user: {
    name: string;
    avatar_url: string | null;
    role: string;
  } | null;
  isLoading: boolean;
  error: string | null;
  refreshUserData: () => void;
}

export function useSidebarData(): SidebarData {
  const [data, setData] = useState<SidebarData>({
    restaurant: null,
    user: null,
    isLoading: true,
    error: null,
    refreshUserData: () => {},
  });

  // Get restaurant data from the store
  const {
    restaurant: storeRestaurant,
    isLoading: storeLoading,
    error: storeError,
  } = useRestaurantSettings();

  // Restaurant WebSocket for real-time status updates
  useRestaurantWebSocket({
    restaurantId: storeRestaurant?.id,
    onRestaurantUpdated: (restaurant) => {
      // Update the restaurant status in the store
      const { updateRestaurantStatus } = useRestaurantSettings.getState();
      updateRestaurantStatus((restaurant as any).is_open);

      // Also update the sidebar data
      setData((prev) => ({
        ...prev,
        restaurant: prev.restaurant
          ? {
              ...prev.restaurant,
              status: (restaurant as any).is_open ? "open" : "closed",
            }
          : null,
      }));
    },
    enabled: !!storeRestaurant?.id,
  });

  // Add a refresh trigger
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const refreshUserData = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  useEffect(() => {
    async function fetchUserData() {
      try {
        console.log("👤 Fetching sidebar user data...");
        const supabase = createClient();

        // Get current user
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
        if (userError || !user) {
          throw new Error("Not authenticated");
        }

        // Fetch user profile
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("id", user.id)
          .single();

        if (profileError) {
          console.warn("Profile not found:", profileError);
        }

        // Fetch staff role if restaurant exists
        let staffRole = "owner"; // default role
        if (storeRestaurant) {
          const { data: staff, error: staffError } = await supabase
            .from("staff")
            .select("role")
            .eq("user_id", user.id)
            .eq("restaurant_id", storeRestaurant.id)
            .single();

          if (!staffError && staff) {
            staffRole = staff.role;
          }
        }

        // Determine restaurant status based on manual override and opening hours
        const manualStatus = storeRestaurant?.is_open;
        const autoStatus = storeRestaurant?.opening_hours
          ? determineRestaurantStatus(storeRestaurant.opening_hours)
          : false;
        const isOpen = manualStatus !== null ? manualStatus : autoStatus;

        // Get subscription plan - only show actual subscription plans, not defaults
        let subscriptionPlan = null;
        if (
          storeRestaurant?.subscriptions &&
          storeRestaurant.subscriptions.length > 0
        ) {
          // Get the most recent active subscription
          const activeSubscription = storeRestaurant.subscriptions
            .filter((sub: any) =>
              [
                "active",
                "trialing",
                "past_due",
                "incomplete",
                "incomplete_expired",
              ].includes(sub.status)
            )
            .sort(
              (a: any, b: any) =>
                new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime()
            )[0];

          if (activeSubscription) {
            subscriptionPlan = activeSubscription.plan;
          }
        }

        // Only show subscription plan if we have a valid subscription
        // Don't default to "Starter" when there's no actual subscription
        if (
          !subscriptionPlan &&
          storeRestaurant?.subscription_status === "pending"
        ) {
          subscriptionPlan = null; // Don't show any plan for pending status
        }

        console.log("✅ Sidebar data fetched successfully:", {
          restaurant: storeRestaurant?.name,
          user: profile?.full_name || user.email,
          role: staffRole,
        });

        setData({
          restaurant: storeRestaurant
            ? {
                name: storeRestaurant.name,
                logo_url: storeRestaurant.logo_url,
                status: isOpen ? "open" : "closed",
                subscription_plan: subscriptionPlan,
                type: storeRestaurant.type,
              }
            : null,
          user: {
            name: profile?.full_name || user.email || "User",
            avatar_url: profile?.avatar_url || null,
            role: staffRole,
          },
          isLoading: false, // We have the data now, so loading is complete
          error: storeError,
          refreshUserData: () => {},
        });
      } catch (error: any) {
        console.error("❌ Error fetching sidebar data:", error);
        setData({
          restaurant: null,
          user: null,
          isLoading: false,
          error: error.message || "Failed to fetch data",
          refreshUserData: () => {},
        });
      }
    }

    // Handle different states of the store
    if (storeLoading) {
      console.log("⏳ Store is loading, showing loading state...");
      // Store is still loading, show loading state
      setData((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
      }));
    } else if (storeError && !storeRestaurant) {
      console.error("❌ Store has error and no restaurant data:", storeError);
      // Store has an error and no restaurant data, show error state
      setData((prev) => ({
        ...prev,
        isLoading: false,
        error: storeError,
      }));
    } else if (!storeRestaurant) {
      console.log(
        "⏳ Store loaded but no restaurant data yet, showing loading state..."
      );
      // Store is done loading but no restaurant data yet, show loading state
      setData((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
      }));
    } else {
      console.log("🔄 Store ready with restaurant data, fetching user data...");
      // Store is ready with restaurant data, fetch user data
      fetchUserData();
    }
  }, [storeRestaurant, storeLoading, storeError, refreshTrigger]);

  return { ...data, refreshUserData };
}

// Helper function to determine if restaurant is open based on opening hours
function determineRestaurantStatus(openingHours: any): boolean {
  if (!openingHours) return false;

  const now = new Date();
  const days = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  const currentDay = days[now.getDay()]; // Get day name like "monday", "tuesday", etc.
  const currentTime = now.toTimeString().slice(0, 5); // "HH:MM"

  const todayHours = openingHours[currentDay];
  if (!todayHours || !todayHours.open || !todayHours.close) {
    return false;
  }

  return currentTime >= todayHours.open && currentTime <= todayHours.close;
}
