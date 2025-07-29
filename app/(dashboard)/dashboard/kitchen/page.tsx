"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  CheckCircle,
  AlertCircle,
  Timer,
  Bell,
  Volume2,
  VolumeX,
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

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  modifiers: string[];
}

interface Order {
  id: string;
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
  };

  // Fetch orders from DB
  useEffect(() => {
    if (!restaurant?.id) return;
    setLoading(true);
    getRestaurantOrders(restaurant.id)
      .then((result) => {
        if (result.success && result.data) {
          const mappedOrders = result.data.map((order: DBOrder) => ({
            id: order.id,
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
      })
      .finally(() => setLoading(false));
  }, [restaurant?.id]);

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
  }, [orders.length, previousOrdersCount, isSoundMuted]);

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
      <div className="p-6 text-center text-gray-500">Loading orders...</div>
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
      case "new":
        return "bg-red-100 text-red-800 border-red-200";
      case "preparing":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "ready":
        return "bg-green-100 text-green-800 border-green-200";
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

  return (
    <motion.div
      className="p-4 md:p-6 space-y-4 md:space-y-6"
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
          <h1 className="text-2xl font-bold text-gray-900">Kitchen Display</h1>
          <p className="text-sm text-gray-500">Real-time order management</p>
        </div>
        <motion.div className="flex items-center gap-3" variants={itemVariants}>
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
                    New Orders
                  </p>
                  <p className="text-xl md:text-2xl font-bold text-red-900">
                    {
                      orders.filter((order) => order.status === "pending")
                        .length
                    }
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
                    {
                      orders.filter((order) => order.status === "preparing")
                        .length
                    }
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
                    {orders.filter((order) => order.status === "ready").length}
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
                    {orders.length}
                  </p>
                </div>
                <motion.div variants={iconVariants}>
                  <Clock className="h-6 w-6 md:h-8 md:w-8 text-blue-600" />
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Orders Grid */}
      <motion.div variants={itemVariants}>
        <KitchenDndContext
          orders={orders}
          onOrdersChange={handleOrdersChange}
        />
      </motion.div>
    </motion.div>
  );
}
