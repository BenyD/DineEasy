"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  CheckCircle,
  AlertCircle,
  Timer,
  Bell,
  Volume2,
  VolumeX,
  RefreshCw,
  Maximize2,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRouter } from "next/navigation";
import { KitchenDndContext } from "@/components/dashboard/kitchen/KitchenDndContext";
import {
  getRestaurantOrders,
  updateOrderStatus,
  type Order as DBOrder,
} from "@/lib/actions/orders";
import { useOrdersWebSocket } from "@/hooks/useOrdersWebSocket";
import { useRestaurantSettings } from "@/lib/store/restaurant-settings";
import { toast } from "sonner";

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  modifiers: string[];
}

interface Order {
  id: string;
  orderNumber: string;
  tableNumber: string;
  customerName: string;
  items: OrderItem[];
  status: string;
  time: Date;
  estimatedTime: number;
  notes: string;
  priority: string;
  total: number;
}

const formatTime = (date: Date) => {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    hourCycle: "h12",
  }).format(date);
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
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 200,
    },
  },
};

const iconVariants = {
  hidden: { opacity: 0, rotate: -180 },
  visible: {
    opacity: 1,
    rotate: 0,
    transition: {
      type: "spring",
      stiffness: 200,
    },
  },
};

export default function KitchenPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSoundMuted, setIsSoundMuted] = useState(false);
  const [previousOrdersCount, setPreviousOrdersCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { restaurant } = useRestaurantSettings();
  const router = useRouter();

  // Load sound preference from localStorage
  useEffect(() => {
    const savedMutePreference = localStorage.getItem("kitchen-sound-muted");
    if (savedMutePreference) {
      setIsSoundMuted(JSON.parse(savedMutePreference));
    }
  }, []);

  // Save sound preference to localStorage
  const toggleSound = () => {
    const newMuteState = !isSoundMuted;
    setIsSoundMuted(newMuteState);
    localStorage.setItem("kitchen-sound-muted", JSON.stringify(newMuteState));
    toast.success(
      newMuteState ? "Notifications muted" : "Notifications enabled"
    );
  };

  // Fetch orders from DB
  const fetchOrders = useCallback(async () => {
    if (!restaurant?.id) return;
    setLoading(true);
    try {
      const result = await getRestaurantOrders(restaurant.id);
      if (result.success && result.data) {
        const mappedOrders = result.data.map((order: DBOrder) => ({
          id: order.id,
          orderNumber: order.orderNumber || `#${order.id.slice(0, 8)}`,
          tableNumber: order.tableNumber,
          customerName: order.customerName || "",
          items: order.items.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            modifiers: item.modifiers || [],
          })),
          status: order.status,
          time: new Date(order.time),
          estimatedTime: order.estimatedTime || 15,
          notes: order.notes || "",
          priority: order.priority || "normal",
          total: order.total,
        }));
        setOrders(mappedOrders);
        // Set initial count after first load
        if (previousOrdersCount === 0) {
          setPreviousOrdersCount(mappedOrders.length);
        }
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [restaurant?.id, previousOrdersCount]);

  useEffect(() => {
    fetchOrders();
  }, [restaurant?.id, fetchOrders]);

  // Manual refresh function
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchOrders();
    setIsRefreshing(false);
    toast.success("Orders refreshed");
  };

  // WebSocket for real-time updates
  useOrdersWebSocket({
    restaurantId: restaurant?.id,
    onOrderAdded: async (order) => {
      // Fetch the full order from the DB to get customerName and tableNumber
      let customerName = "Guest";
      let tableNumber = order.table_id
        ? `Table ${order.table_id.slice(0, 4)}`
        : "Unknown";

      if (restaurant?.id && order.id) {
        const result = await getRestaurantOrders(restaurant.id, {
          search: order.id,
        });
        const fullOrder = result.data?.find((o) => o.id === order.id);
        if (fullOrder) {
          customerName = fullOrder.customerName || "Guest";
          tableNumber = fullOrder.tableNumber || tableNumber;
        }
      }

      setOrders((prev) => [
        {
          id: order.id,
          orderNumber: order.order_number || `#${order.id.slice(0, 8)}`,
          tableNumber,
          customerName,
          items: [], // Optionally fetch items if needed
          status: order.status,
          time: new Date(order.created_at),
          estimatedTime: 15,
          notes: order.notes || "",
          priority: "normal",
          total: order.total_amount,
        },
        ...prev,
      ]);
    },
    onOrderUpdated: (updatedOrder) => {
      setOrders((prev) =>
        prev.map((order) =>
          order.id === updatedOrder.id
            ? {
                ...order,
                status: updatedOrder.status,
                notes: updatedOrder.notes || "",
                updated_at: updatedOrder.updated_at,
              }
            : order
        )
      );
    },
    onOrderDeleted: (deletedOrder) => {
      setOrders((prev) => prev.filter((order) => order.id !== deletedOrder.id));
    },
  });

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    setCurrentTime(new Date());
    return () => clearInterval(timer);
  }, []);

  // Play sound for new orders (only when count increases)
  useEffect(() => {
    if (orders.length === 0 || previousOrdersCount === 0) return;

    const newOrders = orders.filter((order) => order.status === "pending");

    const activeOrdersCount = orders.filter(
      (order) => order.status !== "pending"
    ).length;

    // Only play sound if we have more new orders than before and sound is not muted
    if (newOrders.length > 0 && !isSoundMuted) {
      const audio = new Audio("/notification-sound.mp3");
      audio.play().catch((error) => console.log("Audio play failed:", error));
    }

    // Update previous count
    setPreviousOrdersCount(orders.length);
  }, [orders, previousOrdersCount, isSoundMuted]);

  // Persist status changes to DB
  const handleOrdersChange = async (newOrders: typeof orders) => {
    // Find changed statuses and update in DB
    for (const newOrder of newOrders) {
      const oldOrder = orders.find((o) => o.id === newOrder.id);
      if (oldOrder && oldOrder.status !== newOrder.status) {
        await updateOrderStatus(newOrder.id, newOrder.status);
      }
    }
    setOrders(newOrders);
  };

  if (loading || !currentTime) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-green-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading kitchen display...</p>
        </div>
      </div>
    );
  }

  const getTimeSinceOrder = (orderTime: Date) => {
    if (!currentTime) return ""; // Return empty string if time not initialized
    const diffInMinutes = Math.floor(
      (currentTime.getTime() - orderTime.getTime()) / (1000 * 60)
    );
    return `${diffInMinutes}m ago`;
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

  const formatCurrency = (amount: number) => {
    const symbol = restaurant?.currency || "$";
    return `${symbol} ${amount.toFixed(2)}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 py-4 lg:px-6 lg:py-6">
          <motion.div
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-xl lg:text-2xl font-bold text-gray-900">
                  Kitchen Display
                </h1>
                <p className="text-sm text-gray-500">
                  Real-time order management
                </p>
              </div>
            </div>

            <motion.div
              className="flex items-center gap-3"
              variants={itemVariants}
            >
              {/* Current Time */}
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

              {/* Refresh Button */}
              <motion.div variants={cardVariants}>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                >
                  <RefreshCw
                    className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
                  />
                  Refresh
                </Button>
              </motion.div>

              {/* Sound Toggle Button */}
              <motion.div variants={cardVariants}>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={toggleSound}
                  title={
                    isSoundMuted ? "Unmute notifications" : "Mute notifications"
                  }
                >
                  {isSoundMuted ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                  {isSoundMuted ? "Unmute" : "Mute"}
                </Button>
              </motion.div>

              {/* Kitchen Display Button */}
              <motion.div variants={cardVariants}>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={() => router.push("/dashboard/kitchen/display")}
                >
                  <Maximize2 className="h-4 w-4" />
                  Full Screen
                </Button>
              </motion.div>

              {/* Orders View Button */}
              <motion.div variants={cardVariants}>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={() => router.push("/dashboard/orders/active")}
                >
                  Orders View
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      <div className="p-4 lg:p-6 space-y-6">
        {/* Summary Stats */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-3 gap-4"
          variants={itemVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={cardVariants}>
            <Card className="bg-red-50 border-red-200 hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-red-800">
                      New Orders
                    </p>
                    <p className="text-2xl font-bold text-red-900">
                      {
                        orders.filter((order) => order.status === "pending")
                          .length
                      }
                    </p>
                  </div>
                  <motion.div variants={iconVariants}>
                    <AlertCircle className="h-8 w-8 text-red-600" />
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={cardVariants}>
            <Card className="bg-amber-50 border-amber-200 hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-amber-800">
                      Preparing
                    </p>
                    <p className="text-2xl font-bold text-amber-900">
                      {
                        orders.filter((order) => order.status === "preparing")
                          .length
                      }
                    </p>
                  </div>
                  <motion.div variants={iconVariants}>
                    <Timer className="h-8 w-8 text-amber-600" />
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={cardVariants}>
            <Card className="bg-green-50 border-green-200 hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-800">Ready</p>
                    <p className="text-2xl font-bold text-green-900">
                      {
                        orders.filter((order) => order.status === "ready")
                          .length
                      }
                    </p>
                  </div>
                  <motion.div variants={iconVariants}>
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Ready Orders Row */}
        {orders.filter((order) => order.status === "ready").length > 0 && (
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="visible"
          >
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <h3 className="text-lg font-semibold text-green-800">
                    Ready to Serve
                  </h3>
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    {orders.filter((order) => order.status === "ready").length}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-3">
                  {orders
                    .filter((order) => order.status === "ready")
                    .map((order) => (
                      <motion.div
                        key={order.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: "spring", stiffness: 200 }}
                        className="bg-white px-4 py-3 rounded-lg border border-green-200 shadow-sm hover:shadow-md transition-all cursor-pointer"
                        onClick={() =>
                          handleOrdersChange(
                            orders.map((o) =>
                              o.id === order.id ? { ...o, status: "served" } : o
                            )
                          )
                        }
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-center">
                            <div className="text-sm font-mono text-green-700 font-semibold">
                              {order.orderNumber}
                            </div>
                            <div className="text-xs text-green-600">
                              Table {order.tableNumber}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-gray-500">
                              {order.items.reduce(
                                (sum, item) => sum + item.quantity,
                                0
                              )}{" "}
                              items
                            </div>
                            <div className="text-xs text-gray-600 font-medium">
                              {formatCurrency(order.total)}
                            </div>
                          </div>
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </div>
                      </motion.div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Orders Grid */}
        <motion.div variants={itemVariants} initial="hidden" animate="visible">
          <KitchenDndContext
            orders={orders}
            onOrdersChange={handleOrdersChange}
          />
        </motion.div>
      </div>
    </div>
  );
}
