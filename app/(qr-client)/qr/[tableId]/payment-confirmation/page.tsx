"use client";

import { use, useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle,
  XCircle,
  Loader2,
  CreditCard,
  Shield,
  Clock,
  RefreshCw,
  Banknote,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";

export default function PaymentConfirmationPage({
  params,
}: {
  params: Promise<{ tableId: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { clearCart } = useCart(resolvedParams.tableId);
  const searchParams = useSearchParams();

  const [paymentStatus, setPaymentStatus] = useState<
    "processing" | "success" | "failed" | "cancelled"
  >("processing");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Main payment processing effect
  useEffect(() => {
    const sessionId = searchParams?.get("session_id");
    const orderIdParam = searchParams?.get("order_id");
    const canceled = searchParams?.get("canceled");

    console.log("Payment confirmation page loaded:", {
      sessionId,
      orderIdParam,
      canceled,
      tableId: resolvedParams.tableId,
    });

    // Handle canceled checkout
    if (canceled === "true") {
      setPaymentStatus("cancelled");
      setError(
        "Payment was canceled. Please try again or choose a different payment method."
      );
      return;
    }

    // Validate required parameters
    if (!sessionId || !orderIdParam) {
      console.error("Missing payment parameters:", {
        hasSessionId: !!sessionId,
        hasOrderId: !!orderIdParam,
      });
      setPaymentStatus("failed");
      setError("Invalid payment parameters. Please try again.");
      return;
    }

    setOrderId(orderIdParam);
    validateCheckoutSession(sessionId, orderIdParam);
  }, [searchParams, resolvedParams.tableId]);

  const validateCheckoutSession = async (
    sessionId: string,
    orderIdParam: string
  ) => {
    try {
      setIsProcessing(true);
      console.log("Validating checkout session:", { sessionId, orderIdParam });

      const response = await fetch("/api/qr/validate-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          orderId: orderIdParam,
          tableId: resolvedParams.tableId,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        console.error("Session validation failed:", result.error);
        setPaymentStatus("failed");

        // Provide more specific error messages based on the error type
        let userFriendlyError = "Payment validation failed. Please try again.";

        if (result.error?.includes("expired")) {
          userFriendlyError =
            "The payment session has expired. Please try again with a fresh payment.";
        } else if (result.error?.includes("not found")) {
          userFriendlyError =
            "Order not found. Please return to the menu and place your order again.";
        } else if (result.error?.includes("not in pending status")) {
          userFriendlyError =
            "This order has already been processed. Please check your order status.";
        } else if (result.error?.includes("timed out")) {
          userFriendlyError =
            "The order has timed out. Please place a new order.";
        } else if (result.error?.includes("Payment not completed")) {
          userFriendlyError =
            "The payment was not completed. Please try again or choose a different payment method.";
        } else if (result.error) {
          userFriendlyError = result.error;
        }

        setError(userFriendlyError);
        return;
      }

      console.log("Session validation successful:", result);

      // Check payment status
      if (result.session.paymentStatus === "paid") {
        setPaymentStatus("success");
        // Clear cart after successful payment
        clearCart();
        // Redirect to order tracking after a short delay
        setTimeout(() => {
          router.push(
            `/qr/${resolvedParams.tableId}/order-tracking/${orderIdParam}?payment_success=true`
          );
        }, 2000);
      } else {
        setPaymentStatus("failed");
        setError("Payment was not completed. Please try again.");
      }
    } catch (error: any) {
      console.error("Session validation error:", error);
      setPaymentStatus("failed");
      setError("Payment validation failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetry = () => {
    if (orderId) {
      router.push(`/qr/${resolvedParams.tableId}/checkout`);
    }
  };

  const handleBackToMenu = () => {
    router.push(`/qr/${resolvedParams.tableId}`);
  };

  const handleCashFallback = async () => {
    try {
      setIsProcessing(true);

      // Get cart data from sessionStorage
      const cartData = sessionStorage.getItem(
        `cart_data_${resolvedParams.tableId}`
      );
      if (!cartData) {
        setError("Cart data not found. Please return to menu and try again.");
        return;
      }

      const cart = JSON.parse(cartData);

      // Create cash order
      const response = await fetch("/api/qr/create-cash-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tableId: resolvedParams.tableId,
          items: cart.items,
          total: cart.total,
          customerName: cart.customerName || "",
          customerEmail: cart.customerEmail || "",
          specialInstructions: cart.specialInstructions || "",
        }),
      });

      const result = await response.json();

      if (result.success) {
        clearCart();
        toast.success("Cash order created successfully!");
        router.push(
          `/qr/${resolvedParams.tableId}/order-tracking/${result.orderId}`
        );
      } else {
        setError(
          result.error || "Failed to create cash order. Please try again."
        );
      }
    } catch (error: any) {
      console.error("Cash fallback error:", error);
      setError("Failed to create cash order. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Loading state
  if (isProcessing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <Loader2 className="w-8 h-8 text-green-600" />
          </motion.div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Processing Payment
          </h2>
          <p className="text-gray-600">
            Please wait while we confirm your payment...
          </p>
        </motion.div>
      </div>
    );
  }

  // Success state
  if (paymentStatus === "success") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle className="w-10 h-10 text-green-600" />
          </motion.div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Payment Successful!
          </h2>
          <p className="text-gray-600 mb-6">
            Your order has been confirmed and is being prepared. You&apos;ll be
            redirected to order tracking shortly.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-green-600 bg-green-100 px-4 py-2 rounded-full">
            <Shield className="w-4 h-4" />
            <span>Payment secured by Stripe</span>
          </div>
        </motion.div>
      </div>
    );
  }

  // Failed state
  if (paymentStatus === "failed") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-lg"
        >
          {/* Enhanced Error Icon */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="relative mx-auto mb-8"
          >
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center border-4 border-red-200 shadow-lg">
              <XCircle className="w-12 h-12 text-red-600" />
            </div>
            {/* Floating warning indicators */}
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
              className="absolute -top-2 -right-2 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center"
            >
              <span className="text-white text-xs font-bold">!</span>
            </motion.div>
          </motion.div>

          {/* Enhanced Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-3xl font-bold bg-gradient-to-r from-red-700 to-red-600 bg-clip-text text-transparent mb-4">
              Payment Failed
            </h2>
            <p className="text-gray-700 mb-6 text-lg leading-relaxed">
              {error ||
                "We couldn't process your card payment. Don't worry - your order is safe and you have options to complete it."}
            </p>
          </motion.div>

          {/* Enhanced Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-4"
          >
            {/* Primary Action - Retry Card */}
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-600" />
                Try Card Payment Again
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Sometimes card payments fail due to temporary issues. You can
                try again with the same or a different card.
              </p>
              <Button
                onClick={handleRetry}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Retry Card Payment
              </Button>
            </div>

            {/* Secondary Action - Cash Payment */}
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Banknote className="w-5 h-5 text-green-600" />
                Pay with Cash
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Pay at the counter when your order is ready. No additional fees
                and your order will be prepared immediately.
              </p>
              <Button
                variant="outline"
                onClick={handleCashFallback}
                className="w-full border-green-300 text-green-700 hover:bg-green-50 hover:border-green-400 font-semibold py-3 rounded-lg transition-all duration-200"
              >
                <Banknote className="w-4 h-4 mr-2" />
                Choose Cash Payment
              </Button>
            </div>

            {/* Tertiary Action - Back to Menu */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
                Return to Menu
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Go back to browse the menu or modify your order. Your cart items
                will be saved.
              </p>
              <Button
                variant="ghost"
                onClick={handleBackToMenu}
                className="w-full text-gray-700 hover:bg-gray-100 font-medium py-3 rounded-lg transition-all duration-200"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Menu
              </Button>
            </div>
          </motion.div>

          {/* Helpful Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-200"
          >
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-600 text-sm font-bold">i</span>
              </div>
              <div className="text-left">
                <h4 className="text-sm font-semibold text-blue-900 mb-1">
                  Need Help?
                </h4>
                <p className="text-sm text-blue-700 leading-relaxed">
                  If you continue having issues, you can pay at the counter when
                  your order is ready. Your order will be prepared as soon as
                  you confirm payment.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // Cancelled state
  if (paymentStatus === "cancelled") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-lg"
        >
          {/* Enhanced Cancelled Icon */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="relative mx-auto mb-8"
          >
            <div className="w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center border-4 border-amber-200 shadow-lg">
              <Clock className="w-12 h-12 text-amber-600" />
            </div>
            {/* Floating pause indicator */}
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
              className="absolute -top-2 -right-2 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center"
            >
              <span className="text-white text-xs font-bold">⏸</span>
            </motion.div>
          </motion.div>

          {/* Enhanced Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-3xl font-bold bg-gradient-to-r from-amber-700 to-orange-600 bg-clip-text text-transparent mb-4">
              Payment Cancelled
            </h2>
            <p className="text-gray-700 mb-6 text-lg leading-relaxed">
              {error ||
                "You cancelled the payment. No charges were made and your order is still available to complete."}
            </p>
          </motion.div>

          {/* Enhanced Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-4"
          >
            {/* Primary Action - Retry Card */}
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-600" />
                Try Card Payment Again
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Ready to try again? You can use the same card or try a different
                payment method.
              </p>
              <Button
                onClick={handleRetry}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Retry Card Payment
              </Button>
            </div>

            {/* Secondary Action - Cash Payment */}
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Banknote className="w-5 h-5 text-green-600" />
                Pay with Cash
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Pay at the counter when your order is ready. No additional fees
                and your order will be prepared immediately.
              </p>
              <Button
                variant="outline"
                onClick={handleCashFallback}
                className="w-full border-green-300 text-green-700 hover:bg-green-50 hover:border-green-400 font-semibold py-3 rounded-lg transition-all duration-200"
              >
                <Banknote className="w-4 h-4 mr-2" />
                Choose Cash Payment
              </Button>
            </div>

            {/* Tertiary Action - Back to Menu */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
                Return to Menu
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Go back to browse the menu or modify your order. Your cart items
                will be saved.
              </p>
              <Button
                variant="ghost"
                onClick={handleBackToMenu}
                className="w-full text-gray-700 hover:bg-gray-100 font-medium py-3 rounded-lg transition-all duration-200"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Menu
              </Button>
            </div>
          </motion.div>

          {/* Helpful Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-8 p-4 bg-amber-50 rounded-xl border border-amber-200"
          >
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-amber-600 text-sm font-bold">i</span>
              </div>
              <div className="text-left">
                <h4 className="text-sm font-semibold text-amber-900 mb-1">
                  No Charges Made
                </h4>
                <p className="text-sm text-amber-700 leading-relaxed">
                  Since you cancelled the payment, no charges were made to your
                  card. You can safely try again or choose a different payment
                  method.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // Default loading state
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-md"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <Loader2 className="w-8 h-8 text-gray-600" />
        </motion.div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Loading Payment
        </h2>
        <p className="text-gray-600">Please wait...</p>
      </motion.div>
    </div>
  );
}
