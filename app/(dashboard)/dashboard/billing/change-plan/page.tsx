"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Check, X, ArrowRight } from "lucide-react";
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

// Mock data - replace with real data fetching
const currentPlan = {
  name: "Pro",
  billingCycle: "monthly",
};

export default function ChangePlanPage() {
  const [annual, setAnnual] = useState(currentPlan.billingCycle === "yearly");
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

  const plans = [
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
      {/* Header */}
      <div className="space-y-1">
        <Link
          href="/dashboard/billing"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Billing
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Change Subscription Plan
        </h1>
        <p className="text-lg text-gray-500">
          Select a new plan that better fits your needs
        </p>
      </div>

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
      <div className="grid gap-8 md:grid-cols-3">
        {plans.map((plan, index) => {
          const isCurrentPlan =
            plan.id.toLowerCase() === currentPlan.name.toLowerCase();
          const isSelected = plan.id === selectedPlan;

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
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
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-green-600 to-green-500 px-4 py-1 text-sm font-medium text-white shadow-sm">
                    Most Popular
                  </div>
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
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                    {plan.negativeFeatures?.map((feature, i) => (
                      <li key={`neg-${i}`} className="flex items-start gap-2">
                        <X className="h-4 w-4 text-gray-300 mt-0.5 shrink-0" />
                        <span className="text-sm text-gray-500">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {isCurrentPlan ? (
                    <div className="text-center">
                      <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
                        <Check className="h-4 w-4" />
                        Current Plan
                      </div>
                    </div>
                  ) : isSelected ? (
                    <div className="text-center">
                      <div className="inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
                        <Check className="h-4 w-4" />
                        Selected
                      </div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center pt-6">
        <div className="space-y-4 w-full max-w-md text-center">
          <Button
            onClick={handleContinue}
            disabled={!selectedPlan || isLoading}
            size="lg"
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Processing...
              </div>
            ) : (
              <>
                Continue to Checkout
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
          <p className="text-sm text-gray-500">
            Your current subscription will be prorated automatically
          </p>
        </div>
      </div>
    </div>
  );
}
