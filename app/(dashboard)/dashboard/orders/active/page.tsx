"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  Filter,
  Search,
  ChevronDown,
  Bell,
  Printer,
  RefreshCcw,
  MoreHorizontal,
  ChefHat,
  Timer,
  Download,
  Ban,
  ChevronRight,
  Loader2,
  MessageSquare,
  CreditCard,
  DollarSign as DollarSignIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRestaurantSettings } from "@/lib/store/restaurant-settings";
import {
  getRestaurantOrders,
  updateOrderStatus,
  cancelOrder,
  type Order,
  type OrderFilters,
} from "@/lib/actions/orders";
import { useOrdersWebSocket } from "@/hooks/useOrdersWebSocket";
import { toast } from "sonner";
import { completeCashOrder } from "@/lib/actions/qr-payments";
import { cn } from "@/lib/utils";

type OrderStatus =
  | "pending"
  | "preparing"
  | "ready"
  | "served"
  | "completed"
  | "cancelled"
  | "all";

const formatTime = (date: Date) => {
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  return `${hours}:${minutes} ${ampm}`;
};

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 100,
    },
  },
};

const filterVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: "spring",
      stiffness: 100,
    },
  },
};

const iconVariants = {
  hidden: { scale: 0 },
  visible: {
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 200,
    },
  },
};

