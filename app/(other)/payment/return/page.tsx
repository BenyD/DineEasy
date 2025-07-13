"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  CheckCircle,
  XCircle,
  Loader2,
  Sparkles,
  CreditCard,
  Calendar,
  Zap,
  Shield,
  ArrowRight,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

interface PaymentStatus {
  status: "loading" | "success" | "failed" | "verifying";
  type:
    | "new_subscription"
    | "plan_upgrade"
    | "trial_upgrade"
    | "trial_end_payment"
    | "payment"
    | "unknown";
  message: string;
  plan?: string;
  interval?: string;
  currency?: string;
  isTrial?: boolean;
  trialDays?: number;
  error?: string;
  retryCount?: number;
}

export default function PaymentReturnPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>({
    status: "loading",
    type: "unknown",
    message: "Processing your payment...",
  });

  // Function to verify webhook processing
  const verifyWebhookProcessing = async (
    sessionId: string,
    retryCount = 0
  ): Promise<boolean> => {
    try {
      const supabase = createClient();

      // Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error("User not authenticated:", userError);
        return false;
      }

      // Check if subscription was created/updated in database
      const { data: restaurant, error: restaurantError } = await supabase
        .from("restaurants")
        .select(
          `
          id,
          subscription_status,
          subscriptions (
            id,
            stripe_subscription_id,
            plan,
            interval,
            status,
            created_at
          )
        `
        )
        .eq("owner_id", user.id)
        .single();

      if (restaurantError) {
        console.error("Error fetching restaurant:", restaurantError);
        return false;
      }

      // Check if we have an active subscription
      const hasActiveSubscription =
        restaurant.subscriptions &&
        restaurant.subscriptions.some(
          (sub: any) => sub.status === "active" || sub.status === "trialing"
        );

      if (hasActiveSubscription) {
        console.log("Webhook processing verified successfully");
        return true;
      }

      // If not found and we haven't exceeded retries, wait and retry
      if (retryCount < 3) {
        console.log(
          `Webhook not processed yet, retrying in 2 seconds... (attempt ${retryCount + 1})`
        );
        await new Promise((resolve) => setTimeout(resolve, 2000));
        return verifyWebhookProcessing(sessionId, retryCount + 1);
      }

      console.error("Webhook processing verification failed after retries");
      return false;
    } catch (error) {
      console.error("Error verifying webhook processing:", error);
      return false;
    }
  };

  useEffect(() => {
    const processPaymentReturn = async () => {
      try {
        // Get URL parameters
        const sessionId = searchParams.get("session_id");
        const paymentIntentId = searchParams.get("payment_intent");
        const redirectStatus = searchParams.get("redirect_status");
        const success = searchParams.get("success");
        const upgraded = searchParams.get("upgraded");
        const trialPreserved = searchParams.get("trial_preserved");
        const plan = searchParams.get("plan");
        const interval = searchParams.get("interval");
        const currency = searchParams.get("currency");
        const isNewSubscription = searchParams.get("isNewSubscription");
        const isUpgrade = searchParams.get("isUpgrade");

        // Determine payment type and status
        let status: PaymentStatus;

        // Handle direct upgrades (no checkout)
        if (upgraded === "true" && !sessionId) {
          status = {
            status: "success",
            type: trialPreserved === "true" ? "trial_upgrade" : "plan_upgrade",
            message:
              trialPreserved === "true"
                ? "Your plan has been upgraded successfully! Your trial period continues unchanged."
                : "Your plan has been upgraded successfully!",
            plan: plan || undefined,
            interval: interval || undefined,
            currency: currency || undefined,
            isTrial: trialPreserved === "true",
          };
        }
        // Handle Stripe checkout completion
        else if (sessionId || paymentIntentId) {
          // Check if payment was successful
          if (redirectStatus === "succeeded" || sessionId) {
            // Determine the type of payment
            const isUpgradePayment =
              upgraded === "true" || isUpgrade === "true";
            const isTrialUpgradePayment =
              isUpgradePayment && trialPreserved === "true";
            const isNewSubscriptionPayment =
              isNewSubscription === "true" ||
              (!isUpgradePayment && !isTrialUpgradePayment);

            status = {
              status: "verifying", // Start with verifying status
              type: isTrialUpgradePayment
                ? "trial_upgrade"
                : isUpgradePayment
                  ? "plan_upgrade"
                  : "new_subscription",
              message: "Verifying your payment was processed successfully...",
              plan: plan || undefined,
              interval: interval || undefined,
              currency: currency || undefined,
              isTrial: !isUpgradePayment, // Only new subscriptions are in trial (not upgrades)
              trialDays: isUpgradePayment ? undefined : 14,
            };

            setPaymentStatus(status);

            // Verify webhook processing
            if (sessionId) {
              const webhookVerified = await verifyWebhookProcessing(sessionId);

              if (webhookVerified) {
                status = {
                  ...status,
                  status: "success",
                  message: isTrialUpgradePayment
                    ? "Your plan has been upgraded successfully! Your trial period continues unchanged."
                    : isUpgradePayment
                      ? "Your plan has been upgraded successfully!"
                      : "Your subscription has been created successfully!",
                };
              } else {
                status = {
                  ...status,
                  status: "failed",
                  message:
                    "Payment was processed but there was an issue setting up your subscription. Please contact support.",
                  error: "webhook_processing_failed",
                };
              }
            } else {
              // For payment_intent cases, assume success
              status = {
                ...status,
                status: "success",
                message: "Payment processed successfully!",
              };
            }
          } else {
            status = {
              status: "failed",
              type: "payment",
              message: "Payment was not completed. Please try again.",
              error: "payment_failed",
            };
          }
        }
        // Handle trial end payments
        else if (searchParams.get("trial_end") === "true") {
          status = {
            status: "success",
            type: "trial_end_payment",
            message:
              "Your trial has ended and billing has started successfully!",
            plan: plan || undefined,
            interval: interval || undefined,
            currency: currency || undefined,
            isTrial: false,
          };
        }
        // Fallback for unknown scenarios
        else {
          status = {
            status: "failed",
            type: "unknown",
            message:
              "Unable to process payment information. Please contact support.",
            error: "unknown_scenario",
          };
        }

        setPaymentStatus(status);

        // Show appropriate toast
        if (status.status === "success") {
          if (status.type === "trial_upgrade") {
            toast.success(
              "🎉 Plan upgraded successfully! Your trial period continues unchanged."
            );
          } else if (status.type === "plan_upgrade") {
            toast.success(
              "🎉 Plan upgraded successfully! Your new features are now available."
            );
          } else if (status.type === "trial_end_payment") {
            toast.success(
              "✅ Billing started successfully! Your subscription is now active."
            );
          } else {
            toast.success(
              "🎉 Subscription created successfully! Welcome to DineEasy!"
            );
          }
        } else if (status.status === "failed") {
          toast.error(status.message);
        }

        // Auto-redirect after delay (only for success)
        if (status.status === "success") {
          setTimeout(() => {
            if (status.type === "new_subscription") {
              router.push("/setup/connect");
            } else if (
              status.type === "plan_upgrade" ||
              status.type === "trial_upgrade" ||
              status.type === "trial_end_payment"
            ) {
              router.push("/dashboard/billing");
            } else {
              router.push("/dashboard");
            }
          }, 5000);
        }
      } catch (error) {
        console.error("Error processing payment return:", error);
        setPaymentStatus({
          status: "failed",
          type: "unknown",
          message: "An error occurred while processing your payment.",
          error: "processing_error",
        });
        toast.error("An error occurred while processing your payment.");
      }
    };

    processPaymentReturn();
  }, [searchParams, router]);

  const getStatusIcon = () => {
    switch (paymentStatus.status) {
      case "loading":
        return <Loader2 className="h-8 w-8 animate-spin text-blue-600" />;
      case "verifying":
        return <RefreshCw className="h-8 w-8 animate-spin text-orange-600" />;
      case "success":
        return <CheckCircle className="h-8 w-8 text-green-600" />;
      case "failed":
        return <XCircle className="h-8 w-8 text-red-600" />;
    }
  };

  const getStatusTitle = () => {
    switch (paymentStatus.status) {
      case "loading":
        return "Processing Payment...";
      case "verifying":
        return "Verifying Payment...";
      case "success":
        if (paymentStatus.type === "trial_upgrade") {
          return "Plan Upgraded - Trial Preserved!";
        }
        if (paymentStatus.type === "plan_upgrade") {
          return "Plan Upgraded Successfully!";
        }
        if (paymentStatus.type === "trial_end_payment") {
          return "Billing Started Successfully!";
        }
        return "Payment Successful!";
      case "failed":
        return "Payment Failed";
    }
  };

  const getStatusColor = () => {
    switch (paymentStatus.status) {
      case "loading":
        return "text-blue-600";
      case "verifying":
        return "text-orange-600";
      case "success":
        return "text-green-600";
      case "failed":
        return "text-red-600";
    }
  };

  const getBackgroundGradient = () => {
    switch (paymentStatus.status) {
      case "loading":
        return "bg-gradient-to-br from-blue-50 to-indigo-100";
      case "verifying":
        return "bg-gradient-to-br from-orange-50 to-amber-100";
      case "success":
        return "bg-gradient-to-br from-green-50 to-emerald-100";
      case "failed":
        return "bg-gradient-to-br from-red-50 to-pink-100";
    }
  };

  const handleRetry = () => {
    setPaymentStatus((prev) => ({
      ...prev,
      status: "loading",
      message: "Retrying payment verification...",
    }));
    // Re-process the payment return
    window.location.reload();
  };

  return (
    <div
      className={`min-h-screen ${getBackgroundGradient()} flex items-center justify-center p-4`}
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-lg"
      >
        <Card className="text-center shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="flex justify-center mb-4"
            >
              {getStatusIcon()}
            </motion.div>
            <CardTitle className={`text-2xl font-bold ${getStatusColor()}`}>
              {getStatusTitle()}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-gray-600 text-lg"
            >
              {paymentStatus.message}
            </motion.p>

            {paymentStatus.status === "success" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-4"
              >
                {/* Plan Information */}
                {paymentStatus.plan && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Sparkles className="h-5 w-5 text-green-600" />
                      <span className="font-semibold text-green-800">
                        {paymentStatus.plan.charAt(0).toUpperCase() +
                          paymentStatus.plan.slice(1)}{" "}
                        Plan
                      </span>
                    </div>
                    <div className="text-sm text-green-700">
                      <p>
                        {paymentStatus.interval === "monthly"
                          ? "Monthly"
                          : "Yearly"}{" "}
                        billing
                      </p>
                      {paymentStatus.currency && (
                        <p className="text-xs mt-1">
                          Currency: {paymentStatus.currency.toUpperCase()}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Trial Information */}
                {paymentStatus.isTrial && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Calendar className="h-5 w-5 text-blue-600" />
                      <span className="font-semibold text-blue-800">
                        {paymentStatus.type === "trial_upgrade"
                          ? "Trial Period Continues"
                          : `${paymentStatus.trialDays || 14}-Day Free Trial`}
                      </span>
                    </div>
                    <p className="text-sm text-blue-700">
                      {paymentStatus.type === "trial_upgrade"
                        ? "Your trial period continues unchanged. No charges until your trial ends."
                        : "Your trial period is now active. No charges until your trial ends."}
                    </p>
                  </div>
                )}

                {/* Trial End Payment Information */}
                {paymentStatus.type === "trial_end_payment" && (
                  <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg p-4 border border-purple-200">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Calendar className="h-5 w-5 text-purple-600" />
                      <span className="font-semibold text-purple-800">
                        Trial Ended - Billing Active
                      </span>
                    </div>
                    <p className="text-sm text-purple-700">
                      Your trial period has ended and regular billing has
                      started. You'll be charged {paymentStatus.currency} for
                      your {paymentStatus.plan} plan.
                    </p>
                  </div>
                )}

                {/* Plan Upgrade Information (for non-trial upgrades) */}
                {!paymentStatus.isTrial &&
                  (paymentStatus.type === "plan_upgrade" ||
                    paymentStatus.type === "trial_upgrade") && (
                    <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-4 border border-orange-200">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Sparkles className="h-5 w-5 text-orange-600" />
                        <span className="font-semibold text-orange-800">
                          Plan Upgrade Complete
                        </span>
                      </div>
                      <p className="text-sm text-orange-700">
                        Your new plan is now active. You'll be charged at your
                        next billing cycle.
                      </p>
                    </div>
                  )}

                {/* Features Available */}
                <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg p-4 border border-purple-200">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <Zap className="h-5 w-5 text-purple-600" />
                    <span className="font-semibold text-purple-800">
                      {paymentStatus.type === "trial_upgrade"
                        ? "New Features Now Available"
                        : "Features Now Available"}
                    </span>
                  </div>
                  {paymentStatus.type === "trial_upgrade" && (
                    <p className="text-sm text-purple-600 mb-3 text-center">
                      ✨ Your trial period continues unchanged while you enjoy
                      new features!
                    </p>
                  )}
                  <div className="grid grid-cols-2 gap-2 text-sm text-purple-700">
                    <div className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      <span>QR Menus</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      <span>Order Management</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      <span>Analytics</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      <span>Staff Management</span>
                    </div>
                  </div>
                </div>

                {/* Security Badge */}
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                  <Shield className="h-4 w-4" />
                  <span>Payment secured by Stripe</span>
                </div>

                {/* Redirect Message */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600">
                    {paymentStatus.type === "new_subscription"
                      ? "You will be redirected to the next setup step in a few seconds..."
                      : paymentStatus.type === "plan_upgrade" ||
                          paymentStatus.type === "trial_upgrade" ||
                          paymentStatus.type === "trial_end_payment"
                        ? "You will be redirected to your billing page in a few seconds..."
                        : "You will be redirected to your dashboard in a few seconds..."}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  {paymentStatus.type === "new_subscription" ? (
                    <>
                      <Button
                        onClick={() => router.push("/setup/connect")}
                        className="w-full bg-green-600 hover:bg-green-700 text-white h-12 text-lg"
                      >
                        <CreditCard className="mr-2 h-5 w-5" />
                        Continue to Next Step
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>

                      <Button
                        onClick={() => router.push("/dashboard")}
                        variant="outline"
                        className="w-full"
                      >
                        Go to Dashboard
                      </Button>
                    </>
                  ) : paymentStatus.type === "plan_upgrade" ||
                    paymentStatus.type === "trial_upgrade" ||
                    paymentStatus.type === "trial_end_payment" ? (
                    <>
                      <Button
                        onClick={() => router.push("/dashboard/billing")}
                        className="w-full bg-green-600 hover:bg-green-700 text-white h-12 text-lg"
                      >
                        <CreditCard className="mr-2 h-5 w-5" />
                        View Billing Details
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>

                      <Button
                        onClick={() => router.push("/dashboard")}
                        variant="outline"
                        className="w-full"
                      >
                        Continue to Dashboard
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        onClick={() => router.push("/dashboard")}
                        className="w-full bg-green-600 hover:bg-green-700 text-white h-12 text-lg"
                      >
                        <CreditCard className="mr-2 h-5 w-5" />
                        Go to Dashboard
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>

                      <Button
                        onClick={() => router.push("/dashboard/billing")}
                        variant="outline"
                        className="w-full"
                      >
                        View Billing
                      </Button>
                    </>
                  )}
                </div>
              </motion.div>
            )}

            {paymentStatus.status === "failed" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-4"
              >
                {/* Error Details */}
                {paymentStatus.error && (
                  <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <span className="font-medium text-red-800">
                        Error Details
                      </span>
                    </div>
                    <p className="text-sm text-red-700">
                      {paymentStatus.error === "webhook_processing_failed"
                        ? "Payment was processed but there was an issue setting up your subscription. Our team has been notified."
                        : paymentStatus.error === "payment_failed"
                          ? "The payment was not completed. Please check your payment method and try again."
                          : "An unexpected error occurred. Please contact support for assistance."}
                    </p>
                  </div>
                )}

                <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                  <p className="text-sm text-red-700">
                    Don't worry! You can try again or contact our support team
                    for assistance.
                  </p>
                </div>

                <div className="space-y-3">
                  {paymentStatus.error === "webhook_processing_failed" && (
                    <Button
                      onClick={handleRetry}
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Retry Verification
                    </Button>
                  )}

                  <Button
                    onClick={() => router.back()}
                    variant="outline"
                    className="w-full"
                  >
                    Try Again
                  </Button>

                  <Button
                    onClick={() => router.push("/dashboard/billing")}
                    className="w-full"
                  >
                    Go to Billing
                  </Button>

                  <Button
                    onClick={() => router.push("/dashboard")}
                    variant="ghost"
                    className="w-full"
                  >
                    Go to Dashboard
                  </Button>
                </div>
              </motion.div>
            )}

            {paymentStatus.status === "loading" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-4"
              >
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <p className="text-sm text-blue-700">
                    Please wait while we process your payment and set up your
                    account...
                  </p>
                </div>

                <div className="flex justify-center">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Processing...</span>
                  </div>
                </div>
              </motion.div>
            )}

            {paymentStatus.status === "verifying" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-4"
              >
                <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                  <p className="text-sm text-orange-700">
                    Verifying that your payment was processed correctly...
                  </p>
                </div>

                <div className="flex justify-center">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Verifying...</span>
                  </div>
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
