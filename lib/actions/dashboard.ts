import { createClient } from "@/lib/supabase/server";
import { getRestaurantOrders } from "./orders";
import { formatAmountWithCurrency } from "@/lib/utils/currency";

async function getCurrentRestaurantId(): Promise<string> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  if (!restaurant) {
    throw new Error("Restaurant not found");
  }

  return restaurant.id;
}

async function getRestaurantCurrency(restaurantId: string): Promise<string> {
  const supabase = createClient();
  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("currency")
    .eq("id", restaurantId)
    .single();

  return restaurant?.currency || "CHF";
}

export async function getDashboardStats() {
  const supabase = createClient();
  const restaurantId = await getCurrentRestaurantId();
  const currency = await getRestaurantCurrency(restaurantId);

  try {
    // Get current month and previous month for comparison
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const currentWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Total Revenue (this month)
    const { data: currentMonthRevenue } = await supabase
      .from("orders")
      .select("total_amount")
      .eq("restaurant_id", restaurantId)
      .gte("created_at", currentMonth.toISOString())
      .eq("status", "completed");

    const { data: previousMonthRevenue } = await supabase
      .from("orders")
      .select("total_amount")
      .eq("restaurant_id", restaurantId)
      .gte("created_at", previousMonth.toISOString())
      .lt("created_at", currentMonth.toISOString())
      .eq("status", "completed");

    const currentRevenue =
      currentMonthRevenue?.reduce(
        (sum, order) => sum + order.total_amount,
        0
      ) || 0;
    const previousRevenue =
      previousMonthRevenue?.reduce(
        (sum, order) => sum + order.total_amount,
        0
      ) || 0;
    const revenueTrend =
      previousRevenue > 0
        ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
        : 0;

    // Orders (this week)
    const { data: currentWeekOrders } = await supabase
      .from("orders")
      .select("id")
      .eq("restaurant_id", restaurantId)
      .gte("created_at", currentWeek.toISOString());

    const { data: previousWeekOrders } = await supabase
      .from("orders")
      .select("id")
      .eq("restaurant_id", restaurantId)
      .gte(
        "created_at",
        new Date(currentWeek.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
      )
      .lt("created_at", currentWeek.toISOString());

    const currentOrders = currentWeekOrders?.length || 0;
    const previousOrders = previousWeekOrders?.length || 0;
    const ordersTrend =
      previousOrders > 0
        ? ((currentOrders - previousOrders) / previousOrders) * 100
        : 0;

    // Customers (total unique customers)
    const { data: customers } = await supabase
      .from("orders")
      .select("customer_email")
      .eq("restaurant_id", restaurantId)
      .not("customer_email", "is", null);

    const uniqueCustomers = new Set(
      customers?.map((order) => order.customer_email).filter(Boolean)
    ).size;

    // Average Order Value
    const { data: allCompletedOrders } = await supabase
      .from("orders")
      .select("total_amount")
      .eq("restaurant_id", restaurantId)
      .eq("status", "completed");

    const totalRevenue =
      allCompletedOrders?.reduce((sum, order) => sum + order.total_amount, 0) ||
      0;
    const totalOrders = allCompletedOrders?.length || 0;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    return {
      success: true,
      data: {
        totalRevenue: {
          value: currentRevenue,
          trend: revenueTrend,
          formatted: formatAmountWithCurrency(currentRevenue, currency),
        },
        orders: {
          value: currentOrders,
          trend: ordersTrend,
          formatted: currentOrders.toString(),
        },
        customers: {
          value: uniqueCustomers,
          trend: 0, // We'll calculate this if needed
          formatted: uniqueCustomers.toLocaleString(),
        },
        avgOrderValue: {
          value: avgOrderValue,
          trend: 0, // We'll calculate this if needed
          formatted: formatAmountWithCurrency(avgOrderValue, currency),
        },
      },
    };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return {
      success: false,
      error: "Failed to fetch dashboard stats",
    };
  }
}

export async function getRecentOrders() {
  const restaurantId = await getCurrentRestaurantId();
  const currency = await getRestaurantCurrency(restaurantId);

  try {
    const result = await getRestaurantOrders(restaurantId, {});

    if (!result.success || !result.data) {
      throw new Error(result.error || "Failed to fetch orders");
    }

    // Take the first 5 orders and transform them for dashboard display
    const recentOrders = result.data.slice(0, 5).map((order) => {
      const itemCount = order.items.reduce(
        (sum, item) => sum + item.quantity,
        0
      );
      const timeAgo = getTimeAgo(order.time);

      return {
        id: order.id,
        table:
          order.tableNumber !== "Unknown"
            ? `Table ${order.tableNumber}`
            : "No Table",
        items: itemCount,
        total: formatAmountWithCurrency(order.total, currency),
        status: order.status,
        time: timeAgo,
        customer: order.customerName || "No Customer",
        notes: order.notes || null,
        paymentStatus: order.paymentStatus || "pending",
      };
    });

    return {
      success: true,
      data: recentOrders,
    };
  } catch (error) {
    console.error("Error fetching recent orders:", error);
    return {
      success: false,
      error: "Failed to fetch recent orders",
    };
  }
}

export async function getRecentPayments() {
  const supabase = createClient();
  const restaurantId = await getCurrentRestaurantId();
  const currency = await getRestaurantCurrency(restaurantId);

  try {
    // Get all payments from payments table (both card and cash)
    const { data: allPayments, error: paymentsError } = await supabase
      .from("payments")
      .select(
        `
        id,
        amount,
        currency,
        status,
        method,
        created_at,
        order_id,
        stripe_payment_id,
        refund_id
      `
      )
      .eq("restaurant_id", restaurantId)
      .order("created_at", { ascending: false })
      .limit(10);

    if (paymentsError) throw paymentsError;

    // Get all corresponding orders
    const allOrderIds = (allPayments || [])
      .map((p) => p.order_id)
      .filter(Boolean);

    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select(
        `
        id,
        order_number,
        total_amount,
        table_id,
        notes,
        customer_name,
        tables (
          number
        )
      `
      )
      .in("id", allOrderIds);

    if (ordersError) throw ordersError;

    // Create a map for quick lookup
    const ordersMap = new Map((orders || []).map((order) => [order.id, order]));

    // Transform payments to match the payments page structure
    const transformedPayments = (allPayments || []).map((payment) => {
      const order = ordersMap.get(payment.order_id);

      return {
        id: payment.id,
        transactionId: payment.id,
        orderId: payment.order_id,
        orderNumber:
          order?.order_number || `#${payment.order_id?.slice(-8) || "N/A"}`,
        amount: payment.amount,
        currency: payment.currency || currency,
        status: payment.status,
        method: payment.method,
        created_at: payment.created_at,
        order_id: payment.order_id,
        stripe_payment_id: payment.stripe_payment_id,
        refund_id: payment.refund_id,
        customer_name: order?.customer_name || "Guest",
        table_number: order?.tables?.[0]?.number || null,
        order: order
          ? {
              id: order.id,
              order_number: order.order_number,
              total_amount: order.total_amount,
              table_id: order.table_id,
              notes: order.notes,
              customer_name: order.customer_name,
              tables: order.tables?.[0]
                ? { number: order.tables[0].number }
                : undefined,
            }
          : undefined,
      };
    });

    // Take top 5 most recent payments
    const recentPaymentsData = transformedPayments.slice(0, 5);

    return {
      success: true,
      data: recentPaymentsData,
    };
  } catch (error) {
    console.error("Error fetching recent payments:", error);
    return {
      success: false,
      error: "Failed to fetch recent payments",
    };
  }
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return `${diffInSeconds} sec ago`;
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} min ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? "s" : ""} ago`;
  }
}
