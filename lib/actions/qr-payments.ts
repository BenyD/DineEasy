"use server";

import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
import { revalidatePath } from "next/cache";

export interface QRPaymentData {
  tableId: string;
  restaurantId: string;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  subtotal: number;
  tax: number;
  tip: number;
  total: number;
  email?: string;
  customerName?: string;
  specialInstructions?: string;
}

export async function createQRPaymentIntent(paymentData: QRPaymentData) {
  const supabase = createClient();

  try {
    // Check for existing pending orders for this table to prevent duplicates
    const { data: existingOrders, error: existingError } = await supabase
      .from("orders")
      .select("id, status, created_at")
      .eq("table_id", paymentData.tableId)
      .eq("status", "pending")
      .gte("created_at", new Date(Date.now() - 5 * 60 * 1000).toISOString()) // Last 5 minutes
      .order("created_at", { ascending: false })
      .limit(1);

    if (existingError) {
      console.error("Error checking for existing orders:", existingError);
      return { error: "Failed to verify existing orders" };
    }

    if (existingOrders && existingOrders.length > 0) {
      const existingOrder = existingOrders[0];
      const timeDiff =
        Date.now() - new Date(existingOrder.created_at).getTime();

      if (timeDiff < 5 * 60 * 1000) {
        // Less than 5 minutes
        console.log("Duplicate order prevention: Found recent pending order:", {
          existingOrderId: existingOrder.id,
          timeDiff: Math.round(timeDiff / 1000) + " seconds ago",
        });
        return {
          error:
            "You already have a pending order. Please wait for it to be processed.",
        };
      }
    }

    // Get restaurant details with Stripe Connect information
    const { data: restaurant, error: restaurantError } = await supabase
      .from("restaurants")
      .select(
        "id, name, stripe_account_id, currency, stripe_account_enabled, stripe_account_requirements"
      )
      .eq("id", paymentData.restaurantId)
      .single();

    if (restaurantError || !restaurant) {
      return { error: "Restaurant not found" };
    }

    // Check if restaurant has Stripe Connect enabled FIRST
    if (!restaurant.stripe_account_enabled || !restaurant.stripe_account_id) {
      return {
        error:
          "Restaurant payment processing is not available. Please pay at the counter.",
      };
    }

    // Check if Stripe Connect account has any blocking requirements
    if (restaurant.stripe_account_requirements) {
      const requirements = restaurant.stripe_account_requirements;

      // Check for any currently due requirements that would block payments
      if (requirements.currently_due && requirements.currently_due.length > 0) {
        console.error(
          "Stripe Connect account has currently due requirements:",
          requirements.currently_due
        );
        return {
          error:
            "Restaurant payment processing is not fully configured. Please pay at the counter.",
        };
      }

      // Check for any past due requirements
      if (requirements.past_due && requirements.past_due.length > 0) {
        console.error(
          "Stripe Connect account has past due requirements:",
          requirements.past_due
        );
        return {
          error:
            "Restaurant payment processing is not fully configured. Please pay at the counter.",
        };
      }

      // Check for any errors
      if (requirements.errors && requirements.errors.length > 0) {
        console.error(
          "Stripe Connect account has errors:",
          requirements.errors
        );
        return {
          error:
            "Restaurant payment processing is not properly configured. Please pay at the counter.",
        };
      }

      // Check if account is disabled
      if (requirements.disabled_reason) {
        console.error(
          "Stripe Connect account is disabled:",
          requirements.disabled_reason
        );
        return {
          error:
            "Restaurant payment processing is temporarily unavailable. Please pay at the counter.",
        };
      }
    }

    // Calculate platform fee (2% of total amount)
    const platformFeeAmount = Math.round(paymentData.total * 0.02 * 100); // 2% of total, converted to cents

    // Prepare payment intent parameters
    const paymentIntentParams: any = {
      amount: Math.round(paymentData.total * 100), // Convert to cents
      currency: restaurant.currency?.toLowerCase() || "chf",
      metadata: {
        restaurantId: paymentData.restaurantId,
        tableId: paymentData.tableId,
        customerEmail: paymentData.email || "",
        customerName: paymentData.customerName || "",
        isQRPayment: "true",
        restaurantName: restaurant.name,
        platformFee: platformFeeAmount.toString(),
        timestamp: Date.now().toString(), // Add timestamp for uniqueness
      },
      automatic_payment_methods: {
        enabled: true,
      },
      // Set up transfer to restaurant's Stripe Connect account
      transfer_data: {
        destination: restaurant.stripe_account_id,
      },
      // Calculate platform fee (2% of total amount)
      application_fee_amount: platformFeeAmount,
    };

    // Create Stripe payment intent FIRST (before creating any database records)
    let paymentIntent;
    try {
      console.log("Creating Stripe payment intent with params:", {
        amount: Math.round(paymentData.total * 100),
        currency: restaurant.currency?.toLowerCase() || "chf",
        transfer_data: {
          destination: restaurant.stripe_account_id,
        },
        application_fee_amount: platformFeeAmount,
        metadata: paymentIntentParams.metadata,
      });

      paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);

      console.log("Payment intent created successfully:", {
        id: paymentIntent.id,
        status: paymentIntent.status,
        client_secret: paymentIntent.client_secret ? "present" : "missing",
      });
    } catch (stripeError: any) {
      console.error("Stripe payment intent creation failed:", {
        error: stripeError.message,
        code: stripeError.code,
        type: stripeError.type,
        decline_code: stripeError.decline_code,
        param: stripeError.param,
        restaurantId: paymentData.restaurantId,
        restaurantStripeAccount: restaurant.stripe_account_id,
        restaurantStripeEnabled: restaurant.stripe_account_enabled,
        amount: paymentData.total,
        currency: restaurant.currency,
      });

      // Check if it's a Stripe Connect account issue
      if (
        stripeError.code === "account_invalid" ||
        stripeError.message?.includes("account")
      ) {
        return {
          error:
            "Restaurant payment processing is not properly configured. Please contact the restaurant or pay at the counter.",
        };
      }

      // Check if it's an amount issue
      if (
        stripeError.code === "parameter_invalid" &&
        stripeError.param === "amount"
      ) {
        return {
          error: "Invalid payment amount. Please try again or contact support.",
        };
      }

      // Check if it's a currency issue
      if (
        stripeError.code === "parameter_invalid" &&
        stripeError.param === "currency"
      ) {
        return {
          error: "Payment currency not supported. Please contact support.",
        };
      }

      // Generic error
      return {
        error:
          "Payment processing is temporarily unavailable. Please try again or pay at the counter.",
      };
    }

    // Only after successful payment intent creation, create the order
    const orderId = crypto.randomUUID();

    // Generate unique order number with retry mechanism
    let orderNumberResult: string | null = null;
    let maxRetries = 5;
    let retryCount = 0;

    while (!orderNumberResult && retryCount < maxRetries) {
      try {
        const { data: orderNumberData, error: orderNumberError } =
          await supabase.rpc("generate_order_number");

        if (orderNumberError) {
          console.error("Error generating order number:", orderNumberError);
          retryCount++;
          continue;
        }

        orderNumberResult = orderNumberData;
        break;
      } catch (error) {
        console.error("Error in generate_order_number call:", error);
        retryCount++;
        continue;
      }
    }

    if (!orderNumberResult) {
      // Fallback: use timestamp-based order number
      const timestamp = Date.now();
      orderNumberResult = `ORD-${new Date().getFullYear()}-${timestamp}`;
      console.log("Using fallback order number:", orderNumberResult);
    }

    // Create order in database with retry for duplicate order numbers
    let orderInserted = false;
    let insertRetryCount = 0;
    const maxInsertRetries = 3;

    while (!orderInserted && insertRetryCount < maxInsertRetries) {
      try {
        const { error: orderError } = await supabase.from("orders").insert({
          id: orderId,
          restaurant_id: paymentData.restaurantId,
          table_id: paymentData.tableId,
          status: "pending", // Start with pending status
          total_amount: paymentData.total,
          tax_amount: paymentData.tax,
          tip_amount: paymentData.tip,
          notes: paymentData.specialInstructions || null,
          customer_name: paymentData.customerName || null,
          customer_email: paymentData.email || null,
          order_number: orderNumberResult,
          stripe_payment_intent_id: paymentIntent.id, // Link to the payment intent
        });

        if (orderError) {
          if (
            orderError.code === "23505" &&
            orderError.message.includes("order_number")
          ) {
            // Duplicate order number, generate a new one
            console.log(
              "Duplicate order number detected, generating new one..."
            );
            const timestamp = Date.now();
            orderNumberResult = `ORD-${new Date().getFullYear()}-${timestamp}`;
            insertRetryCount++;
            continue;
          } else {
            console.error("Error creating order:", orderError);
            console.error("Order data:", {
              id: orderId,
              restaurant_id: paymentData.restaurantId,
              table_id: paymentData.tableId,
              total_amount: paymentData.total,
              order_number: orderNumberResult,
            });
            return { error: "Failed to create order" };
          }
        }

        orderInserted = true;
      } catch (error) {
        console.error("Unexpected error creating order:", error);
        insertRetryCount++;
        continue;
      }
    }

    if (!orderInserted) {
      return { error: "Failed to create order after multiple attempts" };
    }

    console.log("Order created successfully with pending status:", {
      orderId,
      orderNumber: orderNumberResult,
      paymentIntentId: paymentIntent.id,
    });

    // Create order items
    const orderItems = paymentData.items.map((item) => ({
      order_id: orderId,
      menu_item_id: item.id,
      quantity: item.quantity,
      unit_price: item.price,
    }));

    console.log("Creating order items:", orderItems);

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      console.error("Error creating order items:", itemsError);
      console.error("Order items data:", orderItems);

      // Clean up the order if items creation fails
      await supabase.from("orders").delete().eq("id", orderId);

      return { error: "Failed to create order items" };
    }

    console.log("Order items created successfully");

    // Update payment intent metadata with order ID
    try {
      await stripe.paymentIntents.update(paymentIntent.id, {
        metadata: {
          ...paymentIntentParams.metadata,
          orderId: orderId, // Add order ID to metadata
        },
      });
    } catch (updateError) {
      console.error("Error updating payment intent metadata:", updateError);
      // Don't fail the entire process for this, just log the error
    }

    console.log("Created QR payment intent:", {
      orderId,
      paymentIntentId: paymentIntent.id,
      amount: paymentData.total,
      restaurantId: paymentData.restaurantId,
      tableId: paymentData.tableId,
    });

    return {
      orderId: orderId,
      clientSecret: paymentIntent.client_secret,
    };
  } catch (error) {
    console.error("Error creating QR payment intent:", error);
    return { error: "Failed to create payment intent" };
  }
}

