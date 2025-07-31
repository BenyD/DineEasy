import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { clientSecret, orderId, tableId } = await request.json();

    // Validate required parameters
    if (!clientSecret || !orderId || !tableId) {
      return NextResponse.json(
        { success: false, error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Validate client secret format
    if (!clientSecret.startsWith("pi_") && !clientSecret.includes("_secret_")) {
      return NextResponse.json(
        { success: false, error: "Invalid payment intent format" },
        { status: 400 }
      );
    }

    // Retrieve payment intent from Stripe
    let paymentIntent;
    try {
      paymentIntent = await stripe.paymentIntents.retrieve(clientSecret);
    } catch (error: any) {
      console.error("Error retrieving payment intent:", error);
      return NextResponse.json(
        { success: false, error: "Invalid payment intent" },
        { status: 400 }
      );
    }

    // Validate payment intent status
    if (paymentIntent.status === "succeeded") {
      return NextResponse.json(
        { success: false, error: "Payment already completed" },
        { status: 400 }
      );
    }

    if (paymentIntent.status === "canceled") {
      return NextResponse.json(
        { success: false, error: "Payment was canceled" },
        { status: 400 }
      );
    }

    // Get order details from database
    const supabase = createClient();
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(`
        id,
        table_id,
        status,
        created_at,
        tables (
          id,
          restaurant_id
        )
      `)
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      console.error("Error fetching order:", orderError);
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    // Validate order belongs to correct table
    if (order.table_id !== tableId) {
      console.error("Table mismatch:", {
        orderTableId: order.table_id,
        requestTableId: tableId,
      });
      return NextResponse.json(
        { success: false, error: "Order does not belong to this table" },
        { status: 403 }
      );
    }

    // Validate order status
    if (order.status !== "pending") {
      return NextResponse.json(
        { success: false, error: "Order is not in pending status" },
        { status: 400 }
      );
    }

    // Validate payment intent metadata matches order
    const paymentOrderId = paymentIntent.metadata?.orderId;
    if (paymentOrderId !== orderId) {
      console.error("Order ID mismatch:", {
        paymentOrderId,
        requestOrderId: orderId,
      });
      return NextResponse.json(
        { success: false, error: "Payment intent does not match order" },
        { status: 403 }
      );
    }

    // Check if order has timed out
    const orderTime = new Date(order.created_at).getTime();
    const currentTime = Date.now();
    const timeoutMs = 30 * 60 * 1000; // 30 minutes
    if (currentTime - orderTime > timeoutMs) {
      return NextResponse.json(
        { success: false, error: "Order has timed out" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      paymentIntent: {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
      },
      order: {
        id: order.id,
        status: order.status,
        tableId: order.table_id,
      },
    });
  } catch (error: any) {
    console.error("Payment validation error:", error);
    return NextResponse.json(
      { success: false, error: "Payment validation failed" },
      { status: 500 }
    );
  }
} 