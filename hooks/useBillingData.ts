"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { PRICING } from "@/lib/constants/pricing";
import { CURRENCIES } from "@/lib/constants/currencies";

interface BillingData {
  plan: string;
  price: number;
  billingCycle: "monthly" | "yearly";
  nextBillingDate: Date | null;
  trialEndsAt: Date | null;
  hasActiveSubscription: boolean;
  currency: string;
  usage: {
    tables: { used: number; limit: number };
    menuItems: { used: number; limit: number };
    staff: { used: number; limit: number };
  };
  isLoading: boolean;
  error: string | null;
  restaurantId?: string;
}

export function useBillingData(): BillingData & { refresh: () => void } {
  const [data, setData] = useState<BillingData>({
    plan: "Starter",
    price: 0,
    billingCycle: "monthly",
    nextBillingDate: null,
    trialEndsAt: null,
    hasActiveSubscription: false,
    currency: "USD", // Default currency
    usage: {
      tables: { used: 0, limit: 5 },
      menuItems: { used: 0, limit: 50 },
      staff: { used: 1, limit: 1 },
    },
    isLoading: true,
    error: null,
  });

  const fetchBillingData = async () => {
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

      // Fetch restaurant with subscription and usage data
      const { data: restaurant, error: restaurantError } = await supabase
        .from("restaurants")
        .select(
          `
          id,
          currency,
          stripe_account_id,
          subscription_status,
          subscriptions (
            id,
            plan,
            interval,
            status,
            current_period_start,
            current_period_end,
            trial_start,
            trial_end,
            cancel_at,
            canceled_at
          )
        `
        )
        .eq("owner_id", user.id)
        .single();

      if (restaurantError) {
        throw restaurantError;
      }

      // Fetch usage statistics
      const [tablesResult, menuItemsResult, staffResult] = await Promise.all([
        supabase
          .from("tables")
          .select("id", { count: "exact" })
          .eq("restaurant_id", restaurant.id)
          .eq("is_active", true),
        supabase
          .from("menu_items")
          .select("id", { count: "exact" })
          .eq("restaurant_id", restaurant.id)
          .eq("is_available", true),
        supabase
          .from("staff")
          .select("id", { count: "exact" })
          .eq("restaurant_id", restaurant.id)
          .eq("is_active", true),
      ]);

      // Get current subscription
      const currentSubscription = restaurant.subscriptions?.[0];
      const plan = currentSubscription?.plan || "starter";
      const interval = currentSubscription?.interval || "monthly";
      const currency = restaurant.currency || "CHF";

      // Debug logging
      console.log("Billing data debug:", {
        restaurantId: restaurant.id,
        subscriptionStatus: restaurant.subscription_status,
        currentSubscription,
        subscriptionCount: restaurant.subscriptions?.length || 0,
        currentPeriodEnd: currentSubscription?.current_period_end,
        trialEnd: currentSubscription?.trial_end,
        cancelAt: currentSubscription?.cancel_at,
      });

      // Check if there's an active subscription
      const hasActiveSubscription =
        (currentSubscription &&
          (currentSubscription.status === "active" ||
            currentSubscription.status === "trialing" ||
            currentSubscription.status === "past_due" ||
            currentSubscription.status === "incomplete" ||
            currentSubscription.status === "incomplete_expired")) ||
        (restaurant.subscription_status &&
          (restaurant.subscription_status === "active" ||
            restaurant.subscription_status === "trialing" ||
            restaurant.subscription_status === "past_due" ||
            restaurant.subscription_status === "incomplete" ||
            restaurant.subscription_status === "incomplete_expired"));

      // Get plan pricing
      const planPricing = PRICING[plan as keyof typeof PRICING];
      const price =
        planPricing?.price?.[currency as keyof typeof planPricing.price]?.[
          interval as keyof (typeof planPricing.price)[keyof typeof planPricing.price]
        ] || 0;

      // Get plan limits
      const getPlanLimits = (planName: string) => {
        switch (planName.toLowerCase()) {
          case "starter":
            return {
              tables: 5,
              menuItems: 50,
              staff: 1,
            };
          case "pro":
            return {
              tables: 20,
              menuItems: 200,
              staff: 5,
            };
          case "elite":
            return {
              tables: -1, // unlimited
              menuItems: -1, // unlimited
              staff: -1, // unlimited
            };
          default:
            return {
              tables: 5,
              menuItems: 50,
              staff: 1,
            };
        }
      };

      const limits = getPlanLimits(plan);

      // Calculate next billing date based on subscription status
      let nextBillingDate: Date | null = null;
      if (currentSubscription) {
        if (
          currentSubscription.status === "trialing" &&
          currentSubscription.trial_end
        ) {
          // If in trial, next billing is when trial ends
          nextBillingDate = new Date(currentSubscription.trial_end);
        } else if (
          currentSubscription.status === "active" ||
          currentSubscription.status === "past_due" ||
          currentSubscription.status === "incomplete"
        ) {
          // If active, past due, or incomplete, next billing is current_period_end
          if (currentSubscription.current_period_end) {
            nextBillingDate = new Date(currentSubscription.current_period_end);
          } else if (currentSubscription.current_period_start) {
            // Fallback: calculate based on current_period_start + interval
            const startDate = new Date(
              currentSubscription.current_period_start
            );
            const interval = currentSubscription.interval;
            if (interval === "monthly") {
              nextBillingDate = new Date(
                startDate.setMonth(startDate.getMonth() + 1)
              );
            } else if (interval === "yearly") {
              nextBillingDate = new Date(
                startDate.setFullYear(startDate.getFullYear() + 1)
              );
            }
          }
        } else if (
          currentSubscription.status === "canceled" &&
          currentSubscription.cancel_at
        ) {
          // If canceled, show when subscription will end
          nextBillingDate = new Date(currentSubscription.cancel_at);
        } else if (currentSubscription.status === "incomplete_expired") {
          // If incomplete_expired, show when it expired
          nextBillingDate = currentSubscription.current_period_end
            ? new Date(currentSubscription.current_period_end)
            : null;
        }
      }

      console.log("Next billing date calculation:", {
        subscriptionStatus: currentSubscription?.status,
        nextBillingDate: nextBillingDate?.toISOString(),
        isTrial: currentSubscription?.status === "trialing",
        trialEnd: currentSubscription?.trial_end,
        currentPeriodEnd: currentSubscription?.current_period_end,
      });

      setData({
        plan: plan.charAt(0).toUpperCase() + plan.slice(1),
        price,
        billingCycle: interval as "monthly" | "yearly",
        nextBillingDate,
        trialEndsAt: currentSubscription?.trial_end
          ? new Date(currentSubscription.trial_end)
          : null,
        hasActiveSubscription: hasActiveSubscription,
        currency: currency,
        usage: {
          tables: {
            used: tablesResult.count || 0,
            limit: limits.tables === -1 ? 999 : limits.tables,
          },
          menuItems: {
            used: menuItemsResult.count || 0,
            limit: limits.menuItems === -1 ? 999 : limits.menuItems,
          },
          staff: {
            used: staffResult.count || 1,
            limit: limits.staff === -1 ? 999 : limits.staff,
          },
        },
        isLoading: false,
        error: null,
        restaurantId: restaurant.id,
      });
    } catch (error) {
      console.error("Error fetching billing data:", error);
      setData((prev) => ({
        ...prev,
        isLoading: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to load billing data",
      }));
    }
  };

  useEffect(() => {
    fetchBillingData();
  }, []);

  const refresh = () => {
    setData((prev) => ({ ...prev, isLoading: true, error: null }));
    fetchBillingData();
  };

  return { ...data, refresh };
}
