import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { sessionId, orderId, tableId } = await request.json();

    // Validate required parameters
    if (!sessionId || !tableId) {
      return NextResponse.json(
        { success: false, error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Validate session ID format
    if (!sessionId.startsWith("cs_")) {
      return NextResponse.json(
        { success: false, error: "Invalid session ID format" },
        { status: 400 }
      );
    }

    console.log("Validating checkout session:", sessionId);

    // Retrieve checkout session from Stripe
    let session;
    try {
      session = await stripe.checkout.sessions.retrieve(sessionId);
      console.log("Checkout session retrieved successfully:", {
        id: session.id,
        status: session.status,
        paymentStatus: session.payment_status,
        amount: session.amount_total,
        currency: session.currency,
        metadata: session.metadata,
      });
    } catch (error: any) {
      console.error("Error retrieving checkout session:", error);
      return NextResponse.json(
        { success: false, error: "Invalid checkout session" },
        { status: 400 }
      );
    }

    // Validate session status
    if (session.status === "expired") {
      return NextResponse.json(
        { success: false, error: "Checkout session has expired" },
        { status: 400 }
      );
    }

    if (session.status === "open") {
      return NextResponse.json(
        { success: false, error: "Payment not completed" },
        { status: 400 }
      );
    }

    // Get order details from database
    const supabase = createClient();
    let order;
    let orderError;

    if (orderId) {
      // If orderId is provided, fetch the specific order
      const result = await supabase
        .from("orders")
        .select(
          `
          id,
          table_id,
          status,
          created_at,
          tables (
            id,
            restaurant_id
          )
        `
        )
        .eq("id", orderId)
        .single();

      order = result.data;
      orderError = result.error;
    } else {
      // If no orderId provided, try to find the order
      const sessionOrderId = session.metadata?.orderId;
      if (sessionOrderId) {
        // Try to find order by session metadata
        const result = await supabase
          .from("orders")
          .select(
            `
            id,
            table_id,
            status,
            created_at,
            tables (
              id,
              restaurant_id
            )
          `
          )
          .eq("id", sessionOrderId)
          .single();

        order = result.data;
        orderError = result.error;
      } else {
        // Try to find order by table and recent creation time
        console.log("Searching for order by table and recent creation:", {
          tableId,
          sessionOrderId: sessionOrderId || "not provided",
        });

        const result = await supabase
          .from("orders")
          .select(
            `
            id,
            table_id,
            status,
            created_at,
            tables (
              id,
              restaurant_id
            )
          `
          )
          .eq("table_id", tableId)
          .in("status", ["pending", "completed"])
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        order = result.data;
        orderError = result.error;

        console.log("Order search result:", {
          found: !!order,
          orderId: order?.id,
          error: orderError,
        });
      }
    }

    if (orderError || !order) {
      console.error("Error fetching order:", {
        orderError,
        orderId,
        sessionOrderId: session.metadata?.orderId,
        tableId,
        searchStrategy: orderId ? "by orderId" : "by table and recent creation",
      });
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    console.log("Order found successfully:", {
      orderId: order.id,
      tableId: order.table_id,
      status: order.status,
      created_at: order.created_at,
    });

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

    // Validate order status - accept both pending and completed orders
    if (order.status !== "pending" && order.status !== "completed") {
      return NextResponse.json(
        { success: false, error: "Order is not in a valid status" },
        { status: 400 }
      );
    }

    // Validate session metadata matches order (only if orderId was provided)
    if (orderId) {
      const sessionOrderId = session.metadata?.orderId;
      if (sessionOrderId !== orderId) {
        console.error("Order ID mismatch:", {
          sessionOrderId,
          requestOrderId: orderId,
        });
        return NextResponse.json(
          { success: false, error: "Checkout session does not match order" },
          { status: 403 }
        );
      }
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
      session: {
        id: session.id,
        status: session.status,
        paymentStatus: session.payment_status,
        amount: session.amount_total,
        currency: session.currency,
        paymentIntentId: session.payment_intent as string,
      },
      order: {
        id: order.id,
        status: order.status,
        tableId: order.table_id,
      },
    });
  } catch (error: any) {
    console.error("Session validation error:", error);
    return NextResponse.json(
      { success: false, error: "Session validation failed" },
      { status: 500 }
    );
  }
}
