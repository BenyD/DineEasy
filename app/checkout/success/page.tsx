"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Check, ArrowRight, ChefHat } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function CheckoutSuccessPage() {
  const [sessionData, setSessionData] = useState({
    sessionId: "",
    plan: "pro",
    cycle: "monthly",
  })

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    setSessionData({
      sessionId: urlParams.get("session_id") || "",
      plan: urlParams.get("plan") || "pro",
      cycle: urlParams.get("cycle") || "monthly",
    })

    // In a real implementation, you would:
    // 1. Verify the session with Stripe
    // 2. Create the restaurant record in your database
    // 3. Set up the subscription and trial period
    // 4. Send confirmation email
  }, [])

  const handleContinue = () => {
    window.location.href = "/connect"
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Background Pattern */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(#e0f2e9_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <ChefHat className="h-8 w-8 text-green-600" />
            <span className="text-2xl font-bold">DineEasy</span>
          </div>
          <div className="text-sm text-gray-500">Payment Successful</div>
        </div>
      </div>

      <div className="container max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-8"
        >
          {/* Success Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="flex justify-center"
          >
            <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="h-10 w-10 text-green-600" />
            </div>
          </motion.div>

          {/* Success Message */}
          <div className="space-y-4">
            <h1 className="text-3xl font-bold text-gray-900">Payment Successful!</h1>
            <p className="text-lg text-gray-600">Your 14-day free trial has started. Welcome to DineEasy!</p>
          </div>

          {/* Success Details */}
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Plan</span>
                  <span className="font-medium capitalize">{sessionData.plan}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Billing</span>
                  <span className="font-medium capitalize">{sessionData.cycle}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Trial Period</span>
                  <span className="font-medium">14 days</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-600">Session ID</span>
                  <span className="font-mono text-sm text-gray-500">{sessionData.sessionId}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="font-semibold text-green-800 mb-2">What happens next?</h3>
            <ul className="text-sm text-green-700 space-y-1 text-left">
              <li>• Connect your Stripe account to accept payments</li>
              <li>• Set up your restaurant profile and menu</li>
              <li>• Generate QR codes for your tables</li>
              <li>• Start accepting orders from customers</li>
            </ul>
          </div>

          {/* Continue Button */}
          <Button
            onClick={handleContinue}
            size="lg"
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
          >
            Continue Setup
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>

          <p className="text-sm text-gray-500">You'll receive a confirmation email shortly with your trial details.</p>
        </motion.div>
      </div>
    </div>
  )
}
