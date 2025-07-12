"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

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
}

export function useSidebarData(): SidebarData {
  const [data, setData] = useState<SidebarData>({
    restaurant: null,
    user: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    async function fetchSidebarData() {
      try {
        const supabase = createClient();

        // Get current user
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
        if (userError || !user) {
          throw new Error("Not authenticated");
        }

        // Fetch restaurant data with subscription info
        const { data: restaurant, error: restaurantError } = await supabase
          .from("restaurants")
          .select(
            `
            name,
            logo_url,
            type,
            opening_hours,
            is_open,
            subscriptions (
              plan,
              status
            )
          `
          )
          .eq("owner_id", user.id)
          .single();

        if (restaurantError) {
          throw restaurantError;
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

        // Fetch staff role
        const { data: staff, error: staffError } = await supabase
          .from("staff")
          .select("role")
          .eq("user_id", user.id)
          .eq("restaurant_id", restaurant.id)
          .single();

        if (staffError) {
          console.warn("Staff record not found:", staffError);
        }

        // Determine restaurant status based on manual override and opening hours
        const manualStatus = restaurant.is_open;
        const autoStatus = determineRestaurantStatus(restaurant.opening_hours);
        const isOpen = manualStatus !== null ? manualStatus : autoStatus;

        // Get subscription plan
        const subscriptionPlan =
          restaurant.subscriptions?.[0]?.plan || "Starter";

        setData({
          restaurant: {
            name: restaurant.name,
            logo_url: restaurant.logo_url,
            status: isOpen ? "open" : "closed",
            subscription_plan: subscriptionPlan,
            type: restaurant.type,
          },
          user: {
            name: profile?.full_name || user.email?.split("@")[0] || "User",
            avatar_url: profile?.avatar_url,
            role: staff?.role || "Restaurant Owner",
          },
          isLoading: false,
          error: null,
        });
      } catch (error: any) {
        console.error("Error fetching sidebar data:", error);
        setData({
          restaurant: null,
          user: null,
          isLoading: false,
          error: error.message || "Failed to fetch data",
        });
      }
    }

    fetchSidebarData();
  }, []);

  return data;
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
