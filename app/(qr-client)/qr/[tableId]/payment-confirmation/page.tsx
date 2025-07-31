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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  confirmQRPayment,
  handleFailedPayment,
  getQROrderDetails,
} from "@/lib/actions/qr-payments";
import { loadStripe } from "@stripe/stripe-js";

// Initialize Stripe
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

// Debug: Check if Stripe key is loaded
console.log("Stripe configuration:", {
  hasKey: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  keyLength: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.length,
  keyPrefix:
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.substring(0, 10) + "...",
  keyStartsWithPk:
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.startsWith("pk_"),
  environment: process.env.NODE_ENV,
});

// Validate Stripe key
if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
  console.error("❌ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set");
} else if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.startsWith("pk_")) {
  console.error(
    "❌ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY does not start with 'pk_'"
  );
} else {
  console.log("✅ Stripe publishable key is properly configured");
}

export default function PaymentConfirmationPage({
  params,
}: {
  params: Promise<{ tableId: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { clearCart } = useCart();
  const searchParams = useSearchParams();

  const [paymentStatus, setPaymentStatus] = useState<
    | "processing"
    | "success"
    | "failed"
    | "requires_action"
    | "processing_payment"
  >("processing");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [hasProcessed, setHasProcessed] = useState(false);
  const [maxRetries] = useState(3);
  const [retryDelay, setRetryDelay] = useState(2000); // Start with 2 seconds
  const [isRetrying, setIsRetrying] = useState(false);
  const [paymentValidation, setPaymentValidation] = useState<{
    isValid: boolean;
    orderId: string;
    tableId: string;
  } | null>(null);

  // Main payment processing effect
  useEffect(() => {
    const clientSecret = searchParams?.get("client_secret");
    const orderIdParam = searchParams?.get("order_id");

    // Validate required parameters
    if (!clientSecret || !orderIdParam) {
      console.error("Missing payment parameters:", {
        hasClientSecret: !!clientSecret,
        hasOrderId: !!orderIdParam,
      });
      setPaymentStatus("failed");
      setError("Invalid payment parameters. Please try again.");
      return;
    }

    // Prevent multiple processing attempts using sessionStorage
    const processingKey = `payment_processing_${orderIdParam}`;
    const isAlreadyProcessing = sessionStorage.getItem(processingKey);

    if (isAlreadyProcessing) {
      console.log("Payment already being processed, skipping");
      return;
    }

    // Mark as processing
    sessionStorage.setItem(processingKey, "true");
    setHasProcessed(true);
    setOrderId(orderIdParam);

    // Validate payment intent before processing
    validatePaymentIntent(clientSecret, orderIdParam, resolvedParams.tableId);
  }, [searchParams, resolvedParams.tableId]);

  // Validate payment intent belongs to correct order and table
  const validatePaymentIntent = async (
    clientSecret: string,
    orderIdParam: string,
    tableId: string
  ) => {
    try {
      console.log("Validating payment intent:", {
        orderId: orderIdParam,
        tableId: tableId,
        clientSecretLength: clientSecret?.length,
      });

      // Call server to validate payment intent
      const response = await fetch("/api/qr/validate-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientSecret,
          orderId: orderIdParam,
          tableId: tableId,
        }),
      });

      const validationResult = await response.json();

      if (!validationResult.success) {
        console.error("Payment validation failed:", validationResult.error);
        setPaymentStatus("failed");
        setError(
          validationResult.error || "Invalid payment. Please try again."
        );
        sessionStorage.removeItem(`payment_processing_${orderIdParam}`);
        return;
      }

      setPaymentValidation({
        isValid: true,
        orderId: orderIdParam,
        tableId: tableId,
      });

      // Process payment with retry logic
      processPaymentWithRetry(clientSecret, orderIdParam);
    } catch (error: any) {
      console.error("Payment validation error:", error);
      setPaymentStatus("failed");
      setError("Payment validation failed. Please try again.");
      sessionStorage.removeItem(`payment_processing_${orderIdParam}`);
    }
  };

  const processPaymentWithRetry = async (
    clientSecret: string,
    orderIdParam: string
  ) => {
    let attempt = 0;
    const maxAttempts = 3;

    while (attempt < maxAttempts) {
      try {
        console.log(`Payment processing attempt ${attempt + 1}/${maxAttempts}`);

        if (attempt > 0) {
          setIsRetrying(true);
          setPaymentStatus("processing");
          // Exponential backoff
          const delay = Math.min(2000 * Math.pow(2, attempt - 1), 10000);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }

        await processPayment(clientSecret, orderIdParam);
        setIsRetrying(false);
        return; // Success, exit retry loop
      } catch (error: any) {
        attempt++;
        // Properly serialize the error for logging
        const errorDetails = {
          message: error?.message || "Unknown error",
          name: error?.name || "UnknownError",
          stack: error?.stack ? error.stack.split("\n")[0] : "No stack trace",
          attempt: attempt,
        };
        console.error(
          `Payment processing attempt ${attempt} failed:`,
          errorDetails
        );

        if (attempt >= maxAttempts) {
          console.error("All payment processing attempts failed");
          setIsRetrying(false);
          handlePaymentFailure(
            orderIdParam,
            error?.message ||
              "Payment processing failed after multiple attempts"
          );
          return;
        }

        // Continue to next attempt
        console.log(
          `Retrying payment processing in ${Math.min(2000 * Math.pow(2, attempt - 1), 10000)}ms`
        );
      }
    }
  };

  const processPayment = async (clientSecret: string, orderIdParam: string) => {
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error("Payment processing timeout"));
      }, 30000); // 30 second timeout
    });

    try {
      const result = await Promise.race([
        processPaymentInternal(clientSecret, orderIdParam),
        timeoutPromise,
      ]);
      return result;
    } catch (error: any) {
      if (error.message === "Payment processing timeout") {
        console.error("Payment processing timed out");
        handlePaymentFailure(
          orderIdParam,
          "Payment processing timed out. Please try again."
        );
      } else {
        throw error; // Re-throw other errors for retry logic
      }
    }
  };

  const processPaymentInternal = async (
    clientSecret: string,
    orderIdParam: string
  ) => {
    console.log("Processing payment internally:", {
      orderId: orderIdParam,
      clientSecretLength: clientSecret?.length,
      clientSecretPrefix: clientSecret?.substring(0, 20) + "...",
    });

    try {
      // Step 1: Verify order exists
      console.log("Step 1: Verifying order exists...");
      const orderCheck = await verifyOrderExists(orderIdParam);
      if (!orderCheck.success) {
        console.error("Order verification failed:", orderCheck.error);
        handlePaymentFailure(
          orderIdParam,
          orderCheck.error || "Order not found"
        );
        return;
      }
      console.log("✅ Order verification successful");

      // Step 2: Initialize Stripe
      console.log("Step 2: Initializing Stripe...");
      const stripeInstance = await stripePromise;
      if (!stripeInstance) {
        console.error("Failed to initialize Stripe");
        handlePaymentFailure(
          orderIdParam,
          "Failed to initialize payment system"
        );
        return;
      }

      console.log("✅ Stripe initialized successfully:", {
        hasStripe: !!stripeInstance,
        stripeType: typeof stripeInstance,
        hasConfirmPayment: !!stripeInstance?.confirmPayment,
        hasRetrievePaymentIntent: !!stripeInstance?.retrievePaymentIntent,
      });

      // Step 3: Retrieve payment intent
      console.log("Step 3: Retrieving payment intent...");
      const paymentIntent = await retrievePaymentIntent(
        stripeInstance,
        clientSecret,
        orderIdParam
      );

      if (!paymentIntent) {
        console.error("Failed to retrieve payment intent");
        handlePaymentFailure(
          orderIdParam,
          "Failed to retrieve payment information"
        );
        return;
      }

      console.log("✅ Payment intent retrieved:", {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        transferData: paymentIntent.transfer_data,
        applicationFee: paymentIntent.application_fee_amount,
      });

      // Step 4: Handle payment intent status
      console.log("Step 4: Handling payment intent status...");
      await handlePaymentIntentStatus(
        paymentIntent,
        orderIdParam,
        stripeInstance,
        clientSecret
      );
    } catch (error: any) {
      // Debug: Log the raw error object to see what we're dealing with
      console.log("Raw error object:", {
        error: error,
        errorType: typeof error,
        errorKeys: error ? Object.keys(error) : "no keys",
        errorMessage: error?.message,
        errorName: error?.name,
        errorStack: error?.stack ? error.stack.split("\n")[0] : "no stack",
      });

      // Properly serialize the error for logging
      const errorDetails = {
        message: error?.message || "Unknown error",
        name: error?.name || "UnknownError",
        stack: error?.stack ? error.stack.split("\n")[0] : "No stack trace",
        orderId: orderIdParam,
      };
      console.error("Payment processing error:", errorDetails);

      // Ensure we have a valid error message
      const errorMessage = error?.message || "Payment processing failed";
      console.log("Calling handlePaymentFailure with:", {
        orderIdParam,
        errorMessage,
        errorMessageType: typeof errorMessage,
        errorMessageLength: errorMessage.length,
      });

      handlePaymentFailure(orderIdParam, errorMessage);
    }
  };

  const verifyOrderExists = async (
    orderIdParam: string
  ): Promise<{ success: boolean; error?: string }> => {
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise<{ success: boolean; error?: string }>(
      (resolve) => {
        setTimeout(() => {
          resolve({ success: false, error: "Order verification timeout" });
        }, 10000); // 10 second timeout
      }
    );

    try {
      const result = await Promise.race([
        verifyOrderExistsInternal(orderIdParam),
        timeoutPromise,
      ]);
      return result;
    } catch (error: any) {
      // Properly serialize the error for logging
      const errorDetails = {
        message: error?.message || "Unknown error",
        name: error?.name || "UnknownError",
        stack: error?.stack ? error.stack.split("\n")[0] : "No stack trace",
      };
      console.error("Error in verifyOrderExists:", errorDetails);
      return { success: false, error: "Order verification failed" };
    }
  };

  const verifyOrderExistsInternal = async (
    orderIdParam: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      // Validate order ID format
      if (!orderIdParam || orderIdParam.length !== 36) {
        return { success: false, error: "Invalid order ID format" };
      }

      const orderDetails = await getQROrderDetails(orderIdParam);

      if (orderDetails.error || !orderDetails.order) {
        // Check if we're returning from Stripe payment
        const isReturnFromStripe = searchParams.get("payment") === "stripe";

        if (isReturnFromStripe) {
          console.log(
            "Returning from Stripe payment, continuing with payment intent check"
          );
          return { success: true }; // Continue processing
        } else {
          // Provide more specific error message based on the error
          if (orderDetails.error === "Order not found") {
            return {
              success: false,
              error:
                "Order was not found. It may have been cancelled or cleaned up. Please try placing your order again.",
            };
          } else if (orderDetails.error === "Database error") {
            return {
              success: false,
              error:
                "Unable to verify order due to a system error. Please try again.",
            };
          } else {
            return {
              success: false,
              error: orderDetails.error || "Order verification failed",
            };
          }
        }
      }

      // Check if order is in a terminal state that should prevent further processing
      if (orderDetails.order.status === "cancelled") {
        console.log("Order is cancelled, checking if we should continue:", {
          orderId: orderIdParam,
          status: orderDetails.order.status,
        });

        // If returning from Stripe, we should still check the payment intent
        const isReturnFromStripe = searchParams.get("payment") === "stripe";
        if (isReturnFromStripe) {
          console.log(
            "Order is cancelled but returning from Stripe, continuing with payment intent check"
          );
          return { success: true }; // Continue processing
        } else {
          return { success: false, error: "Order has been cancelled" };
        }
      }

      console.log("Order verified:", {
        orderId: orderIdParam,
        status: orderDetails.order.status,
      });
      return { success: true };
    } catch (error: any) {
      // Properly serialize the error for logging
      const errorDetails = {
        message: error?.message || "Unknown error",
        name: error?.name || "UnknownError",
        stack: error?.stack ? error.stack.split("\n")[0] : "No stack trace",
        orderId: orderIdParam,
      };
      console.error("Order verification error:", errorDetails);
      return { success: false, error: "Unable to verify order" };
    }
  };

  const retrievePaymentIntent = async (
    stripeInstance: any,
    clientSecret: string,
    orderIdParam: string
  ) => {
    try {
      console.log("Retrieving payment intent with:", {
        clientSecretLength: clientSecret?.length,
        clientSecretPrefix: clientSecret?.substring(0, 20) + "...",
        stripeInstanceType: typeof stripeInstance,
        hasRetrievePaymentIntent: !!stripeInstance?.retrievePaymentIntent,
      });

      const result = await stripeInstance.retrievePaymentIntent(clientSecret);

      console.log("Stripe retrievePaymentIntent result:", {
        hasResult: !!result,
        resultType: typeof result,
        resultKeys: result ? Object.keys(result) : "no keys",
        hasPaymentIntent: !!result?.paymentIntent,
        paymentIntentStatus: result?.paymentIntent?.status,
        paymentIntentId: result?.paymentIntent?.id,
      });

      const paymentIntent = result.paymentIntent;

      console.log("Payment intent retrieved:", {
        status: paymentIntent?.status,
        id: paymentIntent?.id,
        amount: paymentIntent?.amount,
        currency: paymentIntent?.currency,
      });

      if (!paymentIntent) {
        console.error("No payment intent found in result");
        handlePaymentFailure(orderIdParam, "Payment information not found");
        return null;
      }

      return paymentIntent;
    } catch (error: any) {
      // Properly serialize the error for logging
      const errorDetails = {
        message: error?.message || "Unknown error",
        name: error?.name || "UnknownError",
        stack: error?.stack ? error.stack.split("\n")[0] : "No stack trace",
        orderId: orderIdParam,
      };
      console.error("Error retrieving payment intent:", errorDetails);
      handlePaymentFailure(
        orderIdParam,
        error?.message || "Failed to retrieve payment information"
      );
      return null;
    }
  };

  const handlePaymentIntentStatus = async (
    paymentIntent: any,
    orderIdParam: string,
    stripeInstance: any,
    clientSecret: string
  ) => {
    console.log("Handling payment intent status:", paymentIntent.status);

    switch (paymentIntent.status) {
      case "succeeded":
        await handleSuccessfulPayment(orderIdParam);
        break;

      case "processing":
        setPaymentStatus("processing_payment");
        pollPaymentStatus(paymentIntent.id, orderIdParam);
        break;

      case "requires_payment_method":
        await handleRequiresPaymentMethod(
          stripeInstance,
          clientSecret,
          orderIdParam
        );
        break;

      case "requires_action":
        setPaymentStatus("requires_action");
        setError("Payment requires additional authentication");
        break;

      case "canceled":
        handlePaymentFailure(orderIdParam, "Payment was canceled");
        break;

      default:
        handlePaymentFailure(
          orderIdParam,
          `Payment failed with status: ${paymentIntent.status}`
        );
        break;
    }
  };

  const handleSuccessfulPayment = async (orderIdParam: string) => {
    setPaymentStatus("success");
    clearCart();

    try {
      const result = await confirmQRPayment(orderIdParam);
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
          `/qr/${resolvedParams.tableId}/confirmation?order_id=${orderIdParam}&payment=stripe&success=true`
        );
      }, 2000);
    } catch (error: any) {
      // Properly serialize the error for logging
      const errorDetails = {
        message: error?.message || "Unknown error",
        name: error?.name || "UnknownError",
        stack: error?.stack ? error.stack.split("\n")[0] : "No stack trace",
        orderId: orderIdParam,
      };
      console.error("Error confirming payment:", errorDetails);
      handlePaymentFailure(
        orderIdParam,
        error?.message || "Failed to confirm payment"
      );
    }
  };

  const handleRequiresPaymentMethod = async (
    stripeInstance: any,
    clientSecret: string,
    orderIdParam: string
  ) => {
    console.log(
      "Payment requires payment method, redirecting to Stripe hosted payment page"
    );
    console.log("Stripe instance:", {
      hasStripe: !!stripeInstance,
      stripeType: typeof stripeInstance,
      hasConfirmPayment: !!stripeInstance?.confirmPayment,
    });
    console.log("Client secret:", {
      hasSecret: !!clientSecret,
      secretLength: clientSecret?.length,
      secretPrefix: clientSecret?.substring(0, 20) + "...",
    });

    setPaymentStatus("processing_payment");

    try {
      // For requires_payment_method status, we need to redirect to Stripe's hosted payment page
      console.log("Preparing to redirect to Stripe hosted payment page");

      // Use the redirect method to go to Stripe's hosted payment page
      const { error: redirectError } = await stripeInstance.confirmPayment({
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/qr/${resolvedParams.tableId}/confirmation?order_id=${orderIdParam}&payment=stripe`,
        },
        redirect: "if_required", // This should trigger the redirect
      });

      console.log("confirmPayment result:", {
        hasError: !!redirectError,
        errorType: redirectError?.type,
        errorMessage: redirectError?.message,
      });

      if (redirectError) {
        // Properly serialize the Stripe error
        const errorDetails = {
          message: redirectError.message || "Unknown Stripe error",
          type: redirectError.type || "unknown",
          code: redirectError.code || "unknown",
          decline_code: redirectError.decline_code || "none",
          param: redirectError.param || "none",
        };

        console.error("Stripe redirect error:", errorDetails);
        handlePaymentFailure(
          orderIdParam,
          redirectError.message || "Payment redirect failed"
        );
        return;
      }

      // If we reach here, the redirect should have happened
      console.log("Redirect to Stripe should have happened");

      // Add fallback for redirect - if we're still here after 1 second, show error
      setTimeout(() => {
        if (paymentStatus === "processing_payment") {
          console.log("Redirect fallback triggered - redirect may have failed");
          setPaymentStatus("failed");
          setError(
            "Payment page didn't load. Please try again or contact support."
          );
          toast.error(
            "Payment page didn't load. Please try again or contact support."
          );
        }
      }, 1000); // Very short timeout since redirect should be immediate
    } catch (error: any) {
      // Properly serialize the caught error
      const errorDetails = {
        message: error?.message || "Unknown error",
        name: error?.name || "UnknownError",
        stack: error?.stack ? error.stack.split("\n")[0] : "No stack trace",
      };

      console.error("Stripe payment redirect error:", errorDetails);
      handlePaymentFailure(
        orderIdParam,
        error?.message || "Payment redirect failed"
      );
    }
  };

  const handlePaymentFailure = async (
    orderIdParam: string,
    errorMessage: string
  ) => {
    // Debug: Log what we received
    console.log("handlePaymentFailure called with:", {
      orderIdParam,
      errorMessage,
      errorMessageType: typeof errorMessage,
      errorMessageLength: errorMessage?.length || 0,
      errorMessageIsEmpty: !errorMessage || errorMessage.trim() === "",
    });

    // Ensure we have a valid error message
    const finalErrorMessage = errorMessage?.trim() || "Payment failed";

    // Create a structured error object for logging
    const failureDetails = {
      orderId: orderIdParam,
      errorMessage: finalErrorMessage,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
    };

    console.error("Payment failure:", failureDetails);

    try {
      await handleFailedPayment(orderIdParam, finalErrorMessage);
    } catch (cleanupError: any) {
      // Properly serialize cleanup error
      const cleanupErrorDetails = {
        message: cleanupError?.message || "Unknown cleanup error",
        name: cleanupError?.name || "UnknownError",
        stack: cleanupError?.stack
          ? cleanupError.stack.split("\n")[0]
          : "No stack trace",
      };

      console.error("Error during cleanup:", cleanupErrorDetails);
    }

    setPaymentStatus("failed");
    setError(finalErrorMessage);
    toast.error(finalErrorMessage);
  };

  const pollPaymentStatus = async (
    paymentIntentId: string,
    orderId: string
  ) => {
    if (retryCount >= maxRetries) {
      handlePaymentFailure(orderId, "Payment timeout");
      return;
    }

    setTimeout(async () => {
      try {
        const stripeInstance = await stripePromise;
        if (!stripeInstance) {
          handlePaymentFailure(orderId, "Failed to load payment system");
          return;
        }

        const result =
          await stripeInstance.retrievePaymentIntent(paymentIntentId);
        const paymentIntent = result.paymentIntent;

        if (!paymentIntent) {
          handlePaymentFailure(orderId, "Payment information not found");
          return;
        }

        console.log("Polling payment status:", paymentIntent.status);

        if (paymentIntent.status === "succeeded") {
          await handleSuccessfulPayment(orderId);
        } else if (paymentIntent.status === "canceled") {
          handlePaymentFailure(orderId, "Payment was canceled");
        } else if (paymentIntent.status === "requires_payment_method") {
          handlePaymentFailure(orderId, "Payment method required");
        } else {
          // Continue polling
          setRetryCount((prev) => prev + 1);
          pollPaymentStatus(paymentIntentId, orderId);
        }
      } catch (error: any) {
        // Properly serialize the error for logging
        const errorDetails = {
          message: error?.message || "Unknown error",
          name: error?.name || "UnknownError",
          stack: error?.stack ? error.stack.split("\n")[0] : "No stack trace",
          orderId: orderId,
          retryCount: retryCount,
        };
        console.error("Error polling payment status:", errorDetails);
        handlePaymentFailure(orderId, "Payment status check failed");
      }
    }, 2000);
  };

  const handleRetry = () => {
    setRetryCount(0);
    setPaymentStatus("processing");
    setError(null);
    setHasProcessed(false);
    setIsRetrying(false);
    setRetryDelay(2000); // Reset retry delay
  };

  const handleBackToMenu = () => {
    router.push(`/qr/${resolvedParams.tableId}`);
  };

  // Enhanced retry with exponential backoff
  const handleRetryWithBackoff = async () => {
    if (isRetrying) return; // Prevent multiple retries

    setIsRetrying(true);
    setRetryCount((prev) => prev + 1);

    if (retryCount >= maxRetries) {
      setError("Maximum retry attempts reached. Please try again later.");
      setIsRetrying(false);
      return;
    }

    // Exponential backoff
    const delay = Math.min(2000 * Math.pow(2, retryCount), 10000);
    setRetryDelay(delay);

    console.log(
      `Retrying payment with ${delay}ms delay (attempt ${retryCount + 1}/${maxRetries})`
    );

    setTimeout(() => {
      setPaymentStatus("processing");
      setError(null);
      setHasProcessed(false);
      setIsRetrying(false);
    }, delay);
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
              {isRetrying ? "Retrying Payment" : "Processing Payment"}
            </h1>
            <p className="text-gray-600 mb-4">
              {isRetrying
                ? `Attempt ${retryCount + 1}/${maxRetries} - Please wait...`
                : "Please wait while we process your payment..."}
            </p>
            {isRetrying && (
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-4">
                <div className="flex gap-1">
                  {[...Array(maxRetries)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full ${
                        i < retryCount ? "bg-blue-400" : "bg-gray-200"
                      }`}
                    />
                  ))}
                </div>
                <span>Retrying...</span>
              </div>
            )}
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
              <Button onClick={handleRetryWithBackoff} className="w-full">
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
            <p className="text-gray-600 mb-6">
              Your order has been confirmed and is being prepared.
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 text-green-700 mb-2">
                <Clock className="w-4 h-4" />
                <span className="font-medium">Track Your Order</span>
              </div>
              <p className="text-sm text-green-600">
                You'll be redirected to the order tracking page where you can
                see real-time updates of your order status.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-8">
              <CreditCard className="w-4 h-4" />
              <span>Redirecting to order tracking...</span>
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
              <Button onClick={handleRetryWithBackoff} className="w-full">
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
              {error?.includes("Order was not found") && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> Your order may have been
                    automatically cleaned up. You can safely return to the menu
                    and place a new order.
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
