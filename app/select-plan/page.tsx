"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { ArrowRight, Check, ChefHat } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PLANS } from "@/lib/constants"

export default function SelectPlanPage() {
  const [annual, setAnnual] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState("pro")
  const [isLoading, setIsLoading] = useState(false)

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
  ]

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId)
  }

  const handleContinue = async () => {
    setIsLoading(true)

    // Simulate loading
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Go directly to mock Stripe checkout with URL parameters
    const params = new URLSearchParams({
      plan: selectedPlan,
      cycle: annual ? "yearly" : "monthly",
    })
    window.location.href = `/stripe-checkout?${params.toString()}`
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Background Pattern */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(#e0f2e9_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <ChefHat className="h-8 w-8 text-green-600" />
            <span className="text-2xl font-bold">DineEasy</span>
          </div>
          <div className="text-sm text-gray-500">Step 1 of 4</div>
        </div>
      </div>

      <div className="container max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">Choose Your Plan</h1>
          <p className="text-lg text-gray-500 mb-8">Start your 14-day free trial. No credit card required.</p>

          <div className="flex items-center justify-center gap-4 rounded-full border bg-white p-1 shadow-sm max-w-[300px] mx-auto">
            <span className={`text-sm ${!annual ? "font-medium text-green-600" : "text-gray-500"}`}>Monthly</span>
            <Switch checked={annual} onCheckedChange={setAnnual} className="data-[state=checked]:bg-green-600" />
            <span className={`text-sm ${annual ? "font-medium text-green-600" : "text-gray-500"}`}>
              Yearly <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">Save 20%</span>
            </span>
          </div>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-3 mb-12">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card
                className={`relative cursor-pointer transition-all duration-200 hover:shadow-lg ${
                  selectedPlan === plan.id
                    ? "ring-2 ring-green-500 shadow-lg"
                    : plan.highlighted
                      ? "border-green-200 shadow-md"
                      : ""
                }`}
                onClick={() => handlePlanSelect(plan.id)}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-0 right-0 mx-auto w-fit rounded-full bg-gradient-to-r from-green-500 to-emerald-600 px-4 py-1 text-sm font-medium text-white">
                    Most Popular
                  </div>
                )}

                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription>
                    {plan.name === "Starter" && "Perfect for small restaurants"}
                    {plan.name === "Pro" && "Ideal for growing restaurants"}
                    {plan.name === "Elite" && "For established restaurants"}
                  </CardDescription>
                  <div className="mt-4">
                    <div className="flex items-end justify-center">
                      <span className="text-3xl font-bold">${annual ? plan.price.yearly : plan.price.monthly}</span>
                      <span className="text-gray-500">/{annual ? "year" : "month"}</span>
                    </div>
                    {annual && (
                      <p className="text-sm text-green-600 mt-1">
                        Save ${(plan.price.monthly * 12 - plan.price.yearly).toFixed(2)} per year
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
                  </ul>

                  {selectedPlan === plan.id && (
                    <div className="text-center">
                      <div className="inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
                        <Check className="h-4 w-4" />
                        Selected
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-center"
        >
          <Button
            onClick={handleContinue}
            disabled={isLoading}
            size="lg"
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-8"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Setting up your trial...
              </div>
            ) : (
              <>
                Continue to Checkout
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>

          <p className="text-sm text-gray-500 mt-4">
            14-day free trial • Cancel anytime • Only 2% commission on payments
          </p>
        </motion.div>
      </div>
    </div>
  )
}
