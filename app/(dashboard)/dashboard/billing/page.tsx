"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle,
  ArrowRight,
  CreditCard,
  AlertCircle,
  Loader2,
  Sparkles,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { PLANS } from "@/lib/constants";
import { useBillingData } from "@/hooks/useBillingData";
import { createStripePortalSession } from "@/lib/actions/billing";
import { toast } from "sonner";
import { cancelSubscription } from "@/lib/actions/subscription";
import { useSearchParams } from "next/navigation";

function calculateDaysLeft(endDate: Date) {
  const now = new Date();
  const diff = endDate.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function formatDate(date: Date | null) {
  if (!date) return "Not available";
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

// Add these animation variants at the top level
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
  hover: { y: -5, transition: { duration: 0.2 } },
};

export default function BillingPage() {
  const billingData = useBillingData();
  const searchParams = useSearchParams();
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);
  const [isLoadingCancel, setIsLoadingCancel] = useState(false);
  const [showUpgradeSuccess, setShowUpgradeSuccess] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const daysLeft = billingData.trialEndsAt
    ? calculateDaysLeft(billingData.trialEndsAt)
    : 0;
  const isTrialActive = daysLeft > 0;

  // Check if subscription is cancelled
  const isSubscriptionCancelled =
    billingData.nextBillingDate &&
    new Date(billingData.nextBillingDate) < new Date();

  // Handle upgrade success message
  useEffect(() => {
    if (searchParams?.get("upgraded") === "true") {
      setShowUpgradeSuccess(true);
      toast.success(
        "🎉 Plan upgraded successfully! Your new features are now available."
      );

      // Refresh billing data to show updated plan
      billingData.refresh();

      // Remove the URL parameter
      const url = new URL(window.location.href);
      url.searchParams.delete("upgraded");
      window.history.replaceState({}, "", url.toString());

      // Hide success message after 5 seconds
      setTimeout(() => setShowUpgradeSuccess(false), 5000);
    }
  }, [searchParams, billingData.refresh]);

  const handleStripePortal = async () => {
    setIsLoadingPortal(true);
    try {
      const result = await createStripePortalSession();
      if (result.error) {
        toast.error(result.error);
      } else if (result.portalUrl) {
        window.location.href = result.portalUrl;
      }
    } catch (error) {
      toast.error("Failed to open billing portal");
    } finally {
      setIsLoadingPortal(false);
    }
  };

  const handleCancelSubscription = async () => {
    setShowCancelDialog(false);
    setIsLoadingCancel(true);
    try {
      const formData = new FormData();
      formData.append("restaurant_id", billingData.restaurantId || "");
      const res = await cancelSubscription(formData);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(
          "Subscription cancellation scheduled. You will retain access until the end of the billing period."
        );
        // Refresh billing data to show updated status
        billingData.refresh();
      }
    } catch (err) {
      toast.error("Failed to cancel subscription.");
    } finally {
      setIsLoadingCancel(false);
    }
  };

  // Show loading state
  if (billingData.isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading billing information...</span>
        </div>
      </div>
    );
  }

  // Show error state
  if (billingData.error) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600">
            Error Loading Billing
          </h2>
          <p className="text-gray-600 mt-2">{billingData.error}</p>
        </div>
      </div>
    );
  }

  if (!billingData.hasActiveSubscription) {
    return (
      <div className="p-6 space-y-8 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-1"
        >
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Set Up Billing
          </h1>
          <p className="text-lg text-gray-500">
            Add a payment method to start your DineEasy subscription
          </p>
        </motion.div>

        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="show"
          whileHover="hover"
          className="transform transition-all duration-200"
        >
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-amber-100">
                  <AlertCircle className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <CardTitle>Payment Method Required</CardTitle>
                  <CardDescription>
                    Please add a payment method to continue using DineEasy
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Before you can start your subscription, you'll need to:
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span>Add a payment method</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span>Choose your subscription plan</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span>Start your free trial</span>
                  </li>
                </ul>
              </div>

              <div className="pt-4">
                <Button
                  className="w-full bg-green-600 hover:bg-green-700 text-white h-12 text-lg"
                  onClick={() =>
                    (window.location.href = "/dashboard/billing/change-plan")
                  }
                >
                  <CreditCard className="h-5 w-5 mr-2" />
                  Choose a Plan
                </Button>
                <p className="text-xs text-gray-500 text-center mt-3">
                  You'll be guided through a secure payment setup process
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {isTrialActive && (
          <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="show"
            className="transform transition-all duration-200"
          >
            <Alert>
              <AlertTitle>{`Trial Status: ${daysLeft} days remaining`}</AlertTitle>
              <AlertDescription>
                Set up your payment method before your trial ends to continue
                using DineEasy without interruption.
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-1"
      >
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Billing & Subscription
        </h1>
        <p className="text-lg text-gray-500">
          Manage your subscription plan and billing details
        </p>
      </motion.div>

      {/* Upgrade Success Message */}
      {showUpgradeSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="transform transition-all duration-200"
        >
          <Alert variant="default" className="bg-green-50 border-green-200">
            <Sparkles className="h-4 w-4 text-green-600" />
            <AlertTitle>Plan Upgraded Successfully! 🎉</AlertTitle>
            <AlertDescription>
              Your plan has been upgraded and your new features are now
              available.
              {isTrialActive && " Your trial period has been preserved."}
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Cancellation Notice */}
      {isSubscriptionCancelled && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="transform transition-all duration-200"
        >
          <Alert variant="destructive" className="bg-red-50 border-red-200">
            <XCircle className="h-4 w-4 text-red-600" />
            <AlertTitle>Subscription Cancelled</AlertTitle>
            <AlertDescription>
              Your subscription has been cancelled and will end on{" "}
              {formatDate(billingData.nextBillingDate)}. You can reactivate your
              subscription at any time by visiting the change plan page.
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {isTrialActive && (
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="show"
          className="transform transition-all duration-200"
        >
          <Alert variant="default" className="bg-blue-50 border-blue-200">
            <AlertTitle>{`🎉 You're on your 14-day free trial — ${daysLeft} days remaining!`}</AlertTitle>
            <AlertDescription>
              You're currently on the {billingData.plan} plan. Your card will be
              charged {billingData.currency} {billingData.price} on{" "}
              {formatDate(billingData.nextBillingDate)} unless you cancel.
              {billingData.plan.toLowerCase() !== "elite" && (
                <div className="mt-3">
                  <Button
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() =>
                      (window.location.href = "/dashboard/billing/change-plan")
                    }
                  >
                    Upgrade Now
                  </Button>
                </div>
              )}
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid gap-8 md:grid-cols-2"
      >
        {/* Current Plan Card */}
        <motion.div
          variants={cardVariants}
          whileHover="hover"
          className="transform transition-all duration-200"
        >
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Current Plan</CardTitle>
                  <CardDescription>Your subscription details</CardDescription>
                </div>
                <Badge
                  className={`${
                    isSubscriptionCancelled
                      ? "bg-red-100 text-red-800"
                      : isTrialActive
                        ? "bg-blue-100 text-blue-800"
                        : "bg-green-100 text-green-800"
                  }`}
                >
                  {isSubscriptionCancelled
                    ? "Cancelled"
                    : isTrialActive
                      ? "Trial"
                      : "Active"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-green-700">
                  {billingData.plan} Plan
                </h3>
                <p className="text-sm text-gray-500">
                  {billingData.currency} {billingData.price}/
                  {billingData.billingCycle === "monthly" ? "month" : "year"}
                </p>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Billing cycle</span>
                  <span className="font-medium capitalize">
                    {billingData.billingCycle}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">
                    {isSubscriptionCancelled
                      ? "Access ends"
                      : isTrialActive
                        ? "Trial ends"
                        : "Next billing date"}
                  </span>
                  <span className="font-medium">
                    {formatDate(
                      isTrialActive
                        ? billingData.trialEndsAt
                        : billingData.nextBillingDate
                    )}
                  </span>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Plan Features</h4>
                <motion.ul
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  className="space-y-2.5"
                >
                  {PLANS[
                    billingData.plan.toLowerCase() as keyof typeof PLANS
                  ].features.map((feature: string, index: number) => (
                    <motion.li
                      key={index}
                      variants={cardVariants}
                      className="flex items-center gap-2 text-sm"
                    >
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <span>{feature}</span>
                    </motion.li>
                  ))}
                </motion.ul>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() =>
                    (window.location.href = "/dashboard/billing/change-plan")
                  }
                >
                  Change Plan
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                {!isSubscriptionCancelled && (
                  <Button
                    variant="outline"
                    className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => setShowCancelDialog(true)}
                    disabled={isLoadingCancel}
                  >
                    {isLoadingCancel ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Canceling...
                      </>
                    ) : (
                      "Cancel Subscription"
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Usage Stats Card */}
        <motion.div
          variants={cardVariants}
          whileHover="hover"
          className="transform transition-all duration-200"
        >
          <Card>
            <CardHeader>
              <CardTitle>Usage & Limits</CardTitle>
              <CardDescription>
                Monitor your current usage and plan limits
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="space-y-6"
              >
                {/* Menu Items Usage */}
                <motion.div variants={cardVariants} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Menu Items</span>
                    <span className="text-gray-500">
                      {billingData.plan.toLowerCase() === "elite"
                        ? "Unlimited"
                        : `${billingData.usage.menuItems.used} of ${billingData.usage.menuItems.limit} used`}
                    </span>
                  </div>
                  {billingData.plan.toLowerCase() !== "elite" && (
                    <Progress
                      value={
                        (billingData.usage.menuItems.used /
                          billingData.usage.menuItems.limit) *
                        100
                      }
                      className="h-2 bg-gray-100 [&>div]:bg-green-600"
                    />
                  )}
                </motion.div>

                {/* Tables Usage */}
                <motion.div variants={cardVariants} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Tables with QR Codes</span>
                    <span className="text-gray-500">
                      {billingData.plan.toLowerCase() === "elite"
                        ? "Unlimited"
                        : `${billingData.usage.tables.used} of ${billingData.usage.tables.limit} used`}
                    </span>
                  </div>
                  {billingData.plan.toLowerCase() !== "elite" && (
                    <Progress
                      value={
                        (billingData.usage.tables.used /
                          billingData.usage.tables.limit) *
                        100
                      }
                      className="h-2 bg-gray-100 [&>div]:bg-green-600"
                    />
                  )}
                </motion.div>

                {/* Staff Usage */}
                <motion.div variants={cardVariants} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Staff Accounts</span>
                    <span className="text-gray-500">
                      {billingData.plan.toLowerCase() === "elite"
                        ? "Unlimited"
                        : `${billingData.usage.staff.used} of ${billingData.usage.staff.limit} used`}
                    </span>
                  </div>
                  {billingData.plan.toLowerCase() !== "elite" && (
                    <Progress
                      value={
                        (billingData.usage.staff.used /
                          billingData.usage.staff.limit) *
                        100
                      }
                      className="h-2 bg-gray-100 [&>div]:bg-green-600"
                    />
                  )}
                </motion.div>
              </motion.div>

              <Separator />

              {/* Stripe Portal Link */}
              <div className="space-y-3">
                <h4 className="font-medium">Payment & Billing</h4>
                <p className="text-sm text-gray-500">
                  View your payment history and manage your payment methods
                  through our secure Stripe portal.
                </p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleStripePortal}
                  disabled={isLoadingPortal}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  {isLoadingPortal ? "Loading..." : "Manage Billing in Stripe"}
                </Button>
              </div>

              {/* Contextual Upgrade Card */}
              {billingData.plan.toLowerCase() !== "elite" && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <h4 className="font-medium">Ready to grow?</h4>
                    <div className="rounded-lg bg-green-50 p-4 space-y-3">
                      {billingData.plan.toLowerCase() === "pro" ? (
                        <>
                          <p className="text-sm text-green-800">
                            Upgrade to Elite for unlimited tables, staff
                            accounts, and enhanced analytics. Plus, get priority
                            24/7 support and early access to AI features!
                          </p>
                          <Button
                            className="w-full bg-green-600 hover:bg-green-700 text-white"
                            onClick={() =>
                              (window.location.href =
                                "/dashboard/billing/change-plan")
                            }
                          >
                            Upgrade to Elite
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <p className="text-sm text-green-800">
                            Upgrade to Pro for more tables, staff accounts, and
                            advanced features like role-based permissions and
                            analytics!
                          </p>
                          <Button
                            className="w-full bg-green-600 hover:bg-green-700 text-white"
                            onClick={() =>
                              (window.location.href =
                                "/dashboard/billing/change-plan")
                            }
                          >
                            Upgrade to Pro
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Cancel Subscription Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Cancel Subscription
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel your subscription? You will retain
              access until the end of the billing period (
              {formatDate(billingData.nextBillingDate)}).
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
            >
              Keep Subscription
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelSubscription}
              disabled={isLoadingCancel}
            >
              {isLoadingCancel ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Canceling...
                </>
              ) : (
                "Cancel Subscription"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
