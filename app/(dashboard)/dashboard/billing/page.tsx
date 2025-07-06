"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, ArrowRight, CreditCard, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { DashboardAlert } from "@/components/dashboard/DashboardAlert";
import { PLANS } from "@/lib/constants";

// Mock data - replace with real data fetching
const billingData = {
  plan: "Pro",
  price: 39,
  billingCycle: "monthly",
  nextBillingDate: new Date("2024-05-01"),
  trialEndsAt: new Date("2024-04-15"),
  stripeConnected: true,
  usage: {
    tables: { used: 8, limit: 12 },
    menuItems: { used: 75, limit: 100 },
    staff: { used: 2, limit: 3 },
  },
};

function calculateDaysLeft(endDate: Date) {
  const now = new Date();
  const diff = endDate.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export default function BillingPage() {
  const daysLeft = calculateDaysLeft(billingData.trialEndsAt);
  const isTrialActive = daysLeft > 0;

  if (!billingData.stripeConnected) {
    return (
      <div className="p-6 space-y-8 max-w-3xl mx-auto">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Set Up Billing
          </h1>
          <p className="text-lg text-gray-500">
            Add a payment method to start your DineEasy subscription
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-amber-100">
                  <AlertCircle className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <CardTitle>Payment Method Required</CardTitle>
                  <CardDescription>
                    Please add a payment method to continue using DineEasy
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Before you can start your subscription, you'll need to:
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span>Add a payment method</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span>Choose your subscription plan</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span>Start your free trial</span>
                  </li>
                </ul>
              </div>

              <div className="pt-4">
                <Button
                  className="w-full bg-green-600 hover:bg-green-700 text-white h-12 text-lg"
                  onClick={() =>
                    (window.location.href = "/dashboard/billing/change-plan")
                  }
                >
                  <CreditCard className="h-5 w-5 mr-2" />
                  Choose a Plan
                </Button>
                <p className="text-xs text-gray-500 text-center mt-3">
                  You'll be guided through a secure payment setup process
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {isTrialActive && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <DashboardAlert
              variant="info"
              title={`Trial Status: ${daysLeft} days remaining`}
              description="Set up your payment method before your trial ends to continue using DineEasy without interruption."
            />
          </motion.div>
        )}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Billing & Subscription
        </h1>
        <p className="text-lg text-gray-500">
          Manage your subscription plan and billing details
        </p>
      </div>

      {/* Trial Status Alert */}
      {isTrialActive && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <DashboardAlert
            variant="success"
            title={`🎉 You're on your 14-day free trial — ${daysLeft} days remaining!`}
            description={`You're currently on the ${
              billingData.plan
            } plan. Your card will be charged CHF ${
              billingData.price
            } on ${formatDate(billingData.nextBillingDate)} unless you cancel.`}
          >
            <div className="mt-3">
              <Button className="bg-green-600 hover:bg-green-700 text-white">
                Upgrade Now
              </Button>
            </div>
          </DashboardAlert>
        </motion.div>
      )}

      <div className="grid gap-8 md:grid-cols-2">
        {/* Current Plan Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Current Plan</CardTitle>
                  <CardDescription>Your subscription details</CardDescription>
                </div>
                <Badge
                  className={`${
                    isTrialActive
                      ? "bg-blue-100 text-blue-800"
                      : "bg-green-100 text-green-800"
                  }`}
                >
                  {isTrialActive ? "Trial" : "Active"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-green-700">
                  {billingData.plan} Plan
                </h3>
                <p className="text-sm text-gray-500">
                  CHF {billingData.price}/
                  {billingData.billingCycle === "monthly" ? "month" : "year"}
                </p>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Billing cycle</span>
                  <span className="font-medium capitalize">
                    {billingData.billingCycle}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Next billing date</span>
                  <span className="font-medium">
                    {formatDate(billingData.nextBillingDate)}
                  </span>
                </div>
                {isTrialActive && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Trial ends on</span>
                    <span className="font-medium">
                      {formatDate(billingData.trialEndsAt)}
                    </span>
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Plan Features</h4>
                <ul className="space-y-2.5">
                  {PLANS[
                    billingData.plan.toLowerCase() as keyof typeof PLANS
                  ].features.map((feature: string, index: number) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() =>
                    (window.location.href = "/dashboard/billing/change-plan")
                  }
                >
                  Change Plan
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => (window.location.href = "/api/stripe/portal")}
                >
                  Cancel Subscription
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Usage Stats Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Usage & Limits</CardTitle>
              <CardDescription>
                Monitor your current usage and plan limits
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Menu Items Usage */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Menu Items</span>
                  <span className="text-gray-500">
                    {billingData.usage.menuItems.used} of{" "}
                    {billingData.usage.menuItems.limit} used
                  </span>
                </div>
                <Progress
                  value={
                    (billingData.usage.menuItems.used /
                      billingData.usage.menuItems.limit) *
                    100
                  }
                  className="h-2 bg-gray-100 [&>div]:bg-green-600"
                />
              </div>

              {/* Tables Usage */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Tables with QR Codes</span>
                  <span className="text-gray-500">
                    {billingData.usage.tables.used} of{" "}
                    {billingData.usage.tables.limit} used
                  </span>
                </div>
                <Progress
                  value={
                    (billingData.usage.tables.used /
                      billingData.usage.tables.limit) *
                    100
                  }
                  className="h-2 bg-gray-100 [&>div]:bg-green-600"
                />
              </div>

              {/* Staff Usage */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Staff Accounts</span>
                  <span className="text-gray-500">
                    {billingData.usage.staff.used} of{" "}
                    {billingData.usage.staff.limit} used
                  </span>
                </div>
                <Progress
                  value={
                    (billingData.usage.staff.used /
                      billingData.usage.staff.limit) *
                    100
                  }
                  className="h-2 bg-gray-100 [&>div]:bg-green-600"
                />
              </div>

              <Separator />

              {/* Stripe Portal Link */}
              <div className="space-y-3">
                <h4 className="font-medium">Payment & Billing</h4>
                <p className="text-sm text-gray-500">
                  View your payment history and manage your payment methods
                  through our secure Stripe portal.
                </p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => (window.location.href = "/api/stripe/portal")}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Manage Billing in Stripe
                </Button>
              </div>

              {/* Contextual Upgrade Card */}
              {billingData.plan.toLowerCase() !== "elite" && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <h4 className="font-medium">Ready to grow?</h4>
                    <div className="rounded-lg bg-green-50 p-4 space-y-3">
                      {billingData.plan.toLowerCase() === "pro" ? (
                        <>
                          <p className="text-sm text-green-800">
                            Upgrade to Elite for unlimited tables, staff
                            accounts, and enhanced analytics. Plus, get priority
                            24/7 support and early access to AI features!
                          </p>
                          <Button
                            className="w-full bg-green-600 hover:bg-green-700 text-white"
                            onClick={() =>
                              (window.location.href =
                                "/dashboard/billing/change-plan")
                            }
                          >
                            Upgrade to Elite
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <p className="text-sm text-green-800">
                            Upgrade to Pro for more tables, staff accounts, and
                            advanced features like role-based permissions and
                            analytics!
                          </p>
                          <Button
                            className="w-full bg-green-600 hover:bg-green-700 text-white"
                            onClick={() =>
                              (window.location.href =
                                "/dashboard/billing/change-plan")
                            }
                          >
                            Upgrade to Pro
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
