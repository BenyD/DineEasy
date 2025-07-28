"use client";

import { use, useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Plus,
  Minus,
  Trash2,
  MessageSquare,
  Table as TableIcon,
  Users,
  MapPin,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useCart } from "@/hooks/useCart";
import { getTableInfo } from "@/lib/actions/qr-client";
import Link from "next/link";

interface RestaurantData {
  id: string;
  name: string;
  logo_url?: string;
  address?: string;
  phone?: string;
  email?: string;
  currency?: string;
}

interface TableData {
  id: string;
  number: string;
  capacity: number;
  restaurants: RestaurantData;
}

export default function CartPage({
  params,
}: {
  params: Promise<{ tableId: string }>;
}) {
  const resolvedParams = use(params);
  const { cart, updateQuantity, removeFromCart, getTotalPrice, getTotalItems } =
    useCart();
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [restaurant, setRestaurant] = useState<RestaurantData | null>(null);
  const [tableData, setTableData] = useState<TableData | null>(null);

  const subtotal = getTotalPrice();
  const tax = subtotal * 0.077; // 7.7% Swiss VAT
  const total = subtotal + tax;

  // Load restaurant and table data
  useEffect(() => {
    const loadData = async () => {
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

    loadData();
  }, [resolvedParams.tableId]);

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex flex-col">
        <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-lg border-b border-gray-100">
          <div className="flex items-center gap-4 px-4 py-4">
            <Link href={`/qr/${resolvedParams.tableId}`}>
              <Button
                variant="ghost"
                size="sm"
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-lg font-bold">Your Cart</h1>
              <p className="text-sm text-gray-500">
                {restaurant?.name || "Restaurant"} • Table{" "}
                {tableData?.number || resolvedParams.tableId}
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center max-w-sm"
          >
            <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
              <span className="text-5xl">🛒</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Your cart is empty
            </h2>
            <p className="text-gray-500 mb-8 leading-relaxed">
              Discover our delicious menu items and start building your perfect
              meal
            </p>
            <Link href={`/qr/${resolvedParams.tableId}`}>
              <Button className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200">
                Browse Menu
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Enhanced Header */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-lg border-b border-gray-100 shadow-sm">
        <div className="flex items-center gap-4 px-4 py-4">
          <Link href={`/qr/${resolvedParams.tableId}`}>
            <Button
              variant="ghost"
              size="sm"
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-bold">Your Cart</h1>
            <p className="text-sm text-gray-500">
              {restaurant?.name || "Restaurant"} • Table{" "}
              {tableData?.number || resolvedParams.tableId} • {cart.length}{" "}
              {cart.length === 1 ? "item" : "items"}
            </p>
          </div>
        </div>
      </div>

      {/* Restaurant Info Card */}
      {restaurant && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mx-4 mt-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-4 border border-green-200"
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
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  <span>{tableData?.capacity || 4} seats</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Enhanced Cart Items */}
      <div className="px-4 py-6 space-y-4">
        {cart.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow duration-200"
          >
            <div className="flex gap-4">
              <div className="relative">
                <img
                  src={item.image || "/placeholder.svg"}
                  alt={item.name}
                  className="w-20 h-20 rounded-xl object-cover bg-gray-100"
                />
                {/* Popular tag removed - not available in MenuItem type */}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-base leading-tight">
                      {item.name}
                    </h3>
                    <div className="flex gap-1 mt-1">
                      {/* Tags removed - not available in MenuItem type */}
                    </div>
                  </div>
                  <Button
                    onClick={() => removeFromCart(item.id)}
                    variant="ghost"
                    size="sm"
                    className="p-2 h-auto text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {item.description}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      size="sm"
                      variant="outline"
                      className="w-10 h-10 p-0 border-green-200 hover:bg-green-50 rounded-full"
                    >
                      <Minus className="w-4 h-4" />
                    </Button>

                    <span className="font-bold text-green-700 min-w-[2rem] text-center text-lg">
                      {item.quantity}
                    </span>

                    <Button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      size="sm"
                      variant="outline"
                      className="w-10 h-10 p-0 border-green-200 hover:bg-green-50 rounded-full"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>

                  <span className="font-bold text-gray-900 text-lg">
                    {restaurant?.currency?.toUpperCase() || "CHF"}{" "}
                    {(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}

        {/* Special Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="w-5 h-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900">
              Special Instructions
            </h3>
          </div>
          <Textarea
            placeholder="Any special requests? (e.g., no onions, extra spicy, allergies...)"
            value={specialInstructions}
            onChange={(e) => setSpecialInstructions(e.target.value)}
            className="min-h-[80px] border-gray-200 focus:border-green-500 focus:ring-green-500 resize-none rounded-xl"
          />
        </motion.div>
      </div>

      {/* Enhanced Price Breakdown */}
      <div className="px-4 pb-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6 shadow-sm"
        >
          <h3 className="font-bold text-gray-900 mb-4 text-lg">
            Order Summary
          </h3>

          <div className="space-y-3 text-base">
            <div className="flex justify-between">
              <span className="text-gray-600">
                Subtotal ({getTotalItems()} items)
              </span>
              <span className="text-gray-900 font-medium">
                {restaurant?.currency?.toUpperCase() || "CHF"}{" "}
                {subtotal.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tax (7.7%)</span>
              <span className="text-gray-900 font-medium">
                {restaurant?.currency?.toUpperCase() || "CHF"} {tax.toFixed(2)}
              </span>
            </div>
            <Separator className="my-3" />
            <div className="flex justify-between text-xl font-bold">
              <span>Total</span>
              <span className="text-green-700">
                {restaurant?.currency?.toUpperCase() || "CHF"}{" "}
                {total.toFixed(2)}
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Enhanced Proceed Button */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-white via-white/95 to-transparent">
        <Link href={`/qr/${resolvedParams.tableId}/checkout?specialInstructions=${encodeURIComponent(specialInstructions)}`}>
          <Button
            size="lg"
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-xl hover:shadow-2xl transition-all duration-200 h-16 rounded-2xl text-lg font-semibold"
          >
            Proceed to Payment • {restaurant?.currency?.toUpperCase() || "CHF"}{" "}
            {total.toFixed(2)}
          </Button>
        </Link>
      </div>
    </div>
  );
}
