import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    const {
      sessionId,
      syncToDatabase = false,
      restaurantId,
    } = await req.json();

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: "Session ID is required" },
        { status: 400 }
      );
    }

    // Get current user
    const supabase = createClient();
    const adminSupabase = createAdminClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: "User not authenticated" },
        { status: 401 }
      );
    }

    console.log("🔍 Checking Stripe session:", sessionId, {
      syncToDatabase,
      restaurantId,
    });

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    console.log("📋 Stripe session data:", {
      id: session.id,
      status: session.status,
      payment_status: session.payment_status,
      subscription: session.subscription,
      customer: session.customer,
      metadata: session.metadata,
    });

    // Check if the session is completed and has a subscription
    if (session.status === "complete" && session.subscription) {
      // Get the subscription details
      const subscription = await stripe.subscriptions.retrieve(
        session.subscription as string
      );

      console.log("📋 Subscription data:", {
        id: subscription.id,
        status: subscription.status,
        customer: subscription.customer,
        metadata: subscription.metadata,
      });

      // Check if this subscription belongs to the current user
      const { data: restaurant } = await supabase
        .from("restaurants")
        .select("id, stripe_customer_id")
        .eq("owner_id", user.id)
        .single();

      if (
        restaurant &&
        restaurant.stripe_customer_id === subscription.customer
      ) {
        // If sync is requested and subscription is not in database, sync it
        if (syncToDatabase) {
          console.log("🔄 Attempting to sync subscription to database...");

          // Check if subscription already exists in database
          const { data: existingSubscription } = await adminSupabase
            .from("subscriptions")
            .select("id")
            .eq("stripe_subscription_id", subscription.id)
            .single();

          if (!existingSubscription) {
            console.log("📥 Subscription not found in database, syncing...");

            try {
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

              // Get current time as fallback
              const getCurrentTime = (): string => {
                return new Date().toISOString();
              };

              // Extract subscription data
              const {
                restaurantId: subRestaurantId,
                plan,
                interval,
              } = subscription.metadata;

              if (!subRestaurantId || !plan || !interval) {
                console.error(
                  "Missing required metadata in subscription:",
                  subscription.metadata
                );
                return NextResponse.json({
                  success: false,
                  error: "Subscription missing required metadata",
                  data: {
                    session: {
                      id: session.id,
                      status: session.status,
                      payment_status: session.payment_status,
                    },
                    subscription: {
                      id: subscription.id,
                      status: subscription.status,
                      plan: subscription.metadata.plan,
                      interval: subscription.metadata.interval,
                    },
                  },
                });
              }

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

              // First, update the restaurant subscription status
              const { error: restaurantUpdateError } = await adminSupabase.rpc(
                "update_restaurant_subscription_status",
                {
                  p_restaurant_id: subRestaurantId,
                  p_subscription_status: subscription.status,
                  p_stripe_customer_id: subscription.customer as string,
                }
              );

              if (restaurantUpdateError) {
                console.error(
                  "Error updating restaurant subscription status:",
                  restaurantUpdateError
                );
                return NextResponse.json({
                  success: false,
                  error: "Failed to update restaurant subscription status",
                });
              }

              // Then, upsert the subscription record
              const { error: upsertError } = await adminSupabase.rpc(
                "upsert_subscription",
                {
                  p_stripe_subscription_id: subscription.id,
                  p_restaurant_id: subRestaurantId,
                  p_plan: plan,
                  p_interval: interval,
                  p_status: subscription.status,
                  p_stripe_customer_id: subscription.customer as string,
                  p_stripe_price_id:
                    subscription.items.data[0]?.price?.id || null,
                  p_current_period_start: currentPeriodStart,
                  p_current_period_end: currentPeriodEnd,
                  p_trial_start: trialStart,
                  p_trial_end: trialEnd,
                  p_cancel_at: cancelAt,
                  p_canceled_at: canceledAt,
                  p_metadata: subscription.metadata || {},
                }
              );

              if (upsertError) {
                console.error("Error upserting subscription:", upsertError);
                return NextResponse.json({
                  success: false,
                  error: "Failed to sync subscription to database",
                });
              }

              console.log(
                "✅ Successfully synced subscription to database:",
                subscription.id
              );

              return NextResponse.json({
                success: true,
                synced: true,
                data: {
                  session: {
                    id: session.id,
                    status: session.status,
                    payment_status: session.payment_status,
                  },
                  subscription: {
                    id: subscription.id,
                    status: subscription.status,
                    plan: subscription.metadata.plan,
                    interval: subscription.metadata.interval,
                  },
                },
              });
            } catch (syncError) {
              console.error("Error syncing subscription:", syncError);
              return NextResponse.json({
                success: false,
                error: "Failed to sync subscription",
              });
            }
          } else {
            console.log("✅ Subscription already exists in database");
          }
        }

        return NextResponse.json({
          success: true,
          synced: false,
          data: {
            session: {
              id: session.id,
              status: session.status,
              payment_status: session.payment_status,
            },
            subscription: {
              id: subscription.id,
              status: subscription.status,
              plan: subscription.metadata.plan,
              interval: subscription.metadata.interval,
            },
          },
        });
      } else {
        return NextResponse.json({
          success: false,
          error: "Session does not belong to current user",
        });
      }
    } else {
      return NextResponse.json({
        success: false,
        error: "Session not complete or no subscription found",
        data: {
          session: {
            id: session.id,
            status: session.status,
            payment_status: session.payment_status,
          },
        },
      });
    }
  } catch (error) {
    console.error("❌ Error checking Stripe session:", error);
    return NextResponse.json(
      { success: false, error: "Failed to check session" },
      { status: 500 }
    );
  }
}
