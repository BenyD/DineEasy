"use client";

import { use, useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CreditCard,
  Banknote,
  Check,
  Loader2,
  Shield,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { TipSelector } from "@/components/qr/TipSelector";
import { useCart } from "@/hooks/useCart";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  createQRPaymentIntent,
  type QRPaymentData,
} from "@/lib/actions/qr-payments";
import { getTableInfo } from "@/lib/actions/qr-client";

const paymentMethods = [
  {
    id: "stripe",
    name: "Credit Card",
    description: "Secure payment with Visa, Mastercard, or American Express",
    icon: CreditCard,
    color: "blue",
  },
  {
    id: "cash",
    name: "Pay at Counter",
    description: "Pay with cash when you leave",
    icon: Banknote,
    color: "green",
  },
];

interface RestaurantData {
  id: string;
  name: string;
  logo_url?: string;
  address?: string;
  currency?: string;
}

interface TableData {
  id: string;
  number: string;
  capacity: number;
  restaurants: RestaurantData;
}

export default function CheckoutPage({
  params,
}: {
  params: Promise<{ tableId: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { cart, getTotalPrice, clearCart } = useCart();
  const [selectedPayment, setSelectedPayment] = useState("");
  const [email, setEmail] = useState("");
  const [tip, setTip] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [restaurant, setRestaurant] = useState<RestaurantData | null>(null);
  const [tableData, setTableData] = useState<TableData | null>(null);

  const subtotal = getTotalPrice();
  const tax = subtotal * 0.077;
  const total = subtotal + tax + tip;

  // Load restaurant and table data
  useEffect(() => {
    const loadData = async () => {
      try {
        // Get table info
        const tableResult = await getTableInfo(resolvedParams.tableId);
        if (tableResult.success) {
          const tableData = tableResult.data as TableData;
          const restaurantData = tableData.restaurants as RestaurantData;

          setTableData(tableData);
          setRestaurant(restaurantData);
          setRestaurantId(restaurantData.id);
        }

        // Get stored restaurant ID as fallback
        const storedRestaurantId = localStorage.getItem("restaurantId");
        if (storedRestaurantId && !restaurantId) {
          setRestaurantId(storedRestaurantId);
        }
      } catch (error) {
        console.error("Error loading restaurant data:", error);
      }
    };

    loadData();
  }, [resolvedParams.tableId, restaurantId]);

  const handleConfirmOrder = async () => {
    if (!selectedPayment || !restaurantId) {
      toast.error("Please select a payment method");
      return;
    }

    if (selectedPayment === "stripe" && !email) {
      toast.error("Please enter your email for the receipt");
      return;
    }

    setIsProcessing(true);

    try {
      if (selectedPayment === "stripe") {
        // Create server-side Stripe payment intent
        const paymentData: QRPaymentData = {
          tableId: resolvedParams.tableId,
          restaurantId: restaurantId,
          items: cart.map((item) => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
          })),
          subtotal,
          tax,
          tip,
          total,
          email,
        };

        const result = await createQRPaymentIntent(paymentData);

        if (result.error) {
          throw new Error(result.error);
        }

        if (result.clientSecret) {
          // Redirect to a payment confirmation page that handles the payment
          // This follows the server-side pattern used in your codebase
          router.push(
            `/qr/${resolvedParams.tableId}/payment-confirmation?client_secret=${result.clientSecret}&order_id=${result.orderId}`
          );
        }
      } else if (selectedPayment === "cash") {
        // Handle cash payment
        const orderId = crypto.randomUUID();

        // Store order details for cash payment
        localStorage.setItem(
          "cashOrder",
          JSON.stringify({
            orderId,
            items: cart,
            total,
            tip,
            tableId: resolvedParams.tableId,
            restaurantId: restaurantId,
          })
        );

        // Clear cart and redirect to confirmation
        clearCart();
        router.push(
          `/qr/${resolvedParams.tableId}/confirmation?payment=cash&order_id=${orderId}&total=${total.toFixed(2)}&tip=${tip.toFixed(2)}`
        );
      }
    } catch (error: any) {
      console.error("Payment error:", error);
      toast.error(error.message || "Payment failed. Please try again.");
      setIsProcessing(false);
    }
  };

  const handleMethodToggle = (methodId: string) => {
    setSelectedPayment(methodId);
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Your cart is empty
          </h1>
          <p className="text-gray-600 mb-8">
            Add some items to your cart before proceeding to checkout.
          </p>
          <Link href={`/qr/${resolvedParams.tableId}`}>
            <Button className="bg-green-600 hover:bg-green-700">
              Back to Menu
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Enhanced Header */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-lg border-b border-gray-100 shadow-sm">
        <div className="flex items-center gap-4 px-4 py-4">
          <Link href={`/qr/${resolvedParams.tableId}/cart`}>
            <Button
              variant="ghost"
              size="sm"
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-bold">Payment</h1>
            <p className="text-sm text-gray-500">
              {restaurant?.name || "Restaurant"} • Table{" "}
              {tableData?.number || resolvedParams.tableId}
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 pb-32 space-y-6">
        {/* Restaurant Info */}
        {restaurant && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-4 border border-green-200"
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
                {restaurant.address && (
                  <p className="text-sm text-gray-600">{restaurant.address}</p>
                )}
              </div>
              <div className="flex items-center gap-2 text-green-600">
                <Shield className="w-4 h-4" />
                <span className="text-xs font-medium">Secure Payment</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Enhanced Order Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200"
        >
          <h3 className="font-bold text-gray-900 mb-4 text-lg">
            Order Summary
          </h3>
          <div className="space-y-3 text-sm">
            {cart.map((item) => (
              <div key={item.id} className="flex justify-between items-center">
                <div className="flex-1">
                  <span className="text-gray-900 font-medium">
                    {item.quantity}x {item.name}
                  </span>
                  {/* Popular tag removed - not available in MenuItem type */}
                </div>
                <span className="text-gray-900 font-medium">
                  {restaurant?.currency?.toUpperCase() || "CHF"}{" "}
                  {(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
            <Separator className="my-3" />
            <div className="flex justify-between text-base">
              <span className="text-gray-600">Subtotal</span>
              <span className="text-gray-900 font-medium">
                {restaurant?.currency?.toUpperCase() || "CHF"}{" "}
                {subtotal.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-base">
              <span className="text-gray-600">Tax (7.7%)</span>
              <span className="text-gray-900 font-medium">
                {restaurant?.currency?.toUpperCase() || "CHF"} {tax.toFixed(2)}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Tip Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200"
        >
          <h3 className="font-bold text-gray-900 mb-4 text-lg">Add a Tip</h3>
          <TipSelector subtotal={subtotal} onTipChange={setTip} />
        </motion.div>

        {/* Payment Methods */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200"
        >
          <h3 className="font-bold text-gray-900 mb-4 text-lg">
            Payment Method
          </h3>
          <div className="space-y-3">
            {paymentMethods.map((method) => (
              <button
                key={method.id}
                onClick={() => handleMethodToggle(method.id)}
                className={`w-full p-4 rounded-xl border-2 transition-all duration-200 ${
                  selectedPayment === method.id
                    ? "border-green-500 bg-green-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      selectedPayment === method.id
                        ? "border-green-500 bg-green-500"
                        : "border-gray-300"
                    }`}
                  >
                    {selectedPayment === method.id && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </div>
                  <div className="flex items-center gap-3 flex-1">
                    <method.icon
                      className={`w-6 h-6 ${
                        method.color === "blue"
                          ? "text-blue-600"
                          : "text-green-600"
                      }`}
                    />
                    <div className="text-left">
                      <div className="font-semibold text-gray-900">
                        {method.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {method.description}
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Email Input for Stripe */}
        {selectedPayment === "stripe" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200"
          >
            <Label htmlFor="email" className="text-gray-700 font-medium mb-2">
              Email for Receipt
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="h-12 text-lg border-gray-200 focus:border-green-500 focus:ring-green-500 rounded-xl"
            />
            <p className="text-xs text-gray-500 mt-2">
              We'll send your receipt and order confirmation to this email
            </p>
          </motion.div>
        )}

        {/* Security Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="bg-blue-50 border border-blue-200 rounded-2xl p-4"
        >
          <div className="flex items-center gap-2 text-blue-700">
            <Lock className="w-4 h-4" />
            <span className="text-sm font-medium">Secure Payment</span>
          </div>
          <p className="text-xs text-blue-600 mt-1">
            Your payment is processed securely by Stripe. Your card details are
            never stored on our servers.
          </p>
        </motion.div>
      </div>

      {/* Enhanced Proceed Button */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-white via-white/95 to-transparent">
        <Button
          onClick={handleConfirmOrder}
          disabled={isProcessing || !selectedPayment}
          size="lg"
          className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-xl hover:shadow-2xl transition-all duration-200 h-16 rounded-2xl text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            `Pay ${restaurant?.currency?.toUpperCase() || "CHF"} ${total.toFixed(2)}`
          )}
        </Button>
      </div>
    </div>
  );
}
