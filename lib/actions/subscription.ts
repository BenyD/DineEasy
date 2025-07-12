"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Database } from "@/types/supabase";
import { stripe } from "@/lib/stripe";
import { PRICING, SUBSCRIPTION, getStripePriceId } from "@/lib/constants";

type Subscription = Database["public"]["Tables"]["subscriptions"]["Insert"];

export async function createSubscription(formData: FormData) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  const restaurantId = formData.get("restaurant_id") as string;
  const plan = formData.get("plan") as Subscription["plan"];
  const interval = formData.get("interval") as Subscription["interval"];
  const currency = (formData.get("currency") as string) || "USD";

  // Validate interval
  if (!Object.values(SUBSCRIPTION.BILLING_PERIODS).includes(interval)) {
    return { error: "Invalid billing interval" };
  }

  // Get restaurant details
  const { data: restaurant, error: restaurantError } = await supabase
    .from("restaurants")
    .select()
    .eq("id", restaurantId)
    .single();

  if (restaurantError || !restaurant) {
    return { error: "Restaurant not found" };
  }

  if (restaurant.owner_id !== user.id) {
    return { error: "Not authorized" };
  }

  try {
    // Create or get Stripe customer
    let stripeCustomerId = restaurant.stripe_customer_id;
    let customerExists = false;
    if (stripeCustomerId) {
      try {
        // Try to retrieve the customer from Stripe
        await stripe.customers.retrieve(stripeCustomerId);
        customerExists = true;
      } catch (err: any) {
        if (err?.code === "resource_missing") {
          // Customer does not exist in Stripe, will create a new one
          stripeCustomerId = undefined;
        } else {
          throw err;
        }
      }
    }
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          restaurantId,
        },
      });
      stripeCustomerId = customer.id;
      // Update restaurant with Stripe customer ID
      await supabase
        .from("restaurants")
        .update({
          stripe_customer_id: stripeCustomerId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", restaurantId);
    }

    // Get the correct Stripe price ID for the plan, currency, and interval
    const priceId = getStripePriceId(
      plan as keyof typeof PRICING,
      currency as keyof (typeof PRICING)["starter"]["price"],
      interval
    );

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      subscription_data: {
        trial_period_days: SUBSCRIPTION.TRIAL_DAYS,
        metadata: {
          restaurantId,
          plan,
          interval,
          currency,
        },
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/return?session_id={CHECKOUT_SESSION_ID}&plan=${plan}&interval=${interval}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/select-plan`,
    });

    if (!session.url) {
      return { error: "Failed to create checkout session" };
    }

    // Update restaurant subscription status to pending
    await supabase
      .from("restaurants")
      .update({
        subscription_status: "pending",
        updated_at: new Date().toISOString(),
      })
      .eq("id", restaurantId);

    return { checkoutUrl: session.url };
  } catch (error) {
    console.error("Error creating subscription:", error);
    return { error: "Failed to create subscription" };
  }
}

export async function getSubscription(restaurantId: string) {
  const supabase = createClient();

  const { data: subscriptions, error } = await supabase
    .from("subscriptions")
    .select()
    .eq("restaurant_id", restaurantId)
    .order("created_at", { ascending: false }); // Get the most recent subscription

  if (error) {
    return { error: error.message };
  }

  if (!subscriptions || subscriptions.length === 0) {
    return { error: "No subscription found" };
  }

  return { subscription: subscriptions[0] };
}

export async function updateSubscription(formData: FormData) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  const restaurantId = formData.get("restaurant_id") as string;
  const plan = formData.get("plan") as Subscription["plan"];
  const interval = formData.get("interval") as Subscription["interval"];

  // Get current subscription - handle multiple subscriptions like the billing data hook
  const { data: subscriptions, error: subError } = await supabase
    .from("subscriptions")
    .select()
    .eq("restaurant_id", restaurantId)
    .order("created_at", { ascending: false }); // Get the most recent subscription

  if (subError) {
    console.error("Error fetching subscriptions:", subError);
    return { error: "Failed to fetch subscription data" };
  }

  if (!subscriptions || subscriptions.length === 0) {
    return { error: "No subscription found for this restaurant" };
  }

  // Get the most recent subscription
  const subscription = subscriptions[0];

  // Verify the subscription has a Stripe customer ID
  if (!subscription.stripe_customer_id) {
    return { error: "Subscription is not properly linked to Stripe" };
  }

  try {
    // Create Stripe portal session for subscription management
    const { url } = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing`,
    });

    return { portalUrl: url };
  } catch (error) {
    console.error("Error updating subscription:", error);
    return { error: "Failed to update subscription" };
  }
}

export async function cancelSubscription(formData: FormData) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  const restaurantId = formData.get("restaurant_id") as string;

  // Get current subscription - handle multiple subscriptions like the billing data hook
  const { data: subscriptions, error: subError } = await supabase
    .from("subscriptions")
    .select()
    .eq("restaurant_id", restaurantId)
    .order("created_at", { ascending: false }); // Get the most recent subscription

  if (subError) {
    console.error("Error fetching subscriptions:", subError);
    return { error: "Failed to fetch subscription data" };
  }

  if (!subscriptions || subscriptions.length === 0) {
    return { error: "No subscription found for this restaurant" };
  }

  // Get the most recent active subscription
  const subscription = subscriptions[0];

  // Verify the subscription has a Stripe subscription ID
  if (!subscription.stripe_subscription_id) {
    return { error: "Subscription is not properly linked to Stripe" };
  }

  try {
    // Cancel Stripe subscription
    const canceledSubscription = await stripe.subscriptions.update(
      subscription.stripe_subscription_id,
      {
        cancel_at_period_end: true,
      }
    );

    // Update subscription record using the correct column
    const { error } = await supabase
      .from("subscriptions")
      .update({
        status: canceledSubscription.status,
        cancel_at: canceledSubscription.cancel_at
          ? new Date(canceledSubscription.cancel_at * 1000).toISOString()
          : null,
        canceled_at: canceledSubscription.canceled_at
          ? new Date(canceledSubscription.canceled_at * 1000).toISOString()
          : null,
        updated_at: new Date().toISOString(),
      })
      .eq("stripe_subscription_id", subscription.stripe_subscription_id);

    if (error) {
      console.error("Error updating subscription:", error);
      return { error: error.message };
    }

    // Update restaurant subscription status
    const { error: restaurantError } = await supabase
      .from("restaurants")
      .update({
        subscription_status: "canceled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", restaurantId);

    if (restaurantError) {
      console.error("Error updating restaurant status:", restaurantError);
      // Don't fail the cancellation for this error
    }

    return { success: true };
  } catch (error) {
    console.error("Error canceling subscription:", error);
    return { error: "Failed to cancel subscription" };
  }
}
