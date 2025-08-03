"use server";

import { createClient } from "@/lib/supabase/server";
import { stripe, refundPayment } from "@/lib/stripe";
import { revalidatePath } from "next/cache";

export interface PaymentStats {
  totalRevenue: number;
  totalTransactions: number;
  averageOrderValue: number;
  thisMonthRevenue: number;
  thisMonthTransactions: number;
  lastMonthRevenue: number;
  lastMonthTransactions: number;
  revenueGrowth: number;
  transactionGrowth: number;
  refundedAmount: number;
  refundedTransactions: number;
  // New payment method specific stats
  cardRevenue: number;
  cardTransactions: number;
  cashRevenue: number;
  cashTransactions: number;
  cardRevenueThisMonth: number;
  cardTransactionsThisMonth: number;
  cashRevenueThisMonth: number;
  cashTransactionsThisMonth: number;
}

export interface PaymentTransaction {
  id: string;
  transactionId?: string; // Explicit transaction ID
  orderId?: string; // Order ID for reference
  orderNumber?: string; // Human-readable order number
  amount: number;
  currency: string;
  status: string;
  method: string;
  created_at: string;
  order_id: string;
  stripe_payment_id: string;
  refund_id?: string;
  customer_name?: string;
  table_number?: number;
  order?: {
    id: string;
    order_number?: string;
    total_amount: number;
    table_id?: string;
    notes?: string;
    customer_name?: string;
    tables?: {
      number: number;
    };
  };
}

export interface StripeAccountInfo {
  id: string;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  requirements: any;
  business_type: string;
  company: {
    name: string;
  };
  created: number;
}

export interface PaymentMethodSettings {
  cardEnabled: boolean;
  cashEnabled: boolean;
}

export interface RefundRequest {
  paymentId: string;
  amount?: number;
  reason?: "duplicate" | "fraudulent" | "requested_by_customer";
  metadata?: Record<string, string>;
}

export interface PaymentCreateData {
  restaurantId: string;
  orderId: string;
  amount: number;
  currency: string;
  status: "pending" | "completed" | "failed";
  method: "card" | "cash" | "other";
  stripePaymentId?: string;
  metadata?: Record<string, any>;
}

// ============================================================================
// PAYMENT STATISTICS
// ============================================================================

