"use client";

import { useEffect } from "react";
import { useRestaurantSettings } from "@/lib/store/restaurant-settings";

export function RestaurantStoreInitializer() {
  const { fetchRestaurant, isLoading, error } = useRestaurantSettings();

  useEffect(() => {
    // Initialize the restaurant settings store when the dashboard loads
    // Add a small delay to ensure proper loading sequence
    const timer = setTimeout(() => {
      console.log("🏪 Initializing restaurant settings store...");
      fetchRestaurant();
    }, 100);

    return () => clearTimeout(timer);
  }, [fetchRestaurant]);

  // Log store state changes for debugging
  useEffect(() => {
    if (error) {
      console.error("❌ Restaurant store error:", error);
    } else if (!isLoading) {
      console.log("✅ Restaurant store initialized successfully");
    }
  }, [isLoading, error]);

  // This component doesn't render anything, it just initializes the store
  return null;
}
