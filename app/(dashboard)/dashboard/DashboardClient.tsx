"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  DollarSign,
  ShoppingCart,
  Users,
  ArrowUpIcon,
  ArrowDownIcon,
  Clock,
  ChevronRight,
  Timer,
  CheckCircle,
  AlertCircle,
  Bell,
  CreditCard,
  X,
  RefreshCw,
  MessageSquare,
  Table,
  Receipt,
  Heart,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getStripeAccountStatus } from "@/lib/actions/stripe-connect";
import { useOrdersWebSocket } from "@/hooks/useOrdersWebSocket";
import { toast } from "sonner";
import { formatAmountWithCurrency } from "@/lib/utils/currency";
import { useRestaurantSettings } from "@/lib/store/restaurant-settings";

// Add this function at the top level
const formatTime = (date: Date) => {
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  return `${hours}:${minutes} ${ampm}`;
};

// Add getTimeAgo function
const getTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return `${diffInSeconds}s ago`;
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks}w ago`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths}mo ago`;
  }

  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears}y ago`;
};

// Add these animation variants at the top level
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
  hover: { y: -2, transition: { duration: 0.2 } },
};

// Payment status helper functions
const getPaymentStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case "completed":
      return "bg-green-100 text-green-700 border-green-200";
    case "pending":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "failed":
      return "bg-red-100 text-red-700 border-red-200";
    case "refunded":
      return "bg-gray-100 text-gray-700 border-gray-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
};

const getPaymentStatusText = (status: string) => {
  switch (status?.toLowerCase()) {
    case "completed":
      return "Paid";
    case "pending":
      return "Pending";
    case "failed":
      return "Failed";
    case "refunded":
      return "Refunded";
    default:
      return "Pending";
  }
};

const getPaymentMethodColor = (method: string) => {
  switch (method?.toLowerCase()) {
    case "card":
    case "credit_card":
    case "debit_card":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "cash":
      return "bg-green-50 text-green-700 border-green-200";
    default:
      return "bg-gray-50 text-gray-700 border-gray-200";
  }
};

const getPaymentMethodText = (method: string) => {
  switch (method?.toLowerCase()) {
    case "card":
    case "credit_card":
    case "debit_card":
      return "Card Payment";
    case "cash":
      return "Cash Payment";
    default:
      return method
        ? method.charAt(0).toUpperCase() + method.slice(1)
        : "Unknown";
  }
};

interface DashboardClientProps {
  initialStats: any;
  initialRecentOrders: any[];
  initialRecentPayments: any[];
}

export default function DashboardClient({
  initialStats,
  initialRecentOrders,
  initialRecentPayments,
}: DashboardClientProps) {
  const [currentTime] = useState(new Date());
  const [showStripeReminder, setShowStripeReminder] = useState(false);
  const [stripeStatus, setStripeStatus] = useState<string | null>(null);
  const [stripeAccountDetails, setStripeAccountDetails] = useState<any>(null);

  // Live data state
  const [stats, setStats] = useState(initialStats);
  const [recentOrders, setRecentOrders] = useState(initialRecentOrders);
  const [recentPayments, setRecentPayments] = useState(initialRecentPayments);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Use restaurant settings for currency
  const { currencySymbol, currency, restaurant } = useRestaurantSettings();

  const router = useRouter();

  // WebSocket for real-time updates using the same pattern as orders page
  const { isConnected } = useOrdersWebSocket({
    restaurantId: restaurant?.id,
    enabled: !!restaurant?.id,
    onOrderAdded: (newOrder) => {
      // Refresh dashboard data when new order is added
      refreshDashboardData();
      toast.success(`New order received - Dashboard updated`);
    },
    onOrderUpdated: (updatedOrder, oldOrder) => {
      // Refresh dashboard data when order is updated
      refreshDashboardData();

      // Show toast for status changes
      if (oldOrder && updatedOrder.status !== oldOrder.status) {
        toast.success(`Order status updated to ${updatedOrder.status}`);
      }
    },
    onOrderDeleted: (deletedOrder) => {
      // Refresh dashboard data when order is deleted
      refreshDashboardData();
      toast.success(`Order removed - Dashboard updated`);
    },
    onPaymentAdded: (newPayment) => {
      // Refresh dashboard data when new payment is added
      refreshDashboardData();
      toast.success(`New payment received - Dashboard updated`);
    },
    onPaymentUpdated: (updatedPayment, oldPayment) => {
      // Refresh dashboard data when payment is updated
      refreshDashboardData();

      // Show toast for status changes
      if (oldPayment && updatedPayment.status !== oldPayment.status) {
        toast.success(`Payment status updated to ${updatedPayment.status}`);
      }
    },
  });

  // Function to refresh dashboard data
  const refreshDashboardData = async () => {
    if (!restaurant?.id) return;

    try {
      setIsRefreshing(true);
      const supabase = createClient();

      // Use restaurant from settings store
      const restaurantId = restaurant.id;

      // Get current month revenue
      const currentMonth = new Date();
      const currentMonthStart = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        1
      );

      const { data: currentMonthRevenue } = await supabase
        .from("orders")
        .select("total_amount")
        .eq("restaurant_id", restaurantId)
        .gte("created_at", currentMonthStart.toISOString())
        .eq("status", "completed");

      const { data: previousMonthRevenue } = await supabase
        .from("orders")
        .select("total_amount")
        .eq("restaurant_id", restaurantId)
        .gte(
          "created_at",
          new Date(
            currentMonth.getFullYear(),
            currentMonth.getMonth() - 1,
            1
          ).toISOString()
        )
        .lt("created_at", currentMonthStart.toISOString())
        .eq("status", "completed");

      const currentRevenue =
        currentMonthRevenue?.reduce(
          (sum: number, order: { total_amount: number }) =>
            sum + order.total_amount,
          0
        ) || 0;
      const previousRevenue =
        previousMonthRevenue?.reduce(
          (sum: number, order: { total_amount: number }) =>
            sum + order.total_amount,
          0
        ) || 0;
      const revenueTrend =
        previousRevenue > 0
          ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
          : 0;

      // Get current week orders
      const currentWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
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
          new Date(
            currentWeek.getTime() - 7 * 24 * 60 * 60 * 1000
          ).toISOString()
        )
        .lt("created_at", currentWeek.toISOString());

      const currentOrders = currentWeekOrders?.length || 0;
      const previousOrders = previousWeekOrders?.length || 0;
      const ordersTrend =
        previousOrders > 0
          ? ((currentOrders - previousOrders) / previousOrders) * 100
          : 0;

      // Get unique customers
      const { data: customers } = await supabase
        .from("orders")
        .select("customer_email")
        .eq("restaurant_id", restaurantId)
        .not("customer_email", "is", null);

      const uniqueCustomers = new Set(
        customers?.map((c) => c.customer_email).filter(Boolean)
      ).size;

      // Get average order value
      const { data: allCompletedOrders } = await supabase
        .from("orders")
        .select("total_amount")
        .eq("restaurant_id", restaurantId)
        .eq("status", "completed");

      const totalRevenue =
        allCompletedOrders?.reduce(
          (sum: number, order: { total_amount: number }) =>
            sum + order.total_amount,
          0
        ) || 0;
      const totalOrders = allCompletedOrders?.length || 0;
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Set stats in server action format
      setStats({
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
          trend: 0,
          formatted: uniqueCustomers.toString(),
        },
        avgOrderValue: {
          value: avgOrderValue,
          trend: 0,
          formatted: formatAmountWithCurrency(avgOrderValue, currency),
        },
      });

      // Get recent orders
      const { data: recentOrdersData } = await supabase
        .from("orders")
        .select(
          `
          id,
          total_amount,
          status,
          created_at,
          customer_name,
          notes,
          payment_status,
          tables (
            number
          )
        `
        )
        .eq("restaurant_id", restaurantId)
        .order("created_at", { ascending: false })
        .limit(5);

      // Transform recent orders
      const transformedOrders = (recentOrdersData || []).map((order) => ({
        id: order.id,
        table: order.tables?.[0]?.number
          ? `Table ${order.tables[0].number}`
          : "No Table",
        items: 1, // We'll need to fetch order items separately if needed
        total: formatAmountWithCurrency(order.total_amount, currency),
        status: order.status,
        time: getTimeAgo(new Date(order.created_at)),
        customer: order.customer_name || "No Customer",
        notes: order.notes || null,
        paymentStatus: order.payment_status || "pending",
      }));

      setRecentOrders(transformedOrders);

      // Get recent payments (both card and cash)
      const { data: cardPayments } = await supabase
        .from("payments")
        .select(
          `
          id,
          amount,
          method,
          status,
          created_at,
          orders (
            id,
            customer_name,
            tip_amount,
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

      const { data: cashOrders } = await supabase
        .from("orders")
        .select(
          `
          id,
          total_amount,
          created_at,
          status,
          customer_name,
          tip_amount,
          tables (
            number
          )
        `
        )
        .eq("restaurant_id", restaurantId)
        .is("stripe_payment_intent_id", null)
        .order("created_at", { ascending: false })
        .limit(10);

      // Transform card payments
      const cardPaymentsData = (cardPayments || []).map((payment) => {
        const order =
          payment.orders &&
          Array.isArray(payment.orders) &&
          payment.orders.length > 0
            ? payment.orders[0]
            : undefined;

        return {
          id: payment.id,
          amount: formatAmountWithCurrency(payment.amount, currency),
          method: payment.method || "card",
          status: payment.status,
          time: getTimeAgo(new Date(payment.created_at)),
          customer: order?.customer_name || "Guest",
          table: order?.tables?.[0]?.number || null,
          orderId: order?.id || payment.id,
          tip: order?.tip_amount || 0,
          fee: 0, // No fee data in this structure
        };
      });

      // Transform cash orders
      const cashOrdersData = (cashOrders || []).map((order) => ({
        id: `cash-${order.id}`,
        amount: formatAmountWithCurrency(order.total_amount, currency),
        method: "cash",
        status: order.status === "completed" ? "completed" : "pending",
        time: getTimeAgo(new Date(order.created_at)),
        customer: order.customer_name || "Guest",
        table: order.tables?.[0]?.number || null,
        orderId: order.id,
        tip: order.tip_amount || 0,
        fee: 0, // No fee data in this structure
      }));

      // Combine and sort by creation date, take top 5
      const allPayments = [...cardPaymentsData, ...cashOrdersData]
        .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
        .slice(0, 5);

      setRecentPayments(allPayments);
    } catch (error) {
      console.error("Error refreshing dashboard data:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Check Stripe Connect status
  useEffect(() => {
    const checkStripeStatus = async () => {
      try {
        if (!restaurant?.id) return;

        // Check Stripe Connect status
        const result = await getStripeAccountStatus(restaurant.id);

        if (result.status === "not_connected") {
          setShowStripeReminder(true);
          setStripeStatus("not_connected");
        } else if (result.status === "pending") {
          setShowStripeReminder(true);
          setStripeStatus("pending");
          setStripeAccountDetails(result);
        } else if (result.status === "active") {
          setStripeStatus("active");
          setStripeAccountDetails(result);
        }
      } catch (error) {
        console.error("Error checking Stripe status:", error);
      }
    };

    checkStripeStatus();
  }, [restaurant?.id]);

  // Get Stripe status message and actions
  const getStripeStatusInfo = () => {
    switch (stripeStatus) {
      case "not_connected":
        return {
          title: "Set up payments to start accepting customer orders",
          description:
            "Connect your Stripe account to receive payments directly to your bank account. Takes just 5 minutes to set up.",
          icon: CreditCard,
          color: "blue",
          primaryAction: "Set Up Payments",
          secondaryAction: "Remind me later",
          primaryActionUrl: "/setup/connect",
        };
      case "pending":
        return {
          title: "Payment setup in progress",
          description:
            "Your Stripe account is being reviewed. You'll be notified once it's ready to accept payments.",
          icon: Clock,
          color: "amber",
          primaryAction: "Check Status",
          secondaryAction: "Dismiss",
          primaryActionUrl: "/setup/connect",
        };
      case "active":
        return {
          title: "Payments are active",
          description:
            "Your Stripe account is ready to accept customer payments.",
          icon: CheckCircle,
          color: "green",
          primaryAction: "View Dashboard",
          secondaryAction: "Dismiss",
          primaryActionUrl: "/dashboard",
        };
      default:
        return null;
    }
  };

  const stripeStatusInfo = getStripeStatusInfo();

  // Stats configuration with live data
  const statsConfig = [
    {
      title: "Total Revenue",
      value:
        stats?.totalRevenue?.formatted || formatAmountWithCurrency(0, currency),
      description: "This month",
      icon: DollarSign,
      trend: {
        value: Math.round(stats?.totalRevenue?.trend || 0),
        isPositive: (stats?.totalRevenue?.trend || 0) >= 0,
      },
      color: "green",
    },
    {
      title: "Orders",
      value: stats?.orders?.formatted || "0",
      description: "This week",
      icon: ShoppingCart,
      trend: {
        value: Math.round(stats?.orders?.trend || 0),
        isPositive: (stats?.orders?.trend || 0) >= 0,
      },
      color: "amber",
    },
    {
      title: "Customers",
      value: stats?.customers?.formatted || "0",
      description: "Total served",
      icon: Users,
      trend: { value: 0, isPositive: true }, // We can calculate this later if needed
      color: "blue",
    },
    {
      title: "Avg Order Value",
      value:
        stats?.avgOrderValue?.formatted ||
        formatAmountWithCurrency(0, currency),
      description: "Per order",
      icon: BarChart3,
      trend: { value: 0, isPositive: true }, // We can calculate this later if needed
      color: "red",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Stripe Connect Persistent Warning */}
      {stripeStatus === "not_connected" && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-destructive/5 border border-destructive/20 rounded-lg p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-destructive" />
              <div>
                <h3 className="font-medium text-destructive">
                  Payment processing not configured
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Connect your Stripe account to start accepting customer
                  payments
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => router.push("/setup/connect")}
            >
              Set Up Payments
            </Button>
          </div>
        </motion.div>
      )}

      {/* Stripe Connect Status Banner (for pending/active states) */}
      {showStripeReminder &&
        stripeStatusInfo &&
        stripeStatus !== "not_connected" && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={cn(
              "border rounded-lg p-4",
              stripeStatusInfo.color === "blue" &&
                "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200",
              stripeStatusInfo.color === "amber" &&
                "bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200",
              stripeStatusInfo.color === "green" &&
                "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200"
            )}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <stripeStatusInfo.icon
                  className={cn(
                    "h-5 w-5 mt-0.5 shrink-0",
                    stripeStatusInfo.color === "blue" && "text-blue-600",
                    stripeStatusInfo.color === "amber" && "text-amber-600",
                    stripeStatusInfo.color === "green" && "text-green-600"
                  )}
                />
                <div>
                  <h3
                    className={cn(
                      "font-medium",
                      stripeStatusInfo.color === "blue" && "text-blue-800",
                      stripeStatusInfo.color === "amber" && "text-amber-800",
                      stripeStatusInfo.color === "green" && "text-green-800"
                    )}
                  >
                    {stripeStatusInfo.title}
                  </h3>
                  <p
                    className={cn(
                      "text-sm mt-1",
                      stripeStatusInfo.color === "blue" && "text-blue-700",
                      stripeStatusInfo.color === "amber" && "text-amber-700",
                      stripeStatusInfo.color === "green" && "text-green-700"
                    )}
                  >
                    {stripeStatusInfo.description}
                  </p>
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      onClick={() =>
                        router.push(stripeStatusInfo.primaryActionUrl)
                      }
                      className={cn(
                        stripeStatusInfo.color === "blue" &&
                          "bg-blue-600 hover:bg-blue-700",
                        stripeStatusInfo.color === "amber" &&
                          "bg-amber-600 hover:bg-amber-700",
                        stripeStatusInfo.color === "green" &&
                          "bg-green-600 hover:bg-green-700"
                      )}
                    >
                      {stripeStatusInfo.primaryAction}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowStripeReminder(false)}
                    >
                      {stripeStatusInfo.secondaryAction}
                    </Button>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowStripeReminder(false)}
                className={cn(
                  "hover:opacity-70",
                  stripeStatusInfo.color === "blue" &&
                    "text-blue-400 hover:text-blue-600",
                  stripeStatusInfo.color === "amber" &&
                    "text-amber-400 hover:text-amber-600",
                  stripeStatusInfo.color === "green" &&
                    "text-green-400 hover:text-green-600"
                )}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">
            Welcome back! Here&apos;s what&apos;s happening at your restaurant.
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Stripe Connect Status Indicator */}
          {stripeStatus && stripeStatus !== "active" && (
            <div className="flex items-center gap-2">
              <Badge
                variant={
                  stripeStatus === "not_connected" ? "destructive" : "secondary"
                }
                className="text-xs"
              >
                <CreditCard className="w-3 h-3 mr-1" />
                {stripeStatus === "not_connected"
                  ? "Payments Not Set Up"
                  : "Payments Pending"}
              </Badge>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-gray-400" />
            <span className="text-sm text-gray-500">
              {formatTime(currentTime)}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {statsConfig.map((stat, index) => (
          <motion.div
            key={index}
            variants={cardVariants}
            whileHover="hover"
            className="transform transition-all duration-200"
          >
            <Card
              className={cn(
                "border cursor-pointer hover:shadow-md transition-all",
                stat.color === "green" && "bg-green-50 border-green-200",
                stat.color === "amber" && "bg-amber-50 border-amber-200",
                stat.color === "blue" && "bg-blue-50 border-blue-200",
                stat.color === "red" && "bg-red-50 border-red-200"
              )}
              onClick={() => {
                // Navigate to relevant pages based on stat type
                switch (stat.title) {
                  case "Total Revenue":
                    router.push("/dashboard/payments");
                    break;
                  case "Orders":
                    router.push("/dashboard/orders/active");
                    break;
                  case "Customers":
                    router.push("/dashboard/analytics");
                    break;
                  case "Avg Order Value":
                    router.push("/dashboard/analytics");
                    break;
                  default:
                    break;
                }
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p
                      className={cn(
                        "text-sm font-medium",
                        stat.color === "green" && "text-green-800",
                        stat.color === "amber" && "text-amber-800",
                        stat.color === "blue" && "text-blue-800",
                        stat.color === "red" && "text-red-800"
                      )}
                    >
                      {stat.title}
                    </p>
                    <p
                      className={cn(
                        "text-2xl font-bold",
                        stat.color === "green" && "text-green-900",
                        stat.color === "amber" && "text-amber-900",
                        stat.color === "blue" && "text-blue-900",
                        stat.color === "red" && "text-red-900"
                      )}
                    >
                      {stat.value}
                    </p>
                  </div>
                  <stat.icon
                    className={cn(
                      "h-8 w-8",
                      stat.color === "green" && "text-green-600",
                      stat.color === "amber" && "text-amber-600",
                      stat.color === "blue" && "text-blue-600",
                      stat.color === "red" && "text-red-600"
                    )}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-sm text-gray-500">{stat.description}</p>
                  <div
                    className={cn(
                      "flex items-center text-xs font-medium",
                      stat.trend.isPositive ? "text-green-600" : "text-red-600"
                    )}
                  >
                    {stat.trend.isPositive ? (
                      <ArrowUpIcon className="w-3 h-3 mr-1" />
                    ) : (
                      <ArrowDownIcon className="w-3 h-3 mr-1" />
                    )}
                    {stat.trend.value}%
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Orders */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          whileHover={{ scale: 1.01 }}
          className="transform transition-all duration-200"
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Recent Orders
                    {isRefreshing && (
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    )}
                  </CardTitle>
                  <CardDescription>
                    Latest orders from your restaurant
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => router.push("/dashboard/orders/active")}
                >
                  View All
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {recentOrders.length > 0 ? (
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  className="space-y-4"
                >
                  {recentOrders.map((order, index) => (
                    <motion.div
                      key={order.id}
                      variants={cardVariants}
                      whileHover={{ x: 5 }}
                      className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                    >
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{order.table}</p>
                          <Badge
                            variant={
                              order.status === "preparing"
                                ? "default"
                                : order.status === "ready"
                                  ? "outline"
                                  : "secondary"
                            }
                            className={cn(
                              order.status === "preparing" &&
                                "bg-amber-100 text-amber-800 border-amber-200",
                              order.status === "ready" &&
                                "bg-green-100 text-green-800 border-green-200",
                              order.status === "served" &&
                                "bg-blue-100 text-blue-800 border-blue-200",
                              order.status === "completed" &&
                                "bg-green-100 text-green-800 border-green-200",
                              order.status === "cancelled" &&
                                "bg-red-100 text-red-800 border-red-200"
                            )}
                          >
                            {order.status.charAt(0).toUpperCase() +
                              order.status.slice(1)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {order.time}
                          </div>
                          <div className="flex items-center gap-1">
                            <ShoppingCart className="w-3 h-3" />
                            {order.items} items
                          </div>
                          {order.customer && (
                            <div className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {order.customer}
                            </div>
                          )}
                        </div>
                        {order.notes && (
                          <div className="flex items-center gap-1 text-xs text-blue-600">
                            <MessageSquare className="w-3 h-3" />
                            <span className="truncate">{order.notes}</span>
                          </div>
                        )}
                      </div>
                      <div className="text-right ml-4">
                        <p className="font-medium text-lg">{order.total}</p>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs mt-1",
                            getPaymentStatusColor(order.paymentStatus)
                          )}
                        >
                          {getPaymentStatusText(order.paymentStatus)}
                        </Badge>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <ShoppingCart className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p>No orders yet</p>
                  <p className="text-sm">
                    Orders will appear here once customers start ordering
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Payments */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          whileHover={{ scale: 1.01 }}
          className="transform transition-all duration-200"
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Recent Payments
                  </CardTitle>
                  <CardDescription>
                    Latest transactions from customers
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => router.push("/dashboard/payments")}
                >
                  View All
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {recentPayments.length > 0 ? (
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  className="space-y-4"
                >
                  {recentPayments.map((payment, index) => (
                    <motion.div
                      key={payment.id}
                      variants={cardVariants}
                      whileHover={{ x: 5 }}
                      className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                    >
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">
                            {payment.customer || "Guest"}
                          </p>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs",
                              getPaymentMethodColor(payment.method)
                            )}
                          >
                            {getPaymentMethodText(payment.method)}
                          </Badge>
                          <Badge
                            variant="secondary"
                            className={cn(
                              "text-xs",
                              getPaymentStatusColor(payment.status)
                            )}
                          >
                            {getPaymentStatusText(payment.status)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {payment.time || "Unknown time"}
                          </div>
                          {payment.table && (
                            <div className="flex items-center gap-1">
                              <Table className="w-3 h-3" />
                              Table {payment.table}
                            </div>
                          )}
                          {payment.orderId && (
                            <div className="flex items-center gap-1">
                              <Receipt className="w-3 h-3" />#
                              {payment.orderId.slice(-6).toUpperCase()}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <p className="font-medium text-lg">
                          {payment.amount ||
                            formatAmountWithCurrency(0, currency)}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <CreditCard className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p>No payments yet</p>
                  <p className="text-sm">
                    Payments will appear here once customers start paying
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
