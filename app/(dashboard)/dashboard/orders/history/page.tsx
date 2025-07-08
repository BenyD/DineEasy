"use client";

import { useState } from "react";
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
} from "lucide-react";
import { format } from "date-fns";
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

// Mock historical orders data
const mockHistoricalOrders = [
  {
    id: "ORD-001",
    tableNumber: "3",
    items: [
      {
        id: "1",
        name: "Margherita Pizza",
        quantity: 1,
        price: 22.0,
        notes: "Extra cheese",
      },
      { id: "2", name: "Caesar Salad", quantity: 1, price: 16.5, notes: "" },
      { id: "3", name: "Sparkling Water", quantity: 2, price: 4.5, notes: "" },
    ],
    total: 47.5,
    status: "completed",
    orderTime: "2025-06-01T18:30:00.000Z",
    completedTime: "2025-06-01T19:15:00.000Z",
    paymentMethod: "stripe",
    paymentStatus: "paid",
    customerNotes: "Extra cheese on pizza please",
    transactionId: "txn_1234567890",
    customer: {
      name: "John Smith",
      email: "john@example.com",
    },
  },
  {
    id: "ORD-002",
    tableNumber: "7",
    items: [
      { id: "4", name: "House Wine Red", quantity: 2, price: 8.5, notes: "" },
      { id: "5", name: "Tiramisu", quantity: 1, price: 9.5, notes: "" },
    ],
    total: 26.5,
    status: "completed",
    orderTime: "2025-06-01T19:45:00.000Z",
    completedTime: "2025-06-01T20:20:00.000Z",
    paymentMethod: "stripe",
    paymentStatus: "paid",
    customerNotes: "",
    transactionId: "txn_0987654321",
    customer: {
      name: "Sarah Johnson",
      email: "sarah@example.com",
    },
  },
  {
    id: "ORD-003",
    tableNumber: "2",
    items: [
      {
        id: "6",
        name: "Spaghetti Carbonara",
        quantity: 1,
        price: 24.5,
        notes: "No pepper",
      },
    ],
    total: 24.5,
    status: "completed",
    orderTime: "2025-06-01T20:15:00.000Z",
    completedTime: "2025-06-01T20:45:00.000Z",
    paymentMethod: "cash",
    paymentStatus: "paid",
    customerNotes: "No pepper",
    transactionId: "",
    customer: {
      name: "Michael Brown",
      email: "",
    },
  },
  {
    id: "ORD-004",
    tableNumber: "5",
    items: [
      {
        id: "7",
        name: "Beef Burger",
        quantity: 2,
        price: 18.0,
        notes: "Medium well",
      },
      {
        id: "8",
        name: "French Fries",
        quantity: 1,
        price: 6.5,
        notes: "Extra salt",
      },
      { id: "9", name: "Cola", quantity: 2, price: 4.0, notes: "" },
    ],
    total: 50.5,
    status: "refunded",
    orderTime: "2025-05-31T18:30:00.000Z",
    completedTime: "2025-05-31T19:10:00.000Z",
    refundedTime: "2025-05-31T19:45:00.000Z",
    paymentMethod: "stripe",
    paymentStatus: "refunded",
    customerNotes: "Extra ketchup on the side",
    refundReason: "Customer dissatisfied with food temperature",
    transactionId: "txn_5678901234",
    refundId: "ref_1234567890",
    customer: {
      name: "Emma Wilson",
      email: "emma@example.com",
    },
  },
  {
    id: "ORD-005",
    tableNumber: "10",
    items: [
      {
        id: "10",
        name: "Vegetable Risotto",
        quantity: 1,
        price: 19.5,
        notes: "",
      },
      { id: "11", name: "Garlic Bread", quantity: 1, price: 5.5, notes: "" },
    ],
    total: 25.0,
    status: "completed",
    orderTime: "2025-05-31T19:15:00.000Z",
    completedTime: "2025-05-31T19:50:00.000Z",
    paymentMethod: "stripe",
    paymentStatus: "paid",
    customerNotes: "",
    transactionId: "txn_1357924680",
    customer: {
      name: "David Lee",
      email: "david@example.com",
    },
  },
  {
    id: "ORD-006",
    tableNumber: "4",
    items: [
      {
        id: "12",
        name: "Chicken Curry",
        quantity: 1,
        price: 21.0,
        notes: "Spicy",
      },
      { id: "13", name: "Naan Bread", quantity: 2, price: 3.5, notes: "" },
      { id: "14", name: "Mango Lassi", quantity: 1, price: 5.0, notes: "" },
    ],
    total: 33.0,
    status: "cancelled",
    orderTime: "2025-05-30T20:00:00.000Z",
    cancelledTime: "2025-05-30T20:10:00.000Z",
    paymentMethod: "stripe",
    paymentStatus: "refunded",
    customerNotes: "Extra spicy curry",
    cancellationReason: "Customer left restaurant",
    transactionId: "txn_2468013579",
    refundId: "ref_0987654321",
    customer: {
      name: "Lisa Chen",
      email: "lisa@example.com",
    },
  },
  {
    id: "ORD-007",
    tableNumber: "8",
    items: [
      { id: "15", name: "Seafood Paella", quantity: 2, price: 26.0, notes: "" },
      {
        id: "16",
        name: "Green Salad",
        quantity: 1,
        price: 8.5,
        notes: "No onions",
      },
      { id: "17", name: "Sparkling Water", quantity: 2, price: 4.5, notes: "" },
    ],
    total: 69.5,
    status: "completed",
    orderTime: "2025-05-30T19:30:00.000Z",
    completedTime: "2025-05-30T20:15:00.000Z",
    paymentMethod: "stripe",
    paymentStatus: "paid",
    customerNotes: "No onions in salad",
    transactionId: "txn_3692581470",
    customer: {
      name: "Robert Taylor",
      email: "robert@example.com",
    },
  },
  {
    id: "ORD-008",
    tableNumber: "6",
    items: [
      {
        id: "18",
        name: "Mushroom Risotto",
        quantity: 1,
        price: 18.5,
        notes: "",
      },
      { id: "19", name: "Bruschetta", quantity: 1, price: 9.0, notes: "" },
      { id: "20", name: "White Wine", quantity: 1, price: 7.5, notes: "" },
    ],
    total: 35.0,
    status: "completed",
    orderTime: "2025-05-29T18:45:00.000Z",
    completedTime: "2025-05-29T19:20:00.000Z",
    paymentMethod: "cash",
    paymentStatus: "paid",
    customerNotes: "",
    transactionId: "",
    customer: {
      name: "Jennifer Adams",
      email: "",
    },
  },
  {
    id: "ORD-009",
    tableNumber: "9",
    items: [
      {
        id: "21",
        name: "Steak Frites",
        quantity: 2,
        price: 28.0,
        notes: "Medium rare",
      },
      {
        id: "22",
        name: "Chocolate Mousse",
        quantity: 2,
        price: 8.0,
        notes: "",
      },
      { id: "23", name: "Red Wine", quantity: 1, price: 9.5, notes: "" },
    ],
    total: 81.5,
    status: "completed",
    orderTime: "2025-05-29T20:00:00.000Z",
    completedTime: "2025-05-29T20:45:00.000Z",
    paymentMethod: "stripe",
    paymentStatus: "paid",
    customerNotes: "Medium rare steaks",
    transactionId: "txn_4815162342",
    customer: {
      name: "Thomas Wilson",
      email: "thomas@example.com",
    },
  },
  {
    id: "ORD-010",
    tableNumber: "1",
    items: [
      {
        id: "24",
        name: "Vegetarian Pizza",
        quantity: 1,
        price: 20.0,
        notes: "No olives",
      },
      { id: "25", name: "Garlic Bread", quantity: 1, price: 5.5, notes: "" },
      { id: "26", name: "Tiramisu", quantity: 1, price: 9.5, notes: "" },
      { id: "27", name: "Sparkling Water", quantity: 1, price: 4.5, notes: "" },
    ],
    total: 39.5,
    status: "completed",
    orderTime: "2025-05-28T19:15:00.000Z",
    completedTime: "2025-05-28T19:55:00.000Z",
    paymentMethod: "stripe",
    paymentStatus: "paid",
    customerNotes: "No olives on pizza",
    transactionId: "txn_9876543210",
    customer: {
      name: "Anna Martinez",
      email: "anna@example.com",
    },
  },
  {
    id: "ORD-011",
    tableNumber: "3",
    items: [
      { id: "28", name: "Lasagna", quantity: 1, price: 19.0, notes: "" },
      { id: "29", name: "Caprese Salad", quantity: 1, price: 12.5, notes: "" },
      { id: "30", name: "Cheesecake", quantity: 1, price: 8.5, notes: "" },
      { id: "31", name: "Coffee", quantity: 1, price: 4.0, notes: "" },
    ],
    total: 44.0,
    status: "completed",
    orderTime: "2025-05-28T18:30:00.000Z",
    completedTime: "2025-05-28T19:10:00.000Z",
    paymentMethod: "stripe",
    paymentStatus: "paid",
    customerNotes: "",
    transactionId: "txn_1029384756",
    customer: {
      name: "James Johnson",
      email: "james@example.com",
    },
  },
  {
    id: "ORD-012",
    tableNumber: "7",
    items: [
      { id: "32", name: "Fish & Chips", quantity: 2, price: 22.0, notes: "" },
      { id: "33", name: "Coleslaw", quantity: 1, price: 5.0, notes: "" },
      { id: "34", name: "Beer", quantity: 2, price: 6.5, notes: "" },
    ],
    total: 62.0,
    status: "completed",
    orderTime: "2025-05-27T19:45:00.000Z",
    completedTime: "2025-05-27T20:20:00.000Z",
    paymentMethod: "cash",
    paymentStatus: "paid",
    customerNotes: "",
    transactionId: "",
    customer: {
      name: "Daniel Brown",
      email: "",
    },
  },
];

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
    case "paid":
      return "bg-green-100 text-green-800";
    case "refunded":
      return "bg-amber-100 text-amber-800";
    case "failed":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
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

