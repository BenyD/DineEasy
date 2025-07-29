"use server";

import { createClient } from "@/lib/supabase/server";
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
        // Determine payment method: if no payment record exists, infer from order type
        let paymentMethod = order.payments?.[0]?.method || "unknown";
        if (paymentMethod === "unknown" && order.stripe_payment_intent_id) {
          paymentMethod = "card"; // Stripe payment
        } else if (
          paymentMethod === "unknown" &&
          !order.stripe_payment_intent_id
        ) {
          paymentMethod = "cash"; // Cash payment (no stripe intent)
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
  const supabase = createClient();

  try {
    const { error } = await supabase
      .from("orders")
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (error) {
      console.error("Error updating order status:", error);
      return { success: false, error: "Failed to update order status" };
    }

    revalidatePath("/dashboard/orders");
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
  orderId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  try {
    // First, just get the basic order to check if it exists
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
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
    });

    // Since customers pay first, refund and cancel are essentially the same
    // Both operations return money to the customer

    // Check if this is a Stripe payment that needs refund
    if (order.stripe_payment_intent_id) {
      // Get payment details for Stripe refund
      const { data: payment, error: paymentError } = await supabase
        .from("payments")
        .select("method, status")
        .eq("order_id", orderId)
        .single();

      if (
        payment &&
        payment.method === "card" &&
        payment.status === "completed"
      ) {
        try {
          // Import stripe here to avoid issues
          const { stripe } = await import("@/lib/stripe");

          // Create refund in Stripe
          const refund = await stripe.refunds.create({
            payment_intent: order.stripe_payment_intent_id,
            reason: "requested_by_customer",
          });

          console.log("Stripe refund created:", refund.id);
        } catch (stripeError) {
          console.error("Stripe refund error:", stripeError);
          return { success: false, error: "Failed to process Stripe refund" };
        }
      } else {
        console.log("No completed card payment found for refund");
        return {
          success: false,
          error: "No completed card payment found for refund",
        };
      }
    } else {
      console.log(
        "No Stripe payment intent found - this might be a cash order"
      );
      // For cash orders, we just mark as refunded without Stripe processing
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

    // Update payment status to refunded if payment record exists
    const { error: paymentUpdateError } = await supabase
      .from("payments")
      .update({
        status: "refunded",
        updated_at: new Date().toISOString(),
      })
      .eq("order_id", orderId);

    if (paymentUpdateError) {
      console.error("Error updating payment status:", paymentUpdateError);
      // Don't fail the whole operation if payment update fails
    }

    console.log("Order refunded successfully:", {
      orderId,
      orderStatus: order.status,
    });
    return { success: true };
  } catch (error) {
    console.error("Error refunding order:", error);
    return { success: false, error: "Failed to refund order" };
  }
}

export async function cancelOrder(
  orderId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  try {
    // First, just get the basic order to check if it exists
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
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
    });

    // Since customers pay first, cancellation always requires a refund
    if (order.stripe_payment_intent_id) {
      // Get payment details for Stripe refund
      const { data: payment, error: paymentError } = await supabase
        .from("payments")
        .select("method, status")
        .eq("order_id", orderId)
        .single();

      if (
        payment &&
        payment.method === "card" &&
        payment.status === "completed"
      ) {
        try {
          // Import stripe here to avoid issues
          const { stripe } = await import("@/lib/stripe");

          // Create refund in Stripe for cancelled order
          const refund = await stripe.refunds.create({
            payment_intent: order.stripe_payment_intent_id,
            reason: "requested_by_customer",
          });

          console.log("Stripe refund created for cancelled order:", refund.id);
        } catch (stripeError) {
          console.error("Stripe refund error:", stripeError);
          return { success: false, error: "Failed to process Stripe refund" };
        }
      } else {
        console.log("No completed card payment found for refund");
        return {
          success: false,
          error: "No completed card payment found for refund",
        };
      }
    } else {
      console.log(
        "No Stripe payment intent found - this might be a cash order"
      );
      // For cash orders, we just mark as cancelled without Stripe processing
    }

    // Update order status to cancelled (works for both cash and card orders)
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

    // Update payment status to cancelled if payment record exists
    const { error: paymentUpdateError } = await supabase
      .from("payments")
      .update({
        status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("order_id", orderId);

    if (paymentUpdateError) {
      console.error("Error updating payment status:", paymentUpdateError);
      // Don't fail the whole operation if payment update fails
    }

    console.log("Order cancelled successfully:", {
      orderId,
      orderStatus: order.status,
    });
    return { success: true };
  } catch (error) {
    console.error("Error cancelling order:", error);
    return { success: false, error: "Failed to cancel order" };
  }
}
