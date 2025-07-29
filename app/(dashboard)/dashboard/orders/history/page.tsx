"use client";

import { useState, useEffect } from "react";
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
    case "stripe":
      return "text-blue-600";
    case "cash":
      return "text-green-600";
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
        tax_amount: newOrder.tax_amount,
        tip_amount: newOrder.tip_amount,
        created_at: newOrder.created_at,
        updated_at: newOrder.updated_at,
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
          tax_amount: updatedOrder.tax_amount,
          tip_amount: updatedOrder.tip_amount,
          created_at: updatedOrder.created_at,
          updated_at: updatedOrder.updated_at,
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
                  tax_amount: updatedOrder.tax_amount,
                  tip_amount: updatedOrder.tip_amount,
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
  useEffect(() => {
    const fetchOrders = async () => {
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
    };

    fetchOrders();
  }, [restaurant?.id, statusFilter, searchTerm]);

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
    return order.orderNumber || `#${order.id.slice(-8).toUpperCase()}`;
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
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Orders</CardTitle>
            <CardDescription>
              Showing {filteredOrders.length} of {orders.length} orders
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="rounded-md border">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="h-12 px-4 text-left align-middle font-medium text-gray-500">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="font-medium -ml-3"
                        onClick={() => toggleSort("id")}
                      >
                        Order ID
                        <ArrowUpDown className="ml-2 h-3 w-3" />
                      </Button>
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-gray-500">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="font-medium -ml-3"
                        onClick={() => toggleSort("time")}
                      >
                        Date
                        <ArrowUpDown className="ml-2 h-3 w-3" />
                      </Button>
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-gray-500">
                      Table
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-gray-500">
                      Customer
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-gray-500">
                      Items
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-gray-500">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="font-medium -ml-3"
                        onClick={() => toggleSort("total")}
                      >
                        Total
                        <ArrowUpDown className="ml-2 h-3 w-3" />
                      </Button>
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-gray-500">
                      Status
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-gray-500">
                      Payment
                    </th>
                    <th className="h-12 px-4 text-right align-middle font-medium text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence mode="wait">
                    {filteredOrders.length === 0 ? (
                      <motion.tr
                        key="no-orders"
                        variants={tableRowVariants}
                        initial="hidden"
                        animate="visible"
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <td colSpan={9} className="h-24 text-center">
                          <motion.div
                            className="flex flex-col items-center justify-center text-gray-500"
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
                        </td>
                      </motion.tr>
                    ) : (
                      filteredOrders.map((order, index) => (
                        <motion.tr
                          key={order.id}
                          variants={tableRowVariants}
                          initial="hidden"
                          animate="visible"
                          transition={{ delay: index * 0.05 }}
                          className="group hover:bg-gray-50 cursor-pointer"
                          onClick={() => setSelectedOrder(order)}
                        >
                          <td className="p-4 align-middle font-medium">
                            {getOrderNumber(order)}
                          </td>
                          <td className="p-4 align-middle">
                            <div className="flex flex-col">
                              <span>
                                {safeFormat(order.time, "MMM d, yyyy")}
                              </span>
                              <span className="text-xs text-gray-500">
                                {safeFormat(order.time, "h:mm a")}
                              </span>
                            </div>
                          </td>
                          <td className="p-4 align-middle">
                            Table {order.tableNumber}
                          </td>
                          <td className="p-4 align-middle">
                            {order.customerName || "Guest"}
                          </td>
                          <td className="p-4 align-middle">
                            <div className="max-w-[200px] truncate">
                              {order.items.map((item: any, i: number) => (
                                <span key={item.id}>
                                  {item.quantity}x {item.name}
                                  {i < order.items.length - 1 && ", "}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="p-4 align-middle font-medium">
                            {formatCurrency(order.total)}
                          </td>
                          <td className="p-4 align-middle">
                            <Badge className={getStatusColor(order.status)}>
                              {order.status.charAt(0).toUpperCase() +
                                order.status.slice(1)}
                            </Badge>
                          </td>
                          <td className="p-4 align-middle">
                            <Badge
                              variant="outline"
                              className={getPaymentStatusColor(
                                order.paymentStatus
                              )}
                            >
                              {getPaymentStatusText(order.paymentStatus)}
                            </Badge>
                          </td>
                          <td className="p-4 align-middle text-right">
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
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
                                      console.log(
                                        "Print receipt for",
                                        order.id
                                      );
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
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
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
                        <div className="bg-white rounded-lg border divide-y">
                          {selectedOrder.items.map((item: any) => (
                            <div
                              key={item.id}
                              className="p-3 flex items-start justify-between"
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm">
                                    {item.quantity}x
                                  </span>
                                  <span className="text-sm">{item.name}</span>
                                </div>
                                {item.modifiers &&
                                  item.modifiers.length > 0 && (
                                    <p className="text-xs text-gray-500">
                                      Modifiers: {item.modifiers.join(", ")}
                                    </p>
                                  )}
                              </div>
                              <span className="text-sm font-medium">
                                {formatCurrency(item.price * item.quantity)}
                              </span>
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
                          <div className="space-y-4">
                            <div className="flex gap-3">
                              <div className="flex-none">
                                <div className="w-2 h-2 mt-2 rounded-full bg-blue-500 ring-4 ring-blue-50" />
                              </div>
                              <div>
                                <p className="text-sm font-medium">
                                  Order Placed
                                </p>
                                <p className="text-xs text-gray-500">
                                  {safeFormat(
                                    selectedOrder.orderTime ||
                                      selectedOrder.time,
                                    "MMM d, yyyy h:mm a"
                                  )}
                                </p>
                              </div>
                            </div>

                            {selectedOrder.completedTime && (
                              <div className="flex gap-3">
                                <div className="flex-none">
                                  <div className="w-2 h-2 mt-2 rounded-full bg-green-500 ring-4 ring-green-50" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium">
                                    Order Completed
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {safeFormat(
                                      selectedOrder.completedTime,
                                      "MMM d, yyyy h:mm a"
                                    )}
                                  </p>
                                </div>
                              </div>
                            )}

                            {selectedOrder.refundedTime && (
                              <div className="flex gap-3">
                                <div className="flex-none">
                                  <div className="w-2 h-2 mt-2 rounded-full bg-amber-500 ring-4 ring-amber-50" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium">
                                    Payment Refunded
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {safeFormat(
                                      selectedOrder.refundedTime,
                                      "MMM d, yyyy h:mm a"
                                    )}
                                  </p>
                                  {selectedOrder.refundReason && (
                                    <p className="text-xs bg-amber-50 p-2 rounded-md mt-1">
                                      {selectedOrder.refundReason}
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}

                            {selectedOrder.cancelledTime && (
                              <div className="flex gap-3">
                                <div className="flex-none">
                                  <div className="w-2 h-2 mt-2 rounded-full bg-red-500 ring-4 ring-red-50" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium">
                                    Order Cancelled
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {safeFormat(
                                      selectedOrder.cancelledTime,
                                      "MMM d, yyyy h:mm a"
                                    )}
                                  </p>
                                  {selectedOrder.cancellationReason && (
                                    <p className="text-xs bg-red-50 p-2 rounded-md mt-1">
                                      {selectedOrder.cancellationReason}
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="flex-none border-t px-6 py-4 bg-gray-50">
                    <div className="flex justify-end gap-2">
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
                </motion.div>
              )}
            </SheetContent>
          </Sheet>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
