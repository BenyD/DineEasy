"use client";

import { motion } from "framer-motion";
import {
  Clock,
  CheckCircle,
  ChefHat,
  Truck,
  Check,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface OrderStatusTrackerProps {
  status: string;
  showLabels?: boolean;
  compact?: boolean;
  className?: string;
}

const orderStatusSteps = [
  { key: "pending", label: "Order Placed", icon: Clock, color: "bg-blue-500" },
  {
    key: "confirmed",
    label: "Order Confirmed",
    icon: CheckCircle,
    color: "bg-green-500",
  },
  {
    key: "preparing",
    label: "Preparing",
    icon: ChefHat,
    color: "bg-orange-500",
  },
  {
    key: "ready",
    label: "Ready for Pickup",
    icon: Truck,
    color: "bg-purple-500",
  },
  { key: "completed", label: "Completed", icon: Check, color: "bg-green-600" },
  { key: "cancelled", label: "Cancelled", icon: XCircle, color: "bg-red-500" },
];

export function OrderStatusTracker({
  status,
  showLabels = true,
  compact = false,
  className = "",
}: OrderStatusTrackerProps) {
  const getCurrentStepIndex = () => {
    return orderStatusSteps.findIndex((step) => step.key === status);
  };

  const currentStepIndex = getCurrentStepIndex();

  if (compact) {
    const currentStep = orderStatusSteps.find((step) => step.key === status);
    const Icon = currentStep?.icon || Clock;

    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div
          className={`w-6 h-6 rounded-full flex items-center justify-center ${currentStep?.color || "bg-gray-500"}`}
        >
          <Icon className="w-3 h-3 text-white" />
        </div>
        {showLabels && (
          <span className="text-sm font-medium text-gray-700">
            {currentStep?.label || status}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {orderStatusSteps.map((step, index) => {
        const Icon = step.icon;
        const isCompleted = index <= currentStepIndex;
        const isCurrent = index === currentStepIndex;
        const isActive = status === step.key;

        return (
          <motion.div
            key={step.key}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`flex items-center gap-3 p-2 rounded-lg transition-all ${
              isActive ? "bg-blue-50 border border-blue-200" : ""
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                isCompleted ? step.color : "bg-gray-200"
              }`}
            >
              <Icon
                className={`w-4 h-4 ${
                  isCompleted ? "text-white" : "text-gray-400"
                }`}
              />
            </div>
            {showLabels && (
              <div className="flex-1">
                <p
                  className={`font-medium text-sm ${
                    isCompleted ? "text-gray-900" : "text-gray-500"
                  }`}
                >
                  {step.label}
                </p>
                {isCurrent && (
                  <p className="text-xs text-blue-600">
                    {status === "preparing" && "Chef is preparing your order"}
                    {status === "ready" && "Your order is ready for pickup"}
                    {status === "completed" && "Order completed successfully"}
                  </p>
                )}
              </div>
            )}
            {isCompleted && <CheckCircle className="w-4 h-4 text-green-500" />}
          </motion.div>
        );
      })}
    </div>
  );
}

// Badge version for inline use
export function OrderStatusBadge({ status }: { status: string }) {
  const step = orderStatusSteps.find((s) => s.key === status);
  const Icon = step?.icon || Clock;

  return (
    <Badge
      variant={status === "cancelled" ? "destructive" : "default"}
      className="flex items-center gap-1"
    >
      <Icon className="w-3 h-3" />
      {step?.label || status}
    </Badge>
  );
}
