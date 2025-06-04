"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  BarChart3,
  DollarSign,
  ShoppingCart,
  Users,
  X,
} from "lucide-react";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { DashboardAlert } from "@/components/dashboard/DashboardAlert";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const [showTrialBanner, setShowTrialBanner] = useState(true);
  const [showConnectBanner, setShowConnectBanner] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);

  // Mock data - in a real app, this would come from the backend
  const trialDaysRemaining = 12;
  const [isStripeConnected, setIsStripeConnected] = useState(false);

  useEffect(() => {
    // Check if user just connected Stripe (from URL parameter)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("stripe_connected") === "true") {
      setIsStripeConnected(true);
      setShowConnectBanner(false);

      // Remove the query parameter from URL without page refresh
      window.history.replaceState({}, document.title, window.location.pathname);

      // Show success message
      alert("Stripe connected successfully! You can now accept payments.");
    } else {
      // Check localStorage for connection status
      const stripeConnected =
        localStorage.getItem("stripeConnected") === "true";
      setIsStripeConnected(stripeConnected);
      setShowConnectBanner(!stripeConnected);
    }
  }, []);

  const handleConnectStripe = async () => {
    setIsConnecting(true);

    // Simulate API call to create Stripe Connect OAuth link
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // In a real app, this would be the actual Stripe Connect OAuth URL
    // const stripeConnectUrl = `https://connect.stripe.com/oauth/authorize?response_type=code&client_id=${STRIPE_CLIENT_ID}&scope=read_write&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`

    // For the prototype, simulate the external redirect and return
    // window.open(stripeConnectUrl, '_blank')

    // Simulate successful connection after a delay
    setTimeout(() => {
      localStorage.setItem("stripeConnected", "true");
      setIsStripeConnected(true);
      setShowConnectBanner(false);
      setIsConnecting(false);
      alert("Stripe connected successfully! You can now accept payments.");
    }, 2000);
  };

  return (
    <div className="p-8">
      {/* Trial Banner */}
      {showTrialBanner && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <DashboardAlert
            variant="success"
            title={`🎉 You're on your 14-day free trial — ${trialDaysRemaining} days remaining!`}
            description="Full access to your selected plan. Upgrade anytime to continue after your trial ends."
            onClose={() => setShowTrialBanner(false)}
          >
            <div className="mt-3">
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => (window.location.href = "/pricing")}
              >
                Upgrade Plan
              </Button>
            </div>
          </DashboardAlert>
        </motion.div>
      )}

      {/* Stripe Connect Banner */}
      {showConnectBanner && !isStripeConnected && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="mb-6"
        >
          <DashboardAlert
            variant="warning"
            title="Connect your Stripe account to accept payments"
            description="Your customers won't be able to pay with Stripe or TWINT until you connect your account. This takes just 2 minutes."
            onClose={() => setShowConnectBanner(false)}
          >
            <div className="mt-3">
              <Button
                size="sm"
                className="bg-amber-600 hover:bg-amber-700 text-white"
                onClick={handleConnectStripe}
                disabled={isConnecting}
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
            </div>
          </DashboardAlert>
        </motion.div>
      )}

      <div className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-500">
          Welcome back! Here's what's happening at your restaurant.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <DashboardCard
          title="Total Revenue"
          value="$12,345"
          description="This month"
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
          trend={{ value: 12, isPositive: true }}
        />
        <DashboardCard
          title="Orders"
          value="234"
          description="This week"
          icon={<ShoppingCart className="h-4 w-4 text-muted-foreground" />}
          trend={{ value: 8, isPositive: true }}
        />
        <DashboardCard
          title="Customers"
          value="1,234"
          description="Total served"
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
          trend={{ value: 15, isPositive: true }}
        />
        <DashboardCard
          title="Avg Order Value"
          value="$52.80"
          description="Per order"
          icon={<BarChart3 className="h-4 w-4 text-muted-foreground" />}
          trend={{ value: 3, isPositive: false }}
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border bg-white p-6">
          <h3 className="text-lg font-semibold">Recent Orders</h3>
          <p className="text-sm text-gray-500">
            Latest orders from your restaurant
          </p>
          <div className="mt-4 space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between border-b pb-2"
              >
                <div>
                  <p className="font-medium">Table {i + 2}</p>
                  <p className="text-sm text-gray-500">2 items • $24.50</p>
                </div>
                <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-700">
                  Preparing
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border bg-white p-6">
          <h3 className="text-lg font-semibold">Popular Items</h3>
          <p className="text-sm text-gray-500">Most ordered items this week</p>
          <div className="mt-4 space-y-4">
            {[
              { name: "Margherita Pizza", orders: 45 },
              { name: "Caesar Salad", orders: 32 },
              { name: "Pasta Carbonara", orders: 28 },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <p className="font-medium">{item.name}</p>
                <span className="text-sm text-gray-500">
                  {item.orders} orders
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
