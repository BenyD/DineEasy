"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  CreditCard,
  ExternalLink,
  Check,
  AlertCircle,
  RefreshCw,
  Banknote,
  Loader2,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import {
  createStripeAccount,
  createAccountUpdateLink,
  createStripeDashboardLink,
  getStripeAccountRequirements,
  refreshAccountStatus,
} from "@/lib/actions/stripe-connect";
import {
  getPaymentStats,
  getPaymentTransactions,
  getStripeAccountInfo,
  updatePaymentMethodSettings,
  getPaymentMethodSettings,
  type PaymentStats,
  type PaymentTransaction,
  type StripeAccountInfo,
} from "@/lib/actions/payments";
import PaymentStatsComponent from "@/components/dashboard/payments/PaymentStats";
import PaymentTransactions from "@/components/dashboard/payments/PaymentTransactions";
import { formatCurrency, getCurrencySymbol } from "@/lib/utils/currency";
import { useRestaurantSettings } from "@/lib/store/restaurant-settings";

type PaymentMethod = {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  iconColor: string;
  enabled: boolean;
};

const paymentMethods: PaymentMethod[] = [
  {
    id: "creditCard",
    name: "Credit & Debit Cards",
    description: "Visa, Mastercard, American Express",
    icon: CreditCard,
    iconColor: "text-blue-600",
    enabled: true,
  },
  {
    id: "cash",
    name: "Cash Payment",
    description: "Pay at the table or counter",
    icon: Banknote,
    iconColor: "text-green-600",
    enabled: true,
  },
];

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

