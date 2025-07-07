"use client";

import { useState, useEffect } from "react";
import { Clock, CheckCircle, AlertCircle, Timer, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRouter } from "next/navigation";
import { KitchenDndContext } from "@/components/dashboard/kitchen/KitchenDndContext";
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

// Mock orders for demonstration
const mockOrders: Order[] = [
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
    priority: "normal",
    total: 42.5,
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
    priority: "high",
    total: 58.0,
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
    priority: "high",
    total: 65.0,
  },
];

const formatTime = (date: Date) => {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    hourCycle: "h12",
  }).format(date);
};

export default function KitchenPage() {
  const [orders, setOrders] = useState(mockOrders);
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const router = useRouter();

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Play sound for new orders
  useEffect(() => {
    const audio = new Audio("/notification-sound.mp3");
    const newOrders = orders.filter((order) => order.status === "new");

    if (newOrders.length > 0) {
      audio.play().catch((error) => console.log("Audio play failed:", error));
    }
  }, [orders]);

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

  const handleOrdersChange = (newOrders: typeof orders) => {
    // Sort orders by time within each status (newest first)
    const sortedOrders = [...newOrders].sort((a, b) => {
      if (a.status !== b.status) return 0; // Don't sort across different statuses
      return b.time.getTime() - a.time.getTime(); // Sort by time within same status
    });

    setOrders(sortedOrders);
  };

  const newOrders = orders.filter((order) => order.status === "new");
  const preparingOrders = orders.filter(
    (order) => order.status === "preparing"
  );
  const readyOrders = orders.filter((order) => order.status === "ready");

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kitchen Display</h1>
          <p className="text-sm text-gray-500">Real-time order management</p>
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
            onClick={() => router.push("/dashboard/orders")}
          >
            Orders View
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
                  {orders.length}
                </p>
              </div>
              <Clock className="h-6 w-6 md:h-8 md:w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders Grid */}
      <KitchenDndContext orders={orders} onOrdersChange={handleOrdersChange} />
    </div>
  );
}
