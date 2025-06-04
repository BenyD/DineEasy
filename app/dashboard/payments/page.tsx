"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { CreditCard, ExternalLink, Check, AlertCircle, RefreshCw, Smartphone, Banknote } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function PaymentsPage() {
  const [stripeConnected, setStripeConnected] = useState(true)
  const [isConnecting, setIsConnecting] = useState(false)
  const [paymentMethods, setPaymentMethods] = useState({
    creditCard: true,
    twint: true,
    cash: true,
  })
  const [payoutSchedule, setPayoutSchedule] = useState("daily")

  const handleConnectStripe = async () => {
    setIsConnecting(true)
    // Simulate API call to create Stripe Connect OAuth link
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setStripeConnected(true)
    setIsConnecting(false)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payment Settings</h1>
        <p className="text-gray-500">Configure how you accept payments from customers</p>
      </div>

      {/* Stripe Connection Status */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Card className={stripeConnected ? "border-green-200" : "border-amber-200"}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full ${stripeConnected ? "bg-green-100" : "bg-amber-100"}`}>
                  <CreditCard className={`h-6 w-6 ${stripeConnected ? "text-green-600" : "text-amber-600"}`} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">
                    {stripeConnected ? "Stripe Connected" : "Stripe Not Connected"}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {stripeConnected
                      ? "Your Stripe account is connected and ready to accept payments"
                      : "Connect your Stripe account to accept online payments"}
                  </p>
                </div>
              </div>

              <div>
                {stripeConnected ? (
                  <Badge className="bg-green-100 text-green-800">Connected</Badge>
                ) : (
                  <Button
                    onClick={handleConnectStripe}
                    disabled={isConnecting}
                    className="bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
                  >
                    {isConnecting ? (
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Connecting...
                      </div>
                    ) : (
                      "Connect Stripe"
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Warning Alert - Show only when Stripe is not connected */}
      {!stripeConnected && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Alert variant="warning" className="bg-amber-50 border-amber-200">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800">Payment Processing Limited</AlertTitle>
            <AlertDescription className="text-amber-700">
              Without Stripe connected, customers can only pay with cash. Connect your Stripe account to accept credit
              cards and TWINT payments.
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Payment Methods */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
            <CardDescription>Choose which payment methods to offer your customers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Credit Card */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <Label htmlFor="creditCard" className="text-base font-medium">
                    Credit & Debit Cards
                  </Label>
                  <p className="text-sm text-gray-500">Visa, Mastercard, American Express</p>
                </div>
              </div>
              <Switch
                id="creditCard"
                checked={paymentMethods.creditCard && stripeConnected}
                onCheckedChange={(checked) => setPaymentMethods({ ...paymentMethods, creditCard: checked })}
                disabled={!stripeConnected}
              />
            </div>

            <Separator />

            {/* TWINT */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Smartphone className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <Label htmlFor="twint" className="text-base font-medium">
                    TWINT
                  </Label>
                  <p className="text-sm text-gray-500">Swiss mobile payment solution</p>
                </div>
              </div>
              <Switch
                id="twint"
                checked={paymentMethods.twint && stripeConnected}
                onCheckedChange={(checked) => setPaymentMethods({ ...paymentMethods, twint: checked })}
                disabled={!stripeConnected}
              />
            </div>

            <Separator />

            {/* Cash */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Banknote className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <Label htmlFor="cash" className="text-base font-medium">
                    Cash Payment
                  </Label>
                  <p className="text-sm text-gray-500">Pay at the table or counter</p>
                </div>
              </div>
              <Switch
                id="cash"
                checked={paymentMethods.cash}
                onCheckedChange={(checked) => setPaymentMethods({ ...paymentMethods, cash: checked })}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stripe Settings - Only show when connected */}
      {stripeConnected && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Stripe Configuration</CardTitle>
              <CardDescription>Manage your Stripe payment processing settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Payout Schedule */}
              <div className="space-y-2">
                <Label htmlFor="payoutSchedule">Payout Schedule</Label>
                <Select value={payoutSchedule} onValueChange={setPayoutSchedule}>
                  <SelectTrigger id="payoutSchedule">
                    <SelectValue placeholder="Select payout schedule" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500">How often you want to receive payments from Stripe</p>
              </div>

              <Separator />

              {/* Account Information */}
              <div className="space-y-4">
                <h3 className="font-medium">Account Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Account ID</Label>
                    <div className="p-2 bg-gray-50 rounded border text-sm font-mono">acct_1234567890abcdef</div>
                  </div>
                  <div className="space-y-2">
                    <Label>Account Status</Label>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-100 text-green-800">
                        <Check className="w-3 h-3 mr-1" />
                        Active
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Processing Fees */}
              <div className="space-y-4">
                <h3 className="font-medium">Processing Fees</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Credit/Debit Cards:</span>
                    <span className="font-medium">2.9% + CHF 0.30</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>TWINT:</span>
                    <span className="font-medium">1.5% + CHF 0.30</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Cash:</span>
                    <span className="font-medium">Free</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Manage in Stripe Dashboard
                </Button>
                <Button variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Connection
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Test Mode Notice */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.4 }}
      >
        <Alert className="bg-blue-50 border-blue-200">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-800">Test Mode Active</AlertTitle>
          <AlertDescription className="text-blue-700">
            Your Stripe account is currently in test mode. No real payments will be processed. Switch to live mode in
            your Stripe dashboard when you're ready to accept real payments.
          </AlertDescription>
        </Alert>
      </motion.div>
    </div>
  )
}