export default function PaymentsPage() {
  const { currency } = useRestaurantSettings();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);

  // Data states
  const [paymentStats, setPaymentStats] = useState<PaymentStats | null>(null);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [stripeAccount, setStripeAccount] = useState<StripeAccountInfo | null>(
    null
  );
  const [stripeRequirements, setStripeRequirements] = useState<any>(null);
  const [paymentMethodSettings, setPaymentMethodSettings] = useState({
    cardEnabled: true,
    cashEnabled: true,
  });

  // UI states
  const [originalMethods, setOriginalMethods] = useState(paymentMethods);
  const [methods, setMethods] = useState(paymentMethods);
  const [transactionOffset, setTransactionOffset] = useState(0);
  const [hasMoreTransactions, setHasMoreTransactions] = useState(true);

  const hasChanges =
    JSON.stringify(originalMethods) !== JSON.stringify(methods);

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      const supabase = createClient();

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to continue");
        return;
      }

      // Get user's restaurant
      const { data: restaurant, error } = await supabase
        .from("restaurants")
        .select("id")
        .eq("owner_id", user.id)
        .single();

      if (error || !restaurant) {
        toast.error("Restaurant not found");
        return;
      }

      setRestaurantId(restaurant.id);

      // Fetch all data in parallel
      await Promise.all([
        fetchPaymentStats(restaurant.id),
        fetchTransactions(restaurant.id),
        fetchStripeAccountInfo(restaurant.id),
        fetchPaymentMethodSettings(restaurant.id),
        fetchStripeRequirements(restaurant.id),
      ]);

      setIsLoading(false);
    };

    fetchInitialData();
  }, []);

  const fetchPaymentStats = async (id: string) => {
    try {
      const stats = await getPaymentStats(id);
      setPaymentStats(stats);
    } catch (error) {
      console.error("Error fetching payment stats:", error);
      toast.error("Failed to load payment statistics");
    }
  };

  const fetchTransactions = async (
    id: string,
    offset: number = 0,
    append: boolean = false
  ) => {
    try {
      const newTransactions = await getPaymentTransactions(id, 20, offset);
      if (append) {
        setTransactions((prev) => [...prev, ...newTransactions]);
      } else {
        setTransactions(newTransactions);
      }
      setHasMoreTransactions(newTransactions.length === 20);
      setTransactionOffset(offset + newTransactions.length);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      if (!append) {
        toast.error("Failed to load payment transactions");
      }
    }
  };

  const fetchStripeAccountInfo = async (id: string) => {
    try {
      const accountInfo = await getStripeAccountInfo(id);
      setStripeAccount(accountInfo);
    } catch (error) {
      console.error("Error fetching Stripe account info:", error);
      // Don't show error toast for this as it's expected for restaurants without Stripe Connect
    }
  };

  const fetchPaymentMethodSettings = async (id: string) => {
    try {
      const settings = await getPaymentMethodSettings(id);
      setPaymentMethodSettings(settings);
      setMethods(
        methods.map((method) => ({
          ...method,
          enabled:
            method.id === "creditCard"
              ? settings.cardEnabled
              : settings.cashEnabled,
        }))
      );
      setOriginalMethods(
        methods.map((method) => ({
          ...method,
          enabled:
            method.id === "creditCard"
              ? settings.cardEnabled
              : settings.cashEnabled,
        }))
      );
    } catch (error) {
      console.error("Error fetching payment method settings:", error);
      toast.error("Failed to load payment method settings");
    }
  };

  const fetchStripeRequirements = async (id: string) => {
    try {
      const requirements = await getStripeAccountRequirements(id);
      setStripeRequirements(requirements);
    } catch (error) {
      console.error("Error fetching Stripe requirements:", error);
      // Don't show error toast for this as it's expected for restaurants without Stripe Connect
    }
  };

  const handleConnectStripe = async () => {
    if (!restaurantId) return;

    setIsConnecting(true);
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
      setIsConnecting(false);
    }
  };

  const handleRefreshConnection = async () => {
    if (!restaurantId) return;

    setIsRefreshing(true);
    try {
      await Promise.all([
        fetchStripeAccountInfo(restaurantId),
        fetchStripeRequirements(restaurantId),
      ]);
      toast.success("Account status refreshed");
    } catch (error) {
      toast.error("Failed to refresh account status");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleOpenStripeDashboard = async () => {
    if (!restaurantId) return;

    try {
      const result = await createStripeDashboardLink(restaurantId);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      if (result.dashboardUrl) {
        window.open(result.dashboardUrl, "_blank");
      }
    } catch (error) {
      console.error("Error opening Stripe dashboard:", error);
      toast.error("Failed to open Stripe dashboard");
    }
  };

  const handleUpdateStripeAccount = async () => {
    if (!restaurantId) return;

    try {
      const result = await createAccountUpdateLink(restaurantId);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      if (result.accountLink) {
        window.location.href = result.accountLink;
      }
    } catch (error) {
      console.error("Error updating Stripe account:", error);
      toast.error("Failed to update Stripe account");
    }
  };

  const handleSaveChanges = async () => {
    if (!restaurantId) return;

    setIsSaving(true);
    try {
      const settings = {
        cardEnabled:
          methods.find((m) => m.id === "creditCard")?.enabled || false,
        cashEnabled: methods.find((m) => m.id === "cash")?.enabled || false,
      };

      await updatePaymentMethodSettings(restaurantId, settings);

      setPaymentMethodSettings(settings);
      setOriginalMethods(methods);
      toast.success("Payment method settings updated");
    } catch (error) {
      console.error("Failed to save payment methods:", error);
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleMethodToggle = (methodId: string, enabled: boolean) => {
    setMethods(
      methods.map((method) =>
        method.id === methodId ? { ...method, enabled } : method
      )
    );
  };

  const handleLoadMoreTransactions = () => {
    if (restaurantId) {
      fetchTransactions(restaurantId, transactionOffset, true);
    }
  };

  const handleRefreshData = async () => {
    if (!restaurantId) return;

    setIsRefreshing(true);
    try {
      await Promise.all([
        fetchPaymentStats(restaurantId),
        fetchTransactions(restaurantId),
        fetchStripeAccountInfo(restaurantId),
      ]);
      toast.success("Data refreshed");
    } catch (error) {
      toast.error("Failed to refresh data");
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-8 max-w-6xl mx-auto">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-6 w-96" />
          </div>
          <Skeleton className="h-9 w-24" />
        </div>

        {/* Payment Stats Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Stripe Connection Status Skeleton */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-4 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-5 w-5" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-11" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Stripe Account Status Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-16" />
              </div>
            </div>
            <Separator />
            <div className="space-y-4">
              <Skeleton className="h-5 w-32" />
              <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <Skeleton className="h-3 w-32" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <div className="flex justify-between">
                      <Skeleton className="h-3 w-28" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                    <div className="flex justify-between">
                      <Skeleton className="h-3 w-36" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 flex-1" />
            </div>
          </CardContent>
        </Card>

        {/* Payment Transactions Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6">
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-8"
      >
        {/* Payment Overview Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center justify-between"
        >
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Payment Overview
            </h1>
            <p className="text-lg text-gray-500">
              Monitor your payment performance and configure settings
            </p>
          </div>
          <Button
            onClick={handleRefreshData}
            disabled={isRefreshing}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </motion.div>

        {/* Payment Statistics */}
        {paymentStats && (
          <PaymentStatsComponent
            stats={paymentStats}
            isLoading={isRefreshing}
            onRefresh={handleRefreshData}
          />
        )}

        {/* Stripe Connection Status */}
        {stripeAccount?.charges_enabled && (
          <motion.div
            variants={cardVariants}
            whileHover="hover"
            className="transform transition-all duration-200"
          >
            <Card className="border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                    <Check className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      Stripe Connected
                    </h2>
                    <p className="text-gray-500">
                      Your account is ready to accept payments
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Connect Stripe Account Section */}
        {!stripeAccount?.charges_enabled && (
          <motion.div
            variants={cardVariants}
            whileHover="hover"
            className="transform transition-all duration-200"
          >
            <Card>
              <CardHeader>
                <CardTitle>Connect Your Stripe Account</CardTitle>
                <CardDescription>
                  Set up secure payment processing for your restaurant
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
                      <p className="text-sm text-amber-800">
                        You need to connect your Stripe account to receive
                        payments from customers.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4">
                    <div className="flex items-start gap-3 bg-gray-50 p-4 rounded-lg">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Banknote className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">Receive Payments Directly</p>
                        <p className="text-sm text-gray-500">
                          Payments go straight to your bank account with
                          automatic transfers
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 bg-gray-50 p-4 rounded-lg">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <CreditCard className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">Accept Card Payments</p>
                        <p className="text-sm text-gray-500">
                          Take payments from all major credit and debit cards
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 bg-gray-50 p-4 rounded-lg">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Check className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium">Simple Fee Structure</p>
                        <p className="text-sm text-gray-500">
                          2.9% + CHF 0.30 for cards, cash payments are always
                          free
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button
                      onClick={handleConnectStripe}
                      disabled={isConnecting}
                      className="w-full bg-green-600 hover:bg-green-700 text-white h-12 text-lg"
                    >
                      {isConnecting ? (
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          Connecting to Stripe...
                        </div>
                      ) : (
                        <>
                          <CreditCard className="h-5 w-5 mr-2" />
                          Connect with Stripe
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-gray-500 text-center mt-3">
                      You'll be guided through Stripe's secure setup process
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Payment Methods */}
        <motion.div
          variants={cardVariants}
          whileHover="hover"
          className="transform transition-all duration-200"
        >
          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
              <CardDescription>
                Choose which payment methods to accept from customers
                {!stripeAccount?.charges_enabled && (
                  <span className="block mt-2 text-amber-600">
                    Currently only cash payments are available. Connect your
                    Stripe account to accept card payments.
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="space-y-4"
              >
                {methods.map((method: PaymentMethod) => {
                  const isCardMethod = method.id === "creditCard";
                  const isDisabled =
                    isCardMethod && !stripeAccount?.charges_enabled;

                  // Force credit card to be disabled when Stripe is not connected
                  const switchChecked = isDisabled ? false : method.enabled;

                  return (
                    <motion.div
                      key={method.id}
                      variants={cardVariants}
                      whileHover={{ x: 5 }}
                      className={cn(
                        "flex items-center justify-between p-4 rounded-lg border transition-colors",
                        isDisabled
                          ? "bg-gray-50 opacity-60 cursor-not-allowed"
                          : "hover:bg-accent/5"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <method.icon
                          className={cn("h-5 w-5", method.iconColor)}
                        />
                        <div>
                          <Label
                            htmlFor={method.id}
                            className={cn(
                              "text-base",
                              isDisabled && "text-gray-400"
                            )}
                          >
                            {method.name}
                          </Label>
                          <p className="text-sm text-gray-500">
                            {method.description}
                          </p>
                          {isDisabled && (
                            <p className="text-xs text-amber-600 mt-1">
                              Connect Stripe to enable card payments
                            </p>
                          )}
                        </div>
                      </div>
                      <Switch
                        id={method.id}
                        checked={switchChecked}
                        onCheckedChange={(checked) =>
                          handleMethodToggle(method.id, checked)
                        }
                        disabled={isDisabled}
                        className={cn(
                          "data-[state=checked]:bg-green-600",
                          isDisabled && "opacity-40 cursor-not-allowed"
                        )}
                      />
                    </motion.div>
                  );
                })}
              </motion.div>

              {hasChanges && (
                <div className="pt-4 border-t">
                  <Button
                    onClick={handleSaveChanges}
                    disabled={isSaving}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    {isSaving ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving Changes...
                      </div>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Stripe Account Status */}
        {stripeAccount && (
          <motion.div
            variants={cardVariants}
            whileHover="hover"
            className="transform transition-all duration-200"
          >
            <Card>
              <CardHeader>
                <CardTitle>Stripe Account Status</CardTitle>
                <CardDescription>
                  Your Stripe account information and status
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <motion.div variants={cardVariants} className="space-y-2">
                      <Label>Account ID</Label>
                      <div className="p-2 bg-gray-50 rounded border text-sm font-mono">
                        {stripeAccount.id}
                      </div>
                    </motion.div>
                    <motion.div variants={cardVariants} className="space-y-2">
                      <Label>Account Status</Label>
                      <div className="flex items-center gap-2">
                        {stripeAccount.charges_enabled ? (
                          <Badge className="bg-green-100 text-green-800">
                            <Check className="w-3 h-3 mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-100 text-amber-800">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                      </div>
                    </motion.div>
                  </div>

                  {/* Account Requirements Status */}
                  {stripeRequirements && !stripeAccount.charges_enabled && (
                    <motion.div variants={cardVariants} className="space-y-3">
                      <Label>Account Requirements</Label>
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-amber-800">
                              Account verification required
                            </p>
                            {stripeRequirements.currentlyDue &&
                              stripeRequirements.currentlyDue.length > 0 && (
                                <div className="text-xs text-amber-700">
                                  <p className="font-medium mb-1">
                                    Currently required:
                                  </p>
                                  <ul className="list-disc list-inside space-y-1">
                                    {Object.keys(
                                      stripeRequirements.currentlyDue
                                    ).map((field) => (
                                      <li key={field} className="capitalize">
                                        {field.replace(/_/g, " ")}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            <Button
                              size="sm"
                              onClick={handleUpdateStripeAccount}
                              className="bg-amber-600 hover:bg-amber-700"
                            >
                              Complete Verification
                            </Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Payout Status */}
                  {stripeRequirements && (
                    <motion.div variants={cardVariants} className="space-y-2">
                      <Label>Payout Status</Label>
                      <div className="flex items-center gap-2">
                        {stripeRequirements.payoutsEnabled ? (
                          <Badge className="bg-green-100 text-green-800">
                            <Check className="w-3 h-3 mr-1" />
                            Payouts Enabled
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-800">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Payouts Pending
                          </Badge>
                        )}
                      </div>
                    </motion.div>
                  )}
                </motion.div>

                <Separator />

                {/* Processing Fees */}
                <div className="space-y-4">
                  <h3 className="font-medium">Transaction Fees</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                    <div className="space-y-2">
                      <p className="font-medium text-gray-900 mb-2">
                        Card Payments:
                      </p>
                      <div className="flex justify-between text-sm">
                        <span>Stripe Processing Fee:</span>
                        <span className="font-medium">
                          2.9% + {getCurrencySymbol(currency)} 0.30
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>DineEasy Commission:</span>
                        <span className="font-medium">2.0%</span>
                      </div>
                      <div className="flex justify-between text-sm font-medium text-gray-900 pt-2 border-t">
                        <span>Total Fee per Card Transaction:</span>
                        <span>4.9% + {getCurrencySymbol(currency)} 0.30</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="font-medium text-gray-900 mb-2">
                        Cash Payments:
                      </p>
                      <div className="flex justify-between text-sm">
                        <span>All Fees:</span>
                        <span className="font-medium text-green-600">Free</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Cash payments are processed without any additional fees
                      </p>
                    </div>

                    <div className="text-sm bg-blue-50 p-3 rounded-md space-y-2">
                      <p className="font-medium text-blue-900">
                        Example Card Transaction:
                      </p>
                      <div className="space-y-1 text-blue-800">
                        <div className="flex justify-between">
                          <span>Order Amount:</span>
                          <span>{formatCurrency(100, currency)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>
                            Stripe Fee (2.9% + {getCurrencySymbol(currency)}{" "}
                            0.30):
                          </span>
                          <span>- {formatCurrency(3.2, currency)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>DineEasy Commission (2%):</span>
                          <span>- {formatCurrency(2.0, currency)}</span>
                        </div>
                        <div className="flex justify-between font-medium border-t border-blue-200 pt-1 mt-1">
                          <span>You Receive:</span>
                          <span>{formatCurrency(94.8, currency)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      <p>
                        • Stripe processing fees are standard and go directly to
                        Stripe
                      </p>
                      <p>• DineEasy commission applies only to card payments</p>
                      <p>
                        • Cash payments are completely free - no Stripe fees or
                        DineEasy commission
                      </p>
                      <p>
                        • View detailed pricing and transaction history in your
                        Stripe Dashboard
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleOpenStripeDashboard}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open Stripe Dashboard
                  </Button>
                  {!stripeAccount.charges_enabled && (
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={handleUpdateStripeAccount}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Update Account
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleRefreshConnection}
                    disabled={isRefreshing}
                  >
                    <RefreshCw
                      className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
                    />
                    Refresh
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Payment Transactions */}
        <PaymentTransactions
          transactions={transactions}
          isLoading={isRefreshing}
          onLoadMore={handleLoadMoreTransactions}
          hasMore={hasMoreTransactions}
        />
      </motion.div>
    </div>
  );
}
