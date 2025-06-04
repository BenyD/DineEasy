"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, Check, CreditCard, Lock, Shield, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function StripeCheckoutPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [planData, setPlanData] = useState({
    plan: "pro",
    cycle: "monthly",
    price: "11.99",
    planName: "Pro",
  })

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    setPlanData({
      plan: urlParams.get("plan") || "pro",
      cycle: urlParams.get("cycle") || "monthly",
      price: urlParams.get("price") || "11.99",
      planName: urlParams.get("plan_name") || "Pro",
    })
  }, [])

  const handlePayment = async () => {
    setIsLoading(true)

    // Simulate Stripe payment processing
    await new Promise((resolve) => setTimeout(resolve, 3000))

    // In a real implementation, Stripe would handle the payment and redirect to success_url
    // For now, we'll simulate a successful payment and redirect to the connect page
    const successUrl = new URL("/checkout/success", window.location.origin)
    successUrl.searchParams.set("session_id", "cs_mock_" + Math.random().toString(36).substr(2, 9))
    successUrl.searchParams.set("plan", planData.plan)
    successUrl.searchParams.set("cycle", planData.cycle)

    window.location.href = successUrl.toString()
  }

  const handleCancel = () => {
    window.location.href = "/select-plan"
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Stripe-like header */}
      <div className="bg-white border-b">
        <div className="container max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded bg-blue-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="font-semibold text-gray-900">Stripe Checkout</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Lock className="h-4 w-4" />
              Secure payment
            </div>
          </div>
        </div>
      </div>

      <div className="container max-w-2xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          {/* Mock Stripe Checkout Notice */}
          <Alert className="bg-blue-50 border-blue-200">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Demo Mode:</strong> This is a mock Stripe Checkout page for demonstration purposes. No real
              payment will be processed.
            </AlertDescription>
          </Alert>

          <Card className="overflow-hidden">
            <CardContent className="p-0">
              {/* Order Summary Header */}
              <div className="bg-gray-50 px-6 py-4 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-lg font-semibold">DineEasy {planData.planName} Plan</h1>
                    <p className="text-sm text-gray-500">
                      {planData.cycle === "yearly" ? "Annual" : "Monthly"} subscription
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">${planData.price}</div>
                    <div className="text-sm text-gray-500">/{planData.cycle === "yearly" ? "year" : "month"}</div>
                  </div>
                </div>
              </div>

              {/* Trial Information */}
              <div className="px-6 py-4 bg-green-50 border-b">
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-green-800">14-day free trial included</h3>
                    <p className="text-sm text-green-700 mt-1">
                      You won't be charged today. Your trial starts immediately and you can cancel anytime during the
                      trial period.
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Form Simulation */}
              <div className="p-6 space-y-6">
                <div>
                  <h2 className="text-lg font-semibold mb-4">Payment information</h2>

                  {/* Mock payment form */}
                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg bg-gray-50">
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-5 w-5 text-gray-400" />
                        <span className="text-gray-600">•••• •••• •••• 4242</span>
                        <span className="text-sm text-gray-500">Expires 12/28</span>
                        <div className="ml-auto flex gap-1">
                          <div className="h-6 w-8 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-bold">
                            VISA
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="text-sm text-gray-500">
                      <p>john.doe@example.com</p>
                    </div>
                  </div>
                </div>

                {/* Security badges */}
                <div className="flex items-center justify-center gap-6 py-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Shield className="h-4 w-4" />
                    <span>256-bit SSL encryption</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Lock className="h-4 w-4" />
                    <span>PCI DSS compliant</span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="space-y-3">
                  <Button
                    onClick={handlePayment}
                    disabled={isLoading}
                    className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Processing...
                      </div>
                    ) : (
                      <>
                        <Lock className="mr-2 h-4 w-4" />
                        Start free trial
                      </>
                    )}
                  </Button>

                  <Button variant="ghost" onClick={handleCancel} className="w-full" disabled={isLoading}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to plans
                  </Button>
                </div>

                <div className="text-center">
                  <p className="text-xs text-gray-500">
                    By confirming your subscription, you agree to DineEasy's{" "}
                    <a href="/terms" className="text-blue-600 hover:underline">
                      Terms of Service
                    </a>
                    . Your subscription will automatically renew after the trial period unless cancelled.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Powered by Stripe */}
          <div className="text-center">
            <p className="text-xs text-gray-400">
              Powered by <span className="font-semibold text-blue-600">Stripe</span>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