export async function getPaymentStats(
  restaurantId: string
): Promise<PaymentStats> {
  const supabase = createClient();

  try {
    // Get current month stats
    const currentMonth = new Date();
    const currentMonthStart = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      1
    );
    const currentMonthEnd = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1,
      0
    );

    // Get last month stats
    const lastMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() - 1,
      1
    );
    const lastMonthStart = new Date(
      lastMonth.getFullYear(),
      lastMonth.getMonth(),
      1
    );
    const lastMonthEnd = new Date(
      lastMonth.getFullYear(),
      lastMonth.getMonth() + 1,
      0
    );

    // Get all card payments for the restaurant (from payments table where method = 'card')
    const { data: allCardPayments, error: allCardError } = await supabase
      .from("payments")
      .select("amount, status, created_at")
      .eq("restaurant_id", restaurantId)
      .eq("method", "card");

    if (allCardError) {
      console.error("Error fetching all card payments:", allCardError);
      throw allCardError;
    }

    // Get all cash payments for the restaurant (from payments table where method = 'cash')
    const { data: allCashPayments, error: allCashError } = await supabase
      .from("payments")
      .select("amount, status, created_at")
      .eq("restaurant_id", restaurantId)
      .eq("method", "cash");

    if (allCashError) {
      console.error("Error fetching all cash payments:", allCashError);
      throw allCashError;
    }

    // Get current month card payments
    const { data: currentMonthCardPayments, error: currentCardError } =
      await supabase
        .from("payments")
        .select("amount, status, created_at")
        .eq("restaurant_id", restaurantId)
        .eq("method", "card")
        .gte("created_at", currentMonthStart.toISOString())
        .lte("created_at", currentMonthEnd.toISOString());

    if (currentCardError) {
      console.error(
        "Error fetching current month card payments:",
        currentCardError
      );
      throw currentCardError;
    }

    // Get current month cash payments
    const { data: currentMonthCashPayments, error: currentCashError } =
      await supabase
        .from("payments")
        .select("amount, status, created_at")
        .eq("restaurant_id", restaurantId)
        .eq("method", "cash")
        .gte("created_at", currentMonthStart.toISOString())
        .lte("created_at", currentMonthEnd.toISOString());

    if (currentCashError) {
      console.error(
        "Error fetching current month cash payments:",
        currentCashError
      );
      throw currentCashError;
    }

    // Get last month card payments
    const { data: lastMonthCardPayments, error: lastCardError } = await supabase
      .from("payments")
      .select("amount, status, created_at")
      .eq("restaurant_id", restaurantId)
      .eq("method", "card")
      .gte("created_at", lastMonthStart.toISOString())
      .lte("created_at", lastMonthEnd.toISOString());

    if (lastCardError) {
      console.error("Error fetching last month card payments:", lastCardError);
      throw lastCardError;
    }

    // Get last month cash payments
    const { data: lastMonthCashPayments, error: lastCashError } = await supabase
      .from("payments")
      .select("amount, status, created_at")
      .eq("restaurant_id", restaurantId)
      .eq("method", "cash")
      .gte("created_at", lastMonthStart.toISOString())
      .lte("created_at", lastMonthEnd.toISOString());

    if (lastCashError) {
      console.error("Error fetching last month cash payments:", lastCashError);
      throw lastCashError;
    }

    // Combine card payments and cash payments
    const allPayments = [
      ...(allCardPayments || []),
      ...(allCashPayments || []),
    ];

    const currentMonthPayments = [
      ...(currentMonthCardPayments || []),
      ...(currentMonthCashPayments || []),
    ];

    const lastMonthPayments = [
      ...(lastMonthCardPayments || []),
      ...(lastMonthCashPayments || []),
    ];

    // Calculate stats
    const completedPayments =
      allPayments?.filter((p) => p.status === "completed") || [];
    const refundedPayments =
      allCardPayments?.filter((p) => p.status === "refunded") || []; // Only card payments can be refunded

    // Card payment stats
    const completedCardPayments =
      allCardPayments?.filter((p) => p.status === "completed") || [];
    const cardRevenue = completedCardPayments.reduce(
      (sum, payment) => sum + payment.amount,
      0
    );
    const cardTransactions = completedCardPayments.length;

    // Cash payment stats
    const completedCashPayments =
      allCashPayments?.filter((payment) => payment.status === "completed") ||
      [];
    const cashRevenue = completedCashPayments.reduce(
      (sum, payment) => sum + payment.amount,
      0
    );
    const cashTransactions = completedCashPayments.length;

    // This month card payment stats
    const thisMonthCompletedCard =
      currentMonthCardPayments?.filter((p) => p.status === "completed") || [];
    const cardRevenueThisMonth = thisMonthCompletedCard.reduce(
      (sum, payment) => sum + payment.amount,
      0
    );
    const cardTransactionsThisMonth = thisMonthCompletedCard.length;

    // This month cash payment stats
    const thisMonthCompletedCash =
      currentMonthCashPayments?.filter(
        (payment) => payment.status === "completed"
      ) || [];
    const cashRevenueThisMonth = thisMonthCompletedCash.reduce(
      (sum, payment) => sum + payment.amount,
      0
    );
    const cashTransactionsThisMonth = thisMonthCompletedCash.length;

    const totalRevenue = completedPayments.reduce(
      (sum, payment) => sum + payment.amount,
      0
    );
    const totalTransactions = completedPayments.length;
    const averageOrderValue =
      totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

    const thisMonthCompleted =
      currentMonthPayments?.filter((p) => p.status === "completed") || [];
    const thisMonthRevenue = thisMonthCompleted.reduce(
      (sum, payment) => sum + payment.amount,
      0
    );
    const thisMonthTransactions = thisMonthCompleted.length;

    const lastMonthCompleted =
      lastMonthPayments?.filter((p) => p.status === "completed") || [];
    const lastMonthRevenue = lastMonthCompleted.reduce(
      (sum, payment) => sum + payment.amount,
      0
    );
    const lastMonthTransactions = lastMonthCompleted.length;

    const refundedAmount = refundedPayments.reduce(
      (sum, payment) => sum + payment.amount,
      0
    );
    const refundedTransactions = refundedPayments.length;

    const revenueGrowth =
      lastMonthRevenue > 0
        ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
        : 0;
    const transactionGrowth =
      lastMonthTransactions > 0
        ? ((thisMonthTransactions - lastMonthTransactions) /
            lastMonthTransactions) *
          100
        : 0;

    return {
      totalRevenue,
      totalTransactions,
      averageOrderValue,
      thisMonthRevenue,
      thisMonthTransactions,
      lastMonthRevenue,
      lastMonthTransactions,
      revenueGrowth,
      transactionGrowth,
      refundedAmount,
      refundedTransactions,
      cardRevenue,
      cardTransactions,
      cashRevenue,
      cashTransactions,
      cardRevenueThisMonth,
      cardTransactionsThisMonth,
      cashRevenueThisMonth,
      cashTransactionsThisMonth,
    };
  } catch (error) {
    console.error("Error fetching payment stats:", error);
    throw new Error("Failed to fetch payment statistics");
  }
}

