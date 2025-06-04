"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { CreditCard, ExternalLink, Clock, CheckCircle, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Mock billing data
const billingData = {
  plan: "Pro",
  price: 11.99,
  billingCycle: "monthly",
  trialEndsAt: "2025-06-15",
  nextBillingDate: "2025-06-15",
  paymentMethod: {
    type: "card",
    last4: "4242",
    expiryMonth: 12,
    expiryYear: 2026,
    brand: "visa",
  },
  invoices: [
    {
      id: "INV-001",
      date: "2025-05-15",
      amount: 11.99,
      status: "paid",
      description: "DineEasy Pro Plan - Monthly",
    },
    {
      id: "INV-002",
      date: "2025-04-15",
      amount: 11.99,
      status: "paid",
      description: "DineEasy Pro Plan - Monthly",
    },
    {
      id: "INV-003",
      date: "2025-03-15",
      amount: 11.99,
      status: "paid",
      description: "DineEasy Pro Plan - Monthly",
    },
  ],
  usage: {
    orders: {
      current: 1247,
      limit: 5000,
    },
    tables: {
      current: 12,
      limit: 20,
    },
    staff: {
      current: 3,
      limit: 5,
    },
  },
}

// Calculate days left in trial
const calculateDaysLeft = (endDate: string) => {
  const end = new Date(endDate)
  const now = new Date()
  const diffTime = end.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date)
}

export default function BillingPage() {
  const [activeTab, setActiveTab] = useState("subscription")
  const daysLeft = calculateDaysLeft(billingData.trialEndsAt)
  const isTrialActive = daysLeft > 0

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Billing & Subscription</h1>
        <p className="text-gray-500">Manage your subscription plan and billing details</p>
      </div>

      {/* Trial Status Alert */}
      {isTrialActive && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <Alert className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <div className="flex items-start justify-between w-full">
              <div className="flex gap-3">
                <Clock className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <AlertTitle className="text-green-800 font-medium">
                    🎉 You're on your 14-day free trial — {daysLeft} days remaining!
                  </AlertTitle>
                  <AlertDescription className="text-green-700 mt-1">
                    You're currently on the {billingData.plan} plan. Your card will be charged CHF {billingData.price}{" "}
                    on {formatDate(billingData.nextBillingDate)} unless you cancel.
                  </AlertDescription>
                </div>
              </div>
              <div>
                <Button className="bg-green-600 hover:bg-green-700 text-white">Upgrade Now</Button>
              </div>
            </div>
          </Alert>
        </motion.div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
          <TabsTrigger value="payment">Payment Methods</TabsTrigger>
          <TabsTrigger value="invoices">Billing History</TabsTrigger>
        </TabsList>

        {/* Subscription Tab */}
        <TabsContent value="subscription">
          <div className="grid gap-6 md:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Current Plan</CardTitle>
                  <CardDescription>Your subscription details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-green-700">{billingData.plan} Plan</h3>
                      <p className="text-sm text-gray-500">
                        CHF {billingData.price}/{billingData.billingCycle === "monthly" ? "month" : "year"}
                      </p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">{isTrialActive ? "Trial" : "Active"}</Badge>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Billing cycle</span>
                      <span className="font-medium capitalize">{billingData.billingCycle}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Next billing date</span>
                      <span className="font-medium">{formatDate(billingData.nextBillingDate)}</span>
                    </div>
                    {isTrialActive && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Trial ends on</span>
                        <span className="font-medium">{formatDate(billingData.trialEndsAt)}</span>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="font-medium">Plan Features</h4>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Unlimited menu items</span>
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Up to {billingData.usage.tables.limit} tables with QR codes</span>
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Up to {billingData.usage.orders.limit} orders per month</span>
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Up to {billingData.usage.staff.limit} staff accounts</span>
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Analytics & reporting</span>
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Email support</span>
                      </li>
                    </ul>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button variant="outline">Change Plan</Button>
                    <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                      Cancel Subscription
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Usage</CardTitle>
                  <CardDescription>Your current usage metrics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Orders</span>
                      <span className="text-sm text-gray-500">
                        {billingData.usage.orders.current} / {billingData.usage.orders.limit}
                      </span>
                    </div>
                    <Progress
                      value={(billingData.usage.orders.current / billingData.usage.orders.limit) * 100}
                      className="h-2"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Tables</span>
                      <span className="text-sm text-gray-500">
                        {billingData.usage.tables.current} / {billingData.usage.tables.limit}
                      </span>
                    </div>
                    <Progress
                      value={(billingData.usage.tables.current / billingData.usage.tables.limit) * 100}
                      className="h-2"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Staff Accounts</span>
                      <span className="text-sm text-gray-500">
                        {billingData.usage.staff.current} / {billingData.usage.staff.limit}
                      </span>
                    </div>
                    <Progress
                      value={(billingData.usage.staff.current / billingData.usage.staff.limit) * 100}
                      className="h-2"
                    />
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="font-medium">Need More?</h4>
                    <p className="text-sm text-gray-500">
                      Upgrade to our Elite plan for unlimited tables, higher order limits, and priority support.
                    </p>
                    <Button className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 w-full">
                      Upgrade to Elite
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </TabsContent>

        {/* Payment Methods Tab */}
        <TabsContent value="payment">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <Card>
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
                <CardDescription>Manage your payment methods</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold">
                      {billingData.paymentMethod.brand.toUpperCase().slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-medium">
                        {billingData.paymentMethod.brand.charAt(0).toUpperCase() +
                          billingData.paymentMethod.brand.slice(1)}{" "}
                        •••• {billingData.paymentMethod.last4}
                      </p>
                      <p className="text-sm text-gray-500">
                        Expires {billingData.paymentMethod.expiryMonth}/{billingData.paymentMethod.expiryYear}
                      </p>
                    </div>
                  </div>
                  <Badge>Default</Badge>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline">
                    <CreditCard className="w-4 h-4 mr-2" />
                    Add Payment Method
                  </Button>
                  <Button variant="outline">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Manage in Stripe
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Invoices Tab */}
        <TabsContent value="invoices">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <Card>
              <CardHeader>
                <CardTitle>Billing History</CardTitle>
                <CardDescription>View and download your invoices</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {billingData.invoices.map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{invoice.description}</p>
                        <div className="flex items-center gap-4 mt-1">
                          <p className="text-sm text-gray-500">{invoice.id}</p>
                          <p className="text-sm text-gray-500">{formatDate(invoice.date)}</p>
                          <Badge
                            className={
                              invoice.status === "paid" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
                            }
                          >
                            {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="font-bold">CHF {invoice.amount.toFixed(2)}</p>
                        <Button variant="outline" size="sm">
                          <Download className="w-4 h-4 mr-2" />
                          PDF
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6">
                  <Button variant="outline" className="w-full">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View All Invoices in Stripe
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
