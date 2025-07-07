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

// Mock orders data
const mockOrders = [
  {
    id: "ORD-001",
    tableNumber: "5",
    customerName: "John D.",
    items: [
      {
        name: "Margherita Pizza",
        quantity: 1,
        price: 24.0,
        modifiers: ["Extra cheese", "Thin crust"],
      },
      {
        name: "Caesar Salad",
        quantity: 1,
        price: 12.5,
        modifiers: ["No croutons"],
      },
      { name: "House Wine", quantity: 2, price: 8.0, modifiers: [] },
    ],
    status: "new",
    time: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
    estimatedTime: 15,
    notes: "Please bring extra napkins",
    total: 42.5,
    paymentStatus: "pending",
  },
  {
    id: "ORD-002",
    tableNumber: "3",
    customerName: "Sarah M.",
    items: [
      {
        name: "Grilled Salmon",
        quantity: 1,
        price: 32.0,
        modifiers: ["Medium rare", "No vegetables"],
      },
      {
        name: "Risotto",
        quantity: 1,
        price: 26.0,
        modifiers: ["Extra parmesan"],
      },
    ],
    status: "preparing",
    time: new Date(Date.now() - 12 * 60 * 1000), // 12 minutes ago
    estimatedTime: 20,
    notes: "",
    total: 58.0,
    paymentStatus: "paid",
  },
  {
    id: "ORD-003",
    tableNumber: "8",
    customerName: "Mike R.",
    items: [
      {
        name: "Beef Burger",
        quantity: 2,
        price: 22.0,
        modifiers: ["Medium", "Extra bacon"],
      },
      {
        name: "French Fries",
        quantity: 2,
        price: 8.5,
        modifiers: ["Extra crispy"],
      },
      { name: "Coca Cola", quantity: 2, price: 4.0, modifiers: [] },
    ],
    status: "ready",
    time: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
    estimatedTime: 12,
    notes: "Table is in a hurry",
    total: 65.0,
    paymentStatus: "pending",
  },
];

const orderStatuses = [
  { id: "all", name: "All Orders", count: mockOrders.length },
  {
    id: "new",
    name: "New",
    count: mockOrders.filter((o) => o.status === "new").length,
  },
  {
    id: "preparing",
    name: "Preparing",
    count: mockOrders.filter((o) => o.status === "preparing").length,
  },
  {
    id: "ready",
    name: "Ready",
    count: mockOrders.filter((o) => o.status === "ready").length,
  },
  {
    id: "completed",
    name: "Completed",
    count: mockOrders.filter((o) => o.status === "completed").length,
  },
];

type OrderStatus = "new" | "preparing" | "ready" | "refunded";

const formatTime = (date: Date) => {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    hourCycle: "h12",
  }).format(date);
};

