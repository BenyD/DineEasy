"use client";

import { useState, useEffect } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertCircle,
  Bell,
  Timer,
  CheckCircle,
  Clock,
  Hash,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRestaurantSettings } from "@/lib/store/restaurant-settings";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  modifiers: string[];
}

interface OrderCardProps {
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
  onStatusChange?: (orderId: string, newStatus: string) => void;
}

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
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "pending":
      return <Bell className="w-3 h-3" />;
    case "preparing":
      return <Timer className="w-3 h-3" />;
    case "ready":
      return <CheckCircle className="w-3 h-3" />;
    case "served":
      return <Clock className="w-3 h-3" />;
    default:
      return null;
  }
};

export function OrderCard({
  id,
  orderNumber,
  tableNumber,
  customerName,
  items,
  status,
  time,
  estimatedTime,
  notes,
  priority,
  total,
  onStatusChange,
}: OrderCardProps) {
  const [mounted, setMounted] = useState(false);
  const { currency } = useRestaurantSettings();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    transition: {
      duration: 200,
      easing: "cubic-bezier(0.25, 1, 0.5, 1)",
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 1000 : "auto",
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  const getActionButton = () => {
    if (!onStatusChange) return null;

    switch (status) {
      case "pending":
        return (
          <Button
            onClick={() => onStatusChange(id, "preparing")}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium transition-colors"
          >
            Start Preparing
          </Button>
        );
      case "preparing":
        return (
          <Button
            onClick={() => onStatusChange(id, "ready")}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium transition-colors"
          >
            Mark as Ready
          </Button>
        );
      case "ready":
        return (
          <Button
            onClick={() => onStatusChange(id, "served")}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
          >
            Mark as Served
          </Button>
        );
      case "served":
        return (
          <div className="text-center py-2">
            <span className="text-sm text-gray-500 font-medium">
              Order Served
            </span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card
        ref={setNodeRef}
        style={style}
        className={cn(
          "cursor-move shadow-md hover:shadow-lg transition-all duration-200 relative overflow-hidden",
          isDragging && "shadow-2xl rotate-1 scale-105",
          status === "pending" &&
            "border-l-4 border-l-red-500 bg-gradient-to-r from-red-50/50 to-white",
          status === "preparing" &&
            "border-l-4 border-l-amber-500 bg-gradient-to-r from-amber-50/50 to-white",
          status === "ready" &&
            "border-l-4 border-l-green-500 bg-gradient-to-r from-green-50/50 to-white",
          status === "served" &&
            "border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50/50 to-white opacity-75"
        )}
        {...attributes}
        {...listeners}
      >
        {/* Header - Order ID and Table */}
        <div className="p-3 pb-2 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Hash className="w-4 h-4 text-gray-500" />
              <span className="font-mono text-sm font-semibold text-gray-700">
                {orderNumber}
              </span>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-gray-900">
                Table {tableNumber}
              </div>
            </div>
          </div>
        </div>

        {/* Items Section - Essential for kitchen */}
        <div className="p-3">
          <div className="space-y-2 mb-3">
            {items.map((item, index) => (
              <motion.div
                key={index}
                className="bg-white border border-gray-100 rounded-lg p-2"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="flex items-start gap-2">
                  <span className="font-bold text-gray-900 text-sm min-w-[2rem]">
                    {item.quantity}x
                  </span>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 text-sm">
                      {item.name}
                    </div>
                    {item.modifiers.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {item.modifiers.map((modifier, modIndex) => (
                          <span
                            key={modIndex}
                            className="inline-block bg-blue-50 text-blue-700 text-xs px-1.5 py-0.5 rounded border border-blue-100"
                          >
                            + {modifier}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Special Instructions - Critical for kitchen */}
          {notes && (
            <Alert className="bg-yellow-50 border-yellow-200 py-2 mb-3">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800 text-sm font-medium">
                {notes}
              </AlertDescription>
            </Alert>
          )}

          {/* Action Button */}
          {getActionButton()}
        </div>
      </Card>
    </motion.div>
  );
}
