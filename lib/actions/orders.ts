"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  modifiers?: string[];
}

export interface Order {
  id: string;
  orderNumber: string;
  tableNumber: string;
  customerName?: string;
  items: OrderItem[];
  status: string;
  time: Date;
  estimatedTime?: number;
  notes?: string;
  total: number;
  paymentStatus: string;
  paymentMethod?: string;
  priority?: string;
  restaurant_id: string;
  table_id: string;
  total_amount: number;
  tax_amount: number;
  tip_amount: number;
  created_at: string;
  updated_at: string;
  stripe_payment_intent_id?: string;
  stripe_checkout_session_id?: string;
}

export interface OrderFilters {
  status?: string;
  search?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  historyOnly?: boolean; // If true, only return completed, cancelled, or refunded orders
}

export async function getRestaurantOrders(
  restaurantId: string,
  filters?: OrderFilters
): Promise<{ success: boolean; data?: Order[]; error?: string }> {
  const supabase = createClient();

  try {
    let query = supabase
      .from("orders")
      .select(
        `
        *,
        tables (
          number
        ),
        order_items (
          *,
          menu_items (
            name,
            price
          )
        ),
        payments (
          status,
          method
        )
      `
      )
      .eq("restaurant_id", restaurantId)
      .order("created_at", { ascending: false });

    // Apply history filter - only show completed, cancelled, or refunded orders
    if (filters?.historyOnly) {
      query = query.in("status", ["completed", "cancelled"]);
    }
    // For active orders (not history), fetch all and filter in JS
    else {
      // Only apply status filter in SQL if specified
      if (filters?.status && filters.status !== "all") {
        query = query.eq("status", filters.status);
      }
    }

    // Apply date range filter
    if (filters?.dateRange) {
      query = query
        .gte("created_at", filters.dateRange.start.toISOString())
        .lte("created_at", filters.dateRange.end.toISOString());
    }

    const { data: orders, error } = await query;

    if (error) {
      console.error("Error fetching orders:", error);
      return { success: false, error: "Failed to fetch orders" };
    }

    // For active orders, filter out completed and cancelled in JS
    let filteredOrders = orders || [];
    if (!filters?.historyOnly) {
      filteredOrders = filteredOrders.filter(
        (order) => order.status !== "completed" && order.status !== "cancelled"
      );
    }

    // Transform the data to match the expected format
    const transformedOrders: Order[] =
      filteredOrders.map((order) => {
        const items: OrderItem[] =
          order.order_items?.map((item: any) => ({
            id: item.id,
            name: item.menu_items?.name || "Unknown Item",
            quantity: item.quantity,
            price: item.unit_price,
            modifiers: [], // We can add modifiers later if needed
          })) || [];

        const paymentStatus = order.payments?.[0]?.status || "pending";
        // Determine payment method based on available fields
        let paymentMethod = order.payments?.[0]?.method || "other";
        if (paymentMethod === "other" && order.stripe_payment_intent_id) {
          paymentMethod = "card";
        } else if (
          paymentMethod === "other" &&
          order.stripe_checkout_session_id
        ) {
          paymentMethod = "card";
        } else if (
          paymentMethod === "other" &&
          !order.stripe_payment_intent_id &&
          !order.stripe_checkout_session_id
        ) {
          paymentMethod = "cash";
        }
        const tableNumber = order.tables?.number || "Unknown";

        return {
          id: order.id,
          orderNumber:
            order.order_number || `ORD-${order.id.slice(-8).toUpperCase()}`,
          tableNumber,
          customerName: order.customer_name || undefined,
          items,
          status: order.status,
          time: new Date(order.created_at),
          estimatedTime: 15, // Default estimated time
          notes: order.notes,
          total: order.total_amount,
          paymentStatus,
          paymentMethod,
          priority: "normal", // Default priority
          restaurant_id: order.restaurant_id,
          table_id: order.table_id,
          total_amount: order.total_amount,
          tax_amount: order.tax_amount,
          tip_amount: order.tip_amount,
          created_at: order.created_at,
          updated_at: order.updated_at,
          stripe_payment_intent_id: order.stripe_payment_intent_id,
          stripe_checkout_session_id: order.stripe_checkout_session_id,
        };
      }) || [];

    // Apply search filter if provided
    let finalFilteredOrders = transformedOrders;
    if (filters?.search) {
      const searchTerm = filters.search.toLowerCase();
      finalFilteredOrders = transformedOrders.filter(
        (order) =>
          order.id.toLowerCase().includes(searchTerm) ||
          order.orderNumber.toLowerCase().includes(searchTerm) ||
          order.tableNumber.toLowerCase().includes(searchTerm) ||
          (order.customerName &&
            order.customerName.toLowerCase().includes(searchTerm)) ||
          order.items.some((item) =>
            item.name.toLowerCase().includes(searchTerm)
          ) ||
          (order.notes && order.notes.toLowerCase().includes(searchTerm))
      );
    }

    return { success: true, data: finalFilteredOrders };
  } catch (error) {
    console.error("Error in getRestaurantOrders:", error);
    return { success: false, error: "Failed to fetch orders" };
  }
}