export async function confirmQRPayment(orderId: string) {
  const supabase = createClient();

  try {
    // Get the order to verify it exists and get payment intent ID
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, stripe_payment_intent_id, status")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return { error: "Order not found" };
    }

    // Check if payment record already exists to prevent duplicates
    const { data: existingPayment, error: paymentCheckError } = await supabase
      .from("payments")
      .select("id, status")
      .eq("order_id", orderId)
      .single();

    if (paymentCheckError && paymentCheckError.code !== "PGRST116") {
      // PGRST116 is "not found" error, which is expected
      console.error("Error checking for existing payment:", paymentCheckError);
      return { error: "Failed to verify payment status" };
    }

    if (existingPayment) {
      console.log("Payment record already exists:", {
        orderId,
        paymentId: existingPayment.id,
        paymentStatus: existingPayment.status,
      });

      if (existingPayment.status === "completed") {
        return { success: true, message: "Payment already confirmed" };
      } else {
        return {
          error: "Payment is in an invalid state. Please contact support.",
        };
      }
    }

    // Verify payment with Stripe if we have a payment intent ID
    if (order.stripe_payment_intent_id) {
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(
          order.stripe_payment_intent_id
        );

        if (paymentIntent.status === "succeeded") {
          console.log("Payment verified with Stripe:", {
            orderId,
            paymentIntentId: paymentIntent.id,
            status: paymentIntent.status,
            amount: paymentIntent.amount / 100,
          });

          // Create payment record with completed status
          const { data: orderData } = await supabase
            .from("orders")
            .select("restaurant_id, total_amount")
            .eq("id", orderId)
            .single();

          if (orderData) {
            // Get restaurant currency
            const { data: restaurant } = await supabase
              .from("restaurants")
              .select("currency")
              .eq("id", orderData.restaurant_id)
              .single();

            // Double-check no payment record exists before creating one
            const { data: finalPaymentCheck } = await supabase
              .from("payments")
              .select("id, status")
              .eq("order_id", orderId)
              .single();

            if (finalPaymentCheck) {
              console.log("Payment record already exists:", {
                orderId,
                paymentId: finalPaymentCheck.id,
                paymentStatus: finalPaymentCheck.status,
              });

              if (finalPaymentCheck.status === "completed") {
                return { success: true, message: "Payment already confirmed" };
              } else {
                // Update existing payment to completed status instead of creating a new one
                const { error: updateError } = await supabase
                  .from("payments")
                  .update({
                    status: "completed",
                    stripe_payment_id: paymentIntent.id,
                  })
                  .eq("id", finalPaymentCheck.id);

                if (updateError) {
                  console.error(
                    "Error updating existing payment:",
                    updateError
                  );
                  return { error: "Failed to update payment status" };
                }

                console.log("Updated existing payment to completed status:", {
                  orderId,
                  paymentId: finalPaymentCheck.id,
                });

                // Revalidate the orders page
                revalidatePath("/dashboard/orders");

                return {
                  success: true,
                  message: "Payment status updated successfully",
                };
              }
            }

            const { error: paymentError } = await supabase
              .from("payments")
              .insert({
                restaurant_id: orderData.restaurant_id,
                order_id: orderId,
                amount: orderData.total_amount,
                status: "completed",
                method: "card",
                stripe_payment_id: paymentIntent.id,
                currency: restaurant?.currency || "CHF",
              });

            if (paymentError) {
              console.error("Error creating payment record:", paymentError);

              // Check if it's a duplicate key error
              if (paymentError.code === "23505") {
                console.log("Payment record already exists (race condition):", {
                  orderId,
                  paymentIntentId: paymentIntent.id,
                });
                return { success: true, message: "Payment already confirmed" };
              }

              // Don't fail the entire process for this, just log the error
            } else {
              console.log("Payment record created successfully");
            }
          }

          // Keep order status as pending (for fulfillment)
          // The order should remain pending until the restaurant starts preparing it
          console.log(
            "Order payment confirmed, keeping order status as pending for fulfillment"
          );

          // Revalidate the orders page
          revalidatePath("/dashboard/orders");

          return { success: true, message: "Payment confirmed successfully" };
        } else if (paymentIntent.status === "canceled") {
          // Clean up the order if payment was canceled
          console.log("Payment canceled, cleaning up order:", {
            orderId,
            paymentIntentId: paymentIntent.id,
            status: paymentIntent.status,
          });

          await supabase.from("orders").delete().eq("id", orderId);

          return { error: "Payment was canceled. Please try again." };
        } else if (paymentIntent.status === "processing") {
          // Payment is still processing, keep order as pending
          console.log("Payment still processing:", {
            orderId,
            paymentIntentId: paymentIntent.id,
            status: paymentIntent.status,
          });

          return { success: true, message: "Payment is being processed" };
        } else {
          // Any other status (requires_action, requires_capture, etc.) - clean up the order
          console.log("Payment not successful, cleaning up order:", {
            orderId,
            paymentIntentId: paymentIntent.id,
            status: paymentIntent.status,
          });

          await supabase.from("orders").delete().eq("id", orderId);

          return {
            error: "Payment was not completed successfully. Please try again.",
          };
        }
      } catch (stripeError) {
        console.error("Error verifying payment with Stripe:", stripeError);
        // If we can't verify with Stripe, clean up the order to be safe
        await supabase.from("orders").delete().eq("id", orderId);
        return { error: "Payment verification failed. Please try again." };
      }
    }

    // If no payment intent ID, something is wrong
    console.error("No payment intent ID found for order:", orderId);
    return { error: "Invalid payment information" };
  } catch (error) {
    console.error("Error confirming QR payment:", error);
    return { error: "Failed to confirm payment" };
  }
}

