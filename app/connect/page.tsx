"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { ArrowRight, Check, CreditCard, ShieldCheck, Smartphone, AlertCircle, ChefHat } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function ConnectPage() {
  const [isLoading, setIsLoading] = useState(false)

  const handleConnect = async () => {
    setIsLoading(true)
    // Simulate API call to create Stripe Connect OAuth link
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // In a real app, this would redirect to Stripe Connect OAuth URL
    // window.location.href = stripeConnectUrl

    // Redirect to setup page after connecting
    window.location.href = "/setup"
  }

  const handleSkip = () => {
    // Allow users to skip Stripe connection and go directly to setup
    window.location.href = "/setup"
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
          <div className="text-sm text-gray-500">Step 3 of 4</div>
        </div>
      </div>

      <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-8"
        >
          <div className="text-center">
            <h1 className="text-3xl font-bold">Connect Your Stripe Account</h1>
            <p className="text-gray-500 mt-2">
              Allow your customers to pay with Stripe and TWINT directly to your bank account
            </p>
          </div>

          <Card>
            <CardContent className="p-8">
              <div className="space-y-8">
                <div className="flex flex-col md:flex-row gap-6 md:gap-12 items-center">
                  <div className="w-full md:w-1/2">
                    <img
                      src="/placeholder.svg?height=300&width=400"
                      alt="Stripe Connect"
                      className="w-full rounded-lg shadow-lg"
                    />
                  </div>
                  <div className="w-full md:w-1/2 space-y-6">
                    <h2 className="text-2xl font-semibold">Accept payments directly to your bank account</h2>
                    <p className="text-gray-600">
                      DineEasy uses Stripe Connect to process payments directly to your bank account. We only charge a
                      2% commission on successful payments.
                    </p>
                    <ul className="space-y-3">
                      {[
                        "Funds go directly to your bank account",
                        "Accept credit cards and TWINT payments",
                        "Automatic payouts on your schedule",
                        "Only 2% commission on successful payments",
                      ].map((item, index) => (
                        <motion.li
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 * index }}
                          className="flex items-center gap-2"
                        >
                          <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                          <span>{item}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6 pt-4">
                  <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                    <div className="flex justify-center mb-4">
                      <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                        <CreditCard className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                    <h3 className="font-medium text-center mb-2">Credit Card Payments</h3>
                    <p className="text-sm text-gray-500 text-center">
                      Accept all major credit cards from customers worldwide
                    </p>
                  </div>

                  <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                    <div className="flex justify-center mb-4">
                      <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                        <Smartphone className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                    <h3 className="font-medium text-center mb-2">TWINT Integration</h3>
                    <p className="text-sm text-gray-500 text-center">
                      Let Swiss customers pay directly with the TWINT mobile app
                    </p>
                  </div>

                  <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                    <div className="flex justify-center mb-4">
                      <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                        <ShieldCheck className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                    <h3 className="font-medium text-center mb-2">Secure & Compliant</h3>
                    <p className="text-sm text-gray-500 text-center">PCI compliant and secure payment processing</p>
                  </div>
                </div>

                <div className="pt-4 text-center space-y-4">
                  <Button
                    size="lg"
                    onClick={handleConnect}
                    disabled={isLoading}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Connecting to Stripe...
                      </div>
                    ) : (
                      <>
                        Connect with Stripe
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>

                  <div>
                    <Button variant="ghost" onClick={handleSkip} className="text-gray-500 hover:text-gray-700">
                      Skip for now
                    </Button>
                  </div>

                  <p className="text-xs text-gray-500">
                    By connecting, you agree to Stripe's{" "}
                    <a href="https://stripe.com/legal/connect-account" className="text-green-600 hover:underline">
                      Terms of Service
                    </a>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-medium">Don't have a Stripe account?</h3>
                <p className="text-sm text-gray-600 mt-1">
                  No problem! You'll be guided through creating a Stripe account during the connection process. It only
                  takes a few minutes. You can also skip this step and set it up later from your dashboard.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
