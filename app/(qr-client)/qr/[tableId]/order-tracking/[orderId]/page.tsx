"use client";

import { use, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Wifi,
  WifiOff,
  RefreshCw,
  ChefHat,
  Truck,
  Check,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useOrderTracking } from "@/hooks/useOrderTracking";
import { getQROrderDetails } from "@/lib/actions/qr-payments";
import { getTableInfo } from "@/lib/actions/qr-client";
import { cancelOrder } from "@/lib/actions/orders";
import { formatAmountWithCurrency } from "@/lib/utils/currency";
import Link from "next/link";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";

interface OrderDetails {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  customer_name: string;
  customer_email: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  order_items: Array<{
    id: string;
    menu_item_id: string;
    quantity: number;
    unit_price: number;
    notes?: string;
    menu_items: {
      name: string;
      description?: string;
    };
  }>;
}

interface RestaurantData {
  id: string;
  name: string;
  logo_url?: string;
  currency?: string;
}

interface TableData {
  id: string;
  number: string;
  restaurants: RestaurantData;
}

const orderStatusSteps = [
  { key: "pending", label: "Order Placed", icon: Clock, color: "bg-green-500" },
  {
    key: "preparing",
    label: "Preparing",
    icon: ChefHat,
    color: "bg-green-600",
  },
  {
    key: "ready",
    label: "Ready for Pickup",
    icon: Truck,
    color: "bg-green-700",
  },
  { key: "served", label: "Served", icon: CheckCircle, color: "bg-green-800" },
  { key: "completed", label: "Completed", icon: Check, color: "bg-green-900" },
  { key: "cancelled", label: "Cancelled", icon: XCircle, color: "bg-red-500" },
];

