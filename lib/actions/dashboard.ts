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
    // Get card payments from payments table
    const { data: cardPayments, error: cardError } = await supabase
      .from("payments")
      .select(
        `
        id,
        amount,
        method,
        status,
        created_at,
        orders (
          table_id,
          tables (
            number
          )
        )
      `
      )
      .eq("restaurant_id", restaurantId)
      .order("created_at", { ascending: false })
      .limit(10);

    if (cardError) throw cardError;

    // Get cash orders from orders table (where stripe_payment_intent_id is null)
    const { data: cashOrders, error: cashError } = await supabase
      .from("orders")
      .select(
        `
        id,
        total_amount,
        created_at,
        status,
        customer_name,
        tables (
          number
        )
      `
      )
      .eq("restaurant_id", restaurantId)
      .is("stripe_payment_intent_id", null)
      .order("created_at", { ascending: false })
      .limit(10);

    if (cashError) throw cashError;

    // Transform card payments
    const cardPaymentsData =
      cardPayments?.map((payment) => {
        const timeAgo = getTimeAgo(new Date(payment.created_at));
        const order = payment.orders?.[0];

        return {
          id: payment.id,
          amount: formatAmountWithCurrency(payment.amount, currency),
          method: payment.method || "card",
          status: payment.status,
          time: timeAgo,
          customer: order?.tables?.[0]?.number
            ? `Table ${order.tables[0].number}`
            : "Guest",
          table: order?.tables?.[0]?.number || null,
          orderId: payment.id, // Use payment id since order doesn't have id in this structure
          tip: 0, // No tip data in this structure
          fee: 0, // No fee data in this structure
          created_at: payment.created_at, // Keep for sorting
        };
      }) || [];

    // Transform cash orders
    const cashOrdersData =
      cashOrders?.map((order) => {
        const timeAgo = getTimeAgo(new Date(order.created_at));

        return {
          id: `cash-${order.id}`,
          amount: formatAmountWithCurrency(order.total_amount, currency),
          method: "cash",
          status: order.status === "completed" ? "completed" : "pending",
          time: timeAgo,
          customer: order.customer_name || "Guest",
          table: order.tables?.[0]?.number || null,
          orderId: order.id,
          tip: 0, // No tip data in this structure
          fee: 0, // No fee data in this structure
          created_at: order.created_at, // Keep for sorting
        };
      }) || [];

    // Combine and sort by creation date, take top 5
    const allPayments = [...cardPaymentsData, ...cashOrdersData]
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      .slice(0, 5);

    return {
      success: true,
      data: allPayments,
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
