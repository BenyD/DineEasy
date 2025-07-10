"use server";

import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
import { redirect } from "next/navigation";

export async function createStripeAccount() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  // Get user's restaurant
  const { data: restaurant, error: restaurantError } = await supabase
    .from("restaurants")
    .select()
    .eq("owner_id", user.id)
    .single();

  if (restaurantError || !restaurant) {
    return { error: "Restaurant not found" };
  }

  try {
    // If restaurant already has a Stripe account, return the account link
    if (restaurant.stripe_account_id) {
      const accountLink = await stripe.accountLinks.create({
        account: restaurant.stripe_account_id,
        refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/setup/connect`,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/select-plan`,
        type: "account_onboarding",
      });
      return { accountLink: accountLink.url };
    }

    // Create a new Stripe Connect account
    const account = await stripe.accounts.create({
      type: "standard",
      country: restaurant.country || "CH",
      email: user.email,
      business_type: "company",
      company: {
        name: restaurant.name,
      },
      metadata: {
        restaurantId: restaurant.id,
      },
    });

    // Update restaurant with Stripe Connect account ID
    await supabase
      .from("restaurants")
      .update({
        stripe_account_id: account.id,
        stripe_account_enabled: account.charges_enabled,
        stripe_account_requirements: account.requirements,
        stripe_account_created_at: new Date().toISOString(),
      })
      .eq("id", restaurant.id);

    // Create an account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/setup/connect`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/select-plan`,
      type: "account_onboarding",
    });

    return { accountLink: accountLink.url };
  } catch (error) {
    console.error("Error creating Stripe account:", error);
    return { error: "Failed to create Stripe account" };
  }
}

export async function getStripeAccountStatus(restaurantId: string) {
  const supabase = createClient();

  const { data: restaurant, error } = await supabase
    .from("restaurants")
    .select()
    .eq("id", restaurantId)
    .single();

  if (error || !restaurant) {
    return { error: "Restaurant not found" };
  }

  if (!restaurant.stripe_account_id) {
    return { status: "not_connected" };
  }

  try {
    const account = await stripe.accounts.retrieve(
      restaurant.stripe_account_id
    );

    await supabase
      .from("restaurants")
      .update({
        stripe_account_enabled: account.charges_enabled,
        stripe_account_requirements: account.requirements,
      })
      .eq("id", restaurantId);

    return {
      status: account.charges_enabled ? "active" : "pending",
      requirements: account.requirements,
    };
  } catch (error) {
    console.error("Error retrieving Stripe account:", error);
    return { error: "Failed to get Stripe account status" };
  }
}
