"use client";

import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";
import { CURRENCIES, type Currency } from "@/lib/constants/currencies";
import { toast } from "sonner";

interface RestaurantSettings {
  // Currency settings
  currency: Currency;
  setCurrency: (currency: Currency) => void;

  // Restaurant data
  restaurant: any | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchRestaurant: () => Promise<void>;
  updateRestaurant: (data: Partial<any>) => Promise<void>;
  toggleRestaurantStatus: () => Promise<void>;
  updateNotifications: (settings: any) => Promise<void>;
}

export const useRestaurantSettings = create<RestaurantSettings>((set, get) => ({
  // Default currency
  currency: CURRENCIES.USD,

  // Restaurant data
  restaurant: null,
  isLoading: false,
  error: null,

  // Set currency
  setCurrency: (currency: Currency) => {
    set({ currency });
    // Update in database if restaurant exists
    const { restaurant } = get();
    if (restaurant) {
      get().updateRestaurant({ currency: currency });
    }
  },

  // Fetch restaurant data
  fetchRestaurant: async () => {
    set({ isLoading: true, error: null });

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

      // Fetch restaurant data
      const { data: restaurant, error } = await supabase
        .from("restaurants")
        .select(
          `
          *,
          subscriptions (
            id,
            plan,
            interval,
            status,
            current_period_start,
            current_period_end
          )
        `
        )
        .eq("owner_id", user.id)
        .single();

      if (error) {
        throw error;
      }

      if (restaurant) {
        // Set currency from restaurant data
        const currency = restaurant.currency as Currency;
        set({
          restaurant,
          currency,
          isLoading: false,
        });
      } else {
        set({
          restaurant: null,
          isLoading: false,
        });
      }
    } catch (error: any) {
      console.error("Error fetching restaurant:", error);
      set({
        error: error.message || "Failed to fetch restaurant data",
        isLoading: false,
      });
    }
  },

  // Update restaurant data
  updateRestaurant: async (data: Partial<any>) => {
    try {
      const supabase = createClient();
      const { restaurant } = get();

      if (!restaurant) {
        throw new Error("No restaurant found");
      }

      // Update in database
      const { error } = await supabase
        .from("restaurants")
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq("id", restaurant.id);

      if (error) {
        throw error;
      }

      // Update local state
      set({
        restaurant: {
          ...restaurant,
          ...data,
        },
      });

      toast.success("Restaurant settings updated successfully");
    } catch (error: any) {
      console.error("Error updating restaurant:", error);
      toast.error(error.message || "Failed to update restaurant settings");
      throw error;
    }
  },

  // Toggle restaurant open/closed status
  toggleRestaurantStatus: async () => {
    try {
      const supabase = createClient();
      const { restaurant } = get();

      if (!restaurant) {
        throw new Error("No restaurant found");
      }

      const newStatus = !restaurant.is_open;

      // Update in database
      const { error } = await supabase
        .from("restaurants")
        .update({
          is_open: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", restaurant.id);

      if (error) {
        throw error;
      }

      // Update local state
      set({
        restaurant: {
          ...restaurant,
          is_open: newStatus,
        },
      });

      toast.success(
        `Restaurant ${newStatus ? "opened" : "closed"} successfully`
      );
    } catch (error: any) {
      console.error("Error toggling restaurant status:", error);
      toast.error(error.message || "Failed to update restaurant status");
      throw error;
    }
  },

  // Update notification settings
  updateNotifications: async (settings: any) => {
    try {
      const supabase = createClient();
      const { restaurant } = get();

      if (!restaurant) {
        throw new Error("No restaurant found");
      }

      // Update notification settings in database
      const { error } = await supabase
        .from("restaurants")
        .update({
          notification_settings: settings,
          updated_at: new Date().toISOString(),
        })
        .eq("id", restaurant.id);

      if (error) {
        throw error;
      }

      // Update local state
      set({
        restaurant: {
          ...restaurant,
          notification_settings: settings,
        },
      });

      toast.success("Notification settings updated successfully");
    } catch (error: any) {
      console.error("Error updating notifications:", error);
      toast.error(error.message || "Failed to update notification settings");
      throw error;
    }
  },
}));
