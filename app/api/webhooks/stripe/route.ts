import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { constructWebhookEvent, stripe } from "@/lib/stripe";
import {
  sendInvoiceReceipt,
  sendSubscriptionCancellationEmail,
  sendRefundNotificationEmail,
} from "@/lib/email";
import type { Stripe } from "stripe";

// Define types for database function responses
interface Restaurant {
  id: string;
  owner_id: string;
  name: string;
  email: string;
  subscription_status: string | null;
  stripe_customer_id: string | null;
}

interface StripeAccountRestaurant {
  id: string;
  owner_id: string;
  name: string;
  email: string;
  stripe_account_id: string;
  stripe_account_enabled: boolean;
}

// Get the webhook secret
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

if (!webhookSecret) {
  throw new Error("Stripe webhook secret is not set");
}

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get("stripe-signature");

  if (!signature) {
    console.error("Webhook signature missing");
    return new NextResponse("No signature", { status: 400 });
  }

  try {
    // Pass the environment-specific webhook secret
    const event = await constructWebhookEvent(
      body,
      signature,
      webhookSecret as string
    );
    const supabase = createClient();
    const adminSupabase = createAdminClient();

    // Enhanced logging with structured data
    console.log("Processing webhook event:", {
      type: event.type,
      id: event.id,
      created: new Date(event.created * 1000).toISOString(),
      livemode: event.livemode,
    });

    // Helper function to check if a customer has active subscriptions
    const hasActiveSubscriptions = async (
      customerId: string
    ): Promise<boolean> => {
      try {
        const subscriptions = await stripe.subscriptions.list({
          customer: customerId,
          status: "active",
          limit: 1,
        });
        return subscriptions.data.length > 0;
      } catch (error) {
        console.error("Error checking subscriptions:", error);
        return false;
      }
    };

    // Helper function for safe database operations with retry
    const safeDatabaseOperation = async <T>(
      operation: () => Promise<T>,
      operationName: string,
      maxRetries: number = 3
    ): Promise<T> => {
      let lastError: Error;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          return await operation();
        } catch (error) {
          lastError = error as Error;
          console.error(`${operationName} attempt ${attempt} failed:`, error);

          if (attempt < maxRetries) {
            // Wait before retry with exponential backoff
            await new Promise((resolve) =>
              setTimeout(resolve, Math.pow(2, attempt) * 1000)
            );
          }
        }
      }

      throw lastError!;
    };

    switch (event.type) {
      case "account.updated": {
        const account = event.data.object as Stripe.Account;

        console.log("Processing account.updated event:", {
          accountId: account.id,
          chargesEnabled: account.charges_enabled,
          payoutsEnabled: account.payouts_enabled,
          detailsSubmitted: account.details_submitted,
          requirements: account.requirements,
        });

        // Find restaurant by Stripe account ID using the new function
        const { data: restaurant, error: fetchError } = await adminSupabase
          .rpc("get_restaurant_by_stripe_account", {
            p_stripe_account_id: account.id,
          })
          .single();

        if (fetchError || !restaurant) {
          console.error("No restaurant found for Stripe account:", account.id);

          // Try to find restaurant by searching all restaurants with this account ID
          // This is a fallback in case the function doesn't work
          const { data: fallbackRestaurant, error: fallbackError } =
            await adminSupabase
              .from("restaurants")
              .select(
                "id, owner_id, name, email, stripe_account_id, stripe_account_enabled"
              )
              .eq("stripe_account_id", account.id)
              .single();

          if (fallbackError || !fallbackRestaurant) {
            console.error(
              "Fallback search also failed for Stripe account:",
              account.id
            );

            // Log all restaurants with stripe_account_id for debugging
            const { data: allRestaurants } = await adminSupabase
              .from("restaurants")
              .select("id, name, stripe_account_id")
              .not("stripe_account_id", "is", null);

            console.log(
              "All restaurants with stripe_account_id:",
              allRestaurants
            );

            return new NextResponse("No restaurant found for account", {
              status: 404,
            });
          }

          console.log(
            "Found restaurant via fallback search:",
            fallbackRestaurant
          );
          const stripeRestaurant =
            fallbackRestaurant as StripeAccountRestaurant;

          // Update restaurant with new account status using the new function
          const { error: updateError } = await adminSupabase.rpc(
            "update_stripe_connect_status",
            {
              p_restaurant_id: stripeRestaurant.id,
              p_stripe_account_id: account.id,
              p_charges_enabled: account.charges_enabled,
              p_requirements: account.requirements,
            }
          );

          if (updateError) {
            console.error("Error updating restaurant Stripe account:", {
              restaurantId: stripeRestaurant.id,
              accountId: account.id,
              error: updateError,
            });
            return new NextResponse("Error updating restaurant", {
              status: 500,
            });
          }

          console.log(
            "Successfully updated restaurant Stripe account via fallback:",
            {
              restaurantId: stripeRestaurant.id,
              accountId: account.id,
              chargesEnabled: account.charges_enabled,
              payoutsEnabled: account.payouts_enabled,
            }
          );

          break;
        }

        const stripeRestaurant = restaurant as StripeAccountRestaurant;

        // Update restaurant with new account status using the new function
        const { error: updateError } = await adminSupabase.rpc(
          "update_stripe_connect_status",
          {
            p_restaurant_id: stripeRestaurant.id,
            p_stripe_account_id: account.id,
            p_charges_enabled: account.charges_enabled,
            p_requirements: account.requirements,
          }
        );

        if (updateError) {
          console.error("Error updating restaurant Stripe account:", {
            restaurantId: stripeRestaurant.id,
            accountId: account.id,
            error: updateError,
          });
          return new NextResponse("Error updating restaurant", { status: 500 });
        }

        console.log("Successfully updated restaurant Stripe account:", {
          restaurantId: stripeRestaurant.id,
          accountId: account.id,
          chargesEnabled: account.charges_enabled,
          payoutsEnabled: account.payouts_enabled,
          detailsSubmitted: account.details_submitted,
        });

        break;
      }

      case "account.application.deauthorized": {
        const application = event.data.object as Stripe.Application;

        console.log("Processing account.application.deauthorized event:", {
          applicationId: application.id,
        });

        // For deauthorization, we need to find restaurants by searching for the account ID
        // The application object doesn't contain the account ID directly
        // We'll need to handle this differently - either by storing the application ID
        // or by handling this event differently

        console.log(
          "Account deauthorization detected. Manual intervention may be required."
        );

        // For now, we'll log this event but not take action
        // In a production environment, you might want to:
        // 1. Store application IDs in the database
        // 2. Use a different webhook event
        // 3. Handle this through Stripe dashboard notifications

        break;
      }

      case "customer.updated": {
        const customer = event.data.object as Stripe.Customer;

        console.log("Processing customer.updated event:", {
          customerId: customer.id,
          email: customer.email,
          metadata: customer.metadata,
        });

        // Update restaurant with new customer details if needed
        const { data, error: fetchError } = await adminSupabase
          .rpc("get_restaurant_by_stripe_customer", {
            p_stripe_customer_id: customer.id,
          })
          .single();

        if (fetchError) {
          console.error("Error fetching restaurant by stripe customer:", {
            customerId: customer.id,
            error: fetchError,
          });
          return new NextResponse(
            "Error fetching restaurant: " + fetchError.message,
            { status: 500 }
          );
        }

        if (!data) {
          console.error(
            "No restaurant found for stripe customer:",
            customer.id
          );
          return new NextResponse("No restaurant found for customer", {
            status: 404,
          });
        }

        const restaurant = data as Restaurant;

        // Update if email or name changed
        if (customer.email !== restaurant.email) {
          console.log("Updating restaurant email:", {
            restaurantId: restaurant.id,
            oldEmail: restaurant.email,
            newEmail: customer.email,
          });

          const { error: updateError } = await adminSupabase
            .from("restaurants")
            .update({
              email: customer.email,
              updated_at: new Date().toISOString(),
            })
            .eq("id", restaurant.id);

          if (updateError) {
            console.error("Error updating restaurant email:", {
              restaurantId: restaurant.id,
              error: updateError,
            });
            return new NextResponse(
              "Error updating restaurant: " + updateError.message,
              {
                status: 500,
              }
            );
          }
        }

        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;

        // Log the full subscription object for debugging
        console.log("Processing subscription event:", {
          type: event.type,
          id: subscription.id,
          metadata: subscription.metadata,
          customer: subscription.customer,
          status: subscription.status,
        });

        // Log the full event for debugging
        console.log(
          "Full subscription event data:",
          JSON.stringify(event.data.object, null, 2)
        );

        const { restaurantId, plan, interval, currency } =
          subscription.metadata;

        // More detailed validation
        if (!restaurantId) {
          console.error(
            "Missing restaurantId in subscription metadata:",
            subscription.id
          );
          return new NextResponse("Missing restaurantId in metadata", {
            status: 400,
          });
        }

        if (!plan) {
          console.error(
            "Missing plan in subscription metadata:",
            subscription.id
          );
          return new NextResponse("Missing plan in metadata", { status: 400 });
        }

        if (!interval) {
          console.error(
            "Missing interval in subscription metadata:",
            subscription.id
          );
          return new NextResponse("Missing interval in metadata", {
            status: 400,
          });
        }

        // Helper function to safely convert Unix timestamp to ISO string
        const toISOString = (timestamp: number | null): string | null => {
          if (!timestamp) return null;
          try {
            return new Date(timestamp * 1000).toISOString();
          } catch (error) {
            console.error("Invalid timestamp:", timestamp);
            return null;
          }
        };

        // Helper function to get current time as fallback
        const getCurrentTime = (): string => {
          return new Date().toISOString();
        };

        // First, verify the restaurant exists
        const { data, error: restaurantError } = await adminSupabase
          .rpc("get_restaurant_by_id", {
            p_restaurant_id: restaurantId,
          })
          .single();

        const restaurant = data as Restaurant;

        if (restaurantError || !restaurant) {
          console.error("Restaurant not found:", {
            restaurantId,
            error: restaurantError,
          });
          return new NextResponse("Restaurant not found", { status: 404 });
        }

        // Update restaurant subscription status
        const { error: updateError } = await adminSupabase.rpc(
          "update_restaurant_subscription_status",
          {
            p_restaurant_id: restaurantId,
            p_subscription_status: subscription.status,
          }
        );

        if (updateError) {
          console.error("Error updating restaurant:", {
            restaurantId,
            error: updateError,
          });
          return new NextResponse("Error updating restaurant", { status: 500 });
        }

        console.log("Upserting subscription:", {
          id: subscription.id,
          restaurantId,
          status: subscription.status,
          current_period_start: (subscription as any).current_period_start,
          current_period_end: (subscription as any).current_period_end,
          trial_start: (subscription as any).trial_start,
          trial_end: (subscription as any).trial_end,
          metadata: subscription.metadata,
        });

        // Log the raw subscription object to debug timestamp issues
        console.log("Raw subscription object:", {
          id: subscription.id,
          current_period_start: (subscription as any).current_period_start,
          current_period_end: (subscription as any).current_period_end,
          trial_start: (subscription as any).trial_start,
          trial_end: (subscription as any).trial_end,
          cancel_at: (subscription as any).cancel_at,
          canceled_at: (subscription as any).canceled_at,
        });

        // Convert timestamps and handle trial subscriptions
        let currentPeriodStart = toISOString(
          (subscription as any).current_period_start
        );
        let currentPeriodEnd = toISOString(
          (subscription as any).current_period_end
        );
        const trialStart = toISOString((subscription as any).trial_start);
        const trialEnd = toISOString((subscription as any).trial_end);
        const cancelAt = toISOString((subscription as any).cancel_at);
        const canceledAt = toISOString((subscription as any).canceled_at);

        // For trial subscriptions, use trial timestamps as fallbacks for current period
        if (subscription.status === "trialing") {
          if (!currentPeriodStart && trialStart) {
            currentPeriodStart = trialStart;
          }
          if (!currentPeriodEnd && trialEnd) {
            currentPeriodEnd = trialEnd;
          }
        }

        // Ensure we have valid timestamps for the database constraint
        if (!currentPeriodStart) {
          currentPeriodStart = getCurrentTime();
        }
        if (!currentPeriodEnd) {
          // Set to 30 days from now as a reasonable fallback
          const fallbackEnd = new Date();
          fallbackEnd.setDate(fallbackEnd.getDate() + 30);
          currentPeriodEnd = fallbackEnd.toISOString();
        }

        console.log("Converted timestamps:", {
          current_period_start: currentPeriodStart,
          current_period_end: currentPeriodEnd,
          trial_start: trialStart,
          trial_end: trialEnd,
          cancel_at: cancelAt,
          canceled_at: canceledAt,
        });

        // Log the final subscription status being saved
        console.log("Saving subscription with status:", {
          stripe_subscription_id: subscription.id,
          status: subscription.status,
          is_trial: subscription.status === "trialing",
          trial_start: trialStart,
          trial_end: trialEnd,
          plan: plan,
          interval: interval,
          is_upgrade: subscription.metadata.isUpgrade === "true",
          is_trial_upgrade: subscription.metadata.isTrialUpgrade === "true",
          trial_preserved: subscription.metadata.trial_preserved === "true",
          original_trial_end: subscription.metadata.original_trial_end,
        });

        // Enhanced metadata for trial upgrades
        let enhancedMetadata = subscription.metadata || {};

        // If this is a trial upgrade, ensure we preserve the original trial end
        if (
          subscription.metadata.isTrialUpgrade === "true" &&
          subscription.metadata.original_trial_end
        ) {
          enhancedMetadata = {
            ...enhancedMetadata,
            trial_preserved: "true",
            original_trial_end: subscription.metadata.original_trial_end,
          };

          console.log("Enhanced metadata for trial upgrade:", {
            original_trial_end: subscription.metadata.original_trial_end,
            trial_preserved: "true",
            enhanced_metadata: enhancedMetadata,
          });
        }

        // Use the new upsert function for better error handling
        const { error: upsertError } = await adminSupabase.rpc(
          "upsert_subscription",
          {
            p_stripe_subscription_id: subscription.id,
            p_restaurant_id: restaurantId,
            p_plan: plan,
            p_interval: interval,
            p_status: subscription.status,
            p_stripe_customer_id: subscription.customer as string,
            p_stripe_price_id: subscription.items.data[0]?.price?.id || null,
            p_current_period_start: currentPeriodStart,
            p_current_period_end: currentPeriodEnd,
            p_trial_start: trialStart,
            p_trial_end: trialEnd,
            p_cancel_at: cancelAt,
            p_canceled_at: canceledAt,
            p_metadata: enhancedMetadata,
          }
        );

        if (upsertError) {
          console.error("Error upserting subscription:", {
            id: subscription.id,
            error: upsertError.message,
          });
          return new NextResponse(
            "Error upserting subscription: " + upsertError.message,
            {
              status: 500,
            }
          );
        }

        console.log("Successfully processed subscription:", {
          id: subscription.id,
          status: subscription.status,
          restaurantId,
          plan,
          interval,
          currency,
        });

        // If this is an upgrade, mark the old subscription as an upgrade before it gets deleted
        if (
          subscription.metadata.isUpgrade === "true" &&
          subscription.metadata.existingSubscriptionId
        ) {
          try {
            console.log(
              "Marking old subscription as upgrade:",
              subscription.metadata.existingSubscriptionId
            );

            // Update the old subscription metadata to mark it as an upgrade
            await stripe.subscriptions.update(
              subscription.metadata.existingSubscriptionId,
              {
                metadata: {
                  ...subscription.metadata,
                  isUpgrade: "true",
                  upgradedTo: subscription.id,
                  upgradedAt: new Date().toISOString(),
                },
              }
            );

            console.log("Successfully marked old subscription as upgrade");
          } catch (error) {
            console.error("Error marking old subscription as upgrade:", error);
            // Don't fail the webhook for this
          }
        }

        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const { restaurantId, isUpgrade } = subscription.metadata;

        if (!restaurantId) {
          console.error(
            "Missing restaurantId in subscription:",
            subscription.id
          );
          return new NextResponse("Missing restaurantId", { status: 400 });
        }

        // Check if this is part of a plan upgrade (new subscription exists)
        // Look for any active subscription for this restaurant that's different from the deleted one
        const { data: newSubscription } = await adminSupabase
          .from("subscriptions")
          .select("id, stripe_subscription_id, status")
          .eq("restaurant_id", restaurantId)
          .neq("stripe_subscription_id", subscription.id) // Different from the deleted one
          .in("status", ["active", "trialing", "past_due"])
          .single();

        // Check if this is marked as an upgrade in metadata
        const isMarkedAsUpgrade =
          isUpgrade === "true" || subscription.metadata.isUpgrade === "true";

        // Only update restaurant status to cancelled if this is not part of an upgrade
        if (!newSubscription && !isMarkedAsUpgrade) {
          // Update restaurant subscription status
          const { error: updateError } = await adminSupabase.rpc(
            "update_restaurant_subscription_status",
            {
              p_restaurant_id: restaurantId,
              p_subscription_status: "canceled",
            }
          );

          if (updateError) {
            console.error("Error updating restaurant:", updateError);
            return new NextResponse("Error updating restaurant", {
              status: 500,
            });
          }
        } else {
          console.log(
            "Skipping restaurant status update - this appears to be a plan upgrade",
            {
              hasNewSubscription: !!newSubscription,
              isMarkedAsUpgrade,
              deletedSubscriptionId: subscription.id,
              newSubscriptionId: newSubscription?.stripe_subscription_id,
            }
          );
        }

        // Update subscription record using the correct column
        const { error: upsertError } = await adminSupabase
          .from("subscriptions")
          .update({
            status: subscription.status,
            cancel_at: subscription.cancel_at
              ? new Date(subscription.cancel_at * 1000).toISOString()
              : null,
            canceled_at: subscription.canceled_at
              ? new Date(subscription.canceled_at * 1000).toISOString()
              : null,
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subscription.id); // Use the Stripe subscription ID

        if (upsertError) {
          console.error("Error updating subscription:", upsertError);
          return new NextResponse("Error updating subscription", {
            status: 500,
          });
        }

        // Send cancellation email notification only if this is not a plan upgrade
        if (!newSubscription && !isMarkedAsUpgrade) {
          try {
            // Get restaurant details for email
            const { data: restaurant, error: restaurantError } =
              await adminSupabase
                .from("restaurants")
                .select("name, email")
                .eq("id", restaurantId)
                .single();

            if (!restaurantError && restaurant) {
              const plan = subscription.metadata.plan || "Unknown Plan";
              const interval = subscription.metadata.interval || "monthly";
              const cancelDate = subscription.canceled_at
                ? new Date(subscription.canceled_at * 1000).toLocaleDateString()
                : new Date().toLocaleDateString();
              const endDate = (subscription as any).current_period_end
                ? new Date(
                    (subscription as any).current_period_end * 1000
                  ).toLocaleDateString()
                : "Immediately";

              await sendSubscriptionCancellationEmail(restaurant.email, {
                subscriptionId: subscription.id,
                plan: plan,
                interval: interval,
                cancelDate: cancelDate,
                endDate: endDate,
                restaurantName: restaurant.name,
                reason: subscription.cancellation_details?.reason || undefined,
              });

              console.log(
                "Subscription cancellation email sent to:",
                restaurant.email
              );
            }
          } catch (emailError) {
            console.error("Error sending cancellation email:", emailError);
            // Don't fail the webhook for email errors
          }
        } else {
          console.log(
            "Skipping cancellation email - this appears to be a plan upgrade",
            {
              hasNewSubscription: !!newSubscription,
              isMarkedAsUpgrade,
              deletedSubscriptionId: subscription.id,
            }
          );
        }

        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        console.log("Processing payment_intent.succeeded:", {
          id: paymentIntent.id,
          amount: paymentIntent.amount,
          metadata: paymentIntent.metadata,
        });

        // Try to get restaurant ID from metadata first, then from customer
        let restaurantId = paymentIntent.metadata.restaurantId;

        if (!restaurantId && paymentIntent.customer) {
          // Try to get restaurant ID from customer
          const { data: restaurant, error: customerError } = await adminSupabase
            .rpc("get_restaurant_by_stripe_customer", {
              p_stripe_customer_id: paymentIntent.customer as string,
            })
            .single();

          if (!customerError && restaurant) {
            restaurantId = (restaurant as Restaurant).id;
            console.log("Found restaurant ID from customer:", restaurantId);
          }
        }

        // For subscription payments, we don't need to create a payment record
        // since they're handled by the subscription events
        if (
          paymentIntent.metadata.subscriptionId ||
          paymentIntent.metadata.isUpgrade ||
          paymentIntent.metadata.isNewSubscription ||
          paymentIntent.metadata.subscription_id ||
          // Check if the customer has active subscriptions
          (paymentIntent.customer &&
            (await hasActiveSubscriptions(paymentIntent.customer as string)))
        ) {
          console.log(
            "Skipping payment record creation for subscription payment:",
            paymentIntent.id,
            "metadata:",
            paymentIntent.metadata
          );
          break;
        }

        // Use the new function to create payment with fallback
        const { error: createError } = await adminSupabase.rpc(
          "create_payment_with_fallback",
          [
            restaurantId,
            paymentIntent.metadata.orderId,
            paymentIntent.amount / 100, // Convert from cents
            "completed",
            "card",
            paymentIntent.id,
            paymentIntent.currency.toUpperCase(),
          ]
        );

        if (createError) {
          console.error("Error creating payment:", createError);
          return new NextResponse("Error creating payment", { status: 500 });
        }

        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        console.log("Processing payment_intent.payment_failed:", {
          id: paymentIntent.id,
          amount: paymentIntent.amount,
          metadata: paymentIntent.metadata,
        });

        // Try to get restaurant ID from metadata first, then from customer
        let restaurantId = paymentIntent.metadata.restaurantId;

        if (!restaurantId && paymentIntent.customer) {
          // Try to get restaurant ID from customer
          const { data: restaurant, error: customerError } = await adminSupabase
            .rpc("get_restaurant_by_stripe_customer", {
              p_stripe_customer_id: paymentIntent.customer as string,
            })
            .single();

          if (!customerError && restaurant) {
            restaurantId = (restaurant as Restaurant).id;
            console.log("Found restaurant ID from customer:", restaurantId);
          }
        }

        // For subscription payments, we don't need to create a payment record
        // since they're handled by the subscription events
        if (
          paymentIntent.metadata.subscriptionId ||
          paymentIntent.metadata.isUpgrade ||
          paymentIntent.metadata.isNewSubscription ||
          paymentIntent.metadata.subscription_id ||
          // Check if the customer has active subscriptions
          (paymentIntent.customer &&
            (await hasActiveSubscriptions(paymentIntent.customer as string)))
        ) {
          console.log(
            "Skipping payment record creation for subscription payment:",
            paymentIntent.id,
            "metadata:",
            paymentIntent.metadata
          );
          break;
        }

        // Use the new function to create payment with fallback
        const { error: createError } = await adminSupabase.rpc(
          "create_payment_with_fallback",
          [
            restaurantId,
            paymentIntent.metadata.orderId,
            paymentIntent.amount / 100, // Convert from cents
            "failed",
            "card",
            paymentIntent.id,
            paymentIntent.currency.toUpperCase(),
          ]
        );

        if (createError) {
          console.error("Error creating payment:", createError);
          return new NextResponse("Error creating payment", { status: 500 });
        }

        break;
      }

      case "charge.succeeded": {
        const charge = event.data.object as Stripe.Charge;

        console.log("Processing charge.succeeded:", {
          id: charge.id,
          amount: charge.amount,
          metadata: charge.metadata,
          transfer_group: charge.transfer_group,
        });

        // Only process charges that are customer payments to restaurants
        // Skip subscription-related charges
        if (
          charge.metadata.subscriptionId ||
          charge.metadata.isUpgrade ||
          charge.metadata.isNewSubscription ||
          charge.metadata.subscription_id ||
          // Check if the customer has active subscriptions
          (charge.customer &&
            (await hasActiveSubscriptions(charge.customer as string)))
        ) {
          console.log(
            "Skipping subscription charge:",
            charge.id,
            "metadata:",
            charge.metadata
          );
          break;
        }

        // Get restaurant ID from transfer_group or metadata
        let restaurantId =
          charge.transfer_group || charge.metadata.restaurantId;

        if (!restaurantId) {
          console.log("No restaurant ID found for charge:", charge.id);
          break;
        }

        // Create payment record for customer payment to restaurant
        const { error: createError } = await adminSupabase.rpc(
          "create_payment_with_fallback",
          [
            restaurantId,
            charge.metadata.orderId,
            charge.amount / 100, // Convert from cents
            "completed",
            "card",
            charge.id,
            charge.currency.toUpperCase(),
          ]
        );

        if (createError) {
          console.error("Error creating payment from charge:", createError);
          return new NextResponse("Error creating payment", { status: 500 });
        }

        console.log("Successfully created payment from charge:", charge.id);
        break;
      }

      case "charge.failed": {
        const charge = event.data.object as Stripe.Charge;

        console.log("Processing charge.failed:", {
          id: charge.id,
          amount: charge.amount,
          metadata: charge.metadata,
          transfer_group: charge.transfer_group,
        });

        // Only process charges that are customer payments to restaurants
        if (
          charge.metadata.subscriptionId ||
          charge.metadata.isUpgrade ||
          charge.metadata.isNewSubscription ||
          charge.metadata.subscription_id ||
          // Check if the customer has active subscriptions
          (charge.customer &&
            (await hasActiveSubscriptions(charge.customer as string)))
        ) {
          console.log(
            "Skipping subscription charge:",
            charge.id,
            "metadata:",
            charge.metadata
          );
          break;
        }

        // Get restaurant ID from transfer_group or metadata
        let restaurantId =
          charge.transfer_group || charge.metadata.restaurantId;

        if (!restaurantId) {
          console.log("No restaurant ID found for charge:", charge.id);
          break;
        }

        // Create failed payment record
        const { error: createError } = await adminSupabase.rpc(
          "create_payment_with_fallback",
          [
            restaurantId,
            charge.metadata.orderId,
            charge.amount / 100, // Convert from cents
            "failed",
            "card",
            charge.id,
            charge.currency.toUpperCase(),
          ]
        );

        if (createError) {
          console.error(
            "Error creating failed payment from charge:",
            createError
          );
          return new NextResponse("Error creating payment", { status: 500 });
        }

        console.log(
          "Successfully created failed payment from charge:",
          charge.id
        );
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;

        console.log("Processing charge.refunded:", {
          id: charge.id,
          amount: charge.amount,
          amount_refunded: charge.amount_refunded,
          metadata: charge.metadata,
          transfer_group: charge.transfer_group,
        });

        // Check if this is a subscription payment that was refunded
        if (
          charge.metadata.subscriptionId ||
          charge.metadata.isUpgrade ||
          charge.metadata.isNewSubscription
        ) {
          console.log("Processing subscription charge refund:", charge.id);

          // Get the subscription to update its status
          const subscriptionId = charge.metadata.subscriptionId;
          if (subscriptionId) {
            try {
              const subscription =
                await stripe.subscriptions.retrieve(subscriptionId);

              console.log("Retrieved subscription for refunded charge:", {
                subscriptionId: subscription.id,
                status: subscription.status,
                amountRefunded: charge.amount_refunded,
              });

              // Update subscription status if it was fully refunded
              if (subscription.metadata.restaurantId) {
                // Check if this was a full refund
                const isFullRefund = charge.amount_refunded === charge.amount;

                // Update subscription status based on refund type
                let newStatus = subscription.status;
                if (isFullRefund) {
                  // For full refunds, mark as canceled
                  newStatus = "canceled";
                }

                // First, update the restaurant subscription status
                const { error: restaurantUpdateError } =
                  await adminSupabase.rpc(
                    "update_restaurant_subscription_status",
                    {
                      p_restaurant_id: subscription.metadata.restaurantId,
                      p_subscription_status: newStatus,
                      p_stripe_customer_id: subscription.customer as string,
                    }
                  );

                if (restaurantUpdateError) {
                  console.error(
                    "Error updating restaurant subscription status after refund:",
                    restaurantUpdateError
                  );
                  return new NextResponse(
                    "Error updating restaurant subscription status",
                    {
                      status: 500,
                    }
                  );
                }

                // Then, update the subscription record
                const { error: updateError } = await adminSupabase.rpc(
                  "upsert_subscription",
                  {
                    p_stripe_subscription_id: subscription.id,
                    p_restaurant_id: subscription.metadata.restaurantId,
                    p_plan: subscription.metadata.plan,
                    p_interval: subscription.metadata.interval,
                    p_status: newStatus,
                    p_stripe_customer_id: subscription.customer as string,
                    p_stripe_price_id:
                      subscription.items.data[0]?.price?.id || null,
                    p_current_period_start: new Date(
                      (subscription as any).current_period_start * 1000
                    ).toISOString(),
                    p_current_period_end: new Date(
                      (subscription as any).current_period_end * 1000
                    ).toISOString(),
                    p_trial_start: (subscription as any).trial_start
                      ? new Date(
                          (subscription as any).trial_start * 1000
                        ).toISOString()
                      : null,
                    p_trial_end: (subscription as any).trial_end
                      ? new Date(
                          (subscription as any).trial_end * 1000
                        ).toISOString()
                      : null,
                    p_cancel_at: (subscription as any).cancel_at
                      ? new Date(
                          (subscription as any).cancel_at * 1000
                        ).toISOString()
                      : null,
                    p_canceled_at: (subscription as any).canceled_at
                      ? new Date(
                          (subscription as any).canceled_at * 1000
                        ).toISOString()
                      : null,
                    p_metadata: subscription.metadata || {},
                  }
                );

                if (updateError) {
                  console.error(
                    "Error updating subscription after refund:",
                    updateError
                  );
                  return new NextResponse("Error updating subscription", {
                    status: 500,
                  });
                }

                console.log("Successfully updated subscription after refund:", {
                  subscriptionId: subscription.id,
                  restaurantId: subscription.metadata.restaurantId,
                  newStatus: newStatus,
                  isFullRefund: isFullRefund,
                  amountRefunded: charge.amount_refunded,
                });

                // Send refund notification email only if this is not part of a plan upgrade
                // Check if there are other active subscriptions for this restaurant
                const { data: activeSubscriptions } = await adminSupabase
                  .from("subscriptions")
                  .select("id, status")
                  .eq("restaurant_id", subscription.metadata.restaurantId)
                  .neq("id", subscription.id) // Different from the refunded one
                  .in("status", ["active", "trialing", "past_due"]);

                const isPlanUpgrade =
                  activeSubscriptions && activeSubscriptions.length > 0;

                if (!isPlanUpgrade) {
                  try {
                    // Get restaurant details for email
                    const { data: restaurant, error: restaurantError } =
                      await adminSupabase
                        .from("restaurants")
                        .select("name, email")
                        .eq("id", subscription.metadata.restaurantId)
                        .single();

                    if (!restaurantError && restaurant) {
                      const refundReason =
                        charge.metadata.refundReason || "Customer request";
                      const refundDate = new Date().toLocaleDateString();
                      const plan = subscription.metadata.plan || "Unknown Plan";

                      await sendRefundNotificationEmail(restaurant.email, {
                        refundId: charge.refunds?.data?.[0]?.id || "unknown",
                        amount: charge.amount_refunded,
                        currency: charge.currency,
                        reason: refundReason,
                        date: refundDate,
                        restaurantName: restaurant.name,
                        subscriptionPlan: plan,
                        isFullRefund: isFullRefund,
                      });

                      console.log(
                        "Subscription refund email sent to:",
                        restaurant.email
                      );
                    }
                  } catch (emailError) {
                    console.error("Error sending refund email:", emailError);
                    // Don't fail the webhook for email errors
                  }
                } else {
                  console.log(
                    "Skipping subscription refund email - this appears to be part of a plan upgrade"
                  );
                }
              }
            } catch (error) {
              console.error("Error processing subscription refund:", error);
            }
          }
        } else {
          // Handle regular customer payment refunds (existing logic)
          console.log("Processing regular customer payment refund:", charge.id);

          // Get restaurant ID from transfer_group or metadata
          let restaurantId =
            charge.transfer_group || charge.metadata.restaurantId;

          if (!restaurantId) {
            console.log("No restaurant ID found for charge:", charge.id);
            break;
          }

          // Update existing payment to refunded status
          const { error: updateError } = await adminSupabase
            .from("payments")
            .update({
              status: "refunded",
              refund_id: charge.refunds?.data?.[0]?.id || null,
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_payment_id", charge.id);

          if (updateError) {
            console.error("Error updating payment to refunded:", updateError);
            return new NextResponse("Error updating payment", { status: 500 });
          }

          console.log("Successfully updated payment to refunded:", charge.id);

          // Send refund notification email for customer payments
          try {
            // Get restaurant details for email
            const { data: restaurant, error: restaurantError } =
              await adminSupabase
                .from("restaurants")
                .select("name, email")
                .eq("id", restaurantId)
                .single();

            if (!restaurantError && restaurant) {
              const refundReason =
                charge.metadata.refundReason || "Customer request";
              const refundDate = new Date().toLocaleDateString();
              const isFullRefund = charge.amount_refunded === charge.amount;

              await sendRefundNotificationEmail(restaurant.email, {
                refundId: charge.refunds?.data?.[0]?.id || "unknown",
                amount: charge.amount_refunded,
                currency: charge.currency,
                reason: refundReason,
                date: refundDate,
                restaurantName: restaurant.name,
                isFullRefund: isFullRefund,
              });

              console.log(
                "Customer payment refund email sent to:",
                restaurant.email
              );
            }
          } catch (emailError) {
            console.error("Error sending refund email:", emailError);
            // Don't fail the webhook for email errors
          }
        }

        break;
      }

      case "charge.dispute.created": {
        const dispute = event.data.object as Stripe.Dispute;

        console.log("Processing charge.dispute.created:", {
          id: dispute.id,
          charge: dispute.charge,
          amount: dispute.amount,
        });

        // Get the charge to find restaurant ID
        const charge = await stripe.charges.retrieve(dispute.charge as string);

        // Only process charges that are customer payments to restaurants
        if (
          charge.metadata.subscriptionId ||
          charge.metadata.isUpgrade ||
          charge.metadata.isNewSubscription
        ) {
          console.log("Skipping subscription charge:", charge.id);
          break;
        }

        // Get restaurant ID from transfer_group or metadata
        let restaurantId =
          charge.transfer_group || charge.metadata.restaurantId;

        if (!restaurantId) {
          console.log("No restaurant ID found for charge:", charge.id);
          break;
        }

        // Update existing payment to disputed status
        const { error: updateError } = await adminSupabase
          .from("payments")
          .update({
            status: "disputed",
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_payment_id", charge.id);

        if (updateError) {
          console.error("Error updating payment to disputed:", updateError);
          return new NextResponse("Error updating payment", { status: 500 });
        }

        console.log("Successfully updated payment to disputed:", charge.id);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;

        console.log("Processing invoice.payment_succeeded:", {
          id: invoice.id,
          subscription: (invoice as any).subscription,
          customer: invoice.customer,
          amount_paid: invoice.amount_paid,
          status: invoice.status,
        });

        // Only handle subscription invoices
        if (!(invoice as any).subscription) {
          console.log("Skipping non-subscription invoice:", invoice.id);
          break;
        }

        // Get the subscription to check if this is a trial end payment
        const subscription = await stripe.subscriptions.retrieve(
          (invoice as any).subscription as string
        );

        console.log("Retrieved subscription for invoice:", {
          subscriptionId: subscription.id,
          status: subscription.status,
          trial_end: (subscription as any).trial_end,
          current_period_start: (subscription as any).current_period_start,
          current_period_end: (subscription as any).current_period_end,
        });

        // Check if this is a trial end payment
        const isTrialEnd =
          (subscription as any).trial_end &&
          (subscription as any).trial_end <= Math.floor(Date.now() / 1000);

        if (isTrialEnd) {
          console.log("Processing trial end payment:", {
            subscriptionId: subscription.id,
            trialEnd: new Date(
              (subscription as any).trial_end * 1000
            ).toISOString(),
            amountPaid: invoice.amount_paid,
          });
        }

        // Update subscription with new billing period if trial ended
        if (isTrialEnd && subscription.metadata.restaurantId) {
          // First, update the restaurant subscription status
          const { error: restaurantUpdateError } = await adminSupabase.rpc(
            "update_restaurant_subscription_status",
            {
              p_restaurant_id: subscription.metadata.restaurantId,
              p_subscription_status: subscription.status,
              p_stripe_customer_id: subscription.customer as string,
            }
          );

          if (restaurantUpdateError) {
            console.error(
              "Error updating restaurant subscription status after trial end:",
              restaurantUpdateError
            );
            return new NextResponse(
              "Error updating restaurant subscription status",
              {
                status: 500,
              }
            );
          }

          // Then, update the subscription record
          const { error: updateError } = await adminSupabase.rpc(
            "upsert_subscription",
            {
              p_stripe_subscription_id: subscription.id,
              p_restaurant_id: subscription.metadata.restaurantId,
              p_plan: subscription.metadata.plan,
              p_interval: subscription.metadata.interval,
              p_status: subscription.status,
              p_stripe_customer_id: subscription.customer as string,
              p_stripe_price_id: subscription.items.data[0]?.price?.id || null,
              p_current_period_start: new Date(
                (subscription as any).current_period_start * 1000
              ).toISOString(),
              p_current_period_end: new Date(
                (subscription as any).current_period_end * 1000
              ).toISOString(),
              p_trial_start: (subscription as any).trial_start
                ? new Date(
                    (subscription as any).trial_start * 1000
                  ).toISOString()
                : null,
              p_trial_end: (subscription as any).trial_end
                ? new Date((subscription as any).trial_end * 1000).toISOString()
                : null,
              p_cancel_at: (subscription as any).cancel_at
                ? new Date((subscription as any).cancel_at * 1000).toISOString()
                : null,
              p_canceled_at: (subscription as any).canceled_at
                ? new Date(
                    (subscription as any).canceled_at * 1000
                  ).toISOString()
                : null,
              p_metadata: subscription.metadata || {},
            }
          );

          if (updateError) {
            console.error(
              "Error updating subscription after trial end:",
              updateError
            );
            return new NextResponse("Error updating subscription", {
              status: 500,
            });
          }

          console.log("Successfully updated subscription after trial end:", {
            subscriptionId: subscription.id,
            restaurantId: subscription.metadata.restaurantId,
            newStatus: subscription.status,
            newBillingPeriod: {
              start: new Date(
                (subscription as any).current_period_start * 1000
              ).toISOString(),
              end: new Date(
                (subscription as any).current_period_end * 1000
              ).toISOString(),
            },
          });

          // Send invoice receipt email
          try {
            // Get customer email from Stripe
            const customer = (await stripe.customers.retrieve(
              subscription.customer as string
            )) as Stripe.Customer;

            if (customer.email && customer.email.length > 0) {
              const customerEmail = customer.email;

              // Get restaurant details
              const { data: restaurant } = await adminSupabase
                .from("restaurants")
                .select("name")
                .eq("id", subscription.metadata.restaurantId)
                .single();

              const billingPeriodStart = new Date(
                (subscription as any).current_period_start * 1000
              );
              const billingPeriodEnd = new Date(
                (subscription as any).current_period_end * 1000
              );

              // Check if this is a trial upgrade
              const isTrialUpgrade =
                subscription.metadata?.trial_preserved === "true";
              const trialEndDate = subscription.metadata?.original_trial_end
                ? new Date(
                    parseInt(subscription.metadata.original_trial_end) * 1000
                  ).toLocaleDateString()
                : undefined;

              await sendInvoiceReceipt(customerEmail, {
                invoiceId: invoice.id || "unknown",
                amount: invoice.amount_paid,
                currency: invoice.currency,
                description: `DineEasy ${subscription.metadata.plan} Plan - ${subscription.metadata.interval}`,
                date: new Date().toLocaleDateString(),
                customerName: customer.name || undefined,
                restaurantName: restaurant?.name,
                subscriptionPlan: subscription.metadata.plan,
                billingPeriod: `${billingPeriodStart.toLocaleDateString()} - ${billingPeriodEnd.toLocaleDateString()}`,
                isTrialUpgrade: isTrialUpgrade,
                trialEndDate: trialEndDate,
              });

              console.log(
                "Invoice receipt email sent for subscription payment:",
                {
                  subscriptionId: subscription.id,
                  customerEmail: customer.email,
                  invoiceId: invoice.id,
                }
              );
            }
          } catch (emailError) {
            console.error("Error sending invoice receipt email:", emailError);
            // Don't fail the webhook if email fails
          }
        }

        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;

        console.log("Processing invoice.payment_failed:", {
          id: invoice.id,
          subscription: (invoice as any).subscription,
          customer: invoice.customer,
          amount_due: invoice.amount_due,
          status: invoice.status,
        });

        // Only handle subscription invoices
        if (!(invoice as any).subscription) {
          console.log("Skipping non-subscription invoice:", invoice.id);
          break;
        }

        // Get the subscription to update its status
        const subscription = await stripe.subscriptions.retrieve(
          (invoice as any).subscription as string
        );

        console.log("Retrieved subscription for failed payment:", {
          subscriptionId: subscription.id,
          status: subscription.status,
          trial_end: (subscription as any).trial_end,
        });

        // Update subscription status to past_due
        if (subscription.metadata.restaurantId) {
          // First, update the restaurant subscription status
          const { error: restaurantUpdateError } = await adminSupabase.rpc(
            "update_restaurant_subscription_status",
            {
              p_restaurant_id: subscription.metadata.restaurantId,
              p_subscription_status: subscription.status,
              p_stripe_customer_id: subscription.customer as string,
            }
          );

          if (restaurantUpdateError) {
            console.error(
              "Error updating restaurant subscription status after failed payment:",
              restaurantUpdateError
            );
            return new NextResponse(
              "Error updating restaurant subscription status",
              {
                status: 500,
              }
            );
          }

          // Then, update the subscription record
          const { error: updateError } = await adminSupabase.rpc(
            "upsert_subscription",
            {
              p_stripe_subscription_id: subscription.id,
              p_restaurant_id: subscription.metadata.restaurantId,
              p_plan: subscription.metadata.plan,
              p_interval: subscription.metadata.interval,
              p_status: subscription.status,
              p_stripe_customer_id: subscription.customer as string,
              p_stripe_price_id: subscription.items.data[0]?.price?.id || null,
              p_current_period_start: new Date(
                (subscription as any).current_period_start * 1000
              ).toISOString(),
              p_current_period_end: new Date(
                (subscription as any).current_period_end * 1000
              ).toISOString(),
              p_trial_start: (subscription as any).trial_start
                ? new Date(
                    (subscription as any).trial_start * 1000
                  ).toISOString()
                : null,
              p_trial_end: (subscription as any).trial_end
                ? new Date((subscription as any).trial_end * 1000).toISOString()
                : null,
              p_cancel_at: (subscription as any).cancel_at
                ? new Date((subscription as any).cancel_at * 1000).toISOString()
                : null,
              p_canceled_at: (subscription as any).canceled_at
                ? new Date(
                    (subscription as any).canceled_at * 1000
                  ).toISOString()
                : null,
              p_metadata: subscription.metadata || {},
            }
          );

          if (updateError) {
            console.error(
              "Error updating subscription after failed payment:",
              updateError
            );
            return new NextResponse("Error updating subscription", {
              status: 500,
            });
          }

          console.log(
            "Successfully updated subscription after failed payment:",
            {
              subscriptionId: subscription.id,
              restaurantId: subscription.metadata.restaurantId,
              newStatus: subscription.status,
            }
          );
        }

        break;
      }

      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        console.log("Processing checkout.session.completed:", {
          id: session.id,
          mode: session.mode,
          metadata: session.metadata,
          customer: session.customer,
        });

        // Only handle subscription checkouts
        if (session.mode !== "subscription") {
          console.log("Skipping non-subscription checkout:", session.id);
          break;
        }

        // Get the subscription that was created
        if (!session.subscription) {
          console.error(
            "No subscription found in checkout session:",
            session.id
          );
          return new NextResponse("No subscription in session", {
            status: 400,
          });
        }

        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        );

        console.log("Retrieved subscription from checkout:", {
          subscriptionId: subscription.id,
          metadata: subscription.metadata,
          status: subscription.status,
        });

        // Handle subscription upgrade
        if (
          session.metadata?.isUpgrade === "true" &&
          session.metadata?.existingSubscriptionId
        ) {
          console.log("Processing subscription upgrade:", {
            newSubscriptionId: subscription.id,
            existingSubscriptionId: session.metadata.existingSubscriptionId,
            isTrialUpgrade: session.metadata?.isTrialUpgrade === "true",
          });

          // Get the old subscription to check if it's a trial upgrade
          let oldSubscription;
          try {
            oldSubscription = await stripe.subscriptions.retrieve(
              session.metadata.existingSubscriptionId
            );
          } catch (error) {
            console.error("Error retrieving old subscription:", error);
          }

          // If this is a trial upgrade, we need to preserve the trial period
          if (session.metadata?.isTrialUpgrade === "true" && oldSubscription) {
            console.log("Processing trial upgrade - preserving trial period:", {
              oldTrialEnd: oldSubscription.trial_end,
              newSubscriptionId: subscription.id,
            });

            // Update the new subscription to preserve the trial period
            try {
              const updateData: any = {
                metadata: {
                  ...subscription.metadata,
                  trial_preserved: "true",
                },
              };

              if (oldSubscription.trial_end) {
                updateData.trial_end = oldSubscription.trial_end;
                updateData.metadata.original_trial_end =
                  oldSubscription.trial_end.toString();
              }

              await stripe.subscriptions.update(subscription.id, updateData);
              console.log(
                "Updated new subscription with preserved trial period"
              );
            } catch (error) {
              console.error(
                "Error updating subscription with trial period:",
                error
              );
            }
          }

          // Cancel the old subscription
          try {
            await stripe.subscriptions.cancel(
              session.metadata.existingSubscriptionId
            );
            console.log(
              "Canceled old subscription:",
              session.metadata.existingSubscriptionId
            );
          } catch (error) {
            console.error("Error canceling old subscription:", error);
          }
        }

        // Update the subscription in the database
        if (subscription.metadata.restaurantId) {
          // Helper function to safely convert Unix timestamp to ISO string
          const toISOString = (timestamp: number | null): string | null => {
            if (!timestamp) return null;
            try {
              return new Date(timestamp * 1000).toISOString();
            } catch (error) {
              console.error("Invalid timestamp:", timestamp);
              return null;
            }
          };

          // First, update the restaurant subscription status
          const { error: restaurantUpdateError } = await adminSupabase.rpc(
            "update_restaurant_subscription_status",
            {
              p_restaurant_id: subscription.metadata.restaurantId,
              p_subscription_status: subscription.status,
              p_stripe_customer_id: subscription.customer as string,
            }
          );

          if (restaurantUpdateError) {
            console.error(
              "Error updating restaurant subscription status:",
              restaurantUpdateError
            );
            return new NextResponse(
              "Error updating restaurant subscription status",
              {
                status: 500,
              }
            );
          }

          // Then, update the subscription record
          const { error: updateError } = await adminSupabase.rpc(
            "upsert_subscription",
            {
              p_stripe_subscription_id: subscription.id,
              p_restaurant_id: subscription.metadata.restaurantId,
              p_plan: subscription.metadata.plan,
              p_interval: subscription.metadata.interval,
              p_status: subscription.status,
              p_stripe_customer_id: subscription.customer as string,
              p_stripe_price_id: subscription.items.data[0]?.price?.id || null,
              p_current_period_start: toISOString(
                (subscription as any).current_period_start
              ),
              p_current_period_end: toISOString(
                (subscription as any).current_period_end
              ),
              p_trial_start: toISOString((subscription as any).trial_start),
              p_trial_end: toISOString((subscription as any).trial_end),
              p_cancel_at: toISOString((subscription as any).cancel_at),
              p_canceled_at: toISOString((subscription as any).canceled_at),
              p_metadata: subscription.metadata || {},
            }
          );

          if (updateError) {
            console.error(
              "Error updating subscription after checkout:",
              updateError
            );
            return new NextResponse("Error updating subscription", {
              status: 500,
            });
          }

          console.log("Successfully updated subscription after checkout:", {
            subscriptionId: subscription.id,
            restaurantId: subscription.metadata.restaurantId,
            plan: subscription.metadata.plan,
            interval: subscription.metadata.interval,
            status: subscription.status,
            isUpgrade: session.metadata?.isUpgrade === "true",
          });

          // Send invoice receipt email for plan changes and new subscriptions
          try {
            // Get customer email from Stripe
            const customer = (await stripe.customers.retrieve(
              subscription.customer as string
            )) as Stripe.Customer;

            if (customer.email && customer.email.length > 0) {
              // Get restaurant details
              const { data: restaurant } = await adminSupabase
                .from("restaurants")
                .select("name")
                .eq("id", subscription.metadata.restaurantId)
                .single();

              // Get the latest invoice for this subscription
              const invoices = await stripe.invoices.list({
                subscription: subscription.id,
                limit: 1,
              });

              const latestInvoice = invoices.data[0];
              const billingPeriodStart = new Date(
                (subscription as any).current_period_start * 1000
              );
              const billingPeriodEnd = new Date(
                (subscription as any).current_period_end * 1000
              );

              // Check if this is a trial upgrade
              const isTrialUpgrade =
                session.metadata?.isTrialUpgrade === "true";
              const trialEndDate = subscription.metadata?.original_trial_end
                ? new Date(
                    parseInt(subscription.metadata.original_trial_end) * 1000
                  ).toLocaleDateString()
                : undefined;

              // Determine the description based on the type of checkout
              let description = `DineEasy ${subscription.metadata.plan} Plan - ${subscription.metadata.interval}`;
              if (session.metadata?.isUpgrade === "true") {
                description = `Plan Upgrade: ${subscription.metadata.plan} Plan - ${subscription.metadata.interval}`;
              } else if (session.metadata?.isNewSubscription === "true") {
                description = `New Subscription: ${subscription.metadata.plan} Plan - ${subscription.metadata.interval}`;
              }

              await sendInvoiceReceipt(customer.email, {
                invoiceId: latestInvoice?.id || session.id,
                amount: latestInvoice?.amount_paid || 0,
                currency: subscription.metadata.currency || "USD",
                description: description,
                date: new Date().toLocaleDateString(),
                customerName: customer.name || undefined,
                restaurantName: restaurant?.name,
                subscriptionPlan: subscription.metadata.plan,
                billingPeriod: `${billingPeriodStart.toLocaleDateString()} - ${billingPeriodEnd.toLocaleDateString()}`,
                isTrialUpgrade: isTrialUpgrade,
                trialEndDate: trialEndDate,
              });

              console.log("Invoice receipt email sent for checkout session:", {
                subscriptionId: subscription.id,
                customerEmail: customer.email,
                sessionId: session.id,
                isUpgrade: session.metadata?.isUpgrade === "true",
                isNewSubscription:
                  session.metadata?.isNewSubscription === "true",
              });
            }
          } catch (emailError) {
            console.error("Error sending invoice receipt email:", emailError);
            // Don't fail the webhook if email fails
          }
        }

        break;
      }
    }

    return new NextResponse("Webhook processed", { status: 200 });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return new NextResponse(
      "Webhook error: " +
        (error instanceof Error ? error.message : "Unknown error"),
      { status: 400 }
    );
  }
}
