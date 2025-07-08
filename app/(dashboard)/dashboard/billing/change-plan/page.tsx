"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Check, X, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { PLANS } from "@/lib/constants";
import Link from "next/link";

interface Plan {
  id: string;
  name: string;
  price: {
    readonly monthly: number;
    readonly yearly: number;
  };
  currency: string;
  features: readonly string[];
  negativeFeatures?: readonly string[];
  highlighted?: boolean;
  limits: {
    readonly staff: number | "unlimited";
    readonly analytics: false | "basic" | "advanced";
    readonly roles: boolean;
    readonly tables: number | "unlimited";
  };
}

type BillingCycle = "monthly" | "yearly";

interface CurrentPlan {
  id: string;
  name: string;
  billingCycle: BillingCycle;
}

// Mock data - replace with real data fetching
const currentPlan: CurrentPlan = {
  id: "pro",
  name: "Pro",
  billingCycle: "monthly",
};

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
  const [annual, setAnnual] = useState<boolean>(
    currentPlan.billingCycle === "yearly"
  );
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handlePlanSelect = (planId: string) => {
    if (planId.toLowerCase() === currentPlan.name.toLowerCase()) return;
    setSelectedPlan(planId);
  };

  const handleContinue = async () => {
    if (!selectedPlan) return;
    setIsLoading(true);

    // Here you would typically:
    // 1. Call your API to create a Stripe checkout session
    // 2. Redirect to Stripe checkout
    window.location.href = `/api/stripe/create-checkout-session?plan=${selectedPlan}&cycle=${
      annual ? "yearly" : "monthly"
    }&isUpgrade=true`;
  };

  const plans: Plan[] = [
    {
      id: "starter",
      ...PLANS.starter,
      highlighted: false,
    },
    {
      id: "pro",
      ...PLANS.pro,
      highlighted: true,
    },
    {
      id: "elite",
      ...PLANS.elite,
      highlighted: false,
    },
  ];

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
              Save 20%
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
                className={`relative cursor-pointer transition-all hover:shadow-lg ${
                  isSelected
                    ? "border-green-200 ring-1 ring-green-500"
                    : isCurrentPlan
                    ? "border-blue-200 bg-blue-50/50"
                    : "hover:border-green-200"
                }`}
                onClick={() => handlePlanSelect(plan.id)}
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
                        CHF {annual ? plan.price.yearly : plan.price.monthly}
                      </span>
                      <span className="text-gray-500">
                        /{annual ? "year" : "month"}
                      </span>
                    </div>
                    {annual && (
                      <p className="text-sm text-green-600 mt-1">
                        Save CHF{" "}
                        {(plan.price.monthly * 12 - plan.price.yearly).toFixed(
                          2
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
                    {plan.negativeFeatures?.map((feature, i) => (
                      <motion.li
                        key={`neg-${i}`}
                        variants={cardVariants}
                        className="flex items-start gap-2"
                      >
                        <X className="h-4 w-4 text-gray-300 mt-0.5 shrink-0" />
                        <span className="text-sm text-gray-500">{feature}</span>
                      </motion.li>
                    ))}
                  </motion.ul>

                  {isCurrentPlan ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center"
                    >
                      <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
                        <Check className="h-4 w-4" />
                        Current Plan
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
