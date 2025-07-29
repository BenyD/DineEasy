"use client";

import { motion } from "framer-motion";
import {
  Clock,
  ChefHat,
  CheckCircle,
  Truck,
  Utensils,
  AlertCircle,
  Wifi,
  WifiOff,
  RefreshCw,
} from "lucide-react";
import { useOrderTracking } from "@/hooks/useOrderTracking";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { getQROrderDetails } from "@/lib/actions/qr-payments";

interface OrderStatusTrackerProps {
  orderId: string;
  initialStatus?: string;
}

const ORDER_STATUSES = [
  { key: "pending", label: "Order Received", icon: Clock, color: "blue" },
  { key: "preparing", label: "Preparing", icon: ChefHat, color: "amber" },
  { key: "ready", label: "Ready", icon: CheckCircle, color: "green" },
  { key: "served", label: "Served", icon: Utensils, color: "purple" },
  { key: "completed", label: "Completed", icon: CheckCircle, color: "green" },
];

const getStatusIndex = (status: string) => {
  return ORDER_STATUSES.findIndex((s) => s.key === status);
};

const getStatusInfo = (status: string) => {
  return ORDER_STATUSES.find((s) => s.key === status) || ORDER_STATUSES[0];
};

export function OrderStatusTracker({
  orderId,
  initialStatus = "pending",
}: OrderStatusTrackerProps) {
  const [currentStatus, setCurrentStatus] = useState(initialStatus);
  const [connectionStatus, setConnectionStatus] = useState<
    "connected" | "disconnected" | "error"
  >("disconnected");
  const [error, setError] = useState<string | null>(null);

  const {
    isConnected,
    orderStatus,
    lastUpdate,
    connectionStatus: wsConnectionStatus,
  } = useOrderTracking({
    enabled: true,
    orderId,
    onStatusUpdate: (status) => {
      console.log("Order status updated via WebSocket:", status);
      setCurrentStatus(status);
      setError(null);
    },
    onConnectionChange: (isConnected) => {
      console.log("WebSocket connection changed:", isConnected);
      setConnectionStatus(isConnected ? "connected" : "disconnected");
    },
    onError: (errorMessage) => {
      console.error("WebSocket error:", errorMessage);
      setError(errorMessage);
      setConnectionStatus("error");
    },
  });

  // Update current status when orderStatus changes
  useEffect(() => {
    if (orderStatus) {
      setCurrentStatus(orderStatus);
    }
  }, [orderStatus]);

  // Update connection status when WebSocket status changes
  useEffect(() => {
    setConnectionStatus(wsConnectionStatus);
  }, [wsConnectionStatus]);

  // Fallback polling when WebSocket fails
  const [pollingStatus, setPollingStatus] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  const pollOrderStatus = async () => {
    if (!orderId) return;

    try {
      setIsPolling(true);
      const result = await getQROrderDetails(orderId);
      if (result.success && result.data) {
        const newStatus = result.data.status;
        setPollingStatus(newStatus);
        setCurrentStatus(newStatus);
        setError(null);
      }
    } catch (error) {
      console.error("Error polling order status:", error);
      setError("Failed to fetch order status");
    } finally {
      setIsPolling(false);
    }
  };

  // Start polling if WebSocket is not connected
  useEffect(() => {
    if (connectionStatus === "disconnected" || connectionStatus === "error") {
      const pollInterval = setInterval(pollOrderStatus, 10000); // Poll every 10 seconds
      return () => clearInterval(pollInterval);
    }
  }, [connectionStatus, orderId]);

  const currentStatusIndex = getStatusIndex(currentStatus);
  const statusInfo = getStatusInfo(currentStatus);

  const getStatusColor = (color: string) => {
    switch (color) {
      case "blue":
        return "text-blue-600 bg-blue-100 border-blue-200";
      case "amber":
        return "text-amber-600 bg-amber-100 border-amber-200";
      case "green":
        return "text-green-600 bg-green-100 border-green-200";
      case "purple":
        return "text-purple-600 bg-purple-100 border-purple-200";
      default:
        return "text-gray-600 bg-gray-100 border-gray-200";
    }
  };

  const getProgressColor = (color: string) => {
    switch (color) {
      case "blue":
        return "bg-blue-500";
      case "amber":
        return "bg-amber-500";
      case "green":
        return "bg-green-500";
      case "purple":
        return "bg-purple-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-gray-600" />
          <h3 className="font-bold text-gray-900 text-lg">Order Status</h3>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "w-2 h-2 rounded-full",
              connectionStatus === "connected"
                ? "bg-green-500 animate-pulse"
                : connectionStatus === "error"
                  ? "bg-red-500"
                  : "bg-amber-500"
            )}
          />
          <span className="text-xs text-gray-500">
            {connectionStatus === "connected"
              ? "Live"
              : connectionStatus === "error"
                ? "Error"
                : isPolling
                  ? "Polling"
                  : "Offline"}
          </span>
        </div>
      </div>

      {/* Current Status */}
      <div className="mb-6">
        <div
          className={cn(
            "inline-flex items-center gap-2 px-3 py-2 rounded-full border text-sm font-medium",
            getStatusColor(statusInfo.color)
          )}
        >
          <statusInfo.icon className="w-4 h-4" />
          {statusInfo.label}
        </div>
        {lastUpdate && (
          <p className="text-xs text-gray-500 mt-2">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </p>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Progress</span>
          <span className="text-sm text-gray-500">
            {Math.round(
              ((currentStatusIndex + 1) / ORDER_STATUSES.length) * 100
            )}
            %
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <motion.div
            className={cn(
              "h-2 rounded-full",
              getProgressColor(statusInfo.color)
            )}
            initial={{ width: 0 }}
            animate={{
              width: `${((currentStatusIndex + 1) / ORDER_STATUSES.length) * 100}%`,
            }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Status Steps */}
      <div className="space-y-3">
        {ORDER_STATUSES.map((status, index) => {
          const isCompleted = index <= currentStatusIndex;
          const isCurrent = index === currentStatusIndex;

          return (
            <motion.div
              key={status.key}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border transition-all",
                isCompleted
                  ? "bg-green-50 border-green-200"
                  : "bg-gray-50 border-gray-200"
              )}
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center",
                  isCompleted
                    ? "bg-green-500 text-white"
                    : isCurrent
                      ? "bg-amber-500 text-white"
                      : "bg-gray-300 text-gray-600"
                )}
              >
                {isCompleted ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <status.icon className="w-4 h-4" />
                )}
              </div>
              <div className="flex-1">
                <p
                  className={cn(
                    "font-medium text-sm",
                    isCompleted
                      ? "text-green-800"
                      : isCurrent
                        ? "text-amber-800"
                        : "text-gray-600"
                  )}
                >
                  {status.label}
                </p>
                {isCurrent && (
                  <p className="text-xs text-amber-600 mt-1">
                    Currently in progress...
                  </p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Connection Status */}
      {!isConnected && (
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center gap-2 text-amber-700">
            <WifiOff className="w-4 h-4" />
            <span className="text-sm font-medium">Connection Lost</span>
          </div>
          <p className="text-xs text-amber-600 mt-1">
            Using fallback updates. Status will refresh automatically.
          </p>
          <button
            onClick={pollOrderStatus}
            disabled={isPolling}
            className="mt-2 flex items-center gap-2 text-xs text-amber-700 hover:text-amber-800 disabled:opacity-50"
          >
            <RefreshCw className={cn("w-3 h-3", isPolling && "animate-spin")} />
            {isPolling ? "Refreshing..." : "Refresh Now"}
          </button>
        </div>
      )}
    </div>
  );
}
