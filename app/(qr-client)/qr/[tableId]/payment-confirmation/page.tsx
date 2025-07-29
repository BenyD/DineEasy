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
  Clock,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { confirmQRPayment } from "@/lib/actions/qr-payments";
import { loadStripe } from "@stripe/stripe-js";

// Initialize Stripe
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

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
    | "processing"
    | "success"
    | "failed"
    | "requires_action"
    | "processing_payment"
  >("processing");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stripe, setStripe] = useState<any>(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

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
          setPaymentStatus("failed");
          setError(stripeError.message || "Payment failed. Please try again.");
          toast.error(
            stripeError.message || "Payment failed. Please try again."
          );
          return;
        }

        // Retrieve the PaymentIntent to check its status
        const { paymentIntent } =
          await stripeInstance.retrievePaymentIntent(clientSecret);
        if (!paymentIntent) {
          setPaymentStatus("failed");
          setError("Payment failed. Please try again.");
          toast.error("Payment failed. Please try again.");
          return;
        }

        console.log("Payment intent status:", paymentIntent.status);

        switch (paymentIntent.status) {
          case "succeeded":
            setPaymentStatus("success");
            clearCart();

            // Confirm the payment on our server
            const result = await confirmQRPayment(orderIdParam);
            if (result.error) {
              console.error("Server confirmation error:", result.error);
              // Don't throw here as the payment was successful on Stripe's side
              toast.error(
                "Payment successful but order confirmation failed. Please contact support."
              );
            } else {
              toast.success("Payment successful!");
            }

            // Redirect to confirmation page
            setTimeout(() => {
              router.push(
                `/qr/${resolvedParams.tableId}/confirmation?order_id=${orderIdParam}&payment=stripe&success=true`
              );
            }, 2000);
            break;

          case "processing":
            setPaymentStatus("processing_payment");
            // Poll for status updates
            await pollPaymentStatus(paymentIntent.id, orderIdParam);
            break;

          case "requires_action":
            setPaymentStatus("requires_action");
            setError(
              "Payment requires additional authentication. Please complete the payment."
            );
            break;

          case "canceled":
            setPaymentStatus("failed");
            setError("Payment was canceled. Please try again.");
            toast.error("Payment was canceled. Please try again.");
            break;

          default:
            setPaymentStatus("failed");
            setError("Payment failed. Please try again.");
            toast.error("Payment failed. Please try again.");
            break;
        }
      } catch (error: any) {
        console.error("Payment processing error:", error);
        setPaymentStatus("failed");
        setError(error.message || "Payment processing failed");
        toast.error("Payment failed. Please try again.");
      }
    };

    processPayment();
  }, [searchParams, resolvedParams.tableId, router, clearCart]);

  // Poll payment status for processing payments
  const pollPaymentStatus = async (
    paymentIntentId: string,
    orderId: string
  ) => {
    if (retryCount >= maxRetries) {
      setPaymentStatus("failed");
      setError(
        "Payment is taking longer than expected. Please contact support."
      );
      toast.error(
        "Payment is taking longer than expected. Please contact support."
      );
      return;
    }

    setTimeout(async () => {
      try {
        const stripeInstance = await stripePromise;
        if (!stripeInstance) {
          setPaymentStatus("failed");
          setError("Failed to load payment system");
          return;
        }

        const { paymentIntent } =
          await stripeInstance.retrievePaymentIntent(paymentIntentId);

        if (!paymentIntent) {
          setPaymentStatus("failed");
          setError("Payment failed. Please try again.");
          toast.error("Payment failed. Please try again.");
          return;
        }

        console.log("Polling payment status:", paymentIntent.status);

        if (paymentIntent.status === "succeeded") {
          setPaymentStatus("success");
          clearCart();

          // Confirm the payment on our server
          const result = await confirmQRPayment(orderId);
          if (result.error) {
            console.error("Server confirmation error:", result.error);
            toast.error(
              "Payment successful but order confirmation failed. Please contact support."
            );
          } else {
            toast.success("Payment successful!");
          }

          // Redirect to confirmation page
          setTimeout(() => {
            router.push(
              `/qr/${resolvedParams.tableId}/confirmation?order_id=${orderId}&payment=stripe&success=true`
            );
          }, 2000);
        } else if (paymentIntent.status === "processing") {
          setRetryCount((prev) => prev + 1);
          pollPaymentStatus(paymentIntentId, orderId);
        } else if (paymentIntent.status === "canceled") {
          setPaymentStatus("failed");
          setError("Payment was canceled. Please try again.");
          toast.error("Payment was canceled. Please try again.");
        } else {
          setPaymentStatus("failed");
          setError("Payment failed. Please try again.");
          toast.error("Payment failed. Please try again.");
        }
      } catch (error) {
        console.error("Error polling payment status:", error);
        setRetryCount((prev) => prev + 1);
        if (retryCount < maxRetries - 1) {
          pollPaymentStatus(paymentIntentId, orderId);
        } else {
          setPaymentStatus("failed");
          setError("Failed to check payment status. Please contact support.");
          toast.error(
            "Failed to check payment status. Please contact support."
          );
        }
      }
    }, 2000); // Poll every 2 seconds
  };

  const handleRetry = () => {
    setPaymentStatus("processing");
    setError(null);
    setRetryCount(0);
    window.location.reload();
  };

  const handleBackToMenu = () => {
    router.push(`/qr/${resolvedParams.tableId}`);
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full text-center"
      >
        {paymentStatus === "processing" && (
          <>
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Processing Payment
            </h1>
            <p className="text-gray-600 mb-8">
              Please wait while we process your payment...
            </p>
          </>
        )}

        {paymentStatus === "processing_payment" && (
          <>
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock className="w-8 h-8 text-amber-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Payment Processing
            </h1>
            <p className="text-gray-600 mb-4">
              Your payment is being processed. This may take a few moments...
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <div className="flex gap-1">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full ${
                      i < retryCount ? "bg-gray-400" : "bg-gray-200"
                    }`}
                  />
                ))}
              </div>
              <span>Checking status...</span>
            </div>
          </>
        )}

        {paymentStatus === "requires_action" && (
          <>
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield className="w-8 h-8 text-yellow-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Authentication Required
            </h1>
            <p className="text-gray-600 mb-8">
              {error ||
                "Additional verification is required to complete your payment."}
            </p>
            <div className="space-y-4">
              <Button onClick={handleRetry} className="w-full">
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              <Button
                variant="outline"
                onClick={handleBackToMenu}
                className="w-full"
              >
                Back to Menu
              </Button>
            </div>
          </>
        )}

        {paymentStatus === "success" && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Payment Successful!
            </h1>
            <p className="text-gray-600 mb-8">
              Your order has been confirmed and is being prepared.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-8">
              <CreditCard className="w-4 h-4" />
              <span>Redirecting to confirmation...</span>
            </div>
          </>
        )}

        {paymentStatus === "failed" && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Payment Failed
            </h1>
            <p className="text-gray-600 mb-8">
              {error || "We couldn't process your payment. Please try again."}
            </p>
            <div className="space-y-4">
              <Button onClick={handleRetry} className="w-full">
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              <Button
                variant="outline"
                onClick={handleBackToMenu}
                className="w-full"
              >
                Back to Menu
              </Button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
