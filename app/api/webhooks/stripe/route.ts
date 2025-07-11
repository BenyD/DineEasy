import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { constructWebhookEvent, stripe } from "@/lib/stripe";
import type { Stripe } from "stripe";

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

    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const { restaurantId, plan, interval } = subscription.metadata;

        if (!restaurantId || !plan || !interval) {
          console.error("Missing metadata in subscription:", subscription.id);
          return new NextResponse("Missing metadata", { status: 400 });
        }

        // Update restaurant subscription status
        const { error: updateError } = await supabase
          .from("restaurants")
          .update({
            subscription_status: subscription.status,
            updated_at: new Date().toISOString(),
          })
          .eq("id", restaurantId);

        if (updateError) {
          console.error("Error updating restaurant:", updateError);
          return new NextResponse("Error updating restaurant", { status: 500 });
        }

        // Update or create subscription record
        const { error: upsertError } = await supabase
          .from("subscriptions")
          .upsert({
            id: subscription.id,
            restaurant_id: restaurantId,
            stripe_customer_id: subscription.customer as string,
            stripe_subscription_id: subscription.id,
            plan,
            interval,
            status: subscription.status,
            current_period_start: new Date(
              (subscription as any).current_period_start * 1000
            ).toISOString(),
            current_period_end: new Date(
              (subscription as any).current_period_end * 1000
            ).toISOString(),
            trial_start: subscription.trial_start
              ? new Date(subscription.trial_start * 1000).toISOString()
              : null,
            trial_end: subscription.trial_end
              ? new Date(subscription.trial_end * 1000).toISOString()
              : null,
            cancel_at: subscription.cancel_at
              ? new Date(subscription.cancel_at * 1000).toISOString()
              : null,
            canceled_at: subscription.canceled_at
              ? new Date(subscription.canceled_at * 1000).toISOString()
              : null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (upsertError) {
          console.error("Error upserting subscription:", upsertError);
          return new NextResponse("Error upserting subscription", {
            status: 500,
          });
        }

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
        const { error: updateError } = await supabase
          .from("restaurants")
          .update({
            subscription_status: "canceled",
            updated_at: new Date().toISOString(),
          })
          .eq("id", restaurantId);

        if (updateError) {
          console.error("Error updating restaurant:", updateError);
          return new NextResponse("Error updating restaurant", { status: 500 });
        }

        // Update subscription record
        const { error: upsertError } = await supabase
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
          .eq("id", subscription.id);

        if (upsertError) {
          console.error("Error updating subscription:", upsertError);
          return new NextResponse("Error updating subscription", {
            status: 500,
          });
        }

        break;
      }

      case "customer.updated": {
        const customer = event.data.object as Stripe.Customer;

        // Update restaurant with new customer details if needed
        const { data: restaurants, error: fetchError } = await supabase
          .from("restaurants")
          .select()
          .eq("stripe_customer_id", customer.id)
          .single();

        if (fetchError || !restaurants) {
          console.error("Error fetching restaurant:", fetchError);
          return new NextResponse("Error fetching restaurant", { status: 500 });
        }

        // Update if email or name changed
        if (customer.email !== restaurants.email) {
          const { error: updateError } = await supabase
            .from("restaurants")
            .update({
              email: customer.email,
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_customer_id", customer.id);

          if (updateError) {
            console.error("Error updating restaurant:", updateError);
            return new NextResponse("Error updating restaurant", {
              status: 500,
            });
          }
        }

        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        // Create payment record
        const { error: createError } = await supabase.from("payments").insert({
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
        const { error: createError } = await supabase.from("payments").insert({
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
