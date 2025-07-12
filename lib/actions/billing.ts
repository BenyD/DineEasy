"use server";

import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
import { redirect } from "next/navigation";

// Utility function to validate currency has all required Stripe price IDs
function validateCurrency(currency: string): boolean {
  const plans = ["starter", "pro", "elite"];
  const intervals = ["monthly", "yearly"];

  for (const plan of plans) {
    for (const interval of intervals) {
      const envVarName = `STRIPE_${plan.toUpperCase()}_${interval.toUpperCase()}_${currency}_PRICE_ID`;
      if (!process.env[envVarName]) {
        console.error(`Missing Stripe price ID: ${envVarName}`);
        return false;
      }
    }
  }

  return true;
}

export async function createStripePortalSession() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  try {
    // Get user's restaurant and subscription
    const { data: restaurant, error: restaurantError } = await supabase
      .from("restaurants")
      .select(
        `
        id,
        stripe_customer_id,
        subscriptions (
          stripe_customer_id
        )
      `
      )
      .eq("owner_id", user.id)
      .single();

    if (restaurantError || !restaurant) {
      return { error: "Restaurant not found" };
    }

    const customerId =
      restaurant.stripe_customer_id ||
      restaurant.subscriptions?.[0]?.stripe_customer_id;

    if (!customerId) {
      return { error: "No Stripe customer found" };
    }

    // Create Stripe portal session
    const { url } = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing`,
    });

    return { portalUrl: url };
  } catch (error) {
    console.error("Error creating Stripe portal session:", error);

    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes("No such customer")) {
        return {
          error:
            "Unable to find your billing information. Please contact support.",
        };
      }
      if (error.message.includes("authentication")) {
        return { error: "Please log in again to access your billing portal." };
      }
      if (error.message.includes("permission")) {
        return {
          error:
            "You don't have permission to access billing. Please contact support.",
        };
      }
    }

    return {
      error:
        "Failed to open billing portal. Please try again or contact support.",
    };
  }
}

export async function createPlanChangeSession(
  planId: string,
  interval: "monthly" | "yearly",
  currency?: string
) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  try {
    // Get user's restaurant
    const { data: restaurant, error: restaurantError } = await supabase
      .from("restaurants")
      .select(
        `
        id,
        stripe_customer_id,
        currency,
        subscriptions (
          id,
          stripe_subscription_id
        )
      `
      )
      .eq("owner_id", user.id)
      .single();

    if (restaurantError || !restaurant) {
      return { error: "Restaurant not found" };
    }

    const customerId = restaurant.stripe_customer_id;
    const currentSubscription = restaurant.subscriptions?.[0];
    const selectedCurrency = currency || restaurant.currency || "CHF";

    if (!customerId) {
      return { error: "No Stripe customer found" };
    }

    // Validate that the selected currency has all required Stripe price IDs
    if (!validateCurrency(selectedCurrency)) {
      return {
        error: `Currency ${selectedCurrency} is not fully supported. Please contact support.`,
      };
    }

    // Get the correct Stripe price ID for the plan and interval using the same approach as pricing constants
    const getStripePriceId = (
      plan: string,
      currency: string,
      interval: string
    ) => {
      const envVarName = `STRIPE_${plan.toUpperCase()}_${interval.toUpperCase()}_${currency}_PRICE_ID`;
      const priceId = process.env[envVarName];

      if (!priceId) {
        console.error(
          `Missing Stripe price ID for ${plan} ${interval} ${currency}: ${envVarName}`
        );
        return null;
      }

      return priceId;
    };

    const priceId = getStripePriceId(planId, selectedCurrency, interval);

    if (!priceId) {
      return {
        error: `Price not found for ${planId} ${interval} plan in ${selectedCurrency}`,
      };
    }

    // Validate that we're not trying to "upgrade" to the same plan
    if (currentSubscription?.stripe_subscription_id) {
      const existingSubscription = await stripe.subscriptions.retrieve(
        currentSubscription.stripe_subscription_id
      );

      const currentPlan = existingSubscription.metadata.plan;
      const currentInterval = existingSubscription.metadata.interval;

      if (currentPlan === planId && currentInterval === interval) {
        return {
          error: "You are already on this plan and billing cycle.",
        };
      }
    }

    // If there's an existing subscription, create a checkout session for the upgrade
    if (currentSubscription?.stripe_subscription_id) {
      try {
        // Get the current subscription from Stripe
        const existingSubscription = await stripe.subscriptions.retrieve(
          currentSubscription.stripe_subscription_id
        );

        // Check if the subscription is in trial
        const isInTrial = existingSubscription.status === "trialing";

        if (isInTrial) {
          // If in trial, create a checkout session for immediate upgrade with payment
          const session = await stripe.checkout.sessions.create({
            customer: customerId,
            line_items: [
              {
                price: priceId,
                quantity: 1,
              },
            ],
            mode: "subscription",
            metadata: {
              isUpgrade: "true",
              existingSubscriptionId:
                currentSubscription.stripe_subscription_id,
              isTrialUpgrade: "true",
            },
            subscription_data: {
              metadata: {
                restaurantId: restaurant.id,
                plan: planId,
                interval,
                currency: selectedCurrency,
                isUpgrade: "true",
                isTrialUpgrade: "true",
              },
            },
            success_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/return?session_id={CHECKOUT_SESSION_ID}&plan=${planId}&interval=${interval}&upgraded=true&trial_preserved=true`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing/change-plan`,
          });

          return { checkoutUrl: session.url };
        } else {
          // If not in trial, create a checkout session for prorated upgrade
          const session = await stripe.checkout.sessions.create({
            customer: customerId,
            line_items: [
              {
                price: priceId,
                quantity: 1,
              },
            ],
            mode: "subscription",
            metadata: {
              isUpgrade: "true",
              existingSubscriptionId:
                currentSubscription.stripe_subscription_id,
            },
            subscription_data: {
              metadata: {
                restaurantId: restaurant.id,
                plan: planId,
                interval,
                currency: selectedCurrency,
                isUpgrade: "true",
              },
            },
            success_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/return?session_id={CHECKOUT_SESSION_ID}&plan=${planId}&interval=${interval}&upgraded=true`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing/change-plan`,
          });

          return { checkoutUrl: session.url };
        }
      } catch (error) {
        console.error("Error creating upgrade checkout session:", error);
        return { error: "Failed to create upgrade checkout session" };
      }
    } else {
      // New subscription
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: "subscription",
        metadata: {
          isNewSubscription: "true",
        },
        subscription_data: {
          trial_period_days: 14,
          metadata: {
            restaurantId: restaurant.id,
            plan: planId,
            interval,
            currency: selectedCurrency,
          },
        },
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/return?session_id={CHECKOUT_SESSION_ID}&plan=${planId}&interval=${interval}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing/change-plan`,
      });

      return { checkoutUrl: session.url };
    }
  } catch (error) {
    console.error("Error creating plan change session:", error);

    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes("No such price")) {
        return {
          error:
            "Selected plan is not available in your currency. Please contact support.",
        };
      }
      if (error.message.includes("customer")) {
        return {
          error:
            "Unable to find your billing information. Please try again or contact support.",
        };
      }
      if (error.message.includes("currency")) {
        return {
          error:
            "Currency not supported. Please contact support to enable your preferred currency.",
        };
      }
      if (error.message.includes("authentication")) {
        return {
          error: "Please log in again to continue with your plan change.",
        };
      }
    }

    return {
      error:
        "Failed to create checkout session. Please try again or contact support if the issue persists.",
    };
  }
}
