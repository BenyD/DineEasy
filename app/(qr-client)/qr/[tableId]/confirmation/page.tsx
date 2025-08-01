"use client";

import { use, useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Check,
  Clock,
  Receipt,
  Star,
  Gift,
  Loader2,
  MapPin,
  Phone,
  Table as TableIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { toast } from "sonner";
import { getQROrderDetails } from "@/lib/actions/qr-payments";
import { getTableInfo } from "@/lib/actions/qr-client";
import { Separator } from "@/components/ui/separator";
import { OrderStatusTracker } from "@/components/qr/OrderStatusTracker";

interface OrderItem {
  id: string;
  quantity: number;
  unit_price: number;
  menu_item: {
    id: string;
    name: string;
    description: string;
    price: number;
  };
}

interface Order {
  id: string;
  status: string;
  total_amount: number;
  tax_amount: number;
  tip_amount: number;
  created_at: string;
  order_items: OrderItem[];
  restaurant: {
    id: string;
    name: string;
    address: string;
    phone: string;
  };
}

interface RestaurantData {
  id: string;
  name: string;
  logo_url?: string;
  address?: string;
  phone?: string;
  email?: string;
  currency?: string;
  tax_rate?: number; // Added tax_rate to RestaurantData
}

interface TableData {
  id: string;
  number: string;
  capacity: number;
  restaurants: RestaurantData;
}

export default function ConfirmationPage({
  params,
  searchParams,
}: {
  params: Promise<{ tableId: string }>;
  searchParams: Promise<{
    payment?: string;
    total?: string;
    tip?: string;
    order_id?: string;
    success?: string;
  }>;
}) {
  const resolvedParams = use(params);
  const resolvedSearchParams = use(searchParams);
  const [order, setOrder] = useState<Order | null>(null);
  const [restaurant, setRestaurant] = useState<RestaurantData | null>(null);
  const [tableData, setTableData] = useState<TableData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const paymentMethod = resolvedSearchParams.payment || "stripe";
  const orderId = resolvedSearchParams.order_id;
  const isSuccess = resolvedSearchParams.success === "true";

  const getPaymentMethodName = (method: string) => {
    switch (method) {
      case "stripe":
        return "Credit Card";
      case "twint":
        return "TWINT";
      case "cash":
        return "Cash at Counter";
      default:
        return "Unknown";
    }
  };

  // Load restaurant and table data
  useEffect(() => {
    const loadRestaurantData = async () => {
      try {
        const tableResult = await getTableInfo(resolvedParams.tableId);
        if (tableResult.success) {
          const tableData = tableResult.data as TableData;
          const restaurantData = tableData.restaurants as RestaurantData;

          setTableData(tableData);
          setRestaurant(restaurantData);
        }
      } catch (error) {
        console.error("Error loading restaurant data:", error);
      }
    };

    loadRestaurantData();
  }, [resolvedParams.tableId]);

  // Load order details if order_id is provided
  useEffect(() => {
    const loadOrderDetails = async () => {
      if (orderId) {
        try {
          const result = await getQROrderDetails(orderId);
          if (result.error) {
            toast.error(result.error);
          } else if (result.order) {
            setOrder(result.order as Order);
          }
        } catch (error) {
          console.error("Error loading order details:", error);
          toast.error("Failed to load order details");
        }
      }
      setIsLoading(false);
    };

    loadOrderDetails();
  }, [orderId]);

  // Handle cash order from localStorage
  useEffect(() => {
    if (paymentMethod === "cash" && !orderId) {
      const cashOrderData = localStorage.getItem("cashOrder");
      if (cashOrderData) {
        try {
          const cashOrder = JSON.parse(cashOrderData);
          // Create a mock order object for cash payments
          setOrder({
            id: cashOrder.orderId,
            status: "pending",
            total_amount: parseFloat(cashOrder.total),
            tax_amount:
              (parseFloat(cashOrder.total) * (restaurant?.tax_rate || 0)) / 100,
            tip_amount: parseFloat(cashOrder.tip),
            created_at: new Date().toISOString(),
            order_items: cashOrder.items.map((item: any) => ({
              id: item.id,
              quantity: item.quantity,
              unit_price: item.price,
              menu_item: {
                id: item.id,
                name: item.name,
                description: item.description || "",
                price: item.price,
              },
            })),
            restaurant: {
              id: "cash-restaurant",
              name: restaurant?.name || "Restaurant",
              address: restaurant?.address || "",
              phone: restaurant?.phone || "",
            },
          });
          // Clear the cash order data
          localStorage.removeItem("cashOrder");
        } catch (error) {
          console.error("Error parsing cash order:", error);
        }
      }
      setIsLoading(false);
    }
  }, [paymentMethod, orderId, restaurant]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-green-600" />
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Enhanced Success Header with Restaurant Info */}
      <div className="bg-white border-b border-gray-100">
        <div className="px-4 py-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <Check className="w-8 h-8 text-green-600" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-bold text-gray-900 mb-2 text-center"
          >
            {isSuccess ? "Payment Successful!" : "Order Confirmed!"}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-gray-600 text-center mb-6"
          >
            Thank you for your order at {restaurant?.name || "our restaurant"}
          </motion.p>

          {/* Restaurant Info Card */}
          {restaurant && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-4 border border-green-200 max-w-sm mx-auto"
            >
              <div className="flex items-center gap-3">
                {restaurant.logo_url && (
                  <img
                    src={restaurant.logo_url}
                    alt={restaurant.name}
                    className="w-12 h-12 rounded-xl object-cover"
                  />
                )}
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900">{restaurant.name}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                    <div className="flex items-center gap-1">
                      <TableIcon className="w-3 h-3" />
                      <span>
                        Table {tableData?.number || resolvedParams.tableId}
                      </span>
                    </div>
                    {restaurant.phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        <span>{restaurant.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Order Details */}
        {order && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200"
          >
            <div className="flex items-center gap-3 mb-4">
              <Receipt className="w-5 h-5 text-gray-600" />
              <h3 className="font-bold text-gray-900 text-lg">Order Details</h3>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Order ID</span>
                <span className="text-gray-900 font-mono">
                  {order.id.slice(0, 8).toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Method</span>
                <span className="text-gray-900 font-medium">
                  {getPaymentMethodName(paymentMethod)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date</span>
                <span className="text-gray-900">
                  {new Date(order.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Time</span>
                <span className="text-gray-900">
                  {new Date(order.created_at).toLocaleTimeString()}
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Order Status Tracker */}
        {order && orderId && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200"
          >
            <OrderStatusTracker
              orderId={orderId}
              initialStatus={order.status}
            />
          </motion.div>
        )}

        {/* Order Items */}
        {order && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200"
          >
            <h3 className="font-bold text-gray-900 mb-4 text-lg">Your Order</h3>
            <div className="space-y-3">
              {order.order_items.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center"
                >
                  <div className="flex-1">
                    <span className="text-gray-900 font-medium">
                      {item.quantity}x {item.menu_item.name}
                    </span>
                  </div>
                  <span className="text-gray-900 font-medium">
                    {restaurant?.currency?.toUpperCase() || "CHF"}{" "}
                    {(item.unit_price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
              <Separator className="my-3" />
              <div className="flex justify-between text-base">
                <span className="text-gray-600">Subtotal</span>
                <span className="text-gray-900 font-medium">
                  {restaurant?.currency?.toUpperCase() || "CHF"}{" "}
                  {(
                    order.total_amount -
                    order.tax_amount -
                    order.tip_amount
                  ).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-base">
                <span className="text-gray-600">
                  Tax ({(restaurant?.tax_rate || 0).toFixed(1)}%)
                </span>
                <span className="text-gray-900 font-medium">
                  {restaurant?.currency?.toUpperCase() || "CHF"}{" "}
                  {order.tax_amount.toFixed(2)}
                </span>
              </div>
              {order.tip_amount > 0 && (
                <div className="flex justify-between text-base">
                  <span className="text-gray-600">Tip</span>
                  <span className="text-gray-900 font-medium">
                    {restaurant?.currency?.toUpperCase() || "CHF"}{" "}
                    {order.tip_amount.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-xl font-bold">
                <span>Total</span>
                <span className="text-green-700">
                  {restaurant?.currency?.toUpperCase() || "CHF"}{" "}
                  {order.total_amount.toFixed(2)}
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Restaurant Contact Info */}
        {restaurant && (restaurant.address || restaurant.phone) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200"
          >
            <h3 className="font-bold text-gray-900 mb-4 text-lg">Need Help?</h3>
            <div className="space-y-3">
              {restaurant.address && (
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-600">
                    {restaurant.address}
                  </span>
                </div>
              )}
              {restaurant.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-gray-600" />
                  <a
                    href={`tel:${restaurant.phone}`}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    {restaurant.phone}
                  </a>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Feedback Prompt */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-3">
            <Star className="w-5 h-5 text-green-600" />
            <h3 className="font-bold text-gray-900">
              How was your experience?
            </h3>
          </div>
          <p className="text-gray-600 mb-4">
            We&apos;d love to hear your feedback to improve our service.
          </p>
          <Link
            href={`/qr/${resolvedParams.tableId}/feedback?order_id=${order?.id}`}
          >
            <Button
              variant="outline"
              className="w-full border-green-300 text-green-700 hover:bg-green-50"
            >
              Leave Feedback
            </Button>
          </Link>
        </motion.div>

        {/* Separator */}
        <div className="my-6">
          <Separator />
        </div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          className="space-y-6"
        >
          <Link href={`/qr/${resolvedParams.tableId}`}>
            <Button className="w-full mb-4 bg-green-600 hover:bg-green-700 h-12 text-base">
              Order More
            </Button>
          </Link>
          <Link href="/">
            <Button variant="outline" className="w-full h-12 text-base">
              Back to Home
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
