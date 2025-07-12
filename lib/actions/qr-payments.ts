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
}

export async function createQRPaymentIntent(paymentData: QRPaymentData) {
  const supabase = createClient();

  try {
    // Get restaurant details
    const { data: restaurant, error: restaurantError } = await supabase
      .from("restaurants")
      .select("id, name, stripe_account_id, currency")
      .eq("id", paymentData.restaurantId)
      .single();

    if (restaurantError || !restaurant) {
      return { error: "Restaurant not found" };
    }

    // Create a unique order ID
    const orderId = crypto.randomUUID();

    // Create order in database
    const { error: orderError } = await supabase.from("orders").insert({
      id: orderId,
      restaurant_id: paymentData.restaurantId,
      table_id: paymentData.tableId,
      status: "pending",
      total_amount: paymentData.total,
      tax_amount: paymentData.tax,
      tip_amount: paymentData.tip,
      notes: `QR Order - Table ${paymentData.tableId}`,
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
      },
      automatic_payment_methods: {
        enabled: true,
      },
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/qr/${paymentData.tableId}/confirmation?order_id=${orderId}`,
    };

    // If restaurant has Stripe Connect account, set up transfer
    if (restaurant.stripe_account_id) {
      paymentIntentParams.transfer_data = {
        destination: restaurant.stripe_account_id,
      };
      // Calculate 2% platform fee (2% of total amount)
      paymentIntentParams.application_fee_amount = Math.round(
        paymentData.total * 0.02 * 100 // 2% of total, converted to cents
      );
    }

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
 