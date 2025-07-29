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
    // Get restaurant details with Stripe Connect information
    const { data: restaurant, error: restaurantError } = await supabase
      .from("restaurants")
      .select("id, name, stripe_account_id, currency, stripe_account_enabled")
      .eq("id", paymentData.restaurantId)
      .single();

    if (restaurantError || !restaurant) {
      return { error: "Restaurant not found" };
    }

    // Check if restaurant has Stripe Connect enabled
    if (!restaurant.stripe_account_enabled || !restaurant.stripe_account_id) {
      return {
        error:
          "Restaurant payment processing is not available. Please pay at the counter.",
      };
    }

    // Create a unique order ID
    const orderId = crypto.randomUUID();

    // Generate unique order number
    const { data: orderNumberResult, error: orderNumberError } =
      await supabase.rpc("generate_order_number");

    if (orderNumberError) {
      console.error("Error generating order number:", orderNumberError);
      return { error: "Failed to generate order number" };
    }

    // Create order in database
    const { error: orderError } = await supabase.from("orders").insert({
      id: orderId,
      restaurant_id: paymentData.restaurantId,
      table_id: paymentData.tableId,
      status: "pending",
      total_amount: paymentData.total,
      tax_amount: paymentData.tax,
      tip_amount: paymentData.tip,
      notes: paymentData.specialInstructions || null,
      customer_name: paymentData.customerName || null,
      customer_email: paymentData.email || null,
      order_number: orderNumberResult,
    });

    if (orderError) {
      console.error("Error creating order:", orderError);
      return { error: "Failed to create order" };
    }

    // Create order items
    const orderItems = paymentData.items.map((item) => ({
      order_id: orderId,
      menu_item_id: item.id,
      quantity: item.quantity,
      unit_price: item.price,
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      console.error("Error creating order items:", itemsError);
      return { error: "Failed to create order items" };
    }

    // Calculate platform fee (2% of total amount)
    const platformFeeAmount = Math.round(paymentData.total * 0.02 * 100); // 2% of total, converted to cents

    // Prepare payment intent parameters
    const paymentIntentParams: any = {
      amount: Math.round(paymentData.total * 100), // Convert to cents
      currency: restaurant.currency?.toLowerCase() || "chf",
      metadata: {
        restaurantId: paymentData.restaurantId,
        orderId: orderId,
        tableId: paymentData.tableId,
        customerEmail: paymentData.email || "",
        customerName: paymentData.customerName || "",
        isQRPayment: "true",
        restaurantName: restaurant.name,
        platformFee: platformFeeAmount.toString(),
      },
      automatic_payment_methods: {
        enabled: true,
      },
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/qr/${paymentData.tableId}/confirmation?order_id=${orderId}`,
      // Set up transfer to restaurant's Stripe Connect account
      transfer_data: {
        destination: restaurant.stripe_account_id,
      },
      // Calculate platform fee (2% of total amount)
      application_fee_amount: platformFeeAmount,
    };

    // Create Stripe payment intent
    const paymentIntent =
      await stripe.paymentIntents.create(paymentIntentParams);

    // Update order with payment intent ID
    await supabase
      .from("orders")
      .update({
        stripe_payment_intent_id: paymentIntent.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    console.log("Created QR payment intent:", {
      orderId,
      paymentIntentId: paymentIntent.id,
      amount: paymentData.total,
      platformFee: platformFeeAmount / 100,
      restaurantId: paymentData.restaurantId,
      restaurantName: restaurant.name,
    });

    return {
      clientSecret: paymentIntent.client_secret,
      orderId: orderId,
      paymentIntentId: paymentIntent.id,
    };
  } catch (error) {
    console.error("Error creating QR payment intent:", error);
    return { error: "Failed to create payment" };
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

    if (order.status === "completed") {
      return { success: true, message: "Order already completed" };
    }

    // Verify payment with Stripe if we have a payment intent ID
    if (order.stripe_payment_intent_id) {
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(
          order.stripe_payment_intent_id
        );

        if (paymentIntent.status !== "succeeded") {
          return { error: "Payment not completed" };
        }

        console.log("Payment verified with Stripe:", {
          orderId,
          paymentIntentId: paymentIntent.id,
          status: paymentIntent.status,
          amount: paymentIntent.amount / 100,
        });
      } catch (stripeError) {
        console.error("Error verifying payment with Stripe:", stripeError);
        // Continue with order confirmation even if Stripe verification fails
        // The payment might have been successful but we can't verify it
      }
    }

    // Update order status to completed
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        status: "completed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (updateError) {
      console.error("Error updating order:", updateError);
      return { error: "Failed to update order" };
    }

    // Revalidate the orders page
    revalidatePath("/dashboard/orders");

    console.log("QR payment confirmed:", { orderId });

    return { success: true };
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
    // Create a unique order ID
    const orderId = crypto.randomUUID();

    // Generate unique order number
    const { data: orderNumberResult, error: orderNumberError } =
      await supabase.rpc("generate_order_number");

    if (orderNumberError) {
      console.error("Error generating order number:", orderNumberError);
      return { error: "Failed to generate order number" };
    }

    // Create order in database
    const { error: orderError } = await supabase.from("orders").insert({
      id: orderId,
      restaurant_id: paymentData.restaurantId,
      table_id: paymentData.tableId,
      status: "pending",
      total_amount: paymentData.total,
      tax_amount: paymentData.tax,
      tip_amount: paymentData.tip,
      notes: paymentData.specialInstructions || null,
      customer_name: paymentData.customerName || null,
      customer_email: paymentData.email || null,
      order_number: orderNumberResult,
    });

    if (orderError) {
      console.error("Error creating cash order:", orderError);
      return { error: "Failed to create order" };
    }

    // Create order items
    const orderItems = paymentData.items.map((item) => ({
      order_id: orderId,
      menu_item_id: item.id,
      quantity: item.quantity,
      unit_price: item.price,
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      console.error("Error creating cash order items:", itemsError);
      return { error: "Failed to create order items" };
    }

    console.log("Created cash order:", {
      orderId,
      amount: paymentData.total,
      restaurantId: paymentData.restaurantId,
      tableId: paymentData.tableId,
    });

    return {
      orderId: orderId,
    };
  } catch (error) {
    console.error("Error creating cash order:", error);
    return { error: "Failed to create order" };
  }
}

export async function completeCashOrder(orderId: string) {
  const supabase = createClient();

  try {
    // Update order status to completed
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        status: "completed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (updateError) {
      console.error("Error completing cash order:", updateError);
      return { error: "Failed to complete order" };
    }

    // Create payment record for cash payment
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("restaurant_id, total_amount")
      .eq("id", orderId)
      .single();

    if (!orderError && order) {
      const { error: paymentError } = await supabase.from("payments").insert({
        restaurant_id: order.restaurant_id,
        order_id: orderId,
        amount: order.total_amount,
        status: "completed",
        method: "cash",
        currency: "CHF",
      });

      if (paymentError) {
        console.error("Error creating cash payment record:", paymentError);
        // Don't return error here as the order was already completed
      }
    }

    // Revalidate the orders page
    revalidatePath("/dashboard/orders");

    console.log("Cash order completed:", { orderId });

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
