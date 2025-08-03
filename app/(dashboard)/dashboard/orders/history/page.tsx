"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Download,
  Filter,
  Search,
  ChevronDown,
  X,
  ArrowUpDown,
  FileText,
  Printer,
  RefreshCcw,
  Clock,
  AlertCircle,
  CheckCircle,
  DollarSign,
  MoreHorizontal,
} from "lucide-react";
import { format, isValid, parseISO } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useRestaurantSettings } from "@/lib/store/restaurant-settings";
import {
  getRestaurantOrders,
  refundOrder,
  type Order,
  type OrderFilters,
} from "@/lib/actions/orders";
import { useOrdersWebSocket } from "@/hooks/useOrdersWebSocket";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { getDisplayOrderNumber } from "@/lib/utils/order";

// Order Timeline Component
const OrderTimeline = ({ order }: { order: Order }) => {
  const timelineEvents = [];

  // Order placed (always present)
  timelineEvents.push({
    id: "placed",
    title: "Order Placed",
    description: "Order was created and submitted",
    timestamp: order.time,
    status: "completed",
    icon: "📋",
    color: "blue",
  });

  // Payment processing (if card payment)
  if (order.paymentMethod === "card") {
    timelineEvents.push({
      id: "payment_processing",
      title: "Payment Processing",
      description: "Card payment being processed",
      timestamp: order.time, // Same as order time for card payments
      status: "completed",
      icon: "💳",
      color: "blue",
    });
  }

  // Payment completed
  if (order.paymentStatus === "completed") {
    timelineEvents.push({
      id: "payment_completed",
      title: "Payment Completed",
      description:
        order.paymentMethod === "card"
          ? "Card payment successful"
          : "Cash payment received",
      timestamp: order.time, // For now, using order time
      status: "completed",
      icon: order.paymentMethod === "card" ? "✅" : "💰",
      color: "green",
    });
  }

  // Order status changes (if we had timestamps for these)
  if (order.status === "completed") {
    timelineEvents.push({
      id: "order_completed",
      title: "Order Completed",
      description: "Order was successfully completed",
      timestamp: order.updated_at || order.time,
      status: "completed",
      icon: "🎉",
      color: "green",
    });
  }

  // Refund (if applicable)
  if (order.status === "cancelled" && order.paymentStatus === "refunded") {
    timelineEvents.push({
      id: "refunded",
      title: "Payment Refunded",
      description:
        order.paymentMethod === "card"
          ? "Payment refunded via Stripe"
          : "Cash refund processed - restaurant handled manually",
      timestamp: order.updated_at || order.time,
      status: "completed",
      icon: "↩️",
      color: "amber",
    });
  }

  // Order cancelled (without refund)
  if (order.status === "cancelled" && order.paymentStatus !== "refunded") {
    timelineEvents.push({
      id: "cancelled",
      title: "Order Cancelled",
      description:
        order.paymentMethod === "cash"
          ? "Order cancelled - no payment was made"
          : "Order cancelled before payment confirmation",
      timestamp: order.updated_at || order.time,
      status: "completed",
      icon: "❌",
      color: "red",
    });
  }

  const getColorClasses = (color: string) => {
    switch (color) {
      case "blue":
        return "bg-blue-500 ring-blue-50";
      case "green":
        return "bg-green-500 ring-green-50";
      case "amber":
        return "bg-amber-500 ring-amber-50";
      case "red":
        return "bg-red-500 ring-red-50";
      default:
        return "bg-gray-500 ring-gray-50";
    }
  };

  return (
    <div className="space-y-4">
      {timelineEvents.map((event, index) => (
        <div key={event.id} className="flex gap-3">
          {/* Timeline dot and connector */}
          <div className="flex-none flex flex-col items-center">
            <div
              className={`w-3 h-3 rounded-full ring-4 ${getColorClasses(event.color)}`}
            />
            {index < timelineEvents.length - 1 && (
              <div className="w-0.5 h-8 bg-gray-200 mt-2" />
            )}
          </div>

          {/* Event content */}
          <div className="flex-1 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{event.icon}</span>
              <p className="text-sm font-medium text-gray-900">{event.title}</p>
            </div>
            <p className="text-xs text-gray-500 mb-1">{event.description}</p>
            <p className="text-xs text-gray-400">
              {safeFormat(event.timestamp, "MMM d, yyyy h:mm a")}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

// Status color mapping
const getStatusColor = (status: string) => {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-800";
    case "refunded":
      return "bg-amber-100 text-amber-800";
    case "cancelled":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

// Payment method color mapping
const getPaymentMethodColor = (method: string) => {
  switch (method) {
    case "card":
      return "text-blue-600";
    case "cash":
      return "text-green-600";
    case "other":
      return "text-gray-600";
    default:
      return "text-gray-600";
  }
};

// Payment status color mapping
const getPaymentStatusColor = (status: string) => {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-800";
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "failed":
      return "bg-red-100 text-red-800";
    case "refunded":
      return "bg-amber-100 text-amber-800";
    default:
      return "bg-gray-100 text-gray-800";
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

// Add this new component at the top level
const StatCard = ({
  title,
  value,
  icon: Icon,
  bgColor,
  textColor,
  borderColor,
}: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  bgColor: string;
  textColor: string;
  borderColor: string;
}) => {
  return (
    <Card className={`${bgColor} ${borderColor}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm font-medium ${textColor}`}>{title}</p>
            <p
              className={`text-2xl font-bold mt-1 ${textColor.replace(
                "600",
                "700"
              )}`}
            >
              {value}
            </p>
          </div>
          <div
            className={`h-10 w-10 rounded-full ${bgColor.replace(
              "50",
              "100"
            )} flex items-center justify-center`}
          >
            <Icon className={`h-6 w-6 ${textColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const AnimatedStatCard = motion(StatCard);

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

const tableRowVariants = {
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

// Safe date formatting function
const safeFormat = (
  date: Date | string | null | undefined,
  formatString: string,
  fallback: string = "Invalid Date"
) => {
  if (!date) return fallback;

  let dateObj: Date;
  if (typeof date === "string") {
    dateObj = new Date(date);
  } else {
    dateObj = date;
  }

  if (!isValid(dateObj)) {
    return fallback;
  }

  try {
    return format(dateObj, formatString);
  } catch (error) {
    console.error("Date formatting error:", error, date);
    return fallback;
  }
};

export default function OrderHistoryPage() {
  const router = useRouter();
  const { currencySymbol, restaurant } = useRestaurantSettings();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all");
  const [tableFilter, setTableFilter] = useState("all");
  const [sortField, setSortField] = useState("time");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

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
        paymentMethod: (newOrder as any).paymentMethod || "other",
        stripe_payment_intent_id: (newOrder as any).stripe_payment_intent_id,
      };

      setOrders((prev) => [orderData, ...prev]);
    },
    onOrderUpdated: (updatedOrder, oldOrder) => {
      // If order becomes cancelled or completed, add it to history
      if (
        (updatedOrder.status === "cancelled" ||
          updatedOrder.status === "completed") &&
        oldOrder &&
        oldOrder.status !== "cancelled" &&
        oldOrder.status !== "completed"
      ) {
        // Add the order to history list
        const orderData: Order = {
          id: updatedOrder.id,
          orderNumber:
            (updatedOrder as any).order_number ||
            `ORD-${updatedOrder.id.slice(-8).toUpperCase()}`,
          tableNumber: "Unknown", // Will be fetched with full data
          customerName: undefined,
          items: [],
          status: updatedOrder.status,
          time: new Date(updatedOrder.created_at),
          estimatedTime: 15,
          notes: updatedOrder.notes || undefined,
          total: updatedOrder.total_amount,
          paymentStatus: "pending",
          priority: "normal",
          restaurant_id: updatedOrder.restaurant_id,
          table_id: updatedOrder.table_id || "",
          total_amount: updatedOrder.total_amount,
          tax_amount: (updatedOrder as any).tax_amount || 0,
          tip_amount: (updatedOrder as any).tip_amount || 0,
          created_at: updatedOrder.created_at,
          updated_at: updatedOrder.updated_at,
          paymentMethod: (updatedOrder as any).paymentMethod || "other",
          stripe_payment_intent_id: (updatedOrder as any)
            .stripe_payment_intent_id,
        };
        setOrders((prev) => [orderData, ...prev]);
      } else {
        // Update existing order in history
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
                }
              : order
          )
        );
      }
    },
    onOrderDeleted: (deletedOrder) => {
      setOrders((prev) => prev.filter((order) => order.id !== deletedOrder.id));
    },
  });

  // Fetch orders data
  const fetchOrders = useCallback(async () => {
    if (!restaurant?.id) return;

    setLoading(true);
    try {
      const filters: OrderFilters = {
        historyOnly: true, // Only fetch completed, cancelled, or refunded orders
      };
      if (statusFilter && statusFilter !== "all") {
        filters.status = statusFilter;
      }
      if (searchTerm) {
        filters.search = searchTerm;
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
  }, [restaurant?.id, statusFilter, searchTerm]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Get unique table numbers for filter dropdown
  const uniqueTables = Array.from(
    new Set(orders.map((order) => order.tableNumber))
  ).sort();

  // Format currency with the restaurant's settings
  const formatCurrency = (amount: number): string => {
    return `${currencySymbol} ${amount.toFixed(2)}`;
  };

  // Generate order number from order ID and index
  const getOrderNumber = (order: Order) => {
    return getDisplayOrderNumber(order);
  };

  // Apply filters and sorting
  const filteredOrders = orders
    .filter((order) => {
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesId = order.id.toLowerCase().includes(searchLower);
        const matchesTable = order.tableNumber
          .toLowerCase()
          .includes(searchLower);
        const matchesItems = order.items.some((item) =>
          item.name.toLowerCase().includes(searchLower)
        );
        const matchesNotes =
          order.notes?.toLowerCase().includes(searchLower) || false;
        if (!(matchesId || matchesTable || matchesItems || matchesNotes))
          return false;
      }
      if (statusFilter !== "all" && order.status !== statusFilter) return false;
      if (
        paymentMethodFilter !== "all" &&
        order.paymentMethod !== paymentMethodFilter
      )
        return false;
      if (tableFilter !== "all" && order.tableNumber !== tableFilter)
        return false;
      return true;
    })
    .sort((a, b) => {
      const fieldA = a[sortField as keyof typeof a];
      const fieldB = b[sortField as keyof typeof b];
      if (typeof fieldA === "string" && typeof fieldB === "string") {
        return sortDirection === "asc"
          ? fieldA.localeCompare(fieldB)
          : fieldB.localeCompare(fieldA);
      }
      const dateA = new Date(a.time).getTime();
      const dateB = new Date(b.time).getTime();
      return sortDirection === "asc" ? dateA - dateB : dateB - dateA;
    });

  // Calculate summary stats
  const summaryStats = {
    total: filteredOrders.length,
    completed: filteredOrders.filter((o) => o.status === "completed").length,
    refunded: filteredOrders.filter((o) => o.status === "refunded").length,
    cancelled: filteredOrders.filter((o) => o.status === "cancelled").length,
    totalRevenue: filteredOrders.reduce(
      (sum, order) => (order.status === "completed" ? sum + order.total : sum),
      0
    ),
  };

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const resetFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setPaymentMethodFilter("all");
    setTableFilter("all");
  };

  return (
    <motion.div
      className="p-6 space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        variants={itemVariants}
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Order History</h1>
          <p className="text-gray-500">View and manage past orders</p>
        </div>
        <motion.div className="flex flex-wrap gap-2" variants={itemVariants}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/dashboard/orders/active")}
          >
            Active Orders
          </Button>
          <Button
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <motion.div variants={iconVariants}>
              <RefreshCcw className="w-4 h-4 mr-2" />
            </motion.div>
            Refresh
          </Button>
        </motion.div>
      </motion.div>

      {/* Summary Stats */}
      <motion.div
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
        variants={itemVariants}
      >
        <motion.div variants={cardVariants}>
          <AnimatedStatCard
            title="Total Orders"
            value={summaryStats.total}
            icon={FileText}
            bgColor="bg-blue-50"
            textColor="text-blue-900"
            borderColor="border-blue-200"
          />
        </motion.div>
        <motion.div variants={cardVariants}>
          <AnimatedStatCard
            title="Completed"
            value={summaryStats.completed}
            icon={CheckCircle}
            bgColor="bg-green-50"
            textColor="text-green-900"
            borderColor="border-green-200"
          />
        </motion.div>
        <motion.div variants={cardVariants}>
          <AnimatedStatCard
            title="Refunded"
            value={summaryStats.refunded}
            icon={RefreshCcw}
            bgColor="bg-amber-50"
            textColor="text-amber-900"
            borderColor="border-amber-200"
          />
        </motion.div>
        <motion.div variants={cardVariants}>
          <AnimatedStatCard
            title="Total Revenue"
            value={formatCurrency(summaryStats.totalRevenue)}
            icon={DollarSign}
            bgColor="bg-purple-50"
            textColor="text-purple-900"
            borderColor="border-purple-200"
          />
        </motion.div>
      </motion.div>

      {/* Search and Filters */}
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
              Filter and search through order history
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
              variants={itemVariants}
            >
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                <Input
                  placeholder="Search orders by order number, table, customer, items, or notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>

              {/* Payment Method Filter */}
              <Select
                value={paymentMethodFilter}
                onValueChange={setPaymentMethodFilter}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Payment Method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="card">Card Payment</SelectItem>
                  <SelectItem value="cash">Cash Payment</SelectItem>
                </SelectContent>
              </Select>

              {/* Table Filter */}
              <Select value={tableFilter} onValueChange={setTableFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Table" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tables</SelectItem>
                  {uniqueTables.map((table) => (
                    <SelectItem key={table} value={table}>
                      Table {table}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Reset Button - Only show when filters are applied */}
              {(paymentMethodFilter !== "all" ||
                tableFilter !== "all" ||
                searchTerm) && (
                <Button
                  variant="outline"
                  onClick={resetFilters}
                  className="shrink-0 hover:bg-green-50 hover:text-green-600 hover:border-green-600"
                >
                  <X className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              )}
            </motion.div>

            <Separator />

            {/* Status Filter Buttons */}
            <motion.div
              className="flex flex-wrap gap-2"
              variants={itemVariants}
            >
              <Button
                variant={statusFilter === "all" ? "default" : "outline"}
                onClick={() => setStatusFilter("all")}
                className={
                  statusFilter === "all"
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "hover:bg-green-50 hover:text-green-600 hover:border-green-600"
                }
              >
                All Status
              </Button>
              <Button
                variant={statusFilter === "completed" ? "default" : "outline"}
                onClick={() => setStatusFilter("completed")}
                className={
                  statusFilter === "completed"
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "hover:bg-green-50 hover:text-green-600 hover:border-green-600"
                }
              >
                Completed
              </Button>
              <Button
                variant={statusFilter === "refunded" ? "default" : "outline"}
                onClick={() => setStatusFilter("refunded")}
                className={
                  statusFilter === "refunded"
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "hover:bg-green-50 hover:text-green-600 hover:border-green-600"
                }
              >
                Refunded
              </Button>
              <Button
                variant={statusFilter === "cancelled" ? "default" : "outline"}
                onClick={() => setStatusFilter("cancelled")}
                className={
                  statusFilter === "cancelled"
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "hover:bg-green-50 hover:text-green-600 hover:border-green-600"
                }
              >
                Cancelled
              </Button>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Orders Table */}
      <motion.div variants={itemVariants}>
        <div className="bg-white rounded-lg border shadow-sm">
          {/* Table Header */}
          <div className="px-6 py-4 border-b bg-gray-50/50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Order History
                </h3>
                <p className="text-sm text-gray-500">
                  Showing {filteredOrders.length} of {orders.length} orders
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Refresh the data
                    window.location.reload();
                  }}
                >
                  <RefreshCcw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
          </div>

          {/* Table Content */}
          {loading ? (
            <motion.div
              className="flex flex-col items-center justify-center py-16 px-6"
              variants={itemVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.div
                className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6"
                variants={iconVariants}
              >
                <RefreshCcw className="w-12 h-12 text-gray-400 animate-spin" />
              </motion.div>

              <motion.h3
                className="text-xl font-semibold text-gray-900 mb-2 text-center"
                variants={itemVariants}
              >
                Loading order history...
              </motion.h3>

              <motion.p
                className="text-gray-500 text-center max-w-md"
                variants={itemVariants}
              >
                Please wait while we fetch your order history from the database.
              </motion.p>
            </motion.div>
          ) : filteredOrders.length === 0 ? (
            <motion.div
              className="flex flex-col items-center justify-center py-16 px-6"
              variants={itemVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.div
                className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6"
                variants={iconVariants}
              >
                <FileText className="w-12 h-12 text-gray-400" />
              </motion.div>

              <motion.h3
                className="text-xl font-semibold text-gray-900 mb-2 text-center"
                variants={itemVariants}
              >
                No orders found
              </motion.h3>

              <motion.p
                className="text-gray-500 text-center mb-6 max-w-md"
                variants={itemVariants}
              >
                No orders match your current filters. Try adjusting your search
                criteria or check back later for new orders.
              </motion.p>

              <motion.div
                className="flex flex-col sm:flex-row gap-3"
                variants={itemVariants}
              >
                <Button
                  variant="outline"
                  onClick={resetFilters}
                  className="flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Clear Filters
                </Button>
                <Button
                  onClick={() => router.push("/dashboard/orders/active")}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  View Active Orders
                </Button>
              </motion.div>
            </motion.div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[160px]">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="font-medium h-auto p-0 hover:bg-transparent"
                        onClick={() => toggleSort("id")}
                      >
                        Order ID
                        <ArrowUpDown className="ml-2 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead className="w-[160px]">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="font-medium h-auto p-0 hover:bg-transparent"
                        onClick={() => toggleSort("time")}
                      >
                        Date & Time
                        <ArrowUpDown className="ml-2 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead className="w-[100px]">Table</TableHead>
                    <TableHead className="w-[120px]">Customer</TableHead>
                    <TableHead className="w-[150px]">Items</TableHead>
                    <TableHead className="w-[120px]">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="font-medium h-auto p-0 hover:bg-transparent"
                        onClick={() => toggleSort("total")}
                      >
                        Total
                        <ArrowUpDown className="ml-2 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead className="w-[100px]">Status</TableHead>
                    <TableHead className="w-[100px]">Payment</TableHead>
                    <TableHead className="w-[100px]">Method</TableHead>
                    <TableHead className="w-[80px] text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence mode="wait">
                    {filteredOrders.map((order, index) => (
                      <motion.tr
                        key={order.id}
                        variants={tableRowVariants}
                        initial="hidden"
                        animate="visible"
                        transition={{ delay: index * 0.05 }}
                        className="group hover:bg-gray-50/50 cursor-pointer border-b"
                        onClick={() => setSelectedOrder(order)}
                      >
                        <TableCell className="font-medium">
                          <span className="font-mono text-sm">
                            {getOrderNumber(order)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">
                              {safeFormat(order.time, "MMM d, yyyy")}
                            </span>
                            <span className="text-xs text-gray-500">
                              {safeFormat(order.time, "h:mm a")}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Table {order.tableNumber}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {order.customerName || "Guest"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div
                            className="w-[130px] cursor-pointer hover:text-blue-600 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedOrder(order);
                            }}
                            title={`Click to view ${order.items.length} items`}
                          >
                            <div className="text-sm text-gray-900 truncate">
                              {order.items.length === 1
                                ? `${order.items[0].quantity}x ${order.items[0].name}`
                                : order.items.length === 2
                                  ? `${order.items[0].quantity}x ${order.items[0].name}, ${order.items[1].quantity}x ${order.items[1].name}`
                                  : `${order.items[0].quantity}x ${order.items[0].name} +${order.items.length - 1} more`}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {order.items.length} item
                              {order.items.length !== 1 ? "s" : ""}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium text-sm">
                            {formatCurrency(order.total)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(order.status)}>
                            {order.status.charAt(0).toUpperCase() +
                              order.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={getPaymentStatusColor(
                              order.paymentStatus
                            )}
                          >
                            {getPaymentStatusText(order.paymentStatus)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={getPaymentMethodColor(
                              order.paymentMethod || "unknown"
                            )}
                          >
                            {order.paymentMethod === "card"
                              ? "💳 Card"
                              : "💰 Cash"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-48" align="end">
                              <div className="space-y-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="w-full justify-start"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    console.log("Print receipt for", order.id);
                                  }}
                                >
                                  <Printer className="h-4 w-4 mr-2" />
                                  Print Receipt
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="w-full justify-start"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedOrder(order);
                                  }}
                                >
                                  <FileText className="h-4 w-4 mr-2" />
                                  View Details
                                </Button>
                              </div>
                            </PopoverContent>
                          </Popover>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </motion.div>

      {/* Order Details Sheet */}
      <AnimatePresence>
        {selectedOrder && (
          <Sheet
            open={!!selectedOrder}
            onOpenChange={(open) => !open && setSelectedOrder(null)}
          >
            <SheetContent className="w-full sm:max-w-xl overflow-y-auto p-0">
              <SheetHeader className="px-6 py-4 border-b">
                <SheetTitle>Order Details</SheetTitle>
              </SheetHeader>

              {selectedOrder && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  {/* Header Info */}
                  <div className="flex-none px-6 py-4 border-b bg-gray-50">
                    <div className="flex items-center justify-between mb-1">
                      <h2 className="text-lg font-semibold text-gray-900">
                        Order {getOrderNumber(selectedOrder)}
                      </h2>
                      <Badge className={getStatusColor(selectedOrder.status)}>
                        {selectedOrder.status.charAt(0).toUpperCase() +
                          selectedOrder.status.slice(1)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {safeFormat(selectedOrder.time, "MMM d, yyyy h:mm a")}
                      </span>
                      <span>•</span>
                      <span>Table {selectedOrder.tableNumber}</span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 overflow-y-auto">
                    <div className="px-6 py-4 space-y-6">
                      {/* Customer Info */}
                      {selectedOrder.customer && (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h3 className="text-sm font-medium text-gray-900 mb-2">
                            Customer Details
                          </h3>
                          <div className="space-y-1">
                            <p className="text-sm font-medium">
                              {selectedOrder.customer.name || "Anonymous"}
                            </p>
                            {selectedOrder.customer.email && (
                              <p className="text-sm text-gray-500">
                                {selectedOrder.customer.email}
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Order Items */}
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 mb-3">
                          Order Items
                        </h3>
                        <div className="space-y-3">
                          {selectedOrder.items.map((item: any) => (
                            <div
                              key={item.id}
                              className="bg-white rounded-lg border border-gray-200 p-4"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="font-bold text-gray-900">
                                      {item.quantity}x
                                    </span>
                                    <span className="font-semibold text-gray-900">
                                      {item.name}
                                    </span>
                                    {/* Show combo meal indicator */}
                                    {item.comboMealName && (
                                      <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs font-medium">
                                        🍽️ {item.comboMealName}
                                      </Badge>
                                    )}
                                  </div>

                                  {/* Show advanced options with better styling */}
                                  {(item.selectedSize ||
                                    (item.selectedModifiers &&
                                      item.selectedModifiers.length > 0)) && (
                                    <div className="ml-6 space-y-1 mt-2">
                                      {item.selectedSize && (
                                        <div className="flex items-center gap-2">
                                          <Badge
                                            variant="outline"
                                            className="bg-green-50 text-green-700 border-green-200 text-xs"
                                          >
                                            📏 Size
                                          </Badge>
                                          <span className="text-sm text-gray-700 font-medium">
                                            {item.selectedSize
                                              .charAt(0)
                                              .toUpperCase() +
                                              item.selectedSize
                                                .slice(1)
                                                .toLowerCase()}
                                          </span>
                                        </div>
                                      )}
                                      {item.selectedModifiers &&
                                        item.selectedModifiers.length > 0 && (
                                          <div className="flex items-start gap-2">
                                            <Badge
                                              variant="outline"
                                              className="bg-purple-50 text-purple-700 border-purple-200 text-xs mt-0.5"
                                            >
                                              ⚙️ Modifiers
                                            </Badge>
                                            <div className="flex flex-wrap gap-1">
                                              {item.selectedModifiers.map(
                                                (
                                                  modifier: any,
                                                  modIndex: number
                                                ) => (
                                                  <Badge
                                                    key={modIndex}
                                                    variant="outline"
                                                    className="bg-gray-100 text-gray-700 border-gray-300 text-xs"
                                                  >
                                                    {modifier.name}
                                                    {modifier.priceModifier >
                                                      0 && (
                                                      <span className="text-green-600 ml-1">
                                                        (+
                                                        {modifier.priceModifier.toFixed(
                                                          2
                                                        )}
                                                        )
                                                      </span>
                                                    )}
                                                  </Badge>
                                                )
                                              )}
                                            </div>
                                          </div>
                                        )}
                                    </div>
                                  )}

                                  {/* Legacy modifiers support */}
                                  {!item.selectedModifiers &&
                                    item.modifiers &&
                                    item.modifiers.length > 0 && (
                                      <div className="ml-6 mt-2">
                                        <div className="flex items-center gap-2">
                                          <Badge
                                            variant="outline"
                                            className="bg-orange-50 text-orange-700 border-orange-200 text-xs"
                                          >
                                            📝 Modifiers
                                          </Badge>
                                          <span className="text-sm text-gray-600">
                                            {item.modifiers.join(", ")}
                                          </span>
                                        </div>
                                      </div>
                                    )}
                                </div>
                                <div className="text-right">
                                  <span className="font-bold text-gray-900">
                                    {formatCurrency(item.price * item.quantity)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                          <div className="p-3 flex items-center justify-between bg-gray-50">
                            <span className="font-medium">Total</span>
                            <span className="font-medium text-green-600">
                              {formatCurrency(selectedOrder.total)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Payment Details */}
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 mb-3">
                          Payment Details
                        </h3>
                        <div className="bg-white rounded-lg border p-4 space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-gray-500 mb-1">
                                Method
                              </p>
                              <span
                                className={`text-sm font-medium ${getPaymentMethodColor(
                                  selectedOrder.paymentMethod
                                )}`}
                              >
                                {selectedOrder.paymentMethod.toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">
                                Status
                              </p>
                              <Badge
                                variant="outline"
                                className={getPaymentStatusColor(
                                  selectedOrder.paymentStatus
                                )}
                              >
                                {getPaymentStatusText(
                                  selectedOrder.paymentStatus
                                )}
                              </Badge>
                            </div>
                          </div>

                          {(selectedOrder.transactionId ||
                            selectedOrder.refundId) && (
                            <div className="pt-3 border-t space-y-3">
                              {selectedOrder.transactionId && (
                                <div>
                                  <p className="text-xs text-gray-500 mb-1">
                                    Transaction ID
                                  </p>
                                  <p className="font-mono text-xs bg-gray-50 p-1.5 rounded">
                                    {selectedOrder.transactionId}
                                  </p>
                                </div>
                              )}
                              {selectedOrder.refundId && (
                                <div>
                                  <p className="text-xs text-gray-500 mb-1">
                                    Refund ID
                                  </p>
                                  <p className="font-mono text-xs bg-gray-50 p-1.5 rounded">
                                    {selectedOrder.refundId}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Customer Notes */}
                      {selectedOrder.notes && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-900 mb-3">
                            Customer Notes
                          </h3>
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-sm">{selectedOrder.notes}</p>
                          </div>
                        </div>
                      )}

                      {/* Order Timeline */}
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 mb-3">
                          Order Timeline
                        </h3>
                        <div className="bg-white rounded-lg border p-4">
                          <OrderTimeline order={selectedOrder} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="flex-none border-t px-6 py-4 bg-gray-50">
                    <div className="flex justify-between items-center">
                      {/* Left side - Refund button (only for completed orders) */}
                      {selectedOrder.status === "completed" &&
                        selectedOrder.paymentStatus === "completed" && (
                          <Button
                            variant="outline"
                            className="text-amber-600 border-amber-200 hover:bg-amber-50"
                            onClick={async () => {
                              if (
                                confirm(
                                  `Are you sure you want to refund this ${selectedOrder.paymentMethod} order?`
                                )
                              ) {
                                try {
                                  const result = await refundOrder(
                                    selectedOrder.id
                                  );
                                  if (result.success) {
                                    toast.success(
                                      selectedOrder.paymentMethod === "card"
                                        ? "Refund processed successfully via Stripe"
                                        : "Order marked as refunded - please handle cash refund manually"
                                    );
                                    // Refresh orders to show updated status
                                    fetchOrders();
                                    setSelectedOrder(null);
                                  } else {
                                    toast.error(
                                      result.error || "Failed to process refund"
                                    );
                                  }
                                } catch (error) {
                                  console.error("Refund error:", error);
                                  toast.error("Failed to process refund");
                                }
                              }
                            }}
                          >
                            <RefreshCcw className="w-4 h-4 mr-2" />
                            Refund Order
                          </Button>
                        )}

                      {/* Right side - Print and Close buttons */}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() =>
                            console.log("Print receipt for", selectedOrder.id)
                          }
                        >
                          <Printer className="w-4 h-4 mr-2" />
                          Print Receipt
                        </Button>
                        <Button
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => setSelectedOrder(null)}
                        >
                          Close
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </SheetContent>
          </Sheet>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