export async function updateOrderStatus(
  orderId: string,
  newStatus: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient();

  try {
    // First, get the current order details to check payment status
    const { data: order, error: fetchError } = await supabase
      .from("orders")
      .select(
        `
        id,
        status,
        table_id,
        stripe_payment_intent_id,
        stripe_checkout_session_id,
        payments (
          status,
          method
        )
      `
      )
      .eq("id", orderId)
      .single();

    if (fetchError) {
      console.error("Error fetching order details:", fetchError);
      return { success: false, error: "Failed to fetch order details" };
    }

    // Update the order status
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (updateError) {
      console.error("Error updating order status:", updateError);
      return { success: false, error: "Failed to update order status" };
    }

    // Check if order should be automatically completed
    // For card orders: auto-complete when served (since already paid)
    // For cash orders: auto-complete when paid (since already served)
    if (newStatus === "served") {
      const payment = order.payments?.[0];
      const isPaid = payment?.status === "completed";
      const isCardOrder =
        order.stripe_payment_intent_id || order.stripe_checkout_session_id;

      if (isCardOrder && isPaid) {
        // Card orders: auto-complete when served (already paid)
        const { error: completeError } = await supabase
          .from("orders")
          .update({
            status: "completed",
            updated_at: new Date().toISOString(),
          })
          .eq("id", orderId);

        if (completeError) {
          console.error("Error auto-completing card order:", completeError);
          // Don't fail the original status update, just log the error
        } else {
          console.log(
            `Card order ${orderId} automatically completed (paid and served)`
          );
        }
      }
      // Cash orders: don't auto-complete when served, wait for payment
    }

    // Update table status based on order status
    if (newStatus === "completed" || newStatus === "cancelled") {
      // Mark table as available when order is completed or cancelled
      const { error: tableError } = await supabase
        .from("tables")
        .update({
          status: "available",
          updated_at: new Date().toISOString(),
        })
        .eq("id", order.table_id);

      if (tableError) {
        console.error("Error updating table status:", tableError);
        // Don't fail the order status update, just log the error
      } else {
        console.log(`Table ${order.table_id} marked as available`);
      }
    } else if (
      newStatus === "preparing" ||
      newStatus === "ready" ||
      newStatus === "served"
    ) {
      // Mark table as occupied when order is active
      const { error: tableError } = await supabase
        .from("tables")
        .update({
          status: "occupied",
          updated_at: new Date().toISOString(),
        })
        .eq("id", order.table_id);

      if (tableError) {
        console.error("Error updating table status:", tableError);
        // Don't fail the order status update, just log the error
      } else {
        console.log(`Table ${order.table_id} marked as occupied`);
      }
    }

    revalidatePath("/dashboard/orders");
    revalidatePath("/dashboard/tables");
    return { success: true };
  } catch (error) {
    console.error("Error in updateOrderStatus:", error);
    return { success: false, error: "Failed to update order status" };
  }
}

export async function getOrderAnalytics(
  restaurantId: string,
  days: number = 30
): Promise<{
  success: boolean;
  data?: {
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
    ordersByStatus: Record<string, number>;
    recentOrders: Order[];
  };
  error?: string;
}> {
  const supabase = createClient();

  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get orders for the specified period
    const { data: orders, error } = await supabase
      .from("orders")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching order analytics:", error);
      return { success: false, error: "Failed to fetch analytics" };
    }

    const totalOrders = orders?.length || 0;
    const totalRevenue =
      orders?.reduce((sum, order) => sum + order.total_amount, 0) || 0;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Group orders by status
    const ordersByStatus: Record<string, number> = {};
    orders?.forEach((order) => {
      ordersByStatus[order.status] = (ordersByStatus[order.status] || 0) + 1;
    });

    // Get recent orders (last 10)
    const recentOrders =
      orders?.slice(0, 10).map((order) => ({
        id: order.id,
        orderNumber:
          order.order_number || `ORD-${order.id.slice(-8).toUpperCase()}`,
        tableNumber: "Unknown", // We'll need to join with tables table
        customerName: undefined,
        items: [], // We'll need to join with order_items table
        status: order.status,
        time: new Date(order.created_at),
        estimatedTime: 15,
        notes: order.notes,
        total: order.total_amount,
        paymentStatus: "pending", // We'll need to join with payments table
        priority: "normal",
        restaurant_id: order.restaurant_id,
        table_id: order.table_id,
        total_amount: order.total_amount,
        tax_amount: order.tax_amount,
        tip_amount: order.tip_amount,
        created_at: order.created_at,
        updated_at: order.updated_at,
        stripe_payment_intent_id: order.stripe_payment_intent_id,
        stripeCheckoutSessionId: order.stripe_checkout_session_id,
      })) || [];

    return {
      success: true,
      data: {
        totalOrders,
        totalRevenue,
        averageOrderValue,
        ordersByStatus,
        recentOrders,
      },
    };
  } catch (error) {
    console.error("Error in getOrderAnalytics:", error);
    return { success: false, error: "Failed to fetch analytics" };
  }
}

