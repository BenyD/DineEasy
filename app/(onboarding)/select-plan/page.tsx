"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { createSubscription } from "@/lib/actions/subscription";
import { getUserRestaurants } from "@/lib/actions/restaurant";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PLANS } from "@/lib/constants";
import { toast } from "sonner";

type Plan = keyof typeof PLANS;

export default function SelectPlanPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan>("starter");
  const [interval, setInterval] = useState<"monthly" | "yearly">("monthly");

  async function onSubmit(plan: Plan) {
    setIsLoading(true);

    try {
      // Get user's restaurant
      const { restaurants, error: restaurantError } =
        await getUserRestaurants();
      if (restaurantError || !restaurants?.length) {
        toast.error("No restaurant found. Please create one first.");
        return;
      }

      const formData = new FormData();
      formData.append("restaurant_id", restaurants[0].id);
      formData.append("plan", plan);
      formData.append("interval", interval);

      const result = await createSubscription(formData);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="container relative min-h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-1 lg:px-0">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[800px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Choose your plan
          </h1>
          <p className="text-sm text-muted-foreground">
            Select a plan that best fits your restaurant's needs
          </p>
        </div>

        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-4 bg-gray-100 p-1 rounded-lg">
            <Button
              variant={interval === "monthly" ? "default" : "ghost"}
              onClick={() => setInterval("monthly")}
              className="relative"
            >
              Monthly
            </Button>
            <Button
              variant={interval === "yearly" ? "default" : "ghost"}
              onClick={() => setInterval("yearly")}
              className="relative"
            >
              Yearly
              <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-1 py-0.5 rounded">
                -20%
              </span>
            </Button>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="grid gap-6 grid-cols-1 sm:grid-cols-3"
        >
          {(Object.keys(PLANS) as Array<Plan>).map((plan) => (
            <Card
              key={plan}
              className={`relative ${
                selectedPlan === plan
                  ? "border-green-500 ring-1 ring-green-500"
                  : ""
              }`}
            >
              <CardHeader>
                <CardTitle>
                  <div className="flex items-center justify-between">
                    <span>{PLANS[plan].name}</span>
                    <div className="text-2xl font-bold">
                      {PLANS[plan].currency} {PLANS[plan].price[interval]}
                      <span className="text-sm font-normal text-gray-500">
                        /{interval === "monthly" ? "mo" : "yr"}
                      </span>
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {PLANS[plan].features.map((feature: string, i: number) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                  {plan === "starter" &&
                    PLANS.starter.negativeFeatures?.map(
                      (feature: string, i: number) => (
                        <li
                          key={i}
                          className="flex items-center gap-2 text-gray-400"
                        >
                          <Check className="h-4 w-4" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      )
                    )}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  onClick={() => {
                    setSelectedPlan(plan);
                    onSubmit(plan);
                  }}
                  disabled={isLoading}
                >
                  {isLoading && selectedPlan === plan
                    ? "Processing..."
                    : "Select Plan"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </motion.div>

        <p className="text-center text-sm text-gray-500">
          All plans include a {process.env.NEXT_PUBLIC_TRIAL_DAYS}-day free
          trial. No credit card required.
        </p>
      </div>
    </div>
  );
}
