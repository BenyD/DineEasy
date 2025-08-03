"use client";

import { useEffect, useState, useCallback } from "react";
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
import { clearOnboardingProgress } from "@/lib/utils";

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
  const [isRetrying, setIsRetrying] = useState(false);

  // Function to verify webhook processing
  const verifyWebhookProcessing = async (
    sessionId: string,
    retryCount = 0
  ): Promise<boolean> => {
    // Define valid statuses at the top of the function
    const validStatuses = [
      "active",
      "trialing",
      "past_due",
      "incomplete",
      "incomplete_expired",
    ];

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

      console.log(
        `🔍 Verifying webhook processing (attempt ${retryCount + 1}/4):`,
        {
          sessionId,
          userId: user.id,
        }
      );

      // Check if subscription was created/updated in database
      const { data: restaurant, error: restaurantError } = await supabase
        .from("restaurants")
        .select(
          `
          id,
          subscription_status,
          stripe_customer_id,
          subscriptions (
            id,
            stripe_subscription_id,
            plan,
            interval,
            status,
            created_at,
            updated_at
          )
        `
        )
        .eq("owner_id", user.id)
        .single();

      if (restaurantError) {
        console.error("Error fetching restaurant:", restaurantError);
        return false;
      }

      console.log("📊 Restaurant data found:", {
        restaurantId: restaurant.id,
        subscriptionStatus: restaurant.subscription_status,
        stripeCustomerId: restaurant.stripe_customer_id,
        subscriptionCount: restaurant.subscriptions?.length || 0,
      });

      // Check if we have any subscription records
      if (restaurant.subscriptions && restaurant.subscriptions.length > 0) {
        console.log(
          "📋 Subscriptions found:",
          restaurant.subscriptions.map((sub: any) => ({
            id: sub.id,
            stripeId: sub.stripe_subscription_id,
            status: sub.status,
            plan: sub.plan,
            interval: sub.interval,
            createdAt: sub.created_at,
            updatedAt: sub.updated_at,
          }))
        );

        const hasValidSubscription = restaurant.subscriptions.some((sub: any) =>
          validStatuses.includes(sub.status)
        );

        if (hasValidSubscription) {
          console.log(
            "✅ Webhook processing verified successfully - valid subscription found"
          );
          return true;
        } else {
          console.log(
            "⚠️ Subscriptions found but none have valid status:",
            restaurant.subscriptions.map((sub: any) => sub.status)
          );
        }
      } else {
        console.log("📭 No subscriptions found in database yet");
      }

      // Check restaurant subscription status as fallback
      if (
        restaurant.subscription_status &&
        validStatuses.includes(restaurant.subscription_status)
      ) {
        console.log(
          "✅ Webhook processing verified via restaurant subscription status:",
          restaurant.subscription_status
        );
        return true;
      }

      // If not found and we haven't exceeded retries, wait and retry
      if (retryCount < 3) {
        const waitTime = Math.pow(2, retryCount + 1) * 1000; // Exponential backoff: 2s, 4s, 8s
        console.log(
          `⏳ Webhook not processed yet, retrying in ${waitTime / 1000} seconds... (attempt ${retryCount + 1}/4)`
        );
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        return verifyWebhookProcessing(sessionId, retryCount + 1);
      }

      console.error(
        "❌ Webhook processing verification failed after all retries"
      );
      return false;
    } catch (error) {
      console.error("❌ Error verifying webhook processing:", error);
      return false;
    }
  };

  // Enhanced verification function that also checks Stripe directly
  const enhancedVerifyWebhookProcessing = useCallback(
    async (
      sessionId: string,
      retryCount = 0
    ): Promise<{ success: boolean; reason: string; stripeData?: any }> => {
      try {
        const supabase = createClient();

        // Get current user
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
        if (userError || !user) {
          return { success: false, reason: "User not authenticated" };
        }

        console.log(`🔍 Enhanced verification (attempt ${retryCount + 1}/4):`, {
          sessionId,
          userId: user.id,
        });

        // First, check database
        const { data: restaurant, error: restaurantError } = await supabase
          .from("restaurants")
          .select(
            `
          id,
          subscription_status,
          stripe_customer_id,
          subscriptions (
            id,
            stripe_subscription_id,
            plan,
            interval,
            status,
            created_at,
            updated_at
          )
        `
          )
          .eq("owner_id", user.id)
          .single();

        if (restaurantError) {
          return { success: false, reason: "Error fetching restaurant data" };
        }

        // Check database first
        const validStatuses = [
          "active",
          "trialing",
          "past_due",
          "incomplete",
          "incomplete_expired",
        ];

        if (restaurant.subscriptions && restaurant.subscriptions.length > 0) {
          const hasValidSubscription = restaurant.subscriptions.some(
            (sub: any) => validStatuses.includes(sub.status)
          );

          if (hasValidSubscription) {
            return {
              success: true,
              reason: "Valid subscription found in database",
              stripeData: restaurant.subscriptions,
            };
          }
        }

        // Check restaurant subscription status
        if (
          restaurant.subscription_status &&
          validStatuses.includes(restaurant.subscription_status)
        ) {
          return {
            success: true,
            reason: "Valid subscription status found in restaurant record",
            stripeData: { status: restaurant.subscription_status },
          };
        }

        // If we have a session ID, try to check Stripe directly and sync if needed
        if (sessionId && retryCount >= 1) {
          // Check Stripe on retry attempts
          try {
            console.log("🔍 Checking Stripe directly for session:", sessionId);

            // Make a server-side call to check the session and sync if needed
            const response = await fetch("/api/stripe/check-session", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                sessionId,
                syncToDatabase: true, // Flag to sync subscription to database
                restaurantId: restaurant.id,
              }),
            });

            if (response.ok) {
              const stripeData = await response.json();
              if (stripeData.success) {
                return {
                  success: true,
                  reason: stripeData.synced
                    ? "Subscription synced from Stripe"
                    : "Session verified with Stripe",
                  stripeData: stripeData.data,
                };
              } else if (stripeData.error) {
                console.log("Stripe check failed:", stripeData.error);
              }
            }
          } catch (stripeError) {
            console.error("Error checking Stripe directly:", stripeError);
          }
        }

        // If not found and we haven't exceeded retries, wait and retry
        if (retryCount < 3) {
          const waitTime = Math.pow(2, retryCount + 1) * 1000;
          console.log(`⏳ Waiting ${waitTime / 1000}s before retry...`);
          await new Promise((resolve) => setTimeout(resolve, waitTime));
          return enhancedVerifyWebhookProcessing(sessionId, retryCount + 1);
        }

        return {
          success: false,
          reason: "Verification failed after all retries",
        };
      } catch (error) {
        console.error("❌ Error in enhanced verification:", error);
        return {
          success: false,
          reason: "Verification error: " + (error as Error).message,
        };
      }
    },
    []
  );

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
              console.log(
                "🔍 Starting initial webhook verification for session:",
                sessionId
              );

              const verificationResult =
                await enhancedVerifyWebhookProcessing(sessionId);

              console.log(
                "📊 Initial verification result:",
                verificationResult
              );

              if (verificationResult.success) {
                console.log(
                  "✅ Initial verification successful:",
                  verificationResult.reason
                );

                status = {
                  ...status,
                  status: "success",
                  message: verificationResult.reason.includes("synced")
                    ? "Your subscription has been successfully synced from Stripe! Your payment was processed correctly."
                    : isTrialUpgradePayment
                      ? "Your plan has been upgraded successfully! Your trial period continues unchanged."
                      : isUpgradePayment
                        ? "Your plan has been upgraded successfully!"
                        : "Your subscription has been created successfully!",
                };
              } else {
                console.log(
                  "❌ Initial verification failed:",
                  verificationResult.reason
                );

                status = {
                  ...status,
                  status: "failed",
                  message: `Payment was processed but there was an issue setting up your subscription: ${verificationResult.reason}. Please try retry verification or contact support.`,
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
            // Clear onboarding progress for new subscriptions
            clearOnboardingProgress();
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
  }, [searchParams, router, enhancedVerifyWebhookProcessing]);

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

  const handleRetry = async () => {
    setIsRetrying(true);
    setPaymentStatus((prev) => ({
      ...prev,
      status: "verifying",
      message: "Retrying payment verification...",
      retryCount: (prev.retryCount || 0) + 1,
    }));

    try {
      // Get the session ID from URL params
      const sessionId = searchParams.get("session_id");

      if (sessionId) {
        console.log("🔄 Starting retry verification for session:", sessionId);

        // Retry webhook verification with enhanced function
        const verificationResult =
          await enhancedVerifyWebhookProcessing(sessionId);

        console.log("📊 Verification result:", verificationResult);

        if (verificationResult.success) {
          console.log(
            "✅ Retry verification successful:",
            verificationResult.reason
          );

          setPaymentStatus((prev) => ({
            ...prev,
            status: "success",
            message: verificationResult.reason.includes("synced")
              ? "Your subscription has been successfully synced from Stripe! Your payment was processed correctly."
              : prev.type === "trial_upgrade"
                ? "Your plan has been upgraded successfully! Your trial period continues unchanged."
                : prev.type === "plan_upgrade"
                  ? "Your plan has been upgraded successfully!"
                  : "Your subscription has been created successfully!",
          }));

          toast.success(
            verificationResult.reason.includes("synced")
              ? "Subscription synced successfully!"
              : "Payment verification successful!"
          );

          // Auto-redirect after success
          setTimeout(() => {
            if (paymentStatus.type === "new_subscription") {
              router.push("/setup/connect");
            } else {
              router.push("/dashboard/billing");
            }
          }, 3000);
        } else {
          console.log(
            "❌ Retry verification failed:",
            verificationResult.reason
          );

          setPaymentStatus((prev) => ({
            ...prev,
            status: "failed",
            message: `Verification failed: ${verificationResult.reason}. Please try again or contact support.`,
            error: "verification_failed",
          }));
          toast.error("Verification failed. Please try again.");
        }
      } else {
        console.log("⚠️ No session ID found, redirecting to billing");
        // No session ID, redirect to billing to retry payment
        router.push("/dashboard/billing");
      }
    } catch (error) {
      console.error("❌ Error during retry:", error);
      setPaymentStatus((prev) => ({
        ...prev,
        status: "failed",
        message: "An error occurred during retry. Please try again.",
        error: "retry_error",
      }));
      toast.error("Retry failed. Please try again.");
    } finally {
      setIsRetrying(false);
    }
  };

  const handleTryAgain = async () => {
    setIsRetrying(true);

    try {
      // Get the current URL parameters to preserve them
      const currentParams = new URLSearchParams(searchParams.toString());

      // Determine where to redirect based on the error type
      if (
        paymentStatus.error === "webhook_processing_failed" ||
        paymentStatus.error === "verification_failed"
      ) {
        // For webhook/verification issues, try the same payment flow again
        const sessionId = searchParams.get("session_id");
        if (sessionId) {
          // Retry the same session
          await handleRetry();
          return; // handleRetry will handle the state
        } else {
          // Go to billing to retry
          router.push("/dashboard/billing");
        }
      } else if (paymentStatus.error === "payment_failed") {
        // For payment failures, go back to the payment page
        const returnUrl =
          searchParams.get("return_url") || "/dashboard/billing";
        router.push(returnUrl);
      } else {
        // For unknown errors, go to billing
        router.push("/dashboard/billing");
      }
    } catch (error) {
      console.error("Error in try again:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsRetrying(false);
    }
  };

  const handleGoToBilling = () => {
    router.push("/dashboard/billing");
  };

  const handleGoToDashboard = () => {
    router.push("/dashboard");
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
                {/* Success Message */}
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-semibold text-green-800">
                      {paymentStatus.type === "trial_upgrade"
                        ? "Plan Upgraded Successfully!"
                        : paymentStatus.type === "plan_upgrade"
                          ? "Plan Upgraded Successfully!"
                          : paymentStatus.type === "trial_end_payment"
                            ? "Billing Started Successfully!"
                            : "Payment Successful!"}
                    </span>
                  </div>
                  <p className="text-sm text-green-700">
                    {paymentStatus.message}
                  </p>
                </div>

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
                    <div className="text-sm text-green-700 text-center">
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
                          : `${paymentStatus.trialDays || 30}-Day Free Trial`}
                      </span>
                    </div>
                    <p className="text-sm text-blue-700 text-center">
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
                    <p className="text-sm text-purple-700 text-center">
                      Your trial period has ended and regular billing has
                      started. You&apos;ll be charged {paymentStatus.currency}{" "}
                      for your {paymentStatus.plan} plan.
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
                      <p className="text-sm text-orange-700 text-center">
                        Your new plan is now active. You&apos;ll be charged at
                        your next billing cycle.
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
                  <p className="text-sm text-gray-600 text-center">
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
                        className="w-full bg-green-600 hover:bg-green-700 text-white h-12 text-lg font-semibold"
                      >
                        <CreditCard className="mr-2 h-5 w-5" />
                        Continue to Next Step
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>

                      <Button
                        onClick={() => router.push("/dashboard")}
                        variant="outline"
                        className="w-full h-11"
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
                        className="w-full bg-green-600 hover:bg-green-700 text-white h-12 text-lg font-semibold"
                      >
                        <CreditCard className="mr-2 h-5 w-5" />
                        View Billing Details
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>

                      <Button
                        onClick={() => router.push("/dashboard")}
                        variant="outline"
                        className="w-full h-11"
                      >
                        Continue to Dashboard
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        onClick={() => router.push("/dashboard")}
                        className="w-full bg-green-600 hover:bg-green-700 text-white h-12 text-lg font-semibold"
                      >
                        <CreditCard className="mr-2 h-5 w-5" />
                        Go to Dashboard
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>

                      <Button
                        onClick={() => router.push("/dashboard/billing")}
                        variant="outline"
                        className="w-full h-11"
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
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      <span className="font-semibold text-red-800">
                        What happened?
                      </span>
                      {paymentStatus.retryCount &&
                        paymentStatus.retryCount > 0 && (
                          <Badge
                            variant="outline"
                            className="text-xs bg-red-100 text-red-700 border-red-300"
                          >
                            Attempt {paymentStatus.retryCount}/3
                          </Badge>
                        )}
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm text-red-700">
                        {paymentStatus.error === "webhook_processing_failed"
                          ? "Your payment was successful, but we're having trouble setting up your subscription. We'll try to sync it from Stripe automatically."
                          : paymentStatus.error === "verification_failed"
                            ? "We couldn't verify your payment was processed correctly. We'll attempt to sync your subscription from Stripe."
                            : paymentStatus.error === "retry_error"
                              ? "Something went wrong while trying to verify your payment. Please try again."
                              : paymentStatus.error === "payment_failed"
                                ? "Your payment wasn't completed. Please check your payment method and try again."
                                : "An unexpected error occurred. Please try again or contact support."}
                      </p>

                      <p className="text-xs text-red-600">
                        {paymentStatus.error === "webhook_processing_failed" ||
                        paymentStatus.error === "verification_failed"
                          ? "💡 Tip: We'll automatically sync your subscription from Stripe if it exists there."
                          : paymentStatus.error === "payment_failed"
                            ? "💡 Tip: Make sure your card has sufficient funds and try again."
                            : "💡 Tip: If this persists, please contact our support team."}
                      </p>
                    </div>

                    {/* Debug Information */}
                    {process.env.NODE_ENV === "development" && (
                      <details className="mt-3">
                        <summary className="text-xs text-red-600 cursor-pointer hover:text-red-700 font-medium">
                          Debug Information
                        </summary>
                        <div className="mt-2 p-2 bg-red-100 rounded text-xs text-red-800 font-mono">
                          <div>
                            Session ID:{" "}
                            {searchParams.get("session_id") || "N/A"}
                          </div>
                          <div>
                            Payment Intent:{" "}
                            {searchParams.get("payment_intent") || "N/A"}
                          </div>
                          <div>
                            Redirect Status:{" "}
                            {searchParams.get("redirect_status") || "N/A"}
                          </div>
                          <div>Plan: {searchParams.get("plan") || "N/A"}</div>
                          <div>
                            Interval: {searchParams.get("interval") || "N/A"}
                          </div>
                          <div>
                            Upgraded: {searchParams.get("upgraded") || "N/A"}
                          </div>
                          <div>
                            Trial Preserved:{" "}
                            {searchParams.get("trial_preserved") || "N/A"}
                          </div>
                        </div>
                      </details>
                    )}
                  </div>
                )}

                <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                  <p className="text-sm text-red-700 text-center">
                    Don&apos;t worry! You can try again or contact our support
                    team for assistance.
                  </p>
                </div>

                <div className="space-y-3">
                  {/* Show retry limit message if reached */}
                  {paymentStatus.retryCount &&
                    paymentStatus.retryCount >= 3 && (
                      <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200 mb-3">
                        <p className="text-sm text-yellow-700 text-center">
                          Maximum retry attempts reached. Please contact support
                          for assistance.
                        </p>
                      </div>
                    )}

                  {/* Primary Action - Smart retry based on error type */}
                  <Button
                    onClick={handleTryAgain}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-lg font-semibold"
                    disabled={
                      isRetrying ||
                      (paymentStatus.retryCount !== undefined &&
                        paymentStatus.retryCount >= 3)
                    }
                  >
                    {isRetrying ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-5 w-5" />
                        {paymentStatus.error === "webhook_processing_failed" ||
                        paymentStatus.error === "verification_failed"
                          ? "Retry Verification"
                          : paymentStatus.error === "payment_failed"
                            ? "Try Payment Again"
                            : "Try Again"}
                      </>
                    )}
                  </Button>

                  {/* Contact Support when retry limit reached */}
                  {paymentStatus.retryCount &&
                    paymentStatus.retryCount >= 3 && (
                      <Button
                        onClick={() => {
                          const subject = encodeURIComponent(
                            "Payment Verification Issue - Support Needed"
                          );
                          const body = encodeURIComponent(`Hi DineEasy Support,

I'm experiencing issues with payment verification on my account. Here are the details:

- Error: ${paymentStatus.error}
- Retry attempts: ${paymentStatus.retryCount}
- Session ID: ${searchParams.get("session_id") || "N/A"}
- Payment Intent: ${searchParams.get("payment_intent") || "N/A"}

Please help me resolve this issue.

Thank you.`);
                          window.open(
                            `mailto:support@dineeasy.ch?subject=${subject}&body=${body}`
                          );
                        }}
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white h-11"
                      >
                        Contact Support
                      </Button>
                    )}

                  {/* Secondary Action - Go to Billing */}
                  <Button
                    onClick={handleGoToBilling}
                    variant="outline"
                    className="w-full h-11"
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Go to Billing
                  </Button>

                  {/* Tertiary Action - Go to Dashboard */}
                  <Button
                    onClick={handleGoToDashboard}
                    variant="ghost"
                    className="w-full h-10 text-gray-600 hover:text-gray-800"
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
