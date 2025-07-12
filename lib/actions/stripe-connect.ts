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
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/setup/connect?success=true`,
        type: "account_onboarding",
        collection_options: {
          fields: "eventually_due", // Up-front onboarding for better UX
        },
      });
      return { accountLink: accountLink.url };
    }

    // Create a new Stripe Connect account
    // Note: Using "standard" type for maximum flexibility
    // Alternative: Use "express" type for simpler onboarding (less customization but easier UX)
    console.log("Creating Stripe Connect account for restaurant:", {
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      country: restaurant.country || "CH",
      email: user.email,
    });

    const account = await stripe.accounts.create({
      type: "express", // Could be "express" for simpler onboarding
      country: (restaurant.country || "CH") as string,
      email: user.email,
      business_type: "company",
      company: {
        name: restaurant.name,
      },
      metadata: {
        restaurantId: restaurant.id,
        restaurantName: restaurant.name,
        ownerEmail: user.email,
      },
    } as any);

    console.log("Stripe Connect account created:", {
      accountId: account.id,
      restaurantId: restaurant.id,
      chargesEnabled: account.charges_enabled,
    });

    // Update restaurant with Stripe Connect account ID
    console.log("Updating restaurant with Stripe account ID:", account.id);

    const { error: updateError } = await supabase
      .from("restaurants")
      .update({
        stripe_account_id: account.id,
        stripe_account_enabled: account.charges_enabled,
        stripe_account_requirements: account.requirements,
        stripe_account_created_at: new Date().toISOString(),
      })
      .eq("id", restaurant.id);

    if (updateError) {
      console.error("Error updating restaurant with Stripe account ID:", {
        restaurantId: restaurant.id,
        accountId: account.id,
        error: updateError,
      });
      throw new Error("Failed to update restaurant with Stripe account ID");
    }

    console.log("Successfully updated restaurant with Stripe account ID:", {
      restaurantId: restaurant.id,
      accountId: account.id,
    });

    // Create an account link for onboarding with up-front collection
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/setup/connect`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/setup/connect?success=true`,
      type: "account_onboarding",
      collection_options: {
        fields: "eventually_due", // Collect all required info upfront
      },
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

    // Update restaurant with current account status
    await supabase
      .from("restaurants")
      .update({
        stripe_account_enabled: account.charges_enabled,
        stripe_account_requirements: account.requirements,
      })
      .eq("id", restaurantId);

    // Check if account is fully verified and ready
    const isFullyVerified =
      account.charges_enabled &&
      account.details_submitted &&
      (!account.requirements?.currently_due ||
        Object.keys(account.requirements.currently_due).length === 0);

    return {
      status: isFullyVerified ? "active" : "pending",
      requirements: account.requirements,
      chargesEnabled: account.charges_enabled,
      detailsSubmitted: account.details_submitted,
    };
  } catch (error) {
    console.error("Error retrieving Stripe account:", error);
    return { error: "Failed to get Stripe account status" };
  }
}

export async function createAccountUpdateLink(restaurantId: string) {
  const supabase = createClient();

  const { data: restaurant, error } = await supabase
    .from("restaurants")
    .select("stripe_account_id")
    .eq("id", restaurantId)
    .single();

  if (error || !restaurant || !restaurant.stripe_account_id) {
    return { error: "Restaurant or Stripe account not found" };
  }

  try {
    const accountLink = await stripe.accountLinks.create({
      account: restaurant.stripe_account_id,
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/payments`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/payments?updated=true`,
      type: "account_update",
    });

    return { accountLink: accountLink.url };
  } catch (error) {
    console.error("Error creating account update link:", error);
    return { error: "Failed to create update link" };
  }
}

export async function refreshAccountStatus(restaurantId: string) {
  const supabase = createClient();

  const { data: restaurant, error } = await supabase
    .from("restaurants")
    .select("stripe_account_id")
    .eq("id", restaurantId)
    .single();

  if (error || !restaurant || !restaurant.stripe_account_id) {
    return { error: "Restaurant or Stripe account not found" };
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
        updated_at: new Date().toISOString(),
      })
      .eq("id", restaurantId);

    return {
      success: true,
      chargesEnabled: account.charges_enabled,
      detailsSubmitted: account.details_submitted,
      requirements: account.requirements,
    };
  } catch (error) {
    console.error("Error refreshing account status:", error);
    return { error: "Failed to refresh account status" };
  }
}
