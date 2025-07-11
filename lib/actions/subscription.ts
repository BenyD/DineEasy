"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Database } from "@/types/supabase";
import { stripe } from "@/lib/stripe";
import { PLANS, SUBSCRIPTION } from "@/lib/constants";

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

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      line_items: [
        {
          price: PLANS[plan].stripe_price_id[interval],
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
        },
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
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

  const { data: subscription, error } = await supabase
    .from("subscriptions")
    .select()
    .eq("restaurant_id", restaurantId)
    .single();

  if (error) {
    return { error: error.message };
  }

  return { subscription };
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

  // Get current subscription
  const { data: subscription, error: subError } = await supabase
    .from("subscriptions")
    .select()
    .eq("restaurant_id", restaurantId)
    .single();

  if (subError || !subscription) {
    return { error: "Subscription not found" };
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

  // Get current subscription
  const { data: subscription, error: subError } = await supabase
    .from("subscriptions")
    .select()
    .eq("restaurant_id", restaurantId)
    .single();

  if (subError || !subscription) {
    return { error: "Subscription not found" };
  }

  // Cancel Stripe subscription
  const canceledSubscription = await stripe.subscriptions.update(
    subscription.stripe_subscription_id!,
    {
      cancel_at_period_end: true,
    }
  );

  // Update subscription record
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
    })
    .eq("id", subscription.id);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}
