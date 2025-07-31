"use client";

import { useState, useEffect } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Bell, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRestaurantSettings } from "@/lib/store/restaurant-settings";
import { cn } from "@/lib/utils";
import { CURRENCY_SYMBOLS } from "@/lib/constants/currencies";

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  modifiers: string[];
}

interface OrderCardProps {
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
  onStatusChange?: (orderId: string, newStatus: string) => void;
}

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

export function OrderCard({
  id,
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
  const [timeSinceOrder, setTimeSinceOrder] = useState(0);
  const { currency } = useRestaurantSettings();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  useEffect(() => {
    setMounted(true);
    const updateTime = () => {
      const diffInMinutes = Math.floor(
        (new Date().getTime() - time.getTime()) / (1000 * 60)
      );
      setTimeSinceOrder(diffInMinutes);
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);

    return () => clearInterval(interval);
  }, [time]);

  const formatCurrency = (amount: number) => {
    const symbol =
      CURRENCY_SYMBOLS[currency as keyof typeof CURRENCY_SYMBOLS] || currency;
    return `${symbol} ${amount.toFixed(2)}`;
  };

  const getActionButton = () => {
    if (!onStatusChange) return null;

    switch (status) {
      case "new":
        return (
          <Button
            onClick={() => onStatusChange(id, "preparing")}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium"
          >
            Start Preparing
          </Button>
        );
      case "preparing":
        return (
          <Button
            onClick={() => onStatusChange(id, "ready")}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium"
          >
            Mark as Ready
          </Button>
        );
      case "ready":
        return (
          <Button
            onClick={() => onStatusChange(id, "delivered")}
            variant="outline"
            className="w-full hover:bg-gray-50"
          >
            Mark as Served
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`border-l-4 cursor-move ${
        status === "new"
          ? "border-l-red-500"
          : status === "preparing"
            ? "border-l-amber-500"
            : "border-l-green-500"
      } shadow-md hover:shadow-lg transition-shadow`}
      {...attributes}
      {...listeners}
    >
      <div className="p-3 md:p-4 pb-2 md:pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`w-2.5 h-2.5 rounded-full ${getPriorityColor(
                priority
              )}`}
            />
            <h3 className="text-base md:text-lg font-semibold">
              Table {tableNumber}
            </h3>
            <Badge
              className={cn(
                "text-xs font-medium px-2 py-1 rounded-full",
                status === "pending"
                  ? "bg-red-100 text-red-800"
                  : status === "preparing"
                    ? "bg-amber-100 text-amber-800"
                    : status === "ready"
                      ? "bg-green-100 text-green-800"
                      : status === "served"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-800"
              )}
            >
              {status === "pending" && <Bell className="w-3 h-3 mr-1" />}
              {status === "preparing" && <Timer className="w-3 h-3 mr-1" />}
              {status.toUpperCase()}
            </Badge>
          </div>
          <div className="text-right">
            <p className="text-xs md:text-sm text-gray-500">{id}</p>
            <p className="text-xs text-gray-400">
              {mounted ? `${timeSinceOrder} min ago` : ""}
            </p>
          </div>
        </div>
      </div>
      <div className="p-3 md:p-4 pt-2 space-y-3">
        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={index} className="bg-gray-50 p-2.5 rounded-lg">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex justify-between">
                    <p className="font-medium text-sm md:text-base">
                      {item.quantity}x {item.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      {formatCurrency(item.quantity * item.price)}
                    </p>
                  </div>
                  {item.modifiers.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {item.modifiers.map((modifier, modIndex) => (
                        <span
                          key={modIndex}
                          className="inline-block bg-blue-50 text-blue-700 text-xs px-1.5 py-0.5 rounded"
                        >
                          {modifier}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center px-2 font-medium">
          <span>Total:</span>
          <span>{formatCurrency(total)}</span>
        </div>

        {notes && (
          <Alert className="bg-yellow-50 border-yellow-200 py-2">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800 text-sm">
              {notes}
            </AlertDescription>
          </Alert>
        )}

        {getActionButton()}
      </div>
    </Card>
  );
}
