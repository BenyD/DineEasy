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
  Clock,
  ArrowRight,
} from "lucide-react";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { DashboardAlert } from "@/components/dashboard/DashboardAlert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function DashboardPage() {
  const [showTrialBanner, setShowTrialBanner] = useState(true);
  const [showConnectBanner, setShowConnectBanner] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);

  // Mock data - in a real app, this would come from the backend
  const trialDaysRemaining = 12;
  const [isStripeConnected, setIsStripeConnected] = useState(false);

  // Mock recent activities data
  const recentActivities = [
    {
      id: 1,
      type: "order",
      description: "New order received from Table 5",
      time: "5 minutes ago",
      status: "new",
    },
    {
      id: 2,
      type: "menu",
      description: "Menu item 'Margherita Pizza' updated",
      time: "15 minutes ago",
      status: "update",
    },
    {
      id: 3,
      type: "payment",
      description: "Payment received for Order #1234",
      time: "30 minutes ago",
      status: "success",
    },
    {
      id: 4,
      type: "table",
      description: "Table 3 marked as available",
      time: "1 hour ago",
      status: "info",
    },
    {
      id: 5,
      type: "staff",
      description: "New staff member added: John Doe",
      time: "2 hours ago",
      status: "new",
    },
  ];

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

      <div className="mt-8">
        <div className="rounded-lg border bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">Recent Activities</h3>
              <p className="text-sm text-gray-500">
                Latest actions and updates in your restaurant
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-sm"
              onClick={() => (window.location.href = "/dashboard/activity")}
            >
              View All
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between border-b pb-4 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      activity.status === "new"
                        ? "bg-blue-100 text-blue-600"
                        : activity.status === "update"
                        ? "bg-amber-100 text-amber-600"
                        : activity.status === "success"
                        ? "bg-green-100 text-green-600"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    <Clock className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {activity.description}
                    </p>
                    <p className="text-sm text-gray-500">{activity.time}</p>
                  </div>
                </div>
                <Badge
                  className={`${
                    activity.status === "new"
                      ? "bg-blue-100 text-blue-600"
                      : activity.status === "update"
                      ? "bg-amber-100 text-amber-600"
                      : activity.status === "success"
                      ? "bg-green-100 text-green-600"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {activity.type}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