// ============================================================================
// PAYMENT TRANSACTIONS
// ============================================================================

export async function getPaymentTransactions(
  restaurantId: string,
  limit: number = 20,
  offset: number = 0
): Promise<PaymentTransaction[]> {
  const supabase = createClient();

  try {
    // First get all payments
    const { data: payments, error } = await supabase
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
        refund_id,
        customer_name,
        table_number
      `
      )
      .eq("restaurant_id", restaurantId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Then get the corresponding orders
    const orderIds = (payments || []).map((p) => p.order_id);
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
      .in("id", orderIds);

    if (ordersError) throw ordersError;

    // Create a map for quick lookup
    const ordersMap = new Map((orders || []).map((order) => [order.id, order]));

    return (payments || []).map((payment) => {
      const order = ordersMap.get(payment.order_id);

      return {
        id: payment.id,
        transactionId: payment.id,
        orderId: payment.order_id,
        orderNumber: order?.order_number || `#${payment.order_id.slice(-8)}`,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        method: payment.method,
        created_at: payment.created_at,
        order_id: payment.order_id,
        stripe_payment_id: payment.stripe_payment_id,
        refund_id: payment.refund_id,
        customer_name: order?.customer_name || payment.customer_name,
        table_number: order?.tables?.[0]?.number || payment.table_number,
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
  } catch (error) {
    console.error("Error fetching payment transactions:", error);
    throw new Error("Failed to fetch payment transactions");
  }
}

// ============================================================================
// PAYMENT MANAGEMENT
// ============================================================================

export async function createPayment(data: PaymentCreateData): Promise<string> {
  const supabase = createClient();

  try {
    const { data: payment, error } = await supabase
      .from("payments")
      .insert({
        restaurant_id: data.restaurantId,
        order_id: data.orderId,
        amount: data.amount,
        currency: data.currency,
        status: data.status,
        method: data.method,
        stripe_payment_id: data.stripePaymentId,
      })
      .select("id")
      .single();

    if (error) throw error;

    // Revalidate payments page
    revalidatePath("/dashboard/payments");

    return payment.id;
  } catch (error) {
    console.error("Error creating payment:", error);
    throw new Error("Failed to create payment");
  }
}

export async function updatePaymentStatus(
  paymentId: string,
  status: "pending" | "completed" | "failed" | "refunded",
  refundId?: string
): Promise<void> {
  const supabase = createClient();

  try {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (refundId) {
      updateData.refund_id = refundId;
    }

    const { error } = await supabase
      .from("payments")
      .update(updateData)
      .eq("id", paymentId);

    if (error) throw error;

    // Revalidate payments page
    revalidatePath("/dashboard/payments");
  } catch (error) {
    console.error("Error updating payment status:", error);
    throw new Error("Failed to update payment status");
  }
}

export async function getPaymentByStripeId(
  stripePaymentId: string
): Promise<PaymentTransaction | null> {
  const supabase = createClient();

  try {
    const { data: payment, error } = await supabase
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
        refund_id,
        customer_name,
        table_number,
        order:orders (
          id,
          order_number,
          total_amount,
          table_id,
          notes,
          customer_name,
          tables (
            number
          )
        )
      `
      )
      .eq("stripe_payment_id", stripePaymentId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // No rows returned
      throw error;
    }

    const order =
      payment.order && Array.isArray(payment.order) && payment.order.length > 0
        ? payment.order[0]
        : undefined;

    return {
      id: payment.id,
      transactionId: payment.id,
      orderId: payment.order_id,
      orderNumber: order?.order_number || `#${payment.order_id.slice(-8)}`,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      method: payment.method,
      created_at: payment.created_at,
      order_id: payment.order_id,
      stripe_payment_id: payment.stripe_payment_id,
      refund_id: payment.refund_id,
      customer_name: order?.customer_name || payment.customer_name,
      table_number: order?.tables?.[0]?.number || payment.table_number,
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
  } catch (error) {
    console.error("Error fetching payment by Stripe ID:", error);
    throw new Error("Failed to fetch payment");
  }
}