export default function ActiveOrdersPage() {
  const router = useRouter();
  const { currencySymbol, restaurant } = useRestaurantSettings();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | null>(null);
  const [timeFilter, setTimeFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [updatingOrders, setUpdatingOrders] = useState<Set<string>>(new Set());
  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null);
  const [markingAsPaid, setMarkingAsPaid] = useState<Set<string>>(new Set());

  // WebSocket for real-time updates
  const { isConnected } = useOrdersWebSocket({
    restaurantId: restaurant?.id,
    onOrderAdded: (newOrder) => {
      // Add new order to the list if it matches current filters
      const orderData: Order = {
        id: newOrder.id,
        orderNumber:
          (newOrder as any).order_number ||
          `ORD-${newOrder.id.slice(-8).toUpperCase()}`,
        tableNumber: "Unknown", // Will be fetched with full data
        customerName: undefined,
        items: [],
        status: newOrder.status,
        time: new Date(newOrder.created_at),
        estimatedTime: 15,
        notes: newOrder.notes || undefined,
        total: newOrder.total_amount,
        paymentStatus: "pending",
        priority: "normal",
        restaurant_id: newOrder.restaurant_id,
        table_id: newOrder.table_id || "",
        total_amount: newOrder.total_amount,
        tax_amount: (newOrder as any).tax_amount || 0,
        tip_amount: (newOrder as any).tip_amount || 0,
        created_at: newOrder.created_at,
        updated_at: newOrder.updated_at,
        stripe_payment_intent_id: (newOrder as any).stripe_payment_intent_id,
      };

      setOrders((prev) => [orderData, ...prev]);
    },
    onOrderUpdated: (updatedOrder, oldOrder) => {
      // If order is cancelled or completed, remove it from active orders
      if (
        updatedOrder.status === "cancelled" ||
        updatedOrder.status === "completed"
      ) {
        setOrders((prev) =>
          prev.filter((order) => order.id !== updatedOrder.id)
        );
        toast.success(
          `Order ${(updatedOrder as any).order_number || updatedOrder.id.slice(-6)} moved to history (${updatedOrder.status})`,
          {
            duration: 3000,
          }
        );
      } else {
        // Update the order in the list
        setOrders((prev) =>
          prev.map((order) =>
            order.id === updatedOrder.id
              ? {
                  ...order,
                  status: updatedOrder.status,
                  total_amount: updatedOrder.total_amount,
                  tax_amount: (updatedOrder as any).tax_amount || 0,
                  tip_amount: (updatedOrder as any).tip_amount || 0,
                  notes: updatedOrder.notes || undefined,
                  updated_at: updatedOrder.updated_at,
                  // Update payment status if available
                  paymentStatus:
                    (updatedOrder as any).paymentStatus || order.paymentStatus,
                }
              : order
          )
        );

        // Show toast for status changes
        if (oldOrder && updatedOrder.status !== oldOrder.status) {
          toast.success(
            `Order ${(updatedOrder as any).order_number || updatedOrder.id.slice(-6)} status updated to ${updatedOrder.status}`,
            {
              duration: 3000,
            }
          );
        }
      }
    },
    onOrderDeleted: (deletedOrder) => {
      setOrders((prev) => prev.filter((order) => order.id !== deletedOrder.id));
    },
  });

  // Fetch orders data
  useEffect(() => {
    const fetchOrders = async () => {
      if (!restaurant?.id) return;

      setLoading(true);
      try {
        const filters: OrderFilters = {};
        if (statusFilter && statusFilter !== "all") {
          filters.status = statusFilter;
        }
        if (searchQuery) {
          filters.search = searchQuery;
        }

        const result = await getRestaurantOrders(restaurant.id, filters);

        if (result.success && result.data) {
          setOrders(result.data);
        } else {
          console.error("Failed to fetch orders:", result.error);
          toast.error("Failed to load orders");
        }
      } catch (error) {
        console.error("Error fetching orders:", error);
        toast.error("Failed to load orders");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [restaurant?.id, statusFilter, searchQuery]);

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const getTimeSinceOrder = (orderTime: Date) => {
    const diffInMinutes = Math.floor(
      (currentTime.getTime() - orderTime.getTime()) / (1000 * 60)
    );
    return diffInMinutes;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-red-100 text-red-800 border-red-200";
      case "preparing":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "ready":
        return "bg-green-100 text-green-800 border-green-200";
      case "served":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "completed":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "cancelled":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500";
      case "normal":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700 border-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "failed":
        return "bg-red-100 text-red-800 border-red-200";
      case "refunded":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPaymentStatusText = (status: string) => {
    switch (status) {
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

  const isOrderPaid = (order: Order) => {
    return order.paymentStatus === "completed";
  };

  const canMarkAsPaid = (order: Order) => {
    // Can mark as paid if:
    // 1. Order is not already paid
    // 2. Order has no stripe payment intent (cash order)
    // 3. Order status is not cancelled
    return (
      !isOrderPaid(order) &&
      !order.stripe_payment_intent_id &&
      order.status !== "cancelled"
    );
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      searchQuery === "" ||
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.customerName &&
        order.customerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      order.tableNumber.toString().includes(searchQuery);

    const matchesStatus = !statusFilter || order.status === statusFilter;

    const orderTime = new Date(order.time);
    const timeDiff = currentTime.getTime() - orderTime.getTime();
    const matchesTime =
      timeFilter === "all" ||
      (timeFilter === "15m" && timeDiff <= 15 * 60 * 1000) ||
      (timeFilter === "30m" && timeDiff <= 30 * 60 * 1000) ||
      (timeFilter === "1h" && timeDiff <= 60 * 60 * 1000);

    return matchesSearch && matchesStatus && matchesTime;
  });

  const resetFilters = () => {
    setSearchQuery("");
    setStatusFilter(null);
    setTimeFilter("all");
  };

  // Filter orders by status for display (these are already filtered at database level)
  const pendingOrders = filteredOrders.filter(
    (order) => order.status === "pending"
  );
  const preparingOrders = filteredOrders.filter(
    (order) => order.status === "preparing"
  );
  const readyOrders = filteredOrders.filter(
    (order) => order.status === "ready"
  );
  const servedOrders = filteredOrders.filter(
    (order) => order.status === "served"
  );
  const completedOrders = filteredOrders.filter(
    (order) => order.status === "completed"
  );
  const cancelledOrders = filteredOrders.filter(
    (order) => order.status === "cancelled"
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <AlertCircle className="w-4 h-4" />;
      case "preparing":
        return <Clock className="w-4 h-4" />;
      case "ready":
        return <CheckCircle className="w-4 h-4" />;
      case "served":
        return <Eye className="w-4 h-4" />;
      case "completed":
        return <CheckCircle className="w-4 h-4" />;
      case "cancelled":
        return <Ban className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const orderTime = new Date(timestamp);
    const diffInMinutes = Math.floor(
      (now.getTime() - orderTime.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const hours = Math.floor(diffInMinutes / 60);
    return `${hours}h ${diffInMinutes % 60}m ago`;
  };

  const handleUpdateOrderStatus = async (
    orderId: string,
    newStatus: string
  ) => {
    try {
      // Set loading state for this specific order
      setUpdatingOrders((prev) => new Set(prev).add(orderId));

      // Get the current order to check payment method and status
      const currentOrder = orders.find((order) => order.id === orderId);
      if (!currentOrder) {
        toast.error("Order not found");
        return;
      }

      // Check if this is a completion attempt
      if (newStatus === "completed") {
        // For cash orders: only allow completion if already paid
        if (
          !currentOrder.stripe_payment_intent_id &&
          currentOrder.paymentStatus !== "completed"
        ) {
          toast.error("Cash orders must be marked as paid before completion");
          return;
        }

        // For card orders: only allow completion if status is "served" and already paid
        if (
          currentOrder.stripe_payment_intent_id &&
          currentOrder.status !== "served"
        ) {
          toast.error("Card orders must be served before completion");
          return;
        }

        if (
          currentOrder.stripe_payment_intent_id &&
          currentOrder.paymentStatus !== "completed"
        ) {
          toast.error("Card orders must be paid before completion");
          return;
        }
      }

      // Optimistically update the UI immediately
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId
            ? {
                ...order,
                status: newStatus,
                updated_at: new Date().toISOString(),
              }
            : order
        )
      );

      const result = await updateOrderStatus(orderId, newStatus);

      if (result.success) {
        toast.success(`Order status updated to ${newStatus}`);
        // WebSocket will handle the real-time update, so we don't need to refresh
      } else {
        // Revert the optimistic update on error
        setOrders((prev) =>
          prev.map((order) =>
            order.id === orderId
              ? { ...order, status: order.status, updated_at: order.updated_at }
              : order
          )
        );
        toast.error(result.error || "Failed to update order status");
      }
    } catch (error) {
      // Revert the optimistic update on error
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId
            ? { ...order, status: order.status, updated_at: order.updated_at }
            : order
        )
      );
      console.error("Error updating order status:", error);
      toast.error("Failed to update order status");
    } finally {
      // Clear loading state for this order
      setUpdatingOrders((prev) => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    try {
      setUpdatingOrders((prev) => new Set(prev).add(orderId));

      // Find the order to determine the appropriate message
      const order = orders.find((o) => o.id === orderId);
      const isPending = order?.status === "pending";
      const isCashOrder = !order?.stripe_payment_intent_id;
      const isPaid = order?.paymentStatus === "completed";

      const result = await cancelOrder(orderId, "restaurant_cancellation");

      if (result.success) {
        if (isPending) {
          toast.success("Order cancelled successfully");
        } else if (isCashOrder && isPaid) {
          toast.success("Order cancelled - please handle cash refund manually");
        } else if (!isCashOrder && isPaid) {
          toast.success("Order cancelled and refund processed via Stripe");
        } else {
          toast.success("Order cancelled successfully");
        }
        setCancelOrderId(null);
      } else {
        toast.error(result.error || "Failed to cancel order");
      }
    } catch (error) {
      console.error("Error cancelling order:", error);
      toast.error("Failed to cancel order");
    } finally {
      setUpdatingOrders((prev) => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
  };

  const handleMarkAsPaid = async (orderId: string) => {
    try {
      setMarkingAsPaid((prev) => new Set(prev).add(orderId));

      const result = await completeCashOrder(orderId);

      if (result.success) {
        toast.success("Order marked as paid successfully");

        // Immediately update the local state to reflect payment completion
        // This prevents the "waiting for payment" message from appearing
        setOrders((prev) =>
          prev.map((order) =>
            order.id === orderId
              ? {
                  ...order,
                  paymentStatus: "completed",
                  // If the order was auto-completed, update status as well
                  status: "completed",
                  updated_at: new Date().toISOString(),
                }
              : order
          )
        );

        // The WebSocket will handle the final state update and removal from active orders
      } else {
        toast.error(result.error || "Failed to mark order as paid");
      }
    } catch (error) {
      console.error("Error marking order as paid:", error);
      toast.error("Failed to mark order as paid");
    } finally {
      setMarkingAsPaid((prev) => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
  };

  const formatCurrency = (amount: number): string => {
    return `${currencySymbol} ${amount.toFixed(2)}`;
  };

  // Get order number from order object
  const getOrderNumber = (order: Order) => {
    return order.orderNumber || `#${order.id.slice(-8).toUpperCase()}`;
  };

  return (
    <motion.div
      className="p-4 md:p-6 space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        variants={itemVariants}
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Active Orders</h1>
          <p className="text-sm text-gray-500">
            Manage and track current orders
          </p>
        </div>
        <div className="flex items-center gap-3">
          <motion.div
            className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-lg"
            variants={cardVariants}
          >
            <motion.div variants={iconVariants}>
              <Clock className="h-4 w-4 text-gray-500" />
            </motion.div>
            <span className="text-sm font-medium text-gray-700">
              {formatTime(currentTime)}
            </span>
          </motion.div>

          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2 hover:bg-green-50 hover:text-green-600 hover:border-green-600"
            onClick={() => router.push("/dashboard/kitchen")}
          >
            Kitchen View
          </Button>
        </div>
      </motion.div>

      {/* Summary Stats */}
      <motion.div
        className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4"
        variants={itemVariants}
      >
        <motion.div variants={cardVariants}>
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm font-medium text-red-800">
                    Pending Orders
                  </p>
                  <p className="text-xl md:text-2xl font-bold text-red-900">
                    {pendingOrders.length}
                  </p>
                </div>
                <motion.div variants={iconVariants}>
                  <AlertCircle className="h-6 w-6 md:h-8 md:w-8 text-red-600" />
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={cardVariants}>
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm font-medium text-amber-800">
                    Preparing
                  </p>
                  <p className="text-xl md:text-2xl font-bold text-amber-900">
                    {preparingOrders.length}
                  </p>
                </div>
                <motion.div variants={iconVariants}>
                  <Timer className="h-6 w-6 md:h-8 md:w-8 text-amber-600" />
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={cardVariants}>
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm font-medium text-green-800">
                    Ready
                  </p>
                  <p className="text-xl md:text-2xl font-bold text-green-900">
                    {readyOrders.length}
                  </p>
                </div>
                <motion.div variants={iconVariants}>
                  <CheckCircle className="h-6 w-6 md:h-8 md:w-8 text-green-600" />
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={cardVariants}>
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm font-medium text-blue-800">
                    Total Active
                  </p>
                  <p className="text-xl md:text-2xl font-bold text-blue-900">
                    {filteredOrders.length}
                  </p>
                </div>
                <motion.div variants={iconVariants}>
                  <Bell className="h-6 w-6 md:h-8 md:w-8 text-blue-600" />
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Filters Card */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <motion.div variants={iconVariants}>
                <Filter className="h-5 w-5" />
              </motion.div>
              Filters & Search
            </CardTitle>
            <CardDescription>
              Filter and search through active orders
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
              variants={filterVariants}
            >
              {/* Search Input */}
              <div className="relative col-span-full lg:col-span-2">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>

              {/* Time Range Filter */}
              <Select value={timeFilter} onValueChange={setTimeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Time Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="15m">Last 15 Minutes</SelectItem>
                  <SelectItem value="30m">Last 30 Minutes</SelectItem>
                  <SelectItem value="1h">Last Hour</SelectItem>
                </SelectContent>
              </Select>

              {/* Reset Button */}
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={resetFilters}
                  className="shrink-0 hover:bg-green-50 hover:text-green-600 hover:border-green-600"
                >
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </div>
            </motion.div>

            <Separator />

            {/* Status Filters */}
            <motion.div
              className="flex flex-wrap gap-2"
              variants={filterVariants}
            >
              <Button
                variant={statusFilter === null ? "default" : "outline"}
                onClick={() => setStatusFilter(null)}
                className={
                  statusFilter === null
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "hover:bg-green-50 hover:text-green-600 hover:border-green-600"
                }
              >
                All Status
              </Button>
              <Button
                variant={statusFilter === "pending" ? "default" : "outline"}
                onClick={() =>
                  setStatusFilter(statusFilter === "pending" ? null : "pending")
                }
                className={
                  statusFilter === "pending"
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "hover:bg-green-50 hover:text-green-600 hover:border-green-600"
                }
              >
                Pending Orders
              </Button>
              <Button
                variant={statusFilter === "preparing" ? "default" : "outline"}
                onClick={() =>
                  setStatusFilter(
                    statusFilter === "preparing" ? null : "preparing"
                  )
                }
                className={
                  statusFilter === "preparing"
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "hover:bg-green-50 hover:text-green-600 hover:border-green-600"
                }
              >
                Preparing
              </Button>
              <Button
                variant={statusFilter === "ready" ? "default" : "outline"}
                onClick={() =>
                  setStatusFilter(statusFilter === "ready" ? null : "ready")
                }
                className={
                  statusFilter === "ready"
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "hover:bg-green-50 hover:text-green-600 hover:border-green-600"
                }
              >
                Ready
              </Button>
              <Button
                variant={statusFilter === "served" ? "default" : "outline"}
                onClick={() =>
                  setStatusFilter(statusFilter === "served" ? null : "served")
                }
                className={
                  statusFilter === "served"
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "hover:bg-green-50 hover:text-green-600 hover:border-green-600"
                }
              >
                Served
              </Button>
              <Button
                variant={statusFilter === "completed" ? "default" : "outline"}
                onClick={() =>
                  setStatusFilter(
                    statusFilter === "completed" ? null : "completed"
                  )
                }
                className={
                  statusFilter === "completed"
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "hover:bg-green-50 hover:text-green-600 hover:border-green-600"
                }
              >
                Completed
              </Button>
              <Button
                variant={statusFilter === "cancelled" ? "default" : "outline"}
                onClick={() =>
                  setStatusFilter(
                    statusFilter === "cancelled" ? null : "cancelled"
                  )
                }
                className={
                  statusFilter === "cancelled"
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : "hover:bg-red-50 hover:text-red-600 hover:border-red-600"
                }
              >
                Cancelled
              </Button>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Orders List */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Active Orders</CardTitle>
            <CardDescription>
              Showing {filteredOrders.length} of {orders.length} orders
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AnimatePresence mode="wait">
              <motion.div
                key={`${statusFilter}-${timeFilter}-${searchQuery}`}
                className="space-y-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {loading ? (
                  <motion.div
                    className="text-center py-8"
                    variants={itemVariants}
                  >
                    <motion.div variants={iconVariants}>
                      <div className="w-8 h-8 border-2 border-gray-300 border-t-green-600 rounded-full animate-spin mx-auto mb-4" />
                    </motion.div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Loading orders...
                    </h3>
                    <p className="text-gray-500">
                      Please wait while we fetch your orders
                    </p>
                  </motion.div>
                ) : filteredOrders.length === 0 ? (
                  <motion.div
                    className="text-center py-8"
                    variants={itemVariants}
                  >
                    <motion.div variants={iconVariants}>
                      <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    </motion.div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No orders found
                    </h3>
                    <p className="text-gray-500">
                      Try adjusting your filters or search terms
                    </p>
                  </motion.div>
                ) : (
                  filteredOrders.map((order, index) => (
                    <motion.div
                      key={order.id}
                      variants={cardVariants}
                      initial="hidden"
                      animate="visible"
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card
                        key={order.id}
                        className={`overflow-hidden ${
                          updatingOrders.has(order.id)
                            ? "ring-2 ring-green-200 ring-opacity-50"
                            : ""
                        }`}
                      >
                        <CardContent className="p-6">
                          {/* Order Header */}
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="flex flex-col">
                                <div className="flex items-center gap-3">
                                  <span className="text-lg font-semibold">
                                    {getOrderNumber(order)}
                                  </span>
                                  <Badge
                                    className={`${getStatusColor(order.status)} ${
                                      updatingOrders.has(order.id)
                                        ? "animate-pulse"
                                        : ""
                                    }`}
                                  >
                                    {updatingOrders.has(order.id) ? (
                                      <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                    ) : (
                                      getStatusIcon(order.status)
                                    )}
                                    <span className="ml-1 capitalize">
                                      {order.status}
                                    </span>
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                  <span>Table {order.tableNumber}</span>
                                  <span>•</span>
                                  <span>{order.customerName || "Guest"}</span>
                                  <span>•</span>
                                  <span>
                                    {getTimeAgo(order.time.toISOString())}
                                  </span>
                                  {order.notes && (
                                    <>
                                      <span>•</span>
                                      <span className="flex items-center gap-1 text-blue-600 font-medium">
                                        <MessageSquare className="h-3 w-3" />
                                        Special Instructions
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-xs",
                                  getPaymentStatusColor(order.paymentStatus)
                                )}
                              >
                                {getPaymentStatusText(order.paymentStatus)}
                              </Badge>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  className="w-48"
                                >
                                  <DropdownMenuItem
                                    onClick={() => setSelectedOrder(order)}
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      // Implement print functionality
                                      console.log("Print order:", order.id);
                                    }}
                                  >
                                    <Printer className="h-4 w-4 mr-2" />
                                    Print Order
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={() => setCancelOrderId(order.id)}
                                  >
                                    <Ban className="h-4 w-4 mr-2" />
                                    Cancel Order
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>

                          {/* Order Items */}
                          <div className="space-y-2 mb-4">
                            {order.items.map((item, index) => (
                              <div
                                key={index}
                                className="flex items-start justify-between"
                              >
                                <div className="flex-1">
                                  <div className="flex items-center">
                                    <span className="font-medium">
                                      {item.quantity}x
                                    </span>
                                    <span className="ml-2">{item.name}</span>
                                  </div>
                                  {item.modifiers &&
                                    item.modifiers.length > 0 && (
                                      <p className="text-sm text-gray-500 mt-0.5">
                                        {item.modifiers.join(", ")}
                                      </p>
                                    )}
                                </div>
                                <span className="text-gray-600">
                                  {formatCurrency(item.quantity * item.price)}
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* Order Footer */}
                          <div className="flex items-center justify-between pt-4 border-t">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <Timer className="h-4 w-4 text-gray-500" />
                                <span className="text-sm text-gray-600">
                                  Est. Time: {order.estimatedTime} mins
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                {order.stripe_payment_intent_id ? (
                                  <>
                                    <CreditCard className="h-4 w-4 text-blue-500" />
                                    <span className="text-sm text-gray-600">
                                      Card Payment
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <DollarSignIcon className="h-4 w-4 text-green-500" />
                                    <span className="text-sm text-gray-600">
                                      Cash Payment
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-medium">
                                Total: {formatCurrency(order.total)}
                              </span>
                              {(() => {
                                // Determine if the action button should be shown and what it should do
                                const isCashOrder =
                                  !order.stripe_payment_intent_id;
                                const isPaid =
                                  order.paymentStatus === "completed";

                                // For cash orders: show "Mark Paid" only when served and not paid
                                if (
                                  isCashOrder &&
                                  !isPaid &&
                                  order.status === "served"
                                ) {
                                  return (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-xs h-7 px-3 bg-white text-green-700 border-green-300 hover:bg-green-50 hover:border-green-400 hover:text-green-800 shadow-sm"
                                      disabled={markingAsPaid.has(order.id)}
                                      onClick={() => handleMarkAsPaid(order.id)}
                                    >
                                      {markingAsPaid.has(order.id) ? (
                                        <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                      ) : (
                                        <CheckCircle className="w-3 h-3 mr-1" />
                                      )}
                                      {markingAsPaid.has(order.id)
                                        ? "Marking..."
                                        : "Mark Paid"}
                                    </Button>
                                  );
                                }

                                // For card orders: payment is already completed when order is created
                                // So we should always show status progression for card orders
                                if (!isCashOrder && !isPaid) {
                                  // This should rarely happen for card orders, but handle it gracefully
                                  return (
                                    <Badge
                                      variant="outline"
                                      className="text-xs text-amber-600 border-amber-200 bg-amber-50"
                                    >
                                      Payment Processing
                                    </Badge>
                                  );
                                }

                                // Show status progression buttons for all orders
                                // Cash orders: show progression regardless of payment status
                                // Card orders: payment is already completed, so always show progression
                                const canShowProgression = true;
                                const nextStatus = {
                                  pending: "preparing",
                                  preparing: "ready",
                                  ready: "served",
                                }[order.status];

                                if (nextStatus && canShowProgression) {
                                  return (
                                    <Button
                                      variant="default"
                                      size="sm"
                                      className="bg-green-600 hover:bg-green-700 text-white"
                                      disabled={updatingOrders.has(order.id)}
                                      onClick={() => {
                                        handleUpdateOrderStatus(
                                          order.id,
                                          nextStatus
                                        );
                                      }}
                                    >
                                      {updatingOrders.has(order.id) ? (
                                        <div className="flex items-center gap-2">
                                          <Loader2 className="h-4 w-4 animate-spin" />
                                          Updating...
                                        </div>
                                      ) : (
                                        <>
                                          {order.status === "pending" &&
                                            "Start Preparing"}
                                          {order.status === "preparing" &&
                                            "Mark Ready"}
                                          {order.status === "ready" &&
                                            "Mark Served"}
                                        </>
                                      )}
                                    </Button>
                                  );
                                }

                                // If no next status, show appropriate message
                                if (order.status === "served") {
                                  const isCardOrder =
                                    order.stripe_payment_intent_id;
                                  return (
                                    <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-1 rounded-lg border border-amber-200">
                                      <Clock className="w-3 h-3" />
                                      <span className="text-xs font-medium">
                                        {isCardOrder
                                          ? "Auto-completing..."
                                          : "Waiting for payment..."}
                                      </span>
                                    </div>
                                  );
                                }

                                // If completed, show completion badge
                                return (
                                  <Badge className="bg-green-100 text-green-800 border-green-200">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Completed
                                  </Badge>
                                );
                              })()}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))
                )}
              </motion.div>
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>

      {/* Order Details Dialog */}
      <AnimatePresence>
        {selectedOrder && (
          <Dialog
            open={!!selectedOrder}
            onOpenChange={() => setSelectedOrder(null)}
          >
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="p-2"
              >
                <DialogHeader className="space-y-4 pb-6">
                  <DialogTitle className="text-2xl font-bold text-gray-900">
                    Order {getOrderNumber(selectedOrder)}
                  </DialogTitle>
                  <div className="flex items-center gap-3">
                    <Badge className={getStatusColor(selectedOrder.status)}>
                      {getStatusIcon(selectedOrder.status)}
                      <span className="ml-2 capitalize font-medium">
                        {selectedOrder.status}
                      </span>
                    </Badge>
                    <span className="text-gray-400">•</span>
                    <span className="text-sm text-gray-600 font-medium">
                      {getTimeAgo(selectedOrder.time.toISOString())}
                    </span>
                  </div>
                </DialogHeader>

                <div className="space-y-6">
                  {/* Order Information */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Order Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                          Table
                        </p>
                        <p className="text-lg font-semibold text-gray-900">
                          Table {selectedOrder.tableNumber}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                          Customer
                        </p>
                        <p className="text-lg font-semibold text-gray-900">
                          {selectedOrder.customerName || "Guest"}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                          Payment Status
                        </p>
                        <Badge
                          variant="outline"
                          className={
                            selectedOrder.paymentStatus === "completed"
                              ? "text-green-600 border-green-200 bg-green-50"
                              : "text-amber-600 border-amber-200 bg-amber-50"
                          }
                        >
                          {selectedOrder.paymentStatus.charAt(0).toUpperCase() +
                            selectedOrder.paymentStatus.slice(1)}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                          Payment Method
                        </p>
                        <Badge
                          variant="outline"
                          className="text-blue-600 border-blue-200 bg-blue-50"
                        >
                          {selectedOrder.paymentMethod === "card"
                            ? "Card"
                            : selectedOrder.paymentMethod === "cash"
                              ? "Cash"
                              : selectedOrder.paymentMethod === "other"
                                ? "Other"
                                : selectedOrder.paymentMethod
                                  ? selectedOrder.paymentMethod
                                      .charAt(0)
                                      .toUpperCase() +
                                    selectedOrder.paymentMethod.slice(1)
                                  : "Unknown"}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Order Items
                    </h3>
                    <div className="space-y-4">
                      {selectedOrder.items.map((item: any, index: number) => (
                        <div
                          key={index}
                          className="flex justify-between items-start py-3 border-b border-gray-100 last:border-b-0"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-gray-900 text-lg">
                                {item.quantity}x
                              </span>
                              <span className="font-semibold text-gray-900 text-lg">
                                {item.name}
                              </span>
                            </div>
                            {item.modifiers && item.modifiers.length > 0 && (
                              <p className="text-sm text-gray-600 mt-2 ml-8">
                                Modifiers: {item.modifiers.join(", ")}
                              </p>
                            )}
                          </div>
                          <span className="font-bold text-gray-900 text-lg">
                            {formatCurrency(item.quantity * item.price)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Order Totals */}
                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>Subtotal</span>
                          <span>{formatCurrency(selectedOrder.total)}</span>
                        </div>
                        {selectedOrder.tax_amount > 0 && (
                          <div className="flex justify-between text-sm text-gray-600">
                            <span>Tax</span>
                            <span>
                              {formatCurrency(selectedOrder.tax_amount)}
                            </span>
                          </div>
                        )}
                        {selectedOrder.tip_amount > 0 && (
                          <div className="flex justify-between text-sm text-gray-600">
                            <span>Tip</span>
                            <span>
                              {formatCurrency(selectedOrder.tip_amount)}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-200">
                          <span>Total</span>
                          <span>{formatCurrency(selectedOrder.total)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Customer Notes */}
                  {selectedOrder.notes && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        Customer Notes
                      </h3>
                      <p className="text-gray-700 leading-relaxed">
                        {selectedOrder.notes}
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                    {(() => {
                      const isCashOrder =
                        !selectedOrder.stripe_payment_intent_id;
                      const isPaid =
                        selectedOrder.paymentStatus === "completed";

                      // For cash orders: show "Mark Paid" only when served and not paid
                      if (
                        isCashOrder &&
                        !isPaid &&
                        selectedOrder.status === "served"
                      ) {
                        return (
                          <Button
                            disabled={markingAsPaid.has(selectedOrder.id)}
                            onClick={() => {
                              handleMarkAsPaid(selectedOrder.id);
                              setSelectedOrder(null);
                            }}
                            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2"
                          >
                            {markingAsPaid.has(selectedOrder.id) ? (
                              <div className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Marking as Paid...
                              </div>
                            ) : (
                              "Mark as Paid"
                            )}
                          </Button>
                        );
                      }

                      // For card orders: payment is already completed when order is created
                      // So we should always show status progression for card orders
                      if (!isCashOrder && !isPaid) {
                        // This should rarely happen for card orders, but handle it gracefully
                        return (
                          <div className="flex items-center gap-2 text-amber-600">
                            <AlertCircle className="h-4 w-4" />
                            <span className="text-sm font-medium">
                              Payment Processing
                            </span>
                          </div>
                        );
                      }

                      // Show status progression buttons for all orders
                      // Cash orders: show progression regardless of payment status
                      // Card orders: payment is already completed, so always show progression
                      const canShowProgression = true;

                      if (
                        selectedOrder.status === "pending" &&
                        canShowProgression
                      ) {
                        return (
                          <Button
                            disabled={updatingOrders.has(selectedOrder.id)}
                            onClick={() => {
                              handleUpdateOrderStatus(
                                selectedOrder.id,
                                "preparing"
                              );
                              setSelectedOrder(null);
                            }}
                            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2"
                          >
                            {updatingOrders.has(selectedOrder.id) ? (
                              <div className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Updating...
                              </div>
                            ) : (
                              "Start Preparing"
                            )}
                          </Button>
                        );
                      }

                      if (
                        selectedOrder.status === "preparing" &&
                        canShowProgression
                      ) {
                        return (
                          <Button
                            disabled={updatingOrders.has(selectedOrder.id)}
                            onClick={() => {
                              handleUpdateOrderStatus(
                                selectedOrder.id,
                                "ready"
                              );
                              setSelectedOrder(null);
                            }}
                            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2"
                          >
                            {updatingOrders.has(selectedOrder.id) ? (
                              <div className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Updating...
                              </div>
                            ) : (
                              "Mark Ready"
                            )}
                          </Button>
                        );
                      }

                      if (
                        selectedOrder.status === "ready" &&
                        canShowProgression
                      ) {
                        return (
                          <Button
                            disabled={updatingOrders.has(selectedOrder.id)}
                            onClick={() => {
                              handleUpdateOrderStatus(
                                selectedOrder.id,
                                "served"
                              );
                              setSelectedOrder(null);
                            }}
                            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2"
                          >
                            {updatingOrders.has(selectedOrder.id) ? (
                              <div className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Updating...
                              </div>
                            ) : (
                              "Mark Served"
                            )}
                          </Button>
                        );
                      }

                      if (selectedOrder.status === "served") {
                        const isCardOrder =
                          selectedOrder.stripe_payment_intent_id;
                        return (
                          <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-4 py-2 rounded-lg border border-amber-200">
                            <Clock className="h-4 w-4" />
                            <span className="text-sm font-medium">
                              {isCardOrder
                                ? "Order will be auto-completed when payment is confirmed"
                                : "Order will be auto-completed when customer pays"}
                            </span>
                          </div>
                        );
                      }

                      // If completed, show completion message
                      return (
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-sm font-medium">
                            Order Completed
                          </span>
                        </div>
                      );
                    })()}
                    <Button
                      variant="outline"
                      onClick={() => setSelectedOrder(null)}
                      className="px-6 py-2"
                    >
                      Close
                    </Button>
                  </div>
                </div>
              </motion.div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>

      {/* Cancel Confirmation Dialog */}
      <Dialog
        open={!!cancelOrderId}
        onOpenChange={() => setCancelOrderId(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Cancellation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to cancel this order? This action will:
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Process a refund through Stripe (if card payment)</li>
              <li>• Update the order status to cancelled</li>
              <li>• Update the payment status to cancelled</li>
              <li>• Move the order to history</li>
            </ul>
            <p className="text-sm font-medium text-gray-900">
              This action cannot be undone.
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setCancelOrderId(null)}
              disabled={updatingOrders.has(cancelOrderId || "")}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => cancelOrderId && handleCancelOrder(cancelOrderId)}
              disabled={updatingOrders.has(cancelOrderId || "")}
            >
              {updatingOrders.has(cancelOrderId || "") ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </div>
              ) : (
                "Cancel Order"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