export default function OrderTrackingPage({
  params,
}: {
  params: Promise<{ tableId: string; orderId: string }>;
}) {
  const resolvedParams = use(params);
  const searchParams = useSearchParams();

  // Extract values to avoid object recreation issues
  const orderId = resolvedParams.orderId;
  const tableId = resolvedParams.tableId;

  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [restaurant, setRestaurant] = useState<RestaurantData | null>(null);
  const [tableData, setTableData] = useState<TableData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);

  // Real-time order tracking
  const {
    isConnected,
    orderStatus,
    connectionStatus,
    error: trackingError,
  } = useOrderTracking({
    orderId: orderId,
    onStatusUpdate: (status) => {
      console.log("Order status updated:", status);
      setLastUpdate(new Date());
      toast.success(`Order status updated: ${status}`, {
        style: {
          background: "#10b981",
          color: "white",
        },
      });
    },
    onConnectionChange: (connected) => {
      console.log("Order tracking connection changed:", connected);
    },
    onError: (error) => {
      console.error("Order tracking error:", error);
      toast.error(`Tracking error: ${error}`, {
        style: {
          background: "#ef4444",
          color: "white",
        },
      });
    },
  });

  // Check if coming from successful payment - only once on mount
  useEffect(() => {
    const paymentSuccess = searchParams?.get("payment_success");
    if (paymentSuccess === "true") {
      setShowPaymentSuccess(true);
      // Auto-hide success message after 5 seconds
      const timer = setTimeout(() => setShowPaymentSuccess(false), 5000);
      return () => clearTimeout(timer);
    }
  }, []); // Empty dependency array to run only once

  // Load order details and restaurant info
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load order details
        const orderResult = await getQROrderDetails(orderId);
        if (!orderResult.success) {
          setError(orderResult.error || "Failed to load order details");
          return;
        }
        setOrderDetails(orderResult.data);

        // Debug: Log the order details structure
        console.log("Order details loaded:", {
          orderId: orderResult.data.id,
          orderItems: orderResult.data.order_items,
          firstItem: orderResult.data.order_items?.[0],
          firstItemMenuItems: orderResult.data.order_items?.[0]?.menu_items,
        });

        // Load table and restaurant info
        const tableResult = await getTableInfo(tableId);
        if (tableResult.success) {
          setTableData(tableResult.data);
          setRestaurant(tableResult.data.restaurants);
        }
      } catch (error: any) {
        console.error("Error loading order tracking data:", error);
        setError("Failed to load order information");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [orderId, tableId]);

  const getCurrentStepIndex = () => {
    if (!orderStatus) return 0;
    return orderStatusSteps.findIndex((step) => step.key === orderStatus);
  };

  const getStatusColor = (status: string) => {
    const step = orderStatusSteps.find((s) => s.key === status);
    return step?.color || "bg-gray-500";
  };

  const getStatusLabel = (status: string) => {
    const step = orderStatusSteps.find((s) => s.key === status);
    return step?.label || status;
  };

  const getStatusIcon = (status: string) => {
    const step = orderStatusSteps.find((s) => s.key === status);
    return step?.icon || Clock;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-green-600" />
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !orderDetails) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Order Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            {error || "This order could not be found."}
          </p>
          <Link href={`/qr/${tableId}`}>
            <Button>Back to Menu</Button>
          </Link>
        </div>
      </div>
    );
  }

  const currentStatus = orderStatus || orderDetails.status;
  const currentStepIndex = getCurrentStepIndex();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Payment Success Banner */}
      <AnimatePresence>
        {showPaymentSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-green-50 border-b border-green-200 px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-800">
                  Payment Successful!
                </p>
                <p className="text-xs text-green-600">
                  Your order has been confirmed and is being prepared.
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPaymentSuccess(false)}
                className="text-green-600 hover:text-green-800"
              >
                <XCircle className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-4 py-4">
          <div className="flex items-center gap-4 mb-4">
            <Link href={`/qr/${resolvedParams.tableId}`}>
              <Button variant="ghost" size="sm" className="p-2">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">
                Order Tracking
              </h1>
              <p className="text-sm text-gray-600">
                {restaurant?.name} • Table {tableData?.number}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* Connection Status */}
              <div className="flex items-center gap-1">
                {isConnected ? (
                  <Wifi className="w-4 h-4 text-green-600" />
                ) : (
                  <WifiOff className="w-4 h-4 text-red-600" />
                )}
              </div>
              <Badge
                variant={isConnected ? "default" : "destructive"}
                className={isConnected ? "bg-green-600 hover:bg-green-700" : ""}
              >
                {isConnected ? "Live" : "Offline"}
              </Badge>
            </div>
          </div>

          {/* Order Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h2 className="font-semibold text-gray-900">
                  Order #{orderDetails.order_number}
                </h2>
                <p className="text-sm text-gray-600">
                  {new Date(orderDetails.created_at).toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg text-gray-900">
                  {formatAmountWithCurrency(
                    orderDetails.total_amount,
                    restaurant?.currency || "CHF"
                  )}
                </p>
                <p className="text-sm text-gray-600">
                  {orderDetails.customer_name}
                </p>
              </div>
            </div>
            {lastUpdate && (
              <p className="text-xs text-gray-500">
                Last updated: {lastUpdate.toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Order Status Timeline */}
      <div className="px-4 py-6">
        <div className="bg-white rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Order Status
          </h3>

          <div className="space-y-4">
            {orderStatusSteps.map((step, index) => {
              const Icon = step.icon;
              const isCompleted = index <= currentStepIndex;
              const isCurrent = index === currentStepIndex;
              const isActive = currentStatus === step.key;

              return (
                <motion.div
                  key={step.key}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-center gap-4 p-3 rounded-lg transition-all ${
                    isActive ? "bg-green-50 border border-green-200" : ""
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isCompleted ? step.color : "bg-gray-200"
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 ${
                        isCompleted ? "text-white" : "text-gray-400"
                      }`}
                    />
                  </div>
                  <div className="flex-1">
                    <p
                      className={`font-medium ${
                        isCompleted ? "text-gray-900" : "text-gray-500"
                      }`}
                    >
                      {step.label}
                    </p>
                    {isCurrent && (
                      <p className="text-sm text-green-600">
                        {currentStatus === "preparing" &&
                          "Chef is preparing your order"}
                        {currentStatus === "ready" &&
                          "Your order is ready for pickup"}
                        {currentStatus === "completed" &&
                          "Order completed successfully"}
                      </p>
                    )}
                  </div>
                  {isCompleted && (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Cancel Order Button - Only show for pending orders */}
        {currentStatus === "pending" && (
          <div className="bg-white rounded-lg p-6 mb-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Need to cancel your order?
              </h3>
              <p className="text-gray-600 mb-4">
                You can cancel your order while it&apos;s still pending. Once
                the kitchen starts preparing, cancellation may not be possible.
              </p>
              <Button
                variant="outline"
                className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                onClick={async () => {
                  if (
                    confirm(
                      "Are you sure you want to cancel this order? This action cannot be undone."
                    )
                  ) {
                    try {
                      const result = await cancelOrder(
                        orderDetails.id,
                        "customer_request"
                      );
                      if (result.success) {
                        toast.success("Order cancelled successfully");
                        // Reload the page to show cancelled status
                        window.location.reload();
                      } else {
                        toast.error(result.error || "Failed to cancel order");
                      }
                    } catch (error) {
                      console.error("Error cancelling order:", error);
                      toast.error("Failed to cancel order");
                    }
                  }
                }}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Cancel Order
              </Button>
            </div>
          </div>
        )}

        {/* Order Items */}
        <div className="bg-white rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Order Items
          </h3>
          <div className="space-y-3">
            {orderDetails.order_items && orderDetails.order_items.length > 0 ? (
              orderDetails.order_items.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {item.menu_items?.name || `Item ${item.menu_item_id}`}
                    </p>
                    <p className="text-sm text-gray-600">
                      Qty: {item.quantity} ×{" "}
                      {formatAmountWithCurrency(
                        item.unit_price,
                        restaurant?.currency || "CHF"
                      )}
                    </p>
                    {item.notes && (
                      <p className="text-sm text-gray-500 italic">
                        Note: {item.notes}
                      </p>
                    )}
                  </div>
                  <p className="font-semibold text-gray-900">
                    {formatAmountWithCurrency(
                      item.quantity * item.unit_price,
                      restaurant?.currency || "CHF"
                    )}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">
                No order items found
              </p>
            )}
          </div>
        </div>

        {/* Special Instructions */}
        {orderDetails.notes && (
          <div className="bg-white rounded-lg p-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Special Instructions
            </h3>
            <p className="text-gray-700">{orderDetails.notes}</p>
          </div>
        )}

        {/* Feedback Section - Show when order is completed */}
        {currentStatus === "completed" && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6 mt-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🙏</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                How was your experience?
              </h3>
              <p className="text-gray-600 mb-4">
                Your feedback helps us improve our service and food quality.
              </p>
              <Link
                href={{
                  pathname: `/qr/${resolvedParams.tableId}/feedback`,
                  query: { order: orderDetails.order_number },
                }}
              >
                <Button className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-3 rounded-full">
                  Rate Your Experience
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Connection Status */}
        {!isConnected && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
            <div className="flex items-center gap-2 text-yellow-800">
              <WifiOff className="w-4 h-4" />
              <span className="font-medium">Connection Lost</span>
            </div>
            <p className="text-sm text-yellow-700 mt-1">
              Real-time updates are currently unavailable. The page will
              automatically reconnect.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