// ============================================================================
// REFUND FUNCTIONALITY
// ============================================================================

export async function createRefund(request: RefundRequest): Promise<{
  success: boolean;
  refundId?: string;
  error?: string;
}> {
  const supabase = createClient();

  try {
    // Get the payment to refund
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .select("stripe_payment_id, amount, status")
      .eq("id", request.paymentId)
      .single();

    if (paymentError) {
      throw new Error("Payment not found");
    }

    if (payment.status !== "completed") {
      throw new Error("Payment must be completed to refund");
    }

    if (!payment.stripe_payment_id) {
      throw new Error("Payment has no Stripe ID");
    }

    // Create refund in Stripe
    const refundAmount = request.amount ? request.amount * 100 : undefined; // Convert to cents
    const stripeRefund = await refundPayment(
      payment.stripe_payment_id,
      refundAmount,
      request.reason
    );

    // Update payment status in database
    await updatePaymentStatus(request.paymentId, "refunded", stripeRefund.id);

    // Revalidate payments page
    revalidatePath("/dashboard/payments");

    return {
      success: true,
      refundId: stripeRefund.id,
    };
  } catch (error) {
    console.error("Error creating refund:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create refund",
    };
  }
}

export async function getRefundDetails(refundId: string): Promise<any> {
  try {
    const refund = await stripe.refunds.retrieve(refundId);
    return refund;
  } catch (error) {
    console.error("Error fetching refund details:", error);
    throw new Error("Failed to fetch refund details");
  }
}

// ============================================================================
// STRIPE ACCOUNT MANAGEMENT
// ============================================================================

export async function getStripeAccountInfo(
  restaurantId: string
): Promise<StripeAccountInfo | null> {
  const supabase = createClient();

  try {
    // Get restaurant's Stripe account ID
    const { data: restaurant, error: restaurantError } = await supabase
      .from("restaurants")
      .select("stripe_account_id")
      .eq("id", restaurantId)
      .single();

    if (restaurantError || !restaurant?.stripe_account_id) {
      return null;
    }

    // Get account details from Stripe
    const account = await stripe.accounts.retrieve(
      restaurant.stripe_account_id
    );

    return {
      id: account.id,
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      requirements: account.requirements,
      business_type: account.business_type || "individual",
      company: { name: account.company?.name || "" },
      created: account.created || 0,
    };
  } catch (error) {
    console.error("Error fetching Stripe account info:", error);
    return null;
  }
}

// ============================================================================
// PAYMENT METHOD SETTINGS
// ============================================================================

export async function getPaymentMethodSettings(
  restaurantId: string
): Promise<PaymentMethodSettings> {
  const supabase = createClient();

  try {
    const { data: restaurant, error } = await supabase
      .from("restaurants")
      .select("payment_methods")
      .eq("id", restaurantId)
      .single();

    if (error) throw error;

    const settings = restaurant?.payment_methods || {
      cardEnabled: true,
      cashEnabled: true,
    };
    return {
      cardEnabled: settings.cardEnabled ?? true,
      cashEnabled: settings.cashEnabled ?? true,
    };
  } catch (error) {
    console.error("Error fetching payment method settings:", error);
    return { cardEnabled: true, cashEnabled: true };
  }
}

export async function updatePaymentMethodSettings(
  restaurantId: string,
  settings: PaymentMethodSettings
): Promise<void> {
  const supabase = createClient();

  try {
    const { error } = await supabase
      .from("restaurants")
      .update({
        payment_methods: settings,
        updated_at: new Date().toISOString(),
      })
      .eq("id", restaurantId);

    if (error) throw error;

    // Revalidate payments page
    revalidatePath("/dashboard/payments");
  } catch (error) {
    console.error("Error updating payment method settings:", error);
    throw new Error("Failed to update payment method settings");
  }
}
