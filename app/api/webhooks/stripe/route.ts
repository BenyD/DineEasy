import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { Database } from "@/types/supabase";

type SubscriptionStatus = Database["public"]["Enums"]["subscription_status"];

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-06-30.basil",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature") ?? "";

  if (!signature) {
    return NextResponse.json(
      { error: "No signature in request" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error: any) {
    return NextResponse.json(
      { error: `Webhook Error: ${error.message}` },
      { status: 400 }
    );
  }

  const supabase = createClient();

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription & {
          current_period_end: number;
          start_date: number;
        };
        const restaurantId = subscription.metadata?.restaurantId;

        if (!restaurantId) {
          throw new Error("No restaurantId in subscription metadata");
        }

        // Update restaurant subscription status
        await supabase
          .from("restaurants")
          .update({
            subscription_status: subscription.status as SubscriptionStatus,
            updated_at: new Date().toISOString(),
          })
          .eq("id", restaurantId);

        // Update or delete subscription record
        if (event.type === "customer.subscription.deleted") {
          await supabase
            .from("subscriptions")
            .delete()
            .eq("stripe_subscription_id", subscription.id);
        } else {
          const periodEnd = subscription.current_period_end
            ? subscription.current_period_end
            : Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60; // 30 days from now

          await supabase
            .from("subscriptions")
            .upsert({
              restaurant_id: restaurantId,
              stripe_customer_id: subscription.customer as string,
              stripe_subscription_id: subscription.id,
              status: subscription.status as SubscriptionStatus,
              current_period_start: new Date(
                subscription.start_date * 1000
              ).toISOString(),
              current_period_end: new Date(periodEnd * 1000).toISOString(),
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
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_subscription_id", subscription.id);
        }
        break;
      }

      case "account.updated": {
        const account = event.data.object as Stripe.Account;
        const restaurantId = account.metadata?.restaurantId;

        if (!restaurantId) {
          throw new Error("No restaurantId in account metadata");
        }

        await supabase
          .from("restaurants")
          .update({
            stripe_account_enabled: account.charges_enabled,
            stripe_account_requirements: account.requirements,
            updated_at: new Date().toISOString(),
          })
          .eq("id", restaurantId);
        break;
      }

      case "customer.subscription.trial_will_end": {
        const subscription = event.data.object as Stripe.Subscription;
        const restaurantId = subscription.metadata?.restaurantId;

        if (!restaurantId) {
          throw new Error("No restaurantId in subscription metadata");
        }

        // Notify the restaurant owner (you could implement email notifications here)
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
