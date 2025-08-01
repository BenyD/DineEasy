"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle,
  CreditCard,
  Shield,
  Zap,
  AlertTriangle,
  Clock,
  Banknote,
  Globe,
  CheckCircle2,
  Loader2,
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
import {
  createStripeAccount,
  getStripeAccountStatus,
} from "@/lib/actions/stripe-connect";
import { createClient } from "@/lib/supabase/client";
import { completeOnboarding } from "@/lib/actions/restaurant";
import { toast } from "sonner";
import { Logo } from "@/components/layout/Logo";
import {
  getOnboardingStatus,
  redirectToOnboardingStep,
  clearOnboardingProgress,
} from "@/lib/utils";
import { COUNTRY_OPTIONS } from "@/lib/constants";

export default function ConnectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [accountStatus, setAccountStatus] = useState<
    "not_connected" | "pending" | "active" | null
  >(null);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [restaurantCountry, setRestaurantCountry] = useState<string | null>(
    null
  );
  const [showWarningDialog, setShowWarningDialog] = useState(false);
  const [isCompletingOnboarding, setIsCompletingOnboarding] = useState(false);

  useEffect(() => {
    const checkAuthAndStatus = async () => {
      const supabase = createClient();

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to continue");
        router.push("/login");
        return;
      }

      // Check if user should be on this page
      const onboardingStatus = await getOnboardingStatus(supabase);

      if (onboardingStatus.step !== "connect-stripe") {
        // Check if onboarding is complete but welcome email might not have been sent
        if (onboardingStatus.step === "complete") {
          console.log(
            "🔍 Onboarding already complete, checking if welcome email was sent..."
          );

          // Get the full restaurant data to check onboarding status
          const { data: fullRestaurant, error: fullRestaurantError } =
            await supabase
              .from("restaurants")
              .select(
                "id, onboarding_completed, name, stripe_account_id, stripe_account_enabled"
              )
              .eq("owner_id", user.id)
              .single();

          if (!fullRestaurantError && fullRestaurant) {
            // Check if onboarding is marked as complete but we should ensure welcome email was sent
            if (fullRestaurant.onboarding_completed) {
              console.log(
                "📧 Onboarding marked as complete, ensuring welcome email was sent..."
              );

              try {
                // Send welcome email if onboarding is complete
                await completeOnboarding(fullRestaurant.id);
                console.log(
                  "✅ Welcome email sent for already completed onboarding"
                );
              } catch (emailError) {
                console.error(
                  "❌ Error sending welcome email for completed onboarding:",
                  emailError
                );
                // Don't block the redirect if email fails
              }
            }
          }
        }

        // User has already completed this step or needs to go to a different step
        redirectToOnboardingStep(
          onboardingStatus.step,
          router,
          onboardingStatus.emailVerified
        );
        return;
      }

      // Get user's restaurant for Stripe Connect setup
      const { data: restaurant, error } = await supabase
        .from("restaurants")
        .select("id, stripe_account_id, country")
        .eq("owner_id", user.id)
        .single();

      if (error || !restaurant) {
        toast.error("Restaurant not found");
        router.push("/setup");
        return;
      }

      setRestaurantId(restaurant.id);
      setRestaurantCountry(restaurant.country);

      // Check if user is returning from Stripe Connect
      const success = searchParams.get("success");
      const accountId = searchParams.get("account_id");
      const refresh = searchParams.get("refresh");

      if (refresh === "true") {
        // Handle refresh URL - regenerate account link
        console.log("Handling refresh URL - regenerating account link");
        await handleRefreshAccountLink(restaurant.id);
        return;
      }

      if (accountId || success === "true") {
        // User completed Stripe Connect onboarding - check status and complete onboarding
        await checkAccountStatusAndComplete(restaurant.id);
      } else {
        // Check current status
        await checkAccountStatus(restaurant.id);
      }
    };

    checkAuthAndStatus();
  }, [router, searchParams]);

  const checkAccountStatusAndComplete = async (restaurantId: string) => {
    setIsCheckingStatus(true);
    try {
      const result = await getStripeAccountStatus(restaurantId);
      if (result.error) {
        toast.error(result.error);
        return;
      }

      const status = result.status as "not_connected" | "pending" | "active";
      setAccountStatus(status);

      // If account is active, automatically complete onboarding and redirect
      if (status === "active") {
        await completeOnboardingAndRedirect(restaurantId);
      }
    } catch (error) {
      console.error("Error checking account status:", error);
      toast.error("Failed to check account status");
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const checkAccountStatus = async (restaurantId: string) => {
    setIsCheckingStatus(true);
    try {
      const result = await getStripeAccountStatus(restaurantId);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setAccountStatus(result.status as "not_connected" | "pending" | "active");
    } catch (error) {
      console.error("Error checking account status:", error);
      toast.error("Failed to check account status");
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const completeOnboardingAndRedirect = async (restaurantId: string) => {
    setIsCompletingOnboarding(true);
    try {
      const result = await completeOnboarding(restaurantId);

      if (result.error) {
        console.error("Error completing onboarding:", result.error);
        toast.error("Failed to complete onboarding. Please try again.");
        return;
      }

      console.log("Onboarding completed successfully:", result);
      toast.success("Payment setup complete! Welcome to DineEasy!");

      // Clear onboarding progress from localStorage
      clearOnboardingProgress();

      // Redirect to dashboard
      router.push("/dashboard");
    } catch (error) {
      console.error("Error completing onboarding:", error);
      toast.error("Failed to complete onboarding. Please try again.");
    } finally {
      setIsCompletingOnboarding(false);
    }
  };

  const handleConnectStripe = async () => {
    if (!restaurantId) return;

    setIsLoading(true);
    try {
      const result = await createStripeAccount();

      if (result.error) {
        toast.error(result.error);
        return;
      }

      if (result.accountLink) {
        // Redirect to Stripe Connect onboarding
        window.location.href = result.accountLink;
      }
    } catch (error) {
      console.error("Error connecting Stripe:", error);
      toast.error("Failed to connect Stripe account");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshAccountLink = async (restaurantId: string) => {
    setIsLoading(true);
    try {
      const result = await createStripeAccount();

      if (result.error) {
        toast.error(result.error);
        return;
      }

      if (result.accountLink) {
        // Redirect to the new account link
        window.location.href = result.accountLink;
      }
    } catch (error) {
      console.error("Error refreshing account link:", error);
      toast.error("Failed to refresh account link");
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = async () => {
    if (accountStatus === "not_connected") {
      setShowWarningDialog(true);
    } else if (accountStatus === "active") {
      await completeOnboardingAndRedirect(restaurantId!);
    }
  };

  const handleSkipToDashboard = async () => {
    setShowWarningDialog(false);
    await completeOnboardingAndRedirect(restaurantId!);
  };

  // Check if the restaurant's country supports Stripe Connect
  const countrySupportsStripeConnect = restaurantCountry
    ? COUNTRY_OPTIONS.find((c) => c.value === restaurantCountry)?.stripeConnect
    : true;

  if (isCheckingStatus || isCompletingOnboarding) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-green-600" />
          <p className="text-gray-600">
            {isCompletingOnboarding
              ? "Completing your setup..."
              : "Checking your payment setup..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Background Pattern */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(#e0f2e9_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
          <Logo />
          <div className="text-sm text-gray-500">Payment Setup</div>
        </div>
      </div>

      <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Stripe Connect Availability Notification */}
        {!countrySupportsStripeConnect && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
              <div className="flex items-start gap-4">
                <AlertTriangle className="h-6 w-6 text-amber-600 mt-0.5 shrink-0" />
                <div className="text-left">
                  <h4 className="font-medium text-amber-800 text-lg mb-2">
                    Payment Processing Limited
                  </h4>
                  <p className="text-amber-700 mb-3">
                    Stripe Connect is not available for businesses in{" "}
                    {restaurantCountry}. You can still use DineEasy for menu
                    management, table reservations, and order tracking, but
                    payment processing will be limited to cash payments.
                  </p>
                  <div className="bg-white border border-amber-200 rounded-lg p-4">
                    <h5 className="font-medium text-amber-800 mb-2">
                      Available Features:
                    </h5>
                    <ul className="text-sm text-amber-700 space-y-1">
                      <li>• Digital menu and QR code ordering</li>
                      <li>• Table management and reservations</li>
                      <li>• Order tracking and kitchen display</li>
                      <li>• Staff management and analytics</li>
                      <li>• Cash payment tracking</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Set Up Payments
          </h1>
          <p className="text-lg text-gray-500 mb-6">
            Connect your Stripe Express account to start accepting payments from
            customers. Express accounts have a simple, fast setup process.
          </p>
        </motion.div>

        {/* What to Expect Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-12"
        >
          <div
            className={`border rounded-lg p-6 ${
              countrySupportsStripeConnect
                ? "bg-blue-50 border-blue-200"
                : "bg-amber-50 border-amber-200"
            }`}
          >
            <div className="flex items-start gap-4">
              {countrySupportsStripeConnect ? (
                <CheckCircle2 className="h-6 w-6 text-blue-600 mt-0.5 shrink-0" />
              ) : (
                <AlertTriangle className="h-6 w-6 text-amber-600 mt-0.5 shrink-0" />
              )}
              <div className="text-left">
                <h4
                  className={`font-medium text-lg mb-2 ${
                    countrySupportsStripeConnect
                      ? "text-blue-800"
                      : "text-amber-800"
                  }`}
                >
                  {countrySupportsStripeConnect
                    ? "What to Expect"
                    : "Payment Setup Notice"}
                </h4>
                <p
                  className={
                    countrySupportsStripeConnect
                      ? "text-blue-700"
                      : "text-amber-700"
                  }
                >
                  {countrySupportsStripeConnect
                    ? "You'll be redirected to Stripe's Express onboarding platform to complete your account setup. Express accounts have a streamlined process that takes just a few minutes. This is required for security and compliance."
                    : "Stripe Connect Express is not available in your country. You can still use DineEasy for all other features including menu management, order tracking, and table reservations. Contact support for alternative payment solutions."}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid gap-8 md:grid-cols-2 mb-12">
          {/* Benefits Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-green-500" />
                  Why Connect Stripe?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Banknote className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="font-medium">Get Paid Directly</h4>
                    <p className="text-sm text-gray-500">
                      Money goes straight to your bank account
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="font-medium">Bank-Level Security</h4>
                    <p className="text-sm text-gray-500">
                      PCI compliant with fraud protection
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CreditCard className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="font-medium">All Payment Methods</h4>
                    <p className="text-sm text-gray-500">
                      Cards, Apple Pay, Google Pay, and more
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Globe className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="font-medium">Global Support</h4>
                    <p className="text-sm text-gray-500">
                      Works in 135+ countries worldwide
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Status Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Account Status</CardTitle>
                <CardDescription>
                  {accountStatus === "not_connected" &&
                    "Connect your Stripe account to start accepting payments"}
                  {accountStatus === "pending" &&
                    "Complete your Stripe account setup"}
                  {accountStatus === "active" &&
                    "Your Stripe account is ready to accept payments"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-3">
                  <div
                    className={`h-3 w-3 rounded-full ${
                      accountStatus === "active"
                        ? "bg-green-500"
                        : accountStatus === "pending"
                          ? "bg-yellow-500"
                          : "bg-gray-300"
                    }`}
                  />
                  <span className="font-medium">
                    {accountStatus === "not_connected" && "Not Connected"}
                    {accountStatus === "pending" && "Setup In Progress"}
                    {accountStatus === "active" && "Active"}
                  </span>
                </div>

                {accountStatus === "not_connected" && (
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                        <div>
                          <h4 className="font-medium text-blue-800">
                            Express Setup
                          </h4>
                          <p className="text-sm text-blue-700 mt-1">
                            Takes just 5 minutes with Stripe&apos;s streamlined
                            Express onboarding.
                          </p>
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={handleConnectStripe}
                      disabled={isLoading || !countrySupportsStripeConnect}
                      size="lg"
                      className={`w-full ${
                        countrySupportsStripeConnect
                          ? "bg-green-600 hover:bg-green-700"
                          : "bg-gray-400 cursor-not-allowed"
                      }`}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Connecting...
                        </>
                      ) : !countrySupportsStripeConnect ? (
                        <>
                          Stripe Connect Not Available
                          <AlertTriangle className="ml-2 h-4 w-4" />
                        </>
                      ) : (
                        <>
                          Connect Stripe Express Account
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                    <div className="text-center">
                      <button
                        onClick={() => setShowWarningDialog(true)}
                        className="text-sm text-gray-500 hover:text-gray-700 underline"
                      >
                        Skip for now - I&apos;ll set this up later
                      </button>
                    </div>
                  </div>
                )}

                {accountStatus === "pending" && (
                  <div className="space-y-4">
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Clock className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                        <div>
                          <h4 className="font-medium text-amber-800">
                            Almost Done!
                          </h4>
                          <p className="text-sm text-amber-700 mt-1">
                            Complete a few more steps to start accepting
                            payments.
                          </p>
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={handleConnectStripe}
                      disabled={isLoading}
                      size="lg"
                      variant="outline"
                      className="w-full"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        "Complete Setup"
                      )}
                    </Button>
                  </div>
                )}

                {accountStatus === "active" && (
                  <div className="text-center space-y-4">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
                    <div>
                      <p className="text-green-600 font-medium text-lg">
                        Ready to accept payments!
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Your Stripe account is fully verified and active.
                      </p>
                    </div>
                    <Button
                      onClick={handleContinue}
                      size="lg"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Continue to Dashboard
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Warning Dialog */}
        <Dialog open={showWarningDialog} onOpenChange={setShowWarningDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Skip Payment Setup?
              </DialogTitle>
              <DialogDescription>
                You can always set up payments later from your dashboard. For
                now, you can still explore all other features of DineEasy.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">
                  You can still:
                </h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Set up your menu and items</li>
                  <li>• Configure tables and QR codes</li>
                  <li>• Manage staff and settings</li>
                  <li>• View analytics and reports</li>
                </ul>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h4 className="font-medium text-amber-800 mb-2">
                  You&apos;ll need to set up payments later to:
                </h4>
                <ul className="text-sm text-amber-700 space-y-1">
                  <li>• Accept customer payments</li>
                  <li>• Process orders with payment</li>
                  <li>• Receive money to your bank account</li>
                </ul>
              </div>
            </div>
            <DialogFooter className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowWarningDialog(false)}
              >
                Go Back & Connect Now
              </Button>
              <Button
                onClick={handleSkipToDashboard}
                className="bg-green-600 hover:bg-green-700"
              >
                Continue to Dashboard
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
