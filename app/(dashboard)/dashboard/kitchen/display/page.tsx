"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  CheckCircle,
  AlertCircle,
  Timer,
  Bell,
  Volume2,
  VolumeX,
  ChefHat,
  RefreshCw,
  ArrowLeft,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";
import {
  getRestaurantOrders,
  updateOrderStatus,
  type Order as DBOrder,
} from "@/lib/actions/orders";
import { useOrdersWebSocket } from "@/hooks/useOrdersWebSocket";
import { useRestaurantWebSocket } from "@/hooks/useRestaurantWebSocket";
import { useRestaurantSettings } from "@/lib/store/restaurant-settings";
import { toast } from "sonner";
import { getDisplayOrderNumber } from "@/lib/utils/order";

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  modifiers: string[];
  // Advanced options
  selectedSize?: string;
  selectedModifiers?: Array<{
    id: string;
    name: string;
    type: string;
    priceModifier: number;
  }>;
  comboMealName?: string;
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
  orderNumber?: string; // Added for customer-friendly view
  paymentMethod?: string; // Added for payment method display
}

const formatTime = (date: Date) => {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    hourCycle: "h12",
  }).format(date);
};

// Animation variants for full-screen display
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

const orderCardVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 20,
    },
  },
  exit: {
    opacity: 0,
    x: 20,
    transition: {
      duration: 0.2,
    },
  },
};

const COLUMN_CONFIG = [
  {
    id: "pending",
    title: "New Orders",
    icon: AlertCircle,
    color: "red",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    textColor: "text-red-800",
    iconColor: "text-red-600",
  },
  {
    id: "preparing",
    title: "Preparing",
    icon: Timer,
    color: "amber",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    textColor: "text-amber-800",
    iconColor: "text-amber-600",
  },
  {
    id: "ready",
    title: "Ready",
    icon: CheckCircle,
    color: "green",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    textColor: "text-green-800",
    iconColor: "text-green-600",
  },
];

