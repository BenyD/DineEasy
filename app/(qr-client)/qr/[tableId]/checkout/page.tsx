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
  AlertCircle,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { TipSelector } from "@/components/qr/TipSelector";
import { useCart } from "@/hooks/useCart";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  createQRPaymentIntent,
  createCashOrder,
  type QRPaymentData,
} from "@/lib/actions/qr-payments";
import { getTableInfo } from "@/lib/actions/qr-client";
import { formatAmountWithCurrency } from "@/lib/utils/currency";
import {
  validateOrderData,
  sanitizeOrderData,
  validateEmail,
  validateCustomerName,
} from "@/lib/utils/validation";

interface RestaurantData {
  id: string;
  name: string;
  logo_url?: string;
  address?: string;
  cuisine?: string;
  opening_hours?: any;
  currency?: string;
  phone?: string;
  email?: string;
  description?: string;
  stripe_account_enabled?: boolean;
  stripe_account_id?: string;
  payment_methods?: {
    cardEnabled: boolean;
    cashEnabled: boolean;
  };
  tax_rate?: number; // Added tax_rate to RestaurantData interface
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
  const searchParams = useSearchParams();
  const { cart, getTotalPrice, clearCart } = useCart(resolvedParams.tableId);
  const [selectedPayment, setSelectedPayment] = useState("");
  const [email, setEmail] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [tip, setTip] = useState(0);
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaymentSuccessful, setIsPaymentSuccessful] = useState(false);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [restaurant, setRestaurant] = useState<RestaurantData | null>(null);
  const [tableData, setTableData] = useState<TableData | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentValidation, setPaymentValidation] = useState<any>(null);

  const subtotal = getTotalPrice();
  const tax = (subtotal * (restaurant?.tax_rate || 0)) / 100;
  const total = subtotal + tax + tip;

  // Load restaurant and table data and special instructions
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // Get table info
        const tableResult = await getTableInfo(resolvedParams.tableId);
        if (tableResult.success) {
          const tableData = tableResult.data as TableData;
          const restaurantData = tableData.restaurants as RestaurantData;

          setTableData(tableData);
          setRestaurant(restaurantData);
          setRestaurantId(restaurantData.id);

          // Payment methods are validated in the UI based on restaurant data
        }

        // Get stored restaurant ID as fallback
        const storedRestaurantId = localStorage.getItem("restaurantId");
        if (storedRestaurantId && !restaurantId) {
          setRestaurantId(storedRestaurantId);
        }

        // Load special instructions from URL params
        const specialInstructionsParam = searchParams.get(
          "specialInstructions"
        );
        if (specialInstructionsParam) {
          setSpecialInstructions(decodeURIComponent(specialInstructionsParam));
        }
      } catch (error) {
        console.error("Error loading restaurant data:", error);
        toast.error("Failed to load restaurant information");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [resolvedParams.tableId, restaurantId]);

  const handleConfirmOrder = async () => {
    if (!selectedPayment || !restaurantId) {
      toast.error("Please select a payment method");
      return;
    }

    // Validate and sanitize user inputs
    const sanitizedEmail = email.trim();
    const sanitizedCustomerName = customerName.trim();
    const sanitizedSpecialInstructions = specialInstructions.trim();

    // Validate email
    if (!sanitizedEmail) {
      toast.error("Please enter your email for the receipt");
      return;
    }

    if (!validateEmail(sanitizedEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }

    // Validate customer name
    if (!sanitizedCustomerName) {
      toast.error("Please enter your name");
      return;
    }

    if (!validateCustomerName(sanitizedCustomerName)) {
      toast.error(
        "Please enter a valid name (letters, spaces, hyphens, apostrophes only)"
      );
      return;
    }

    // Validate order data
    const orderValidation = validateOrderData({
      email: sanitizedEmail,
      customerName: sanitizedCustomerName,
      specialInstructions: sanitizedSpecialInstructions,
      items: cart.map((item) => ({
        quantity: item.quantity,
        price: item.price,
      })),
      subtotal,
      tip,
    });

    if (!orderValidation.isValid) {
      toast.error(orderValidation.errors[0]);
      return;
    }

    setIsProcessing(true);

    try {
      if (selectedPayment === "stripe") {
        // Validate Stripe Connect is enabled
        if (
          !restaurant?.stripe_account_enabled ||
          !restaurant?.stripe_account_id
        ) {
          throw new Error(
            "Restaurant payment processing is not available. Please pay at the counter."
          );
        }

        // Create server-side Stripe payment intent with sanitized data
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
          email: sanitizedEmail,
          customerName: sanitizedCustomerName,
          specialInstructions: sanitizedSpecialInstructions,
        };

        // Save cart data to sessionStorage for potential cash fallback
        const cartData = {
          restaurantId,
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
          email: sanitizedEmail,
          customerName: sanitizedCustomerName,
          specialInstructions: sanitizedSpecialInstructions,
        };
        sessionStorage.setItem(
          `cart_${resolvedParams.tableId}`,
          JSON.stringify(cartData)
        );

        const result = await createQRPaymentIntent(paymentData);

        if (result.error) {
          throw new Error(result.error);
        }

        if (result.checkoutUrl && result.orderId) {
          // Only clear cart after successful checkout session creation
          clearCart();

          // Redirect to Stripe hosted checkout
          window.location.href = result.checkoutUrl;
        } else {
          throw new Error("Failed to create payment. Please try again.");
        }
      } else if (selectedPayment === "cash") {
        // Handle cash payment with sanitized data
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
          email: sanitizedEmail,
          customerName: sanitizedCustomerName,
          specialInstructions: sanitizedSpecialInstructions,
        };

        const result = await createCashOrder(paymentData);

        if (result.error) {
          throw new Error(result.error);
        }

        if (result.orderId) {
          // Only clear cart after successful order creation
          clearCart();

          // Redirect to order tracking page with success parameter
          router.push(
            `/qr/${resolvedParams.tableId}/order-tracking/${result.orderId}?payment_success=true`
          );
        } else {
          throw new Error("Failed to create order. Please try again.");
        }
      }
    } catch (error) {
      console.error("Error processing order:", error);

      // Don't clear cart on error - let user try again
      toast.error(
        error instanceof Error ? error.message : "Failed to process order"
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMethodToggle = (methodId: string) => {
    setSelectedPayment(methodId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-green-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (isPaymentSuccessful) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-green-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Redirecting to order tracking...</p>
        </div>
      </div>
    );
  }

  if (cart.length === 0 && !isPaymentSuccessful) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          {/* Enhanced Empty Cart Illustration */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="relative mx-auto mb-8"
          >
            <div className="w-32 h-32 bg-gradient-to-br from-amber-50 to-orange-100 rounded-full flex items-center justify-center border-4 border-amber-200 shadow-lg">
              <div className="relative">
                <span className="text-5xl">🛒</span>
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.7, 1, 0.7],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center"
                >
                  <span className="text-white text-xs font-bold">0</span>
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Enhanced Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-4">
              Your cart is empty
            </h1>
            <p className="text-gray-600 mb-8 leading-relaxed">
              Add some delicious items to your cart before proceeding to
              checkout.
            </p>
          </motion.div>

          {/* Enhanced Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-4"
          >
            <Link href={`/qr/${resolvedParams.tableId}`}>
              <Button className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 px-6 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 font-semibold w-full">
                <span className="mr-2">🍽️</span>
                Back to Menu
              </Button>
            </Link>
            <Link href={`/qr/${resolvedParams.tableId}/feedback`}>
              <Button
                variant="outline"
                className="w-full border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
              >
                <span className="mr-2">⭐</span>
                Rate Your Experience
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // Use enhanced payment validation if available, fallback to basic validation
  const cardPaymentEnabled =
    paymentValidation?.paymentMethods?.card?.available ||
    (restaurant?.stripe_account_enabled &&
      restaurant?.stripe_account_id &&
      (restaurant?.payment_methods?.cardEnabled ?? true));

  const cashPaymentEnabled =
    paymentValidation?.paymentMethods?.cash?.available ||
    (restaurant?.payment_methods?.cashEnabled ?? true);

  // Get payment method issues for better error messages
  const cardPaymentIssues =
    paymentValidation?.paymentMethods?.card?.issues || [];
  const cashPaymentIssues =
    paymentValidation?.paymentMethods?.cash?.issues || [];

  // If no payment methods are enabled, show error
  if (!cardPaymentEnabled && !cashPaymentEnabled) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            No Payment Methods Available
          </h2>
          <p className="text-gray-600 mb-6">
            This restaurant has not enabled any payment methods. Please contact
            the restaurant directly.
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
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3 mb-4">
            <Link href={`/qr/${resolvedParams.tableId}`}>
              <Button variant="ghost" size="sm" className="p-2">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-lg font-semibold text-gray-900">Checkout</h1>
              <p className="text-sm text-gray-600">
                {restaurant?.name} • Table {tableData?.number}
              </p>
            </div>
            <Link href={`/qr/${resolvedParams.tableId}/feedback`}>
              <Button
                variant="ghost"
                size="sm"
                className="p-2"
                title="Rate your experience"
              >
                <span className="text-lg">🙏</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Order Summary */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Order Summary
          </h2>
          <div className="space-y-3">
            {cart.map((item) => (
              <div key={item.id} className="flex justify-between items-center">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{item.name}</p>
                  <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                </div>
                <p className="font-semibold text-gray-900">
                  {formatAmountWithCurrency(
                    item.price * item.quantity,
                    restaurant?.currency || "CHF"
                  )}
                </p>
              </div>
            ))}
          </div>
          <Separator className="my-4" />
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="text-gray-900">
                {formatAmountWithCurrency(
                  subtotal,
                  restaurant?.currency || "CHF"
                )}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">
                Tax ({(restaurant?.tax_rate || 0).toFixed(1)}%)
              </span>
              <span className="text-gray-900">
                {formatAmountWithCurrency(tax, restaurant?.currency || "CHF")}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tip</span>
              <span className="text-gray-900">
                {formatAmountWithCurrency(tip, restaurant?.currency || "CHF")}
              </span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between text-lg font-semibold">
              <span className="text-gray-900">Total</span>
              <span className="text-gray-900">
                {formatAmountWithCurrency(total, restaurant?.currency || "CHF")}
              </span>
            </div>
          </div>
        </div>

        {/* Tip Selector */}
        <TipSelector onTipChange={setTip} subtotal={subtotal} />

        {/* Special Instructions */}
        {specialInstructions && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="w-5 h-5 text-gray-600" />
              <h3 className="font-semibold text-gray-900">
                Special Instructions
              </h3>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-gray-700 text-sm whitespace-pre-wrap">
                {specialInstructions}
              </p>
            </div>
          </div>
        )}

        {/* Payment Methods */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Payment Method
          </h2>

          {/* Debug Payment Validation (Development Only) */}
          {process.env.NODE_ENV === "development" && paymentValidation && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-gray-900 mb-2">
                Payment Validation Debug:
              </h4>
              <div className="text-xs text-gray-600 space-y-1">
                <p>
                  <strong>Restaurant:</strong>{" "}
                  {paymentValidation.restaurantName}
                </p>
                <p>
                  <strong>Currency:</strong> {paymentValidation.currency}
                </p>
                <p>
                  <strong>Card Enabled:</strong>{" "}
                  {paymentValidation.paymentMethods.card.enabled ? "Yes" : "No"}
                </p>
                <p>
                  <strong>Card Available:</strong>{" "}
                  {paymentValidation.paymentMethods.card.available
                    ? "Yes"
                    : "No"}
                </p>
                <p>
                  <strong>Stripe Enabled:</strong>{" "}
                  {paymentValidation.paymentMethods.card.stripeEnabled
                    ? "Yes"
                    : "No"}
                </p>
                <p>
                  <strong>Stripe Account ID:</strong>{" "}
                  {paymentValidation.paymentMethods.card.stripeAccountId ||
                    "None"}
                </p>
                <p>
                  <strong>Cash Enabled:</strong>{" "}
                  {paymentValidation.paymentMethods.cash.enabled ? "Yes" : "No"}
                </p>
                <p>
                  <strong>Cash Available:</strong>{" "}
                  {paymentValidation.paymentMethods.cash.available
                    ? "Yes"
                    : "No"}
                </p>
                {cardPaymentIssues.length > 0 && (
                  <div>
                    <p>
                      <strong>Card Issues:</strong>
                    </p>
                    <ul className="list-disc list-inside ml-2">
                      {cardPaymentIssues.map((issue: string, index: number) => (
                        <li key={index}>{issue}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {!cardPaymentEnabled && cardPaymentIssues.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 text-amber-700 mb-2">
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">
                  Online payments not available
                </span>
              </div>
              <div className="text-sm text-amber-600 space-y-1">
                <p>
                  This restaurant doesn&apos;t have online payment processing
                  set up.
                </p>
                {cardPaymentIssues.length > 0 && (
                  <div className="mt-2">
                    <p className="font-medium">Issues:</p>
                    <ul className="list-disc list-inside space-y-1 mt-1">
                      {cardPaymentIssues.map((issue: string, index: number) => (
                        <li key={index}>{issue}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <p className="mt-2">Please pay at the counter.</p>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {cardPaymentEnabled && (
              <div
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  selectedPayment === "stripe"
                    ? "border-green-500 bg-green-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => handleMethodToggle("stripe")}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedPayment === "stripe"
                        ? "border-green-500 bg-green-500"
                        : "border-gray-300"
                    }`}
                  >
                    {selectedPayment === "stripe" && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-6 h-6 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900">Credit Card</p>
                      <p className="text-sm text-gray-600">
                        Secure payment with Visa, Mastercard, or American
                        Express
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {cashPaymentEnabled && (
              <div
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  selectedPayment === "cash"
                    ? "border-green-500 bg-green-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => handleMethodToggle("cash")}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedPayment === "cash"
                        ? "border-green-500 bg-green-500"
                        : "border-gray-300"
                    }`}
                  >
                    {selectedPayment === "cash" && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <Banknote className="w-6 h-6 text-green-600" />
                    <div>
                      <p className="font-medium text-gray-900">
                        Pay at Counter
                      </p>
                      <p className="text-sm text-gray-600">
                        Pay with cash when you leave
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Customer Information */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Customer Information
          </h3>
          <div className="space-y-4">
            <div>
              <Label
                htmlFor="customerName"
                className="text-gray-700 font-medium mb-2"
              >
                Your Name *
              </Label>
              <Input
                id="customerName"
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter your full name"
                className="h-12 text-lg border-gray-200 focus:border-green-500 focus:ring-green-500 rounded-lg"
                required
              />
            </div>

            <div>
              <Label htmlFor="email" className="text-gray-700 font-medium mb-2">
                Email Address *
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="h-12 text-lg border-gray-200 focus:border-green-500 focus:ring-green-500 rounded-lg"
                required
              />
              <p className="text-xs text-gray-500 mt-2">
                We&apos;ll send your receipt and order confirmation to this
                email
              </p>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-blue-700 mb-2">
            <Shield className="w-4 h-4" />
            <span className="text-sm font-medium">Secure Payment</span>
          </div>
          <p className="text-xs text-blue-600">
            Your payment is processed securely by Stripe. Your card details are
            never stored on our servers.
          </p>
        </div>

        {/* Proceed Button */}
        <Button
          onClick={handleConfirmOrder}
          disabled={!selectedPayment || isProcessing}
          className="w-full bg-green-600 hover:bg-green-700 text-white h-14 text-lg font-medium"
        >
          {isProcessing ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing...
            </div>
          ) : (
            `Confirm Order • ${formatAmountWithCurrency(total, restaurant?.currency || "CHF")}`
          )}
        </Button>
      </div>
    </div>
  );
}
