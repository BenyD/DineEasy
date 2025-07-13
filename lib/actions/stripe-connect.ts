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
      console.log(
        "Restaurant already has Stripe account, creating onboarding link:",
        {
          restaurantId: restaurant.id,
          accountId: restaurant.stripe_account_id,
        }
      );

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
    // Note: Stripe Connect has geographic restrictions
    // A Swiss platform can only create accounts for certain countries
    const supportedCountries = ["CH", "US", "EU", "GB", "AU"]; // Remove IN (India)
    const restaurantCountry = restaurant.country || "CH";

    if (!supportedCountries.includes(restaurantCountry)) {
      console.error(
        "Unsupported country for Stripe Connect:",
        restaurantCountry
      );
      return {
        error: `Stripe Connect is not available for businesses in ${restaurantCountry}. Please contact support for alternative payment solutions.`,
      };
    }

    // Validate required fields
    if (!restaurant.name || !user.email) {
      return {
        error:
          "Restaurant name and email are required to create a Stripe account.",
      };
    }

    console.log("Creating Stripe Connect account for restaurant:", {
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      country: restaurantCountry,
      email: user.email,
    });

    const account = await stripe.accounts.create({
      type: "express", // Could be "express" for simpler onboarding
      country: restaurantCountry as string,
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

    // Update restaurant with Stripe Connect account ID using the dedicated function
    console.log("Updating restaurant with Stripe account ID:", account.id);

    const { error: updateError } = await supabase.rpc(
      "update_stripe_connect_status",
      {
        p_restaurant_id: restaurant.id,
        p_stripe_account_id: account.id,
        p_charges_enabled: account.charges_enabled,
        p_requirements: account.requirements,
      }
    );

    if (updateError) {
      console.error("Error updating restaurant with Stripe account ID:", {
        restaurantId: restaurant.id,
        accountId: account.id,
        error: updateError,
      });

      // Try to clean up the created account if database update fails
      try {
        await stripe.accounts.del(account.id);
        console.log(
          "Cleaned up Stripe account after database update failure:",
          account.id
        );
      } catch (cleanupError) {
        console.error("Failed to clean up Stripe account:", cleanupError);
      }

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
  } catch (error: any) {
    console.error("Error creating Stripe account:", error);

    // Handle specific Stripe errors
    if (error.type === "StripeInvalidRequestError") {
      if (error.code === "parameter_invalid_country") {
        return {
          error: "The selected country is not supported for Stripe Connect.",
        };
      }
      if (error.code === "parameter_invalid_email") {
        return { error: "Please provide a valid email address." };
      }
      if (error.message?.includes("capabilities")) {
        return {
          error:
            "Stripe Connect capabilities are not properly configured. Please contact support.",
        };
      }
    }

    if (error.type === "StripePermissionError") {
      return {
        error:
          "You don't have permission to create Stripe Connect accounts. Please contact support.",
      };
    }

    if (error.type === "StripeRateLimitError") {
      return { error: "Too many requests. Please try again in a few minutes." };
    }

    return {
      error:
        "Failed to create Stripe account. Please try again or contact support.",
    };
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

    // Update restaurant with current account status using the dedicated function
    const { error: updateError } = await supabase.rpc(
      "update_stripe_connect_status",
      {
        p_restaurant_id: restaurantId,
        p_stripe_account_id: restaurant.stripe_account_id,
        p_charges_enabled: account.charges_enabled,
        p_requirements: account.requirements,
      }
    );

    if (updateError) {
      console.error("Error updating restaurant Stripe status:", updateError);
      // Don't fail the function, just log the error
    }

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
  } catch (error: any) {
    console.error("Error retrieving Stripe account:", error);

    // Handle specific Stripe errors
    if (error.type === "StripeInvalidRequestError") {
      if (error.code === "resource_missing") {
        // Account doesn't exist, clean up the database
        try {
          await supabase.rpc("update_stripe_connect_status", {
            p_restaurant_id: restaurantId,
            p_stripe_account_id: null,
            p_charges_enabled: false,
            p_requirements: null,
          });
          return { status: "not_connected", error: "Stripe account not found" };
        } catch (cleanupError) {
          console.error(
            "Error cleaning up invalid Stripe account:",
            cleanupError
          );
        }
      }
    }

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

export async function createStripeDashboardLink(restaurantId: string) {
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
    // Create a login link for the specific Stripe Connect account
    const loginLink = await stripe.accounts.createLoginLink(
      restaurant.stripe_account_id
    );

    return { dashboardUrl: loginLink.url };
  } catch (error) {
    console.error("Error creating Stripe dashboard link:", error);
    return { error: "Failed to create dashboard link" };
  }
}

export async function getStripeAccountRequirements(restaurantId: string) {
  const supabase = createClient();

  const { data: restaurant, error } = await supabase
    .from("restaurants")
    .select("stripe_account_id, stripe_account_requirements")
    .eq("id", restaurantId)
    .single();

  if (error || !restaurant || !restaurant.stripe_account_id) {
    return { error: "Restaurant or Stripe account not found" };
  }

  try {
    const account = await stripe.accounts.retrieve(
      restaurant.stripe_account_id
    );

    return {
      requirements: account.requirements,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
      currentlyDue: account.requirements?.currently_due || [],
      eventuallyDue: account.requirements?.eventually_due || [],
      pastDue: account.requirements?.past_due || [],
    };
  } catch (error) {
    console.error("Error retrieving Stripe account requirements:", error);
    return { error: "Failed to get account requirements" };
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

    await supabase.rpc("update_stripe_connect_status", {
      p_restaurant_id: restaurantId,
      p_stripe_account_id: restaurant.stripe_account_id,
      p_charges_enabled: account.charges_enabled,
      p_requirements: account.requirements,
    });

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
