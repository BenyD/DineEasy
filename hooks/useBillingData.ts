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
  subscriptionStatus?: string;
  isCancelled?: boolean;
  accessEndsAt?: Date | null;
  metadata?: {
    trial_preserved?: string;
    original_trial_end?: string;
  };
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
    subscriptionStatus: undefined,
    isCancelled: false,
    accessEndsAt: null,
  });

  const fetchBillingData = async (retryCount = 0) => {
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
            canceled_at,
            metadata
          )
        `
        )
        .eq("owner_id", user.id)
        .single();

      if (restaurantError) {
        throw restaurantError;
      }

      // Fetch usage statistics with error handling
      const [tablesResult, menuItemsResult, staffResult] =
        await Promise.allSettled([
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

      // Handle usage data with fallbacks
      const tablesCount =
        tablesResult.status === "fulfilled" ? tablesResult.value.count || 0 : 0;
      const menuItemsCount =
        menuItemsResult.status === "fulfilled"
          ? menuItemsResult.value.count || 0
          : 0;
      const staffCount =
        staffResult.status === "fulfilled" ? staffResult.value.count || 1 : 1;

      // Log any usage fetch errors
      if (tablesResult.status === "rejected") {
        console.warn("Failed to fetch tables count:", tablesResult.reason);
      }
      if (menuItemsResult.status === "rejected") {
        console.warn(
          "Failed to fetch menu items count:",
          menuItemsResult.reason
        );
      }
      if (staffResult.status === "rejected") {
        console.warn("Failed to fetch staff count:", staffResult.reason);
      }

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
        canceledAt: currentSubscription?.canceled_at,
        metadata: currentSubscription?.metadata,
        isTrialUpgrade:
          currentSubscription?.metadata?.trial_preserved === "true",
        originalTrialEnd: currentSubscription?.metadata?.original_trial_end,
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

      // Enhanced date calculations for different subscription states
      let nextBillingDate: Date | null = null;
      let trialEndsAt: Date | null = null;
      let accessEndsAt: Date | null = null;
      let isCancelled = false;

      if (currentSubscription) {
        // Set trial end date - check for preserved trial period from upgrades
        if (currentSubscription.trial_end) {
          trialEndsAt = new Date(currentSubscription.trial_end);
        }

        // Check if this is a trial upgrade (trial preserved during plan change)
        const isTrialUpgrade =
          currentSubscription.metadata?.trial_preserved === "true";
        const originalTrialEnd =
          currentSubscription.metadata?.original_trial_end;

        if (isTrialUpgrade && originalTrialEnd) {
          // Use the original trial end date for trial upgrades
          trialEndsAt = new Date(parseInt(originalTrialEnd) * 1000);
          console.log("Detected trial upgrade - using original trial end:", {
            originalTrialEnd: originalTrialEnd,
            trialEndsAt: trialEndsAt.toISOString(),
          });
        }

        // Check if subscription is cancelled
        if (
          currentSubscription.status === "canceled" ||
          currentSubscription.cancel_at
        ) {
          isCancelled = true;

          // If cancelled, access ends at cancel_at date
          if (currentSubscription.cancel_at) {
            accessEndsAt = new Date(currentSubscription.cancel_at);
          } else if (currentSubscription.current_period_end) {
            // Fallback to current_period_end if cancel_at is not set
            accessEndsAt = new Date(currentSubscription.current_period_end);
          }
        }

        // Calculate next billing date based on subscription status
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
        } else if (currentSubscription.status === "incomplete_expired") {
          // If incomplete_expired, show when it expired
          nextBillingDate = currentSubscription.current_period_end
            ? new Date(currentSubscription.current_period_end)
            : null;
        }

        // If cancelled and we don't have accessEndsAt, use nextBillingDate
        if (isCancelled && !accessEndsAt && nextBillingDate) {
          accessEndsAt = nextBillingDate;
        }
      }

      console.log("Enhanced billing date calculation:", {
        subscriptionStatus: currentSubscription?.status,
        nextBillingDate: nextBillingDate?.toISOString(),
        trialEndsAt: trialEndsAt?.toISOString(),
        accessEndsAt: accessEndsAt?.toISOString(),
        isCancelled,
        isTrial: currentSubscription?.status === "trialing",
        isTrialUpgrade:
          currentSubscription?.metadata?.trial_preserved === "true",
        trialEnd: currentSubscription?.trial_end,
        originalTrialEnd: currentSubscription?.metadata?.original_trial_end,
        currentPeriodEnd: currentSubscription?.current_period_end,
        cancelAt: currentSubscription?.cancel_at,
      });

      setData({
        plan: plan.charAt(0).toUpperCase() + plan.slice(1),
        price,
        billingCycle: interval as "monthly" | "yearly",
        nextBillingDate,
        trialEndsAt,
        hasActiveSubscription: hasActiveSubscription,
        currency: currency,
        usage: {
          tables: {
            used: tablesCount,
            limit: limits.tables === -1 ? 999 : limits.tables,
          },
          menuItems: {
            used: menuItemsCount,
            limit: limits.menuItems === -1 ? 999 : limits.menuItems,
          },
          staff: {
            used: staffCount,
            limit: limits.staff === -1 ? 999 : limits.staff,
          },
        },
        isLoading: false,
        error: null,
        restaurantId: restaurant.id,
        subscriptionStatus:
          currentSubscription?.status || restaurant.subscription_status,
        isCancelled,
        accessEndsAt,
        metadata: currentSubscription?.metadata || {},
      });
    } catch (error) {
      console.error("Error fetching billing data:", error);

      // Retry logic for transient errors
      if (retryCount < 2 && error instanceof Error) {
        const isRetryableError =
          error.message.includes("network") ||
          error.message.includes("timeout") ||
          error.message.includes("connection") ||
          error.message.includes("rate limit");

        if (isRetryableError) {
          console.log(
            `Retrying billing data fetch (attempt ${retryCount + 1})`
          );
          setTimeout(
            () => fetchBillingData(retryCount + 1),
            Math.pow(2, retryCount) * 1000
          );
          return;
        }
      }

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