export default function OrderHistoryPage() {
  const router = useRouter();
  const { currency } = useRestaurantSettings();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [tableFilter, setTableFilter] = useState("all");
  const [sortField, setSortField] = useState("orderTime");
  const [sortDirection, setSortDirection] = useState("desc");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  // Get unique table numbers for filter dropdown
  const uniqueTables = Array.from(
    new Set(mockHistoricalOrders.map((order) => order.tableNumber))
  ).sort();

  // Format currency with the restaurant's settings
  const formatCurrency = (amount: number) => {
    return `${currency.symbol} ${amount.toFixed(2)}`;
  };

  // Apply filters and sorting
  const filteredOrders = mockHistoricalOrders
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
          order.customerNotes?.toLowerCase().includes(searchLower) || false;
        if (!(matchesId || matchesTable || matchesItems || matchesNotes))
          return false;
      }
      if (statusFilter !== "all" && order.status !== statusFilter) return false;
      if (
        paymentMethodFilter !== "all" &&
        order.paymentMethod !== paymentMethodFilter
      )
        return false;
      if (
        paymentStatusFilter !== "all" &&
        order.paymentStatus !== paymentStatusFilter
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
      const dateA = new Date(a.orderTime).getTime();
      const dateB = new Date(b.orderTime).getTime();
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
    setPaymentStatusFilter("all");
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
                  placeholder="Search orders by ID, table, items, or notes..."
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
                  <SelectItem value="stripe">Stripe</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
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
              Showing {filteredOrders.length} of {mockHistoricalOrders.length}{" "}
              orders
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
                        onClick={() => toggleSort("orderTime")}
                      >
                        Date
                        <ArrowUpDown className="ml-2 h-3 w-3" />
                      </Button>
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-gray-500">
                      Table
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
                        <td colSpan={8} className="h-24 text-center">
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
                            {order.id}
                          </td>
                          <td className="p-4 align-middle">
                            <div className="flex flex-col">
                              <span>
                                {format(
                                  new Date(order.orderTime),
                                  "MMM d, yyyy"
                                )}
                              </span>
                              <span className="text-xs text-gray-500">
                                {format(new Date(order.orderTime), "h:mm a")}
                              </span>
                            </div>
                          </td>
                          <td className="p-4 align-middle">
                            Table {order.tableNumber}
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
                            <div className="flex flex-col gap-1">
                              <span
                                className={`text-sm ${getPaymentMethodColor(
                                  order.paymentMethod
                                )}`}
                              >
                                {order.paymentMethod.toUpperCase()}
                              </span>
                              <Badge
                                variant="outline"
                                className={getPaymentStatusColor(
                                  order.paymentStatus
                                )}
                              >
                                {order.paymentStatus.toUpperCase()}
                              </Badge>
                            </div>
                          </td>
                          <td className="p-4 align-middle text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  console.log("Print receipt for", order.id);
                                }}
                              >
                                <Printer className="h-4 w-4" />
                                <span className="sr-only">Print Receipt</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedOrder(order);
                                }}
                              >
                                <FileText className="h-4 w-4" />
                                <span className="sr-only">View Details</span>
                              </Button>
                            </div>
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
                        Order {selectedOrder.id}
                      </h2>
                      <Badge className={getStatusColor(selectedOrder.status)}>
                        {selectedOrder.status.charAt(0).toUpperCase() +
                          selectedOrder.status.slice(1)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {format(
                          new Date(selectedOrder.orderTime),
                          "MMM d, yyyy h:mm a"
                        )}
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
                                {item.notes && (
                                  <p className="text-xs text-gray-500">
                                    {item.notes}
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
                                {selectedOrder.paymentStatus.toUpperCase()}
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
                      {selectedOrder.customerNotes && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-900 mb-3">
                            Customer Notes
                          </h3>
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-sm">
                              {selectedOrder.customerNotes}
                            </p>
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
                                  {format(
                                    new Date(selectedOrder.orderTime),
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
                                    {format(
                                      new Date(selectedOrder.completedTime),
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
                                    {format(
                                      new Date(selectedOrder.refundedTime),
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
                                    {format(
                                      new Date(selectedOrder.cancelledTime),
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
