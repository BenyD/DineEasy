import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { constructWebhookEvent, stripe } from "@/lib/stripe";
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

// Get the appropriate webhook secret based on environment
const webhookSecret =
  process.env.NODE_ENV === "production"
    ? process.env.STRIPE_WEBHOOK_SECRET_PROD
    : process.env.STRIPE_WEBHOOK_SECRET;

if (!webhookSecret) {
  throw new Error("Stripe webhook secret is not set");
}

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get("stripe-signature");

  if (!signature) {
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

    switch (event.type) {
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
        const subscription = event.data.object as Stripe.Subscription & {
          current_period_start: number;
          current_period_end: number;
        };

        // Log the full subscription object for debugging
        console.log("Processing subscription event:", {
          type: event.type,
          id: subscription.id,
          metadata: subscription.metadata,
          customer: subscription.customer,
          status: subscription.status,
        });

        const { restaurantId, plan, interval } = subscription.metadata;

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

        // Update or create subscription record
        const subscriptionData = {
          id: subscription.id, // This is now the Stripe subscription ID
          restaurant_id: restaurantId,
          stripe_customer_id: subscription.customer as string,
          stripe_subscription_id: subscription.id,
          plan,
          interval,
          status: subscription.status,
          current_period_start: toISOString(subscription.current_period_start),
          current_period_end: toISOString(subscription.current_period_end),
          trial_start: toISOString(subscription.trial_start),
          trial_end: toISOString(subscription.trial_end),
          cancel_at: toISOString(subscription.cancel_at),
          canceled_at: toISOString(subscription.canceled_at),
          created_at: getCurrentTime(),
          updated_at: getCurrentTime(),
        };

        console.log("Upserting subscription:", {
          id: subscription.id,
          restaurantId,
          status: subscription.status,
          current_period_start: subscription.current_period_start,
          current_period_end: subscription.current_period_end,
          trial_start: subscription.trial_start,
          trial_end: subscription.trial_end,
        });

        // Use upsert with on conflict to handle both insert and update
        const { data: upsertedSub, error: upsertError } = await adminSupabase
          .from("subscriptions")
          .upsert([subscriptionData], {
            onConflict: "id", // Conflict on the Stripe subscription ID
            ignoreDuplicates: false,
          })
          .select()
          .single();

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
          status: upsertedSub.status,
          restaurantId: upsertedSub.restaurant_id,
        });

        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const { restaurantId } = subscription.metadata;

        if (!restaurantId) {
          console.error(
            "Missing restaurantId in subscription:",
            subscription.id
          );
          return new NextResponse("Missing restaurantId", { status: 400 });
        }

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
          return new NextResponse("Error updating restaurant", { status: 500 });
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
          .eq("id", subscription.id); // Use the Stripe subscription ID

        if (upsertError) {
          console.error("Error updating subscription:", upsertError);
          return new NextResponse("Error updating subscription", {
            status: 500,
          });
        }

        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        // Create payment record
        const { error: createError } = await adminSupabase
          .from("payments")
          .insert({
            restaurant_id: paymentIntent.metadata.restaurantId,
            order_id: paymentIntent.metadata.orderId,
            amount: paymentIntent.amount,
            status: "completed",
            method: "card",
            stripe_payment_id: paymentIntent.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (createError) {
          console.error("Error creating payment:", createError);
          return new NextResponse("Error creating payment", { status: 500 });
        }

        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        // Create failed payment record
        const { error: createError } = await adminSupabase
          .from("payments")
          .insert({
            restaurant_id: paymentIntent.metadata.restaurantId,
            order_id: paymentIntent.metadata.orderId,
            amount: paymentIntent.amount,
            status: "failed",
            method: "card",
            stripe_payment_id: paymentIntent.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (createError) {
          console.error("Error creating payment:", createError);
          return new NextResponse("Error creating payment", { status: 500 });
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
