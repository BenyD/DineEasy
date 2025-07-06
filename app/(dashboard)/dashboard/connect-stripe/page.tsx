"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Building2,
  Building,
  Shield,
  ShieldCheck,
  Check,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function ConnectStripePage() {
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    // Redirect to Stripe Connect OAuth flow
    window.location.href = "/api/stripe/connect";
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="space-y-1">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => window.history.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Connect Your Stripe Account
        </h1>
        <p className="text-lg text-gray-500">
          Set up secure payments for your restaurant
        </p>
      </div>

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card>
          <CardContent className="p-8 space-y-8">
            {/* Benefits */}
            <div className="flex flex-col md:flex-row gap-6 md:gap-12 items-center">
              <div className="w-full md:w-1/2 space-y-6">
                <h2 className="text-2xl font-semibold">
                  Accept payments directly to your bank account
                </h2>
                <p className="text-gray-600">
                  DineEasy uses Stripe Connect to process payments directly to
                  your bank account. We only charge a 2% commission on
                  successful card payments.
                </p>
                <ul className="space-y-3">
                  {[
                    "Funds go directly to your bank account",
                    "Accept all major credit cards",
                    "Automatic payouts on your schedule",
                    "Only 2% commission on card payments",
                    "Cash payments are free of charge",
                  ].map((item, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className="flex items-center gap-2"
                    >
                      <Check className="h-5 w-5 text-green-500 shrink-0" />
                      <span>{item}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>
              <div className="w-full md:w-1/2">
                <div className="grid gap-4">
                  <div className="flex items-start gap-3 bg-gray-50 p-4 rounded-lg">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Building2 className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">Business Information</p>
                      <p className="text-sm text-gray-500">
                        Your business name, address, and registration details
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 bg-gray-50 p-4 rounded-lg">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Building className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">Bank Account</p>
                      <p className="text-sm text-gray-500">
                        Your business bank account for receiving payments
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 bg-gray-50 p-4 rounded-lg">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Shield className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium">Identity Verification</p>
                      <p className="text-sm text-gray-500">
                        Personal ID and business verification documents
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Features Grid */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <div className="flex justify-center mb-4">
                  <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                    <CreditCard className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <h3 className="font-medium text-center mb-2">Card Payments</h3>
                <p className="text-sm text-gray-500 text-center">
                  Accept all major credit cards from customers worldwide
                </p>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <div className="flex justify-center mb-4">
                  <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                    <Building className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <h3 className="font-medium text-center mb-2">Fast Payouts</h3>
                <p className="text-sm text-gray-500 text-center">
                  Get your money quickly with automatic bank transfers
                </p>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <div className="flex justify-center mb-4">
                  <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                    <ShieldCheck className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <h3 className="font-medium text-center mb-2">
                  Secure & Compliant
                </h3>
                <p className="text-sm text-gray-500 text-center">
                  PCI compliant and secure payment processing
                </p>
              </div>
            </div>

            {/* Connect Button */}
            <div className="pt-4 text-center space-y-4">
              <Button
                onClick={handleConnect}
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
              <p className="text-xs text-gray-500">
                By connecting, you agree to Stripe's{" "}
                <a
                  href="https://stripe.com/legal/connect-account"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-600 hover:text-green-700 underline"
                >
                  Terms of Service
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Help Notice */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
              <AlertCircle className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-medium">Need Help?</h3>
              <p className="text-sm text-gray-600 mt-1">
                Our support team is here to help you with the Stripe connection
                process. If you have any questions, please don't hesitate to
                contact us through the help section in your dashboard.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
