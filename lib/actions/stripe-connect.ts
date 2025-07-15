"use server";

import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
import { redirect } from "next/navigation";
import { COUNTRY_OPTIONS } from "@/lib/constants/countries";

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
        refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/setup/connect?refresh=true`,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/setup/connect?success=true&account_id=${restaurant.stripe_account_id}`,
        type: "account_onboarding",
        // Express accounts have a streamlined onboarding flow
        // No need for up-front collection - Stripe handles this
      });
      return { accountLink: accountLink.url };
    }

    // Create a new Stripe Connect account
    // Note: Stripe Connect has geographic restrictions
    // Check if the restaurant's country supports Stripe Connect Express accounts
    const restaurantCountry = restaurant.country || "CH";
    const countryOption = COUNTRY_OPTIONS.find(
      (option) => option.value === restaurantCountry
    );

    if (!countryOption || !countryOption.stripeConnect) {
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
      type: "express",
      country: restaurantCountry as string,
      email: user.email,
      business_type: "company",
      company: {
        name: restaurant.name,
      },
      // Express-specific capabilities - only request what we need
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      // Express accounts handle most business info through onboarding
      // Don't prefill too much - let Stripe's Express flow handle it
      metadata: {
        restaurantId: restaurant.id,
        restaurantName: restaurant.name,
        ownerEmail: user.email,
        accountType: "express",
      },
    });

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

    // Create an account link for Express onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/setup/connect?refresh=true`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/setup/connect?success=true&account_id=${account.id}`,
      type: "account_onboarding",
      // Express accounts have a streamlined onboarding flow
      // No need for up-front collection - Stripe handles this
    });

    return { accountLink: accountLink.url };
  } catch (error: any) {
    console.error("Error creating Stripe account:", error);

    // Handle specific Stripe errors with detailed messages for Express accounts
    if (error.type === "StripeInvalidRequestError") {
      if (error.code === "parameter_invalid_country") {
        return {
          error:
            "The selected country is not supported for Stripe Connect Express accounts.",
        };
      }
      if (error.code === "parameter_invalid_email") {
        return { error: "Please provide a valid email address." };
      }
      if (error.code === "parameter_invalid_business_type") {
        return {
          error:
            "Invalid business type for Express account. Please contact support.",
        };
      }
      if (error.message?.includes("capabilities")) {
        return {
          error:
            "Stripe Connect Express capabilities are not properly configured. Please contact support.",
        };
      }
      if (error.code === "parameter_invalid_company") {
        return {
          error:
            "Invalid company information. Please check your business details.",
        };
      }
      // Express-specific error codes
      if (error.code === "parameter_invalid_type") {
        return {
          error:
            "Invalid account type. Express accounts are required for this integration.",
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

    if (error.type === "StripeCardError") {
      return { error: "Payment method error. Please try again." };
    }

    if (error.type === "StripeAuthenticationError") {
      return { error: "Authentication error. Please contact support." };
    }

    // Handle network or unexpected errors
    if (error.code === "ECONNRESET" || error.code === "ENOTFOUND") {
      return {
        error: "Network error. Please check your connection and try again.",
      };
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

    // Enhanced status checking for Express accounts
    // Express accounts have simpler requirements than Standard accounts
    const isFullyVerified =
      account.charges_enabled &&
      account.details_submitted &&
      (!account.requirements?.currently_due ||
        Object.keys(account.requirements.currently_due).length === 0);

    const hasPendingRequirements =
      account.requirements?.currently_due &&
      Object.keys(account.requirements.currently_due).length > 0;

    // Express accounts typically don't have eventually_due requirements
    // They're either ready to accept payments or have current requirements
    const hasFutureRequirements = false; // Express accounts don't typically have future requirements

    let status: "not_connected" | "pending" | "active" = "pending";

    if (isFullyVerified) {
      status = "active";
    } else if (account.details_submitted && !hasPendingRequirements) {
      status = "pending"; // Account submitted but waiting for Stripe review
    } else {
      status = "pending"; // Account not fully submitted
    }

    return {
      status,
      requirements: account.requirements,
      chargesEnabled: account.charges_enabled,
      detailsSubmitted: account.details_submitted,
      hasPendingRequirements,
      hasFutureRequirements,
      isFullyVerified,
    };
  } catch (error: any) {
    console.error("Error retrieving Stripe account:", error);

    // Handle specific Stripe errors
    if (error.type === "StripeInvalidRequestError") {
      if (error.code === "resource_missing") {
        // Account doesn't exist, clear the stored account ID
        await supabase.rpc("update_stripe_connect_status", {
          p_restaurant_id: restaurantId,
          p_stripe_account_id: null,
          p_charges_enabled: false,
          p_requirements: null,
        });
        return { status: "not_connected" };
      }
    }

    return { error: "Failed to retrieve account status" };
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
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/payments?refresh=true`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/payments?updated=true&account_id=${restaurant.stripe_account_id}`,
      type: "account_update",
    });

    return { accountLink: accountLink.url };
  } catch (error: any) {
    console.error("Error creating account update link:", error);

    // Handle specific Stripe errors
    if (error.type === "StripeInvalidRequestError") {
      if (error.code === "resource_missing") {
        return {
          error: "Stripe account not found. Please reconnect your account.",
        };
      }
    }

    if (error.type === "StripePermissionError") {
      return { error: "Permission denied. Please contact support." };
    }

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

    const requirements = account.requirements;
    if (!requirements) {
      return { requirements: null, message: "No requirements found" };
    }

    // Format requirements for Express accounts (simpler than Standard)
    const formattedRequirements = {
      currently_due: requirements.currently_due || {},
      past_due: requirements.past_due || {},
      disabled_reason: requirements.disabled_reason,
      errors: requirements.errors || [],
      // Express accounts typically don't have eventually_due requirements
      eventually_due: {},
    };

    // Generate user-friendly messages for Express accounts
    const messages = [];

    if (Object.keys(formattedRequirements.currently_due).length > 0) {
      messages.push(
        "Please complete the required information to start accepting payments."
      );
    }

    if (Object.keys(formattedRequirements.past_due).length > 0) {
      messages.push(
        "Some required information is overdue. Please complete it immediately."
      );
    }

    if (formattedRequirements.disabled_reason) {
      messages.push(
        `Account disabled: ${formattedRequirements.disabled_reason}`
      );
    }

    // Express accounts are typically simpler - provide encouraging messages
    if (messages.length === 0 && account.details_submitted) {
      messages.push(
        "Your account is being reviewed by Stripe. This usually takes 1-2 business days."
      );
    }

    return {
      requirements: formattedRequirements,
      messages,
      chargesEnabled: account.charges_enabled,
      detailsSubmitted: account.details_submitted,
    };
  } catch (error) {
    console.error("Error retrieving Stripe account requirements:", error);
    return { error: "Failed to retrieve account requirements" };
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