export default function ActiveOrdersPage() {
  const router = useRouter();
  const { currency } = useRestaurantSettings();
  const [orders, setOrders] = useState(mockOrders);
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | null>(null);
  const [timeFilter, setTimeFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

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
      case "new":
        return "bg-red-100 text-red-800 border-red-200";
      case "preparing":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "ready":
        return "bg-green-100 text-green-800 border-green-200";
      case "refunded":
        return "bg-purple-100 text-purple-800 border-purple-200";
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
      case "paid":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      searchQuery === "" ||
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
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

  const newOrders = filteredOrders.filter((order) => order.status === "new");
  const preparingOrders = filteredOrders.filter(
    (order) => order.status === "preparing"
  );
  const readyOrders = filteredOrders.filter(
    (order) => order.status === "ready"
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "new":
        return <AlertCircle className="w-4 h-4" />;
      case "preparing":
        return <Clock className="w-4 h-4" />;
      case "ready":
        return <CheckCircle className="w-4 h-4" />;
      case "completed":
        return <CheckCircle className="w-4 h-4" />;
      case "refunded":
        return <RefreshCcw className="w-4 h-4" />;
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

  const updateOrderStatus = (orderId: string, newStatus: string) => {
    console.log(`Updating order ${orderId} to ${newStatus}`);
    // In real app, this would update the order status
  };

  const formatCurrency = (amount: number) => {
    return `${currency.symbol} ${amount.toFixed(2)}`;
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Active Orders</h1>
          <p className="text-sm text-gray-500">
            Manage and track current orders
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-lg">
            <Clock className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">
              {formatTime(currentTime)}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            onClick={() => router.push("/dashboard/kitchen")}
          >
            Kitchen View
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-red-800">
                  New Orders
                </p>
                <p className="text-xl md:text-2xl font-bold text-red-900">
                  {newOrders.length}
                </p>
              </div>
              <AlertCircle className="h-6 w-6 md:h-8 md:w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

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
              <Timer className="h-6 w-6 md:h-8 md:w-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>

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
              <CheckCircle className="h-6 w-6 md:h-8 md:w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

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
              <Bell className="h-6 w-6 md:h-8 md:w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
          <CardDescription>
            Filter and search through active orders
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                className="shrink-0"
              >
                <RefreshCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>
          </div>

          <Separator />

          {/* Status Filters */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={statusFilter === null ? "default" : "outline"}
              onClick={() => setStatusFilter(null)}
              className={
                statusFilter === null ? "bg-green-600 hover:bg-green-700" : ""
              }
            >
              All Status
            </Button>
            <Button
              variant={statusFilter === "new" ? "default" : "outline"}
              onClick={() =>
                setStatusFilter(statusFilter === "new" ? null : "new")
              }
              className={
                statusFilter === "new" ? "bg-red-600 hover:bg-red-700" : ""
              }
            >
              New Orders
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
                  ? "bg-amber-600 hover:bg-amber-700"
                  : ""
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
                  ? "bg-green-600 hover:bg-green-700"
                  : ""
              }
            >
              Ready
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Active Orders</CardTitle>
          <CardDescription>
            Showing {filteredOrders.length} of {orders.length} orders
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredOrders.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No orders found
                </h3>
                <p className="text-gray-500">
                  Try adjusting your filters or search terms
                </p>
              </div>
            ) : (
              filteredOrders.map((order) => (
                <Card key={order.id} className="overflow-hidden">
                  <CardContent className="p-6">
                    {/* Order Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-3">
                            <span className="text-lg font-semibold">
                              {order.id}
                            </span>
                            <Badge className={getStatusColor(order.status)}>
                              {getStatusIcon(order.status)}
                              <span className="ml-1 capitalize">
                                {order.status}
                              </span>
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                            <span>Table {order.tableNumber}</span>
                            <span>•</span>
                            <span>{order.customerName}</span>
                            <span>•</span>
                            <span>{getTimeAgo(order.time.toISOString())}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={getPaymentStatusColor(order.paymentStatus)}
                        >
                          {order.paymentStatus.charAt(0).toUpperCase() +
                            order.paymentStatus.slice(1)}
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
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
                            {order.paymentStatus === "paid" && (
                              <DropdownMenuItem
                                className="text-purple-600"
                                onClick={() => {
                                  // Update order status to refunded
                                  const updatedOrders = orders.map((o) =>
                                    o.id === order.id
                                      ? { ...o, status: "refunded" }
                                      : o
                                  );
                                  setOrders(updatedOrders);
                                }}
                              >
                                <RefreshCcw className="h-4 w-4 mr-2" />
                                Refund Order
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => {
                                // Implement cancel functionality
                                console.log("Cancel order:", order.id);
                              }}
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
                            {item.modifiers.length > 0 && (
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
                      <div className="flex items-center gap-2">
                        <Timer className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          Est. Time: {order.estimatedTime} mins
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-medium">
                          Total: {formatCurrency(order.total)}
                        </span>
                        <Button
                          variant="default"
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => {
                            const nextStatus = {
                              new: "preparing",
                              preparing: "ready",
                              ready: "completed",
                            }[order.status];
                            if (nextStatus) {
                              const updatedOrders = orders.map((o) =>
                                o.id === order.id
                                  ? { ...o, status: nextStatus }
                                  : o
                              );
                              setOrders(updatedOrders);
                            }
                          }}
                        >
                          {order.status === "new" && "Start Preparing"}
                          {order.status === "preparing" && "Mark Ready"}
                          {order.status === "ready" && "Complete Order"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      <Dialog
        open={!!selectedOrder}
        onOpenChange={() => setSelectedOrder(null)}
      >
        {selectedOrder && (
          <DialogContent className="max-w-md">
            <DialogHeader className="space-y-2">
              <DialogTitle>Order {selectedOrder.id}</DialogTitle>
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(selectedOrder.status)}>
                  {getStatusIcon(selectedOrder.status)}
                  <span className="ml-1 capitalize">
                    {selectedOrder.status}
                  </span>
                </Badge>
                <span className="text-sm text-gray-500">•</span>
                <span className="text-sm text-gray-500">
                  {getTimeAgo(selectedOrder.time.toISOString())}
                </span>
              </div>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Table</p>
                  <p className="font-semibold">
                    Table {selectedOrder.tableNumber}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Customer</p>
                  <p className="font-semibold">{selectedOrder.customerName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Payment</p>
                  <Badge
                    variant="outline"
                    className={
                      selectedOrder.paymentStatus === "paid"
                        ? "text-green-600"
                        : "text-amber-600"
                    }
                  >
                    {selectedOrder.paymentStatus.charAt(0).toUpperCase() +
                      selectedOrder.paymentStatus.slice(1)}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold mb-2">Items</h4>
                <div className="space-y-3">
                  {selectedOrder.items.map((item: any, index: number) => (
                    <div key={index} className="flex justify-between">
                      <div>
                        <div className="flex items-center">
                          <span className="font-medium">
                            {item.quantity}x {item.name}
                          </span>
                        </div>
                        {item.modifiers.length > 0 && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            ({item.modifiers.join(", ")})
                          </p>
                        )}
                      </div>
                      <span>{formatCurrency(item.quantity * item.price)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t mt-3 pt-2 flex justify-between font-semibold">
                  <span>Total</span>
                  <span>{formatCurrency(selectedOrder.total)}</span>
                </div>
              </div>

              {selectedOrder.notes && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-semibold mb-2">Customer Notes</h4>
                    <p className="text-sm bg-gray-50 p-2 rounded">
                      {selectedOrder.notes}
                    </p>
                  </div>
                </>
              )}

              <div className="flex justify-end gap-2 pt-2">
                {selectedOrder.status === "new" && (
                  <Button
                    onClick={() => {
                      const updatedOrders = orders.map((o) =>
                        o.id === selectedOrder.id
                          ? { ...o, status: "preparing" }
                          : o
                      );
                      setOrders(updatedOrders);
                      setSelectedOrder(null);
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    Start Preparing
                  </Button>
                )}
                {selectedOrder.status === "preparing" && (
                  <Button
                    onClick={() => {
                      const updatedOrders = orders.map((o) =>
                        o.id === selectedOrder.id
                          ? { ...o, status: "ready" }
                          : o
                      );
                      setOrders(updatedOrders);
                      setSelectedOrder(null);
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    Mark Ready
                  </Button>
                )}
                {selectedOrder.status === "ready" && (
                  <Button
                    onClick={() => {
                      const updatedOrders = orders.map((o) =>
                        o.id === selectedOrder.id
                          ? { ...o, status: "completed" }
                          : o
                      );
                      setOrders(updatedOrders);
                      setSelectedOrder(null);
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    Complete
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => setSelectedOrder(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
