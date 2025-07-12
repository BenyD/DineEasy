"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Check, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { PRICING, formatPrice } from "@/lib/constants/pricing";
import { SUBSCRIPTION } from "@/lib/constants/subscription";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { createPlanChangeSession } from "@/lib/actions/billing";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import {
  calculateProration,
  formatCurrency,
  getProrationColor,
} from "@/lib/utils/proration";

interface Plan {
  id: string;
  name: string;
  price: Record<string, { monthly: number; yearly: number }>;
  features: readonly string[];
  highlighted?: boolean;
}

type BillingCycle = "monthly" | "yearly";

interface CurrentPlan {
  id: string;
  name: string;
  billingCycle: BillingCycle;
}

// Current plan will be fetched from the database

// Add animation variants at the top level
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

export default function ChangePlanPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentPlan, setCurrentPlan] = useState<CurrentPlan | null>(null);
  const [isLoadingPlan, setIsLoadingPlan] = useState(true);
  const [annual, setAnnual] = useState<boolean>(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [restaurantCurrency, setRestaurantCurrency] = useState<string>("CHF");
  const [isLoading, setIsLoading] = useState(false);
  const [currentSubscriptionDetails, setCurrentSubscriptionDetails] = useState<{
    currentPeriodStart: Date | null;
    currentPeriodEnd: Date | null;
  } | null>(null);

  // Fetch current plan data
  useEffect(() => {
    async function fetchCurrentPlan() {
      try {
        const supabase = createClient();

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
        if (userError || !user) {
          throw new Error("Not authenticated");
        }

        const { data: restaurant, error: restaurantError } = await supabase
          .from("restaurants")
          .select(
            `
            currency,
            subscriptions (
              plan,
              interval,
              current_period_start,
              current_period_end
            )
          `
          )
          .eq("owner_id", user.id)
          .single();

        if (restaurantError) {
          throw restaurantError;
        }

        // Set the currency based on restaurant's currency
        if (restaurant.currency) {
          setRestaurantCurrency(restaurant.currency);
        }

        const subscription = restaurant.subscriptions?.[0];
        if (subscription) {
          setCurrentPlan({
            id: subscription.plan,
            name:
              subscription.plan.charAt(0).toUpperCase() +
              subscription.plan.slice(1),
            billingCycle: subscription.interval as "monthly" | "yearly",
          });
          setAnnual(subscription.interval === "yearly");

          // Store subscription details for proration calculation
          setCurrentSubscriptionDetails({
            currentPeriodStart: subscription.current_period_start
              ? new Date(subscription.current_period_start)
              : null,
            currentPeriodEnd: subscription.current_period_end
              ? new Date(subscription.current_period_end)
              : null,
          });
        } else {
          setCurrentPlan({
            id: "starter",
            name: "Starter",
            billingCycle: "monthly",
          });
        }
      } catch (error) {
        console.error("Error fetching current plan:", error);
        toast.error("Failed to load current plan");
      } finally {
        setIsLoadingPlan(false);
      }
    }

    fetchCurrentPlan();
  }, []);

  useEffect(() => {
    // Show success toast if planChanged=1 is in the URL
    if (searchParams?.get("planChanged") === "1") {
      toast.success("Your plan was changed successfully!");
      setTimeout(() => {
        router.push("/dashboard/billing");
      }, 2000);
    }
  }, [searchParams, router]);

  const handlePlanSelect = (planId: string) => {
    if (!currentPlan || planId.toLowerCase() === currentPlan.name.toLowerCase())
      return;
    setSelectedPlan(planId);
  };

  const handleContinue = async () => {
    if (!selectedPlan) return;
    setIsLoading(true);

    try {
      const result = await createPlanChangeSession(
        selectedPlan,
        annual ? "yearly" : "monthly",
        restaurantCurrency
      );

      if (result.error) {
        toast.error(result.error);
      } else if (result.checkoutUrl) {
        // Check if this is a direct upgrade (not a checkout URL)
        if (
          result.checkoutUrl.includes(
            "dashboard/billing?success=true&upgraded=true"
          )
        ) {
          // Direct upgrade - redirect to billing page with success message
          window.location.href = result.checkoutUrl;
        } else {
          // New subscription or checkout required
          window.location.href = result.checkoutUrl;
        }
      }
    } catch (error) {
      console.error("Error creating checkout session:", error);

      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes("No such price")) {
          toast.error(
            "Selected plan is not available in your currency. Please contact support."
          );
        } else if (error.message.includes("customer")) {
          toast.error(
            "Unable to find your billing information. Please try again or contact support."
          );
        } else if (error.message.includes("currency")) {
          toast.error(
            "Currency not supported. Please contact support to enable your preferred currency."
          );
        } else if (error.message.includes("authentication")) {
          toast.error("Please log in again to continue with your plan change.");
        } else {
          toast.error(
            "Failed to create checkout session. Please try again or contact support if the issue persists."
          );
        }
      } else {
        toast.error(
          "Failed to create checkout session. Please try again or contact support if the issue persists."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Get current subscription status
  const getCurrentSubscriptionStatus = () => {
    if (!currentPlan) return null;

    // This would need to be fetched from the billing data hook
    // For now, we'll assume trial status based on the plan
    return {
      isInTrial:
        currentPlan.id === "starter" && currentPlan.billingCycle === "monthly",
      daysLeft: 14, // This should come from billing data
    };
  };

  const subscriptionStatus = getCurrentSubscriptionStatus();
  const isInTrial = subscriptionStatus?.isInTrial;

  const plans: Plan[] = [
    {
      id: "starter",
      name: PRICING.starter.name,
      price: PRICING.starter.price,
      features: PRICING.starter.features,
      highlighted: false,
    },
    {
      id: "pro",
      name: PRICING.pro.name,
      price: PRICING.pro.price,
      features: PRICING.pro.features,
      highlighted: true,
    },
    {
      id: "elite",
      name: PRICING.elite.name,
      price: PRICING.elite.price,
      features: PRICING.elite.features,
      highlighted: false,
    },
  ];

  // Show loading state while fetching current plan
  if (isLoadingPlan) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading plan information...</span>
        </div>
      </div>
    );
  }

  if (!currentPlan) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600">
            Error Loading Plan
          </h2>
          <p className="text-gray-600 mt-2">
            Failed to load your current plan information.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-1"
      >
        <Link
          href="/dashboard/billing"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Billing
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Change Plan
        </h1>
        <p className="text-lg text-gray-500">
          Select a new plan that better fits your needs
        </p>
      </motion.div>

      {/* Current Plan Info */}
      {currentPlan && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex justify-center"
        >
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 max-w-2xl w-full text-center shadow-sm">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
              <h3 className="text-lg font-semibold text-blue-900">
                Current Plan
              </h3>
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            </div>
            <div className="space-y-2">
              <p className="text-2xl font-bold text-blue-900">
                {currentPlan.name} Plan
              </p>
              <p className="text-blue-700 font-medium">
                {currentPlan.billingCycle === "yearly" ? "Annual" : "Monthly"}{" "}
                Billing
              </p>
              <p className="text-lg font-semibold text-blue-800">
                {formatPrice(
                  annual
                    ? PRICING[currentPlan.id as keyof typeof PRICING].price[
                        restaurantCurrency as keyof typeof PRICING.starter.price
                      ]?.yearly || 0
                    : PRICING[currentPlan.id as keyof typeof PRICING].price[
                        restaurantCurrency as keyof typeof PRICING.starter.price
                      ]?.monthly || 0,
                  restaurantCurrency as any
                )}{" "}
                / {annual ? "year" : "month"}
              </p>
              {isInTrial && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    🎉 <strong>Trial Period Active</strong> - Upgrades preserve
                    your trial period!
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Billing Toggle */}
      <div className="flex justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-4 rounded-full border bg-white/80 p-2 shadow-sm backdrop-blur-sm"
        >
          <span
            className={`text-sm font-medium transition-colors ${
              !annual ? "text-green-600" : "text-gray-500"
            }`}
          >
            Monthly
          </span>
          <Switch
            checked={annual}
            onCheckedChange={setAnnual}
            className="data-[state=checked]:bg-green-600"
          />
          <span
            className={`text-sm font-medium transition-colors ${
              annual ? "text-green-600" : "text-gray-500"
            }`}
          >
            Yearly{" "}
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
              Save {SUBSCRIPTION.YEARLY_DISCOUNT_PERCENTAGE}%
            </span>
          </span>
        </motion.div>
      </div>

      {/* Plans Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid gap-8 md:grid-cols-3"
      >
        {plans.map((plan: Plan, index: number) => {
          const isCurrentPlan = plan.id === currentPlan.id;
          const isSelected = plan.id === selectedPlan;

          return (
            <motion.div
              key={plan.id}
              variants={cardVariants}
              whileHover="hover"
              className="transform transition-all duration-200"
            >
              <Card
                className={`relative transition-all hover:shadow-lg ${
                  isSelected
                    ? "border-green-200 ring-1 ring-green-500 cursor-pointer"
                    : isCurrentPlan
                      ? "border-blue-300 bg-gradient-to-br from-blue-50 to-indigo-50 ring-1 ring-blue-200 cursor-default"
                      : "hover:border-green-200 cursor-pointer"
                }`}
                onClick={() => !isCurrentPlan && handlePlanSelect(plan.id)}
              >
                {plan.highlighted && !isCurrentPlan && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-green-600 to-green-500 px-4 py-1 text-sm font-medium text-white shadow-sm"
                  >
                    Most Popular
                  </motion.div>
                )}

                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>
                    {plan.name === "Starter" && "Perfect for small restaurants"}
                    {plan.name === "Pro" && "Ideal for growing restaurants"}
                    {plan.name === "Elite" && "For established restaurants"}
                  </CardDescription>
                  <div className="mt-4">
                    <div className="flex items-baseline">
                      <span className="text-3xl font-bold">
                        {formatPrice(
                          annual
                            ? plan.price[restaurantCurrency]?.yearly || 0
                            : plan.price[restaurantCurrency]?.monthly || 0,
                          restaurantCurrency as any
                        )}
                      </span>
                      <span className="text-gray-500">
                        /{annual ? "year" : "month"}
                      </span>
                    </div>
                    {annual && (
                      <p className="text-sm text-green-600 mt-1">
                        Save{" "}
                        {formatPrice(
                          (plan.price[restaurantCurrency]?.monthly || 0) * 12 -
                            (plan.price[restaurantCurrency]?.yearly || 0),
                          restaurantCurrency as any
                        )}{" "}
                        per year
                      </p>
                    )}
                  </div>
                </CardHeader>

                <CardContent>
                  <motion.ul
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    className="space-y-3 mb-6"
                  >
                    {plan.features.map((feature, i) => (
                      <motion.li
                        key={i}
                        variants={cardVariants}
                        className="flex items-start gap-2"
                      >
                        <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </motion.li>
                    ))}
                  </motion.ul>
                  {isCurrentPlan ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center"
                    >
                      <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm">
                        <Check className="h-4 w-4" />
                        Your Current Plan
                      </div>
                    </motion.div>
                  ) : isSelected ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center"
                    >
                      <div className="inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
                        <Check className="h-4 w-4" />
                        Selected
                      </div>
                    </motion.div>
                  ) : null}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Upgrade Information */}
      {selectedPlan && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex justify-center"
        >
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-w-2xl">
            <h3 className="font-medium text-green-800 mb-2">
              What happens when you upgrade?
            </h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-green-700">
              <div>
                <h4 className="font-medium mb-1">During Trial Period:</h4>
                <ul className="space-y-1">
                  <li>• Your trial period is preserved</li>
                  <li>• Plan changes immediately</li>
                  <li>• No additional charges until trial ends</li>
                  <li>• New features available right away</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-1">After Trial Period:</h4>
                <ul className="space-y-1">
                  <li>• Plan changes immediately</li>
                  <li>• Prorated charges may apply</li>
                  <li>• New features available right away</li>
                  <li>• Next billing date remains the same</li>
                </ul>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Proration Information */}
      {selectedPlan &&
        currentPlan &&
        currentSubscriptionDetails &&
        !isInTrial && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex justify-center"
          >
            {(() => {
              const proration = calculateProration(
                currentPlan.id,
                selectedPlan,
                currentPlan.billingCycle,
                annual ? "yearly" : "monthly",
                restaurantCurrency,
                currentSubscriptionDetails.currentPeriodStart || new Date(),
                currentSubscriptionDetails.currentPeriodEnd || new Date()
              );

              return (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-2xl w-full">
                  <h3 className="font-medium text-blue-800 mb-3">
                    💳 Billing Details
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-blue-700">
                        Current Plan:
                      </span>
                      <span className="font-medium text-blue-800">
                        {formatCurrency(
                          proration.currentPlanPrice,
                          restaurantCurrency
                        )}{" "}
                        / {currentPlan.billingCycle}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-blue-700">New Plan:</span>
                      <span className="font-medium text-blue-800">
                        {formatCurrency(
                          proration.newPlanPrice,
                          restaurantCurrency
                        )}{" "}
                        / {annual ? "year" : "month"}
                      </span>
                    </div>
                    <div className="border-t border-blue-200 pt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-blue-800">
                          Today's Charge:
                        </span>
                        <span
                          className={`font-bold ${getProrationColor(proration.isUpgrade, proration.isDowngrade)}`}
                        >
                          {proration.prorationAmount > 0
                            ? `+${formatCurrency(proration.prorationAmount, restaurantCurrency)}`
                            : proration.prorationAmount < 0
                              ? `-${formatCurrency(Math.abs(proration.prorationAmount), restaurantCurrency)}`
                              : "No charge"}
                        </span>
                      </div>
                    </div>
                    <div className="bg-blue-100 rounded-md p-3 border border-blue-200">
                      <p className="text-sm text-blue-800 font-medium">
                        {proration.message}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()}
          </motion.div>
        )}

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex justify-center"
      >
        <div className="space-y-4 w-full max-w-md text-center">
          <Button
            onClick={handleContinue}
            disabled={!selectedPlan || isLoading}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : selectedPlan && isInTrial ? (
              "Upgrade Now (Trial Preserved)"
            ) : (
              "Continue to Checkout"
            )}
          </Button>
          <p className="text-sm text-gray-500">
            You can cancel or change your plan at any time
          </p>
        </div>
      </motion.div>
    </div>
  );
}