// Customer-friendly order card for display
function CustomerOrderCard({ order }: { order: Order }) {
  const { currency } = useRestaurantSettings();

  const formatCurrency = (amount: number) => {
    const symbol = currency || "$";
    return `${symbol} ${amount.toFixed(2)}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "border-l-red-500 bg-red-50/20";
      case "preparing":
        return "border-l-amber-500 bg-amber-50/20";
      case "ready":
        return "border-l-green-500 bg-green-50/20";
      case "served":
        return "border-l-blue-500 bg-blue-50/20 opacity-60";
      default:
        return "border-l-gray-500 bg-gray-50/20";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Order Received";
      case "preparing":
        return "Preparing";
      case "ready":
        return "Ready for Pickup";
      case "served":
        return "Order Complete";
      default:
        return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Bell className="w-5 h-5" />;
      case "preparing":
        return <Timer className="w-5 h-5" />;
      case "ready":
        return <CheckCircle className="w-5 h-5" />;
      case "served":
        return <Clock className="w-5 h-5" />;
      default:
        return null;
    }
  };

  const getStatusIconColor = (status: string) => {
    switch (status) {
      case "pending":
        return "text-red-600";
      case "preparing":
        return "text-amber-600";
      case "ready":
        return "text-green-600";
      case "served":
        return "text-blue-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className="group"
    >
      <Card
        className={`border-l-4 shadow-md hover:shadow-lg transition-all duration-200 ${getStatusColor(order.status)}`}
      >
        <div className="p-4">
          {/* Main Header - Order Number and Table */}
          <div className="text-left mb-3">
            <div className="text-3xl font-bold text-gray-900 tracking-wider mb-1">
              {order.orderNumber}
            </div>
            <div className="text-lg text-gray-600 font-medium">
              Table {order.tableNumber}
            </div>
          </div>

          {/* Order Summary - Key Items Only */}
          <div className="mb-3">
            <div className="text-sm text-gray-600 mb-2">Order Summary:</div>
            <div className="space-y-2">
              {order.items.slice(0, 3).map((item, index) => (
                <div
                  key={index}
                  className="bg-white/50 rounded-lg p-2 border border-gray-200"
                >
                  <div className="flex justify-between items-start text-sm">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-gray-900">
                          {item.quantity}x
                        </span>
                        <span className="font-semibold text-gray-900">
                          {item.name}
                        </span>
                        {/* Show combo meal indicator */}
                        {item.comboMealName && (
                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full font-medium">
                            🍽️ {item.comboMealName}
                          </span>
                        )}
                      </div>

                      {/* Show advanced options with better styling */}
                      {(item.selectedSize ||
                        (item.selectedModifiers &&
                          item.selectedModifiers.length > 0)) && (
                        <div className="ml-6 space-y-1">
                          {item.selectedSize && (
                            <div className="flex items-center gap-1">
                              <span className="bg-green-100 text-green-800 text-xs px-1.5 py-0.5 rounded">
                                📏{" "}
                                {item.selectedSize.charAt(0).toUpperCase() +
                                  item.selectedSize.slice(1).toLowerCase()}
                              </span>
                            </div>
                          )}
                          {item.selectedModifiers &&
                            item.selectedModifiers.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {item.selectedModifiers.map(
                                  (modifier, modIndex) => (
                                    <span
                                      key={modIndex}
                                      className="bg-purple-100 text-purple-800 text-xs px-1.5 py-0.5 rounded"
                                    >
                                      ⚙️ {modifier.name}
                                      {modifier.priceModifier > 0 && (
                                        <span className="text-green-600 ml-1">
                                          (+{modifier.priceModifier.toFixed(2)})
                                        </span>
                                      )}
                                    </span>
                                  )
                                )}
                              </div>
                            )}
                        </div>
                      )}

                      {/* Legacy modifiers support */}
                      {!item.selectedModifiers &&
                        item.modifiers &&
                        item.modifiers.length > 0 && (
                          <div className="ml-6 mt-1">
                            <div className="flex flex-wrap gap-1">
                              {item.modifiers.map((modifier, modIndex) => (
                                <span
                                  key={modIndex}
                                  className="bg-orange-100 text-orange-800 text-xs px-1.5 py-0.5 rounded"
                                >
                                  📝 {modifier}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                    </div>
                    <span className="text-gray-700 font-bold text-sm">
                      {formatCurrency(item.quantity * item.price)}
                    </span>
                  </div>
                </div>
              ))}
              {order.items.length > 3 && (
                <div className="text-xs text-gray-500 italic">
                  +{order.items.length - 3} more items
                </div>
              )}
            </div>
          </div>

          {/* Total and Payment Method */}
          <div className="flex justify-between items-center py-2 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-900">Total:</span>
              <span className="text-lg font-bold text-green-700">
                {formatCurrency(order.total)}
              </span>
            </div>
            {order.paymentMethod && (
              <div
                className={`text-xs px-2 py-1 rounded-full ${
                  order.paymentMethod === "card"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-green-100 text-green-800"
                }`}
              >
                {order.paymentMethod === "card" ? "💳 Card" : "💰 Cash"}
              </div>
            )}
          </div>

          {/* Special Instructions - Only if present */}
          {order.notes && (
            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
              <strong>Note:</strong> {order.notes}
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

export default function KitchenDisplayPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSoundMuted, setIsSoundMuted] = useState(false);
  const [previousOrdersCount, setPreviousOrdersCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [restaurantName, setRestaurantName] = useState<string>("");
  const displayRef = useRef<HTMLDivElement>(null);
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

  // Toggle fullscreen for display only
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await displayRef.current?.requestFullscreen();
        setIsFullscreen(true);
        toast.success("Entered fullscreen mode");
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
        toast.success("Exited fullscreen mode");
      }
    } catch (error) {
      console.error("Fullscreen error:", error);
      toast.error("Fullscreen not supported or permission denied");
    }
  };

  // Handle fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    const handleFullscreenError = () => {
      setIsFullscreen(false);
      toast.error("Fullscreen error occurred");
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("fullscreenerror", handleFullscreenError);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("fullscreenerror", handleFullscreenError);
    };
  }, []);

  // Fetch orders from DB
  const fetchOrders = useCallback(async () => {
    if (!restaurant?.id) return;
    setLoading(true);
    try {
      const result = await getRestaurantOrders(restaurant.id);
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
            // Advanced options
            selectedSize: item.selectedSize,
            selectedModifiers: item.selectedModifiers,
            comboMealName: item.comboMealName,
          })),
          status: order.status,
          time: new Date(order.time),
          estimatedTime: order.estimatedTime || 15,
          notes: order.notes || "",
          priority: order.priority || "normal",
          total: order.total,
          orderNumber: getDisplayOrderNumber(order), // Use centralized utility
          paymentMethod: order.paymentMethod || "other",
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
    setRestaurantName(restaurant?.name || "");
  }, [restaurant?.id, restaurant?.name, fetchOrders]);

  // Manual refresh function
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchOrders();
    setIsRefreshing(false);
    toast.success("Orders refreshed");
  };

  // WebSocket for real-time updates
  const { isConnected: isOrdersConnected } = useOrdersWebSocket({
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
          orderNumber: getDisplayOrderNumber(order), // Add orderNumber for customer view
          paymentMethod: (order as any).paymentMethod || "other",
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

  // WebSocket for restaurant updates
  const { isConnected: isRestaurantConnected } = useRestaurantWebSocket({
    restaurantId: restaurant?.id,
    onRestaurantUpdated: (updatedRestaurant) => {
      if (updatedRestaurant.name) {
        setRestaurantName(updatedRestaurant.name);
      }
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

  // Play sound for new orders (only when new orders are received)
  useEffect(() => {
    if (orders.length === 0 || previousOrdersCount === 0) return;

    // Only play sound if we have more orders than before and sound is not muted
    if (orders.length > previousOrdersCount && !isSoundMuted) {
      const audio = new Audio("/notification-sound.mp3");
      audio.play().catch((error) => console.log("Audio play failed:", error));
    }

    // Update previous count
    setPreviousOrdersCount(orders.length);
  }, [orders, previousOrdersCount, isSoundMuted]);

  const getOrdersByStatus = (status: string) => {
    return orders.filter((order) => order.status === status);
  };

  const getTimeSinceOrder = (orderTime: Date) => {
    if (!currentTime) return "";
    const diffInMinutes = Math.floor(
      (currentTime.getTime() - orderTime.getTime()) / (1000 * 60)
    );
    return `${diffInMinutes}m ago`;
  };

  const formatCurrency = (amount: number) => {
    const symbol = restaurant?.currency || "$";
    return `${symbol} ${amount.toFixed(2)}`;
  };

  if (loading || !currentTime) {
    return (
      <div className="min-h-screen bg-white">
        {/* Header Skeleton */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse" />
                <div className="space-y-2">
                  <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-lg">
                  <div className="w-5 h-5 bg-gray-200 rounded animate-pulse" />
                  <div className="h-6 w-20 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="h-10 w-24 bg-gray-200 rounded animate-pulse" />
                <div className="h-10 w-20 bg-gray-200 rounded animate-pulse" />
                <div className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-lg">
                  <div className="w-3 h-3 bg-gray-200 rounded-full animate-pulse" />
                  <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="h-10 w-28 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="p-6 space-y-6">
          {/* Summary Stats Skeleton */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg border p-6 space-y-3">
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
                <div className="h-3 w-32 bg-gray-200 rounded animate-pulse" />
              </div>
            ))}
          </div>

          {/* Orders Sections Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg border">
                <div className="p-4 border-b">
                  <div className="flex items-center justify-between">
                    <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
                    <div className="h-6 w-8 bg-gray-200 rounded-full animate-pulse" />
                  </div>
                </div>
                <div className="p-4 space-y-4">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse" />
                          <div className="space-y-1">
                            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                            <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
                          </div>
                        </div>
                        <div className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
                      </div>
                      <div className="space-y-2">
                        <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                        <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="h-6 w-20 bg-gray-200 rounded animate-pulse" />
                        <div className="h-6 w-24 bg-gray-200 rounded animate-pulse" />
                        <div className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header for Full-Screen Display */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-6 py-4">
          <motion.div
            className="flex items-center justify-between"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <div className="flex items-center gap-4">
              <Avatar className="w-12 h-12">
                <AvatarImage
                  src={restaurant?.logo}
                  alt={`${restaurantName} logo`}
                />
                <AvatarFallback className="bg-gradient-to-br from-orange-100 to-orange-200 text-orange-600 font-semibold text-lg">
                  {restaurantName
                    ? restaurantName.split(" ")[0].charAt(0).toUpperCase()
                    : "K"}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {restaurantName || "Kitchen Display"}
                </h1>
                <p className="text-gray-500">Real-time order management</p>
              </div>
            </div>

            <motion.div
              className="flex items-center gap-4"
              variants={itemVariants}
            >
              {/* Current Time */}
              <motion.div
                className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-lg"
                variants={cardVariants}
              >
                <Clock className="h-5 w-5 text-gray-500" />
                <span className="text-lg font-medium text-gray-700">
                  {formatTime(currentTime)}
                </span>
              </motion.div>

              {/* Refresh Button */}
              <motion.div variants={cardVariants}>
                <Button
                  variant="outline"
                  size="lg"
                  className="flex items-center gap-2"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                >
                  <RefreshCw
                    className={`h-5 w-5 ${isRefreshing ? "animate-spin" : ""}`}
                  />
                  Refresh
                </Button>
              </motion.div>

              {/* Sound Toggle Button */}
              <motion.div variants={cardVariants}>
                <Button
                  variant="outline"
                  size="lg"
                  className="flex items-center gap-2"
                  onClick={toggleSound}
                  title={
                    isSoundMuted ? "Unmute notifications" : "Mute notifications"
                  }
                >
                  {isSoundMuted ? (
                    <VolumeX className="h-5 w-5" />
                  ) : (
                    <Volume2 className="h-5 w-5" />
                  )}
                  {isSoundMuted ? "Unmute" : "Mute"}
                </Button>
              </motion.div>

              {/* WebSocket Status */}
              <motion.div variants={cardVariants}>
                <div className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-lg">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      isOrdersConnected && isRestaurantConnected
                        ? "bg-green-500"
                        : "bg-red-500"
                    }`}
                  />
                  <span className="text-sm font-medium text-gray-700">
                    {isOrdersConnected && isRestaurantConnected
                      ? "Live Updates"
                      : "Offline"}
                  </span>
                </div>
              </motion.div>

              {/* Fullscreen Toggle */}
              <motion.div variants={cardVariants}>
                <Button
                  variant={isFullscreen ? "default" : "outline"}
                  size="lg"
                  className={`flex items-center gap-2 transition-all duration-200 ${
                    isFullscreen
                      ? "bg-green-600 hover:bg-green-700 text-white"
                      : ""
                  }`}
                  onClick={toggleFullscreen}
                >
                  {isFullscreen ? (
                    <Minimize2 className="h-5 w-5" />
                  ) : (
                    <Maximize2 className="h-5 w-5" />
                  )}
                  {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Display View - This is what gets fullscreened */}
      <div
        ref={displayRef}
        className={`space-y-6 transition-all duration-300 bg-white ${
          isFullscreen ? "p-8" : "p-6"
        }`}
      >
        {/* Summary Stats */}
        <motion.div
          className={`grid grid-cols-2 lg:grid-cols-3 gap-6 transition-all duration-300 ${
            isFullscreen ? "gap-8" : "gap-6"
          }`}
          variants={itemVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={cardVariants}>
            <Card className="bg-red-50 border-red-200 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-medium text-red-800">
                      New Orders
                    </p>
                    <p className="text-4xl font-bold text-red-900">
                      {
                        orders.filter((order) => order.status === "pending")
                          .length
                      }
                    </p>
                  </div>
                  <AlertCircle className="h-12 w-12 text-red-600" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={cardVariants}>
            <Card className="bg-amber-50 border-amber-200 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-medium text-amber-800">
                      Preparing
                    </p>
                    <p className="text-4xl font-bold text-amber-900">
                      {
                        orders.filter((order) => order.status === "preparing")
                          .length
                      }
                    </p>
                  </div>
                  <Timer className="h-12 w-12 text-amber-600" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={cardVariants}>
            <Card className="bg-green-50 border-green-200 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-medium text-green-800">Ready</p>
                    <p className="text-4xl font-bold text-green-900">
                      {
                        orders.filter((order) => order.status === "ready")
                          .length
                      }
                    </p>
                  </div>
                  <CheckCircle className="h-12 w-12 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Ready Orders List */}
        <motion.div variants={itemVariants} initial="hidden" animate="visible">
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <h3 className="text-lg font-semibold text-green-800">
                  Ready Orders
                </h3>
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  {orders.filter((order) => order.status === "ready").length}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                {orders.filter((order) => order.status === "ready").length >
                0 ? (
                  orders
                    .filter((order) => order.status === "ready")
                    .map((order) => (
                      <motion.div
                        key={order.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: "spring", stiffness: 200 }}
                        className="bg-white px-3 py-2 rounded-lg border border-green-200 shadow-sm"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono text-green-700">
                            #{order.id.slice(0, 8)}
                          </span>
                          <span className="text-sm text-green-600">
                            Table {order.tableNumber}
                          </span>
                        </div>
                      </motion.div>
                    ))
                ) : (
                  <p className="text-green-600 text-sm">No orders ready</p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Orders Grid - No Drag and Drop */}
        <motion.div variants={itemVariants} initial="hidden" animate="visible">
          <div
            className={`grid grid-cols-1 lg:grid-cols-3 transition-all duration-300 ${
              isFullscreen ? "gap-8" : "gap-6"
            }`}
          >
            {COLUMN_CONFIG.map((column) => {
              const columnOrders = getOrdersByStatus(column.id);
              const Icon = column.icon;

              return (
                <motion.div
                  key={column.id}
                  className={`${column.bgColor} ${column.borderColor} p-4 rounded-lg border-2 transition-all duration-300`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-5 w-5 ${column.iconColor}`} />
                      <h3 className="text-lg font-semibold text-gray-900">
                        {column.title}
                      </h3>
                    </div>
                    <Badge
                      className={`bg-${column.color}-100 text-${column.color}-800 border-${column.color}-200`}
                    >
                      {columnOrders.length}
                    </Badge>
                  </div>

                  <div className="space-y-4 min-h-[200px]">
                    <AnimatePresence mode="popLayout">
                      {columnOrders.length === 0 ? (
                        <motion.div
                          key="empty"
                          className="flex items-center justify-center h-32 text-gray-400"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          <p className="text-sm">No orders</p>
                        </motion.div>
                      ) : (
                        columnOrders.map((order) => (
                          <motion.div
                            key={order.id}
                            variants={orderCardVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            layout
                            transition={{
                              type: "spring",
                              stiffness: 200,
                              damping: 20,
                            }}
                          >
                            <CustomerOrderCard order={order} />
                          </motion.div>
                        ))
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
