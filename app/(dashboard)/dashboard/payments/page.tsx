"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  CreditCard,
  ExternalLink,
  Check,
  AlertCircle,
  RefreshCw,
  Banknote,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

// Add these types at the top level
type PaymentMethod = {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  iconColor: string;
  enabled: boolean;
};

// Mock data - replace with real data fetching
const stripeAccount = {
  id: "acct_1234567890abcdef",
  isConnected: true,
  status: "active",
  chargesEnabled: true,
  payoutsEnabled: true,
  detailsSubmitted: true,
};

// Update the mock data
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

// Add these animation variants at the top level
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
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [originalMethods, setOriginalMethods] = useState(paymentMethods);
  const [methods, setMethods] = useState(paymentMethods);

  const hasChanges =
    JSON.stringify(originalMethods) !== JSON.stringify(methods);

  const handleConnectStripe = async () => {
    setIsConnecting(true);
    // Redirect to Stripe Connect OAuth flow
    window.location.href = "/api/stripe/connect";
  };

  const handleRefreshConnection = async () => {
    // Refresh Stripe account status
    window.location.href = "/api/stripe/refresh-status";
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      // Here you would make an API call to save the changes
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call
      setOriginalMethods(methods);
      // Show success message or toast here
    } catch (error) {
      // Handle error here
      console.error("Failed to save payment methods:", error);
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

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-1"
      >
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Payment Settings
        </h1>
        <p className="text-lg text-gray-500">
          Configure how you accept payments from customers
        </p>
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-6"
      >
        {/* Stripe Connection Status */}
        {stripeAccount.isConnected && (
          <motion.div
            variants={cardVariants}
            whileHover="hover"
            className="transform transition-all duration-200"
          >
            <Card
              className={
                stripeAccount.isConnected
                  ? "border-green-200"
                  : "border-amber-200"
              }
            >
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
        {!stripeAccount.isConnected && (
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
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="space-y-4"
              >
                {methods.map((method: PaymentMethod) => (
                  <motion.div
                    key={method.id}
                    variants={cardVariants}
                    whileHover={{ x: 5 }}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/5 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <method.icon
                        className={cn("h-5 w-5", method.iconColor)}
                      />
                      <div>
                        <Label htmlFor={method.id} className="text-base">
                          {method.name}
                        </Label>
                        <p className="text-sm text-gray-500">
                          {method.description}
                        </p>
                      </div>
                    </div>
                    <Switch
                      id={method.id}
                      checked={method.enabled}
                      onCheckedChange={(checked) =>
                        handleMethodToggle(method.id, checked)
                      }
                      className="data-[state=checked]:bg-green-600"
                    />
                  </motion.div>
                ))}
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stripe Account Status */}
        {stripeAccount.isConnected && (
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
                        <Badge className="bg-green-100 text-green-800">
                          <Check className="w-3 h-3 mr-1" />
                          Active
                        </Badge>
                      </div>
                    </motion.div>
                  </div>
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
                        <span className="font-medium">2.9% + CHF 0.30</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>DineEasy Commission:</span>
                        <span className="font-medium">2.0%</span>
                      </div>
                      <div className="flex justify-between text-sm font-medium text-gray-900 pt-2 border-t">
                        <span>Total Fee per Card Transaction:</span>
                        <span>4.9% + CHF 0.30</span>
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
                          <span>CHF 100.00</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Stripe Fee (2.9% + CHF 0.30):</span>
                          <span>- CHF 3.20</span>
                        </div>
                        <div className="flex justify-between">
                          <span>DineEasy Commission (2%):</span>
                          <span>- CHF 2.00</span>
                        </div>
                        <div className="flex justify-between font-medium border-t border-blue-200 pt-1 mt-1">
                          <span>You Receive:</span>
                          <span>CHF 94.80</span>
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
                    onClick={() =>
                      (window.location.href = "https://dashboard.stripe.com")
                    }
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open Stripe Dashboard
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleRefreshConnection}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh Connection
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