export async function getQROrderDetails(orderId: string) {
  const supabase = createClient();

  try {
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(
        `
        *,
        order_items (
          *,
          menu_item:menu_items (
            id,
            name,
            description,
            price
          )
        ),
        restaurant:restaurants (
          id,
          name,
          address,
          phone
        )
      `
      )
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return { error: "Order not found" };
    }

    return { order };
  } catch (error) {
    console.error("Error fetching QR order details:", error);
    return { error: "Failed to fetch order details" };
  }
}

export async function createCashOrder(paymentData: QRPaymentData) {
  const supabase = createClient();

  try {
    // Check for existing pending orders for this table to prevent duplicates
    const { data: existingOrders, error: existingError } = await supabase
      .from("orders")
      .select("id, status, created_at")
      .eq("table_id", paymentData.tableId)
      .eq("status", "pending")
      .gte("created_at", new Date(Date.now() - 5 * 60 * 1000).toISOString()) // Last 5 minutes
      .order("created_at", { ascending: false })
      .limit(1);

    if (existingError) {
      console.error("Error checking for existing orders:", existingError);
      return { error: "Failed to verify existing orders" };
    }

    if (existingOrders && existingOrders.length > 0) {
      const existingOrder = existingOrders[0];
      const timeDiff =
        Date.now() - new Date(existingOrder.created_at).getTime();

      if (timeDiff < 5 * 60 * 1000) {
        // Less than 5 minutes
        console.log("Duplicate order prevention: Found recent pending order:", {
          existingOrderId: existingOrder.id,
          timeDiff: Math.round(timeDiff / 1000) + " seconds ago",
        });
        return {
          error:
            "You already have a pending order. Please wait for it to be processed.",
        };
      }
    }

    // Get restaurant details
    const { data: restaurant, error: restaurantError } = await supabase
      .from("restaurants")
      .select("id, name, currency")
      .eq("id", paymentData.restaurantId)
      .single();

    if (restaurantError || !restaurant) {
      return { error: "Restaurant not found" };
    }

    // Generate unique order number with retry mechanism
    let orderId: string;
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        const { data: orderNumberResult, error: orderNumberError } =
          await supabase.rpc("generate_order_number", {
            restaurant_id: paymentData.restaurantId,
          });

        if (orderNumberError) {
          console.error("Error generating order number:", orderNumberError);
          // Fallback to timestamp-based order number
          orderId = `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        } else {
          orderId = orderNumberResult;
        }

        // Create the order
        const { data: order, error: orderError } = await supabase
          .from("orders")
          .insert({
            id: orderId,
            restaurant_id: paymentData.restaurantId,
            table_id: paymentData.tableId,
            order_number: orderId,
            total_amount: paymentData.total,
            tax_amount: paymentData.tax,
            tip_amount: paymentData.tip,
            status: "pending",
            customer_name: paymentData.customerName,
            customer_email: paymentData.email,
            notes: paymentData.specialInstructions,
            payment_method: "cash",
          })
          .select("id")
          .single();

        if (orderError) {
          if (orderError.code === "23505") {
            // Duplicate key error
            retryCount++;
            if (retryCount < maxRetries) {
              console.log(
                `Order ID collision, retrying (${retryCount}/${maxRetries})`
              );
              continue;
            }
          }
          throw orderError;
        }

        // Create order items
        const orderItems = paymentData.items.map((item) => ({
          order_id: orderId,
          menu_item_id: item.id,
          quantity: item.quantity,
          unit_price: item.price,
        }));

        const { error: orderItemsError } = await supabase
          .from("order_items")
          .insert(orderItems);

        if (orderItemsError) {
          console.error("Error creating order items:", orderItemsError);
          // Clean up the order if order items creation fails
          await supabase.from("orders").delete().eq("id", orderId);
          return { error: "Failed to create order items" };
        }

        console.log("Cash order created successfully:", { orderId });

        return { success: true, orderId };
      } catch (error) {
        console.error("Error creating cash order:", error);
        retryCount++;
        if (retryCount >= maxRetries) {
          return { error: "Failed to create order after multiple attempts" };
        }
      }
    }

    return { error: "Failed to create order" };
  } catch (error) {
    console.error("Error creating cash order:", error);
    return { error: "Failed to create order" };
  }
}

export async function completeCashOrder(orderId: string) {
  const supabase = createClient();

  try {
    // Get the order to verify it exists
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, restaurant_id, total_amount, status")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return { error: "Order not found" };
    }

    // Get restaurant currency
    const { data: restaurant } = await supabase
      .from("restaurants")
      .select("currency")
      .eq("id", order.restaurant_id)
      .single();

    // Check if payment record already exists to prevent duplicates
    const { data: existingPayment, error: paymentCheckError } = await supabase
      .from("payments")
      .select("id, status")
      .eq("order_id", orderId)
      .single();

    if (paymentCheckError && paymentCheckError.code !== "PGRST116") {
      // PGRST116 is "not found" error, which is expected
      console.error("Error checking for existing payment:", paymentCheckError);
      return { error: "Failed to verify payment status" };
    }

    if (existingPayment) {
      console.log("Payment record already exists:", {
        orderId,
        paymentId: existingPayment.id,
        paymentStatus: existingPayment.status,
      });

      if (existingPayment.status === "completed") {
        return { success: true, message: "Payment already completed" };
      } else {
        // Update existing payment to completed status instead of creating a new one
        const { error: updateError } = await supabase
          .from("payments")
          .update({ status: "completed" })
          .eq("id", existingPayment.id);

        if (updateError) {
          console.error("Error updating existing payment:", updateError);
          return { error: "Failed to update payment status" };
        }

        console.log("Updated existing payment to completed status:", {
          orderId,
          paymentId: existingPayment.id,
        });

        // Revalidate the orders page
        revalidatePath("/dashboard/orders");

        return {
          success: true,
          message: "Payment status updated successfully",
        };
      }
    }

    // Create payment record for cash payment only if one doesn't exist
    const { error: paymentError } = await supabase.from("payments").insert({
      restaurant_id: order.restaurant_id,
      order_id: orderId,
      amount: order.total_amount,
      status: "completed",
      method: "cash",
      currency: restaurant?.currency || "CHF",
    });

    if (paymentError) {
      console.error("Error creating cash payment record:", paymentError);

      // Check if it's a duplicate key error (race condition)
      if (paymentError.code === "23505") {
        console.log("Payment record already exists (race condition):", {
          orderId,
        });
        return { success: true, message: "Payment already completed" };
      }

      return { error: "Failed to create payment record" };
    }

    // Keep order status as pending (for fulfillment)
    // The order should remain pending until the restaurant starts preparing it
    console.log(
      "Cash payment confirmed, keeping order status as pending for fulfillment"
    );

    // Revalidate the orders page
    revalidatePath("/dashboard/orders");

    console.log("Cash order payment completed:", { orderId });

    return { success: true };
  } catch (error) {
    console.error("Error completing cash order:", error);
    return { error: "Failed to complete order" };
  }
}

export async function validatePaymentMethods(restaurantId: string) {
  const supabase = createClient();

  try {
    const { data: restaurant, error } = await supabase
      .from("restaurants")
      .select("payment_methods, stripe_account_enabled, stripe_account_id")
      .eq("id", restaurantId)
      .single();

    if (error || !restaurant) {
      return { error: "Restaurant not found" };
    }

    const paymentMethods = restaurant.payment_methods || {
      cardEnabled: true,
      cashEnabled: true,
    };

    const hasStripeConnect =
      restaurant.stripe_account_enabled && restaurant.stripe_account_id;
    const cardPaymentEnabled = hasStripeConnect && paymentMethods.cardEnabled;
    const cashPaymentEnabled = paymentMethods.cashEnabled;

    return {
      success: true,
      data: {
        cardEnabled: cardPaymentEnabled,
        cashEnabled: cashPaymentEnabled,
        hasStripeConnect,
        paymentMethods,
      },
    };
  } catch (error) {
    console.error("Error validating payment methods:", error);
    return { error: "Failed to validate payment methods" };
  }
}