export async function deleteOrder(
  orderId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  try {
    // First delete order items
    const { error: itemsError } = await supabase
      .from("order_items")
      .delete()
      .eq("order_id", orderId);

    if (itemsError) {
      console.error("Error deleting order items:", itemsError);
      return { success: false, error: "Failed to delete order items" };
    }

    // Then delete the order
    const { error: orderError } = await supabase
      .from("orders")
      .delete()
      .eq("id", orderId);

    if (orderError) {
      console.error("Error deleting order:", orderError);
      return { success: false, error: "Failed to delete order" };
    }

    revalidatePath("/dashboard/orders");
    return { success: true };
  } catch (error) {
    console.error("Error in deleteOrder:", error);
    return { success: false, error: "Failed to delete order" };
  }
}

export async function refundOrder(
  orderId: string,
  refundReason?: string
): Promise<{ success: boolean; error?: string; refundId?: string }> {
  const supabase = createAdminClient();

  try {
    // Get order with payment details
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(
        `
        *,
        payments (
          id,
          method,
          status,
          stripe_payment_id
        )
      `
      )
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      console.error("Order not found for refund:", { orderId, orderError });
      return { success: false, error: "Order not found" };
    }

    console.log("Found order for refund:", {
      orderId,
      orderStatus: order.status,
      stripePaymentIntentId: order.stripe_payment_intent_id,
      paymentMethod: order.payments?.[0]?.method,
      paymentStatus: order.payments?.[0]?.status,
    });

    // Check if order can be refunded
    if (order.status === "cancelled") {
      return { success: false, error: "Order is already cancelled/refunded" };
    }

    const payment = order.payments?.[0];
    if (!payment || payment.status !== "completed") {
      return { success: false, error: "No completed payment found for refund" };
    }

    let refundId: string | undefined;

    // Handle refund based on payment method
    if (
      payment.method === "card" &&
      (order.stripe_payment_intent_id || order.stripe_checkout_session_id)
    ) {
      // Card payment - process Stripe refund
      try {
        const { stripe } = await import("@/lib/stripe");

        // Get payment intent ID from either direct field or checkout session
        let paymentIntentId = order.stripe_payment_intent_id;
        if (!paymentIntentId && order.stripe_checkout_session_id) {
          const session = await stripe.checkout.sessions.retrieve(
            order.stripe_checkout_session_id
          );
          paymentIntentId = session.payment_intent as string;
        }

        if (!paymentIntentId) {
          return {
            success: false,
            error: "No payment intent found for refund",
          };
        }

        // Create refund in Stripe
        const stripeRefund = await stripe.refunds.create({
          payment_intent: paymentIntentId,
          reason:
            (refundReason as
              | "duplicate"
              | "fraudulent"
              | "requested_by_customer") || "requested_by_customer",
          metadata: {
            order_id: orderId,
            restaurant_id: order.restaurant_id,
          },
        });

        refundId = stripeRefund.id;
        console.log("Stripe refund created:", refundId);
      } catch (stripeError) {
        console.error("Stripe refund error:", stripeError);
        return { success: false, error: "Failed to process Stripe refund" };
      }
    } else if (payment.method === "cash") {
      // Cash payment - just mark as refunded (restaurant handles physical refund)
      console.log("Cash order refund - restaurant to handle physical refund");
      refundId = `cash-${Date.now()}`; // Generate a cash refund ID
    } else {
      return { success: false, error: "Unsupported payment method for refund" };
    }

    // Update order status to cancelled (we use cancelled for refunded orders)
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (updateError) {
      console.error("Error updating order status:", updateError);
      return { success: false, error: "Failed to update order status" };
    }

    // Update payment status to refunded
    const { error: paymentUpdateError } = await supabase
      .from("payments")
      .update({
        status: "refunded",
        refund_id: refundId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", payment.id);

    if (paymentUpdateError) {
      console.error("Error updating payment status:", paymentUpdateError);
      return { success: false, error: "Failed to update payment status" };
    }

    console.log("Order refunded successfully:", {
      orderId,
      refundId,
      paymentMethod: payment.method,
    });

    return { success: true, refundId };
  } catch (error) {
    console.error("Error refunding order:", error);
    return { success: false, error: "Failed to refund order" };
  }
}

export async function cancelOrder(
  orderId: string,
  cancellationReason?: string
): Promise<{ success: boolean; error?: string; refundId?: string }> {
  const supabase = createAdminClient();

  try {
    // Get order with payment details
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(
        `
        *,
        payments (
          id,
          method,
          status,
          stripe_payment_id
        )
      `
      )
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      console.error("Order not found for cancellation:", {
        orderId,
        orderError,
      });
      return { success: false, error: "Order not found" };
    }

    console.log("Found order for cancellation:", {
      orderId,
      orderStatus: order.status,
      stripePaymentIntentId: order.stripe_payment_intent_id,
      stripeCheckoutSessionId: order.stripe_checkout_session_id,
      paymentMethod: order.payments?.[0]?.method,
      paymentStatus: order.payments?.[0]?.status,
    });

    // Check if order can be cancelled
    if (order.status === "cancelled") {
      return { success: false, error: "Order is already cancelled" };
    }

    const payment = order.payments?.[0];
    let refundId: string | undefined;

    // Handle cancellation based on order status and payment method
    if (order.status === "pending") {
      // Order is still pending - can be cancelled without refund
      console.log("Cancelling pending order - no refund needed");
    } else if (payment && payment.status === "completed") {
      // Order has been paid - need to handle refund
      if (
        payment.method === "card" &&
        (order.stripe_payment_intent_id || order.stripe_checkout_session_id)
      ) {
        // Card payment - process Stripe refund
        try {
          const { stripe } = await import("@/lib/stripe");

          // Get payment intent ID from either direct field or checkout session
          let paymentIntentId = order.stripe_payment_intent_id;
          if (!paymentIntentId && order.stripe_checkout_session_id) {
            const session = await stripe.checkout.sessions.retrieve(
              order.stripe_checkout_session_id
            );
            paymentIntentId = session.payment_intent as string;
          }

          if (!paymentIntentId) {
            return {
              success: false,
              error: "No payment intent found for refund",
            };
          }

          const stripeRefund = await stripe.refunds.create({
            payment_intent: paymentIntentId,
            reason: "requested_by_customer",
            metadata: {
              order_id: orderId,
              restaurant_id: order.restaurant_id,
              cancellation_reason: cancellationReason || "customer_request",
            },
          });

          refundId = stripeRefund.id;
          console.log("Stripe refund created for cancelled order:", refundId);
        } catch (stripeError) {
          console.error("Stripe refund error:", stripeError);
          return { success: false, error: "Failed to process Stripe refund" };
        }
      } else if (payment.method === "cash") {
        // Cash payment - restaurant handles physical refund
        console.log(
          "Cash order cancellation - restaurant to handle physical refund"
        );
        refundId = `cash-${Date.now()}`; // Generate a cash refund ID
      }
    }

    // Update order status to cancelled
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (updateError) {
      console.error("Error updating order status:", updateError);
      return { success: false, error: "Failed to update order status" };
    }

    // Mark table as available when order is cancelled
    const { error: tableError } = await supabase
      .from("tables")
      .update({
        status: "available",
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.table_id);

    if (tableError) {
      console.error("Error updating table status:", tableError);
      // Don't fail the order cancellation, just log the error
    } else {
      console.log(
        `Table ${order.table_id} marked as available after order cancellation`
      );
    }

    // Update payment status if payment record exists
    if (payment) {
      const { error: paymentUpdateError } = await supabase
        .from("payments")
        .update({
          status: refundId ? "refunded" : "cancelled",
          refund_id: refundId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", payment.id);

      if (paymentUpdateError) {
        console.error("Error updating payment status:", paymentUpdateError);
        return { success: false, error: "Failed to update payment status" };
      }
    }

    console.log("Order cancelled successfully:", {
      orderId,
      refundId,
      paymentMethod: payment?.method,
    });

    revalidatePath("/dashboard/orders");
    revalidatePath("/dashboard/tables");
    return { success: true, refundId };
  } catch (error) {
    console.error("Error cancelling order:", error);
    return { success: false, error: "Failed to cancel order" };
  }
}
