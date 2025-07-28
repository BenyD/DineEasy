"use client";

import { use, useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle,
  XCircle,
  Loader2,
  CreditCard,
  Shield,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { confirmQRPayment } from "@/lib/actions/qr-payments";
import { loadStripe } from "@stripe/stripe-js";

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function PaymentConfirmationPage({
  params,
}: {
  params: Promise<{ tableId: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { clearCart } = useCart();

  const [paymentStatus, setPaymentStatus] = useState<
    "processing" | "success" | "failed"
  >("processing");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stripe, setStripe] = useState<any>(null);

  useEffect(() => {
    const clientSecret = searchParams.get("client_secret");
    const orderIdParam = searchParams.get("order_id");

    if (!clientSecret || !orderIdParam) {
      setPaymentStatus("failed");
      setError("Invalid payment parameters");
      return;
    }

    setOrderId(orderIdParam);

    // Initialize Stripe and process payment
    const processPayment = async () => {
      try {
        const stripeInstance = await stripePromise;
        if (!stripeInstance) {
          throw new Error("Failed to load Stripe");
        }

        setStripe(stripeInstance);

        // Confirm the payment with Stripe
        const { error: stripeError } = await stripeInstance.confirmPayment({
          clientSecret,
          confirmParams: {
            return_url: `${window.location.origin}/qr/${resolvedParams.tableId}/confirmation?order_id=${orderIdParam}&payment=stripe`,
          },
        });

        if (stripeError) {
          console.error("Stripe payment error:", stripeError);
          throw new Error(stripeError.message || "Payment failed");
        }

        // If we reach here, payment was successful
        setPaymentStatus("success");
        clearCart();

        // Confirm the payment on our server
        const result = await confirmQRPayment(orderIdParam);
        if (result.error) {
          console.error("Server confirmation error:", result.error);
          // Don't throw here as the payment was successful on Stripe's side
        }

        // Redirect to confirmation page after a short delay
        setTimeout(() => {
          router.push(
            `/qr/${resolvedParams.tableId}/confirmation?order_id=${orderIdParam}&payment=stripe`
          );
        }, 3000);
      } catch (error: any) {
        console.error("Payment processing error:", error);
        setPaymentStatus("failed");
        setError(error.message || "Payment processing failed");
        toast.error("Payment failed. Please try again.");
      }
    };

    processPayment();
  }, [searchParams, resolvedParams.tableId, router, clearCart]);

  const handleRetry = () => {
    router.push(`/qr/${resolvedParams.tableId}/checkout`);
  };

  const handleBackToMenu = () => {
    router.push(`/qr/${resolvedParams.tableId}`);
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full"
      >
        {/* Payment Status Card */}
        <div className="bg-white border border-gray-200 rounded-lg p-8">
          {paymentStatus === "processing" && (
            <div className="text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <Loader2 className="w-8 h-8 text-blue-600" />
              </motion.div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Processing Payment
              </h2>
              <p className="text-gray-600 mb-6">
                Please wait while we process your payment securely...
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <Shield className="w-4 h-4" />
                <span>Secure payment processing</span>
              </div>
            </div>
          )}

          {paymentStatus === "success" && (
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <CheckCircle className="w-8 h-8 text-green-600" />
              </motion.div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Payment Successful!
              </h2>
              <p className="text-gray-600 mb-6">
                Your order has been confirmed and payment processed
                successfully.
              </p>
              {orderId && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <p className="text-sm text-gray-600">Order ID</p>
                  <p className="font-mono text-sm text-gray-900">{orderId}</p>
                </div>
              )}
              <div className="flex items-center justify-center gap-2 text-sm text-green-600 mb-6">
                <CreditCard className="w-4 h-4" />
                <span>Redirecting to confirmation...</span>
              </div>
            </div>
          )}

          {paymentStatus === "failed" && (
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <XCircle className="w-8 h-8 text-red-600" />
              </motion.div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Payment Failed
              </h2>
              <p className="text-gray-600 mb-6">
                {error ||
                  "There was an issue processing your payment. Please try again."}
              </p>
              <div className="space-y-3">
                <Button
                  onClick={handleRetry}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  Try Again
                </Button>
                <Button
                  onClick={handleBackToMenu}
                  variant="outline"
                  className="w-full"
                >
                  Back to Menu
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Security Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4"
        >
          <div className="flex items-center gap-2 text-blue-700 mb-2">
            <Shield className="w-4 h-4" />
            <span className="text-sm font-medium">Secure Payment</span>
          </div>
          <p className="text-xs text-blue-600">
            Your payment is processed securely by Stripe. Your card details are
            never stored on our servers.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
