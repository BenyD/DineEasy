"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  DollarSign,
  ShoppingCart,
  Users,
  ArrowUpIcon,
  ArrowDownIcon,
  Clock,
  ChevronRight,
  Timer,
  CheckCircle,
  AlertCircle,
  Bell,
  CreditCard,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const [currentTime] = useState(new Date());

  // Mock data - in a real app, this would come from the backend
  const stats = [
    {
      title: "Total Revenue",
      value: "$12,345",
      description: "This month",
      icon: DollarSign,
      trend: { value: 12, isPositive: true },
      color: "green",
    },
    {
      title: "Orders",
      value: "234",
      description: "This week",
      icon: ShoppingCart,
      trend: { value: 8, isPositive: true },
      color: "amber",
    },
    {
      title: "Customers",
      value: "1,234",
      description: "Total served",
      icon: Users,
      trend: { value: 15, isPositive: true },
      color: "blue",
    },
    {
      title: "Avg Order Value",
      value: "$52.80",
      description: "Per order",
      icon: BarChart3,
      trend: { value: 3, isPositive: false },
      color: "red",
    },
  ];

  const recentOrders = [
    {
      id: 1,
      table: "Table 4",
      items: 3,
      total: "$38.50",
      status: "Preparing",
      time: "5 min ago",
    },
    {
      id: 2,
      table: "Table 2",
      items: 2,
      total: "$24.50",
      status: "Ready",
      time: "8 min ago",
    },
    {
      id: 3,
      table: "Table 7",
      items: 4,
      total: "$52.00",
      status: "Served",
      time: "15 min ago",
    },
  ];

  const recentPayments = [
    {
      id: 1,
      amount: "$38.50",
      method: "Credit Card",
      status: "Completed",
      time: "5 min ago",
      last4: "4242",
      customer: "Table 4",
    },
    {
      id: 2,
      amount: "$52.75",
      method: "Cash",
      status: "Completed",
      time: "12 min ago",
      customer: "Table 8",
    },
    {
      id: 3,
      amount: "$24.50",
      method: "Cash",
      status: "Completed",
      time: "25 min ago",
      customer: "Table 2",
    },
    {
      id: 4,
      amount: "$42.00",
      method: "Credit Card",
      status: "Pending",
      time: "2 min ago",
      last4: "8556",
      customer: "Table 6",
    },
  ];

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">
            Welcome back! Here's what's happening at your restaurant.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-gray-400" />
            <span className="text-sm text-gray-500">
              {currentTime.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card
              className={cn(
                "border",
                stat.color === "green" && "bg-green-50 border-green-200",
                stat.color === "amber" && "bg-amber-50 border-amber-200",
                stat.color === "blue" && "bg-blue-50 border-blue-200",
                stat.color === "red" && "bg-red-50 border-red-200"
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p
                      className={cn(
                        "text-sm font-medium",
                        stat.color === "green" && "text-green-800",
                        stat.color === "amber" && "text-amber-800",
                        stat.color === "blue" && "text-blue-800",
                        stat.color === "red" && "text-red-800"
                      )}
                    >
                      {stat.title}
                    </p>
                    <p
                      className={cn(
                        "text-2xl font-bold",
                        stat.color === "green" && "text-green-900",
                        stat.color === "amber" && "text-amber-900",
                        stat.color === "blue" && "text-blue-900",
                        stat.color === "red" && "text-red-900"
                      )}
                    >
                      {stat.value}
                    </p>
                  </div>
                  <stat.icon
                    className={cn(
                      "h-8 w-8",
                      stat.color === "green" && "text-green-600",
                      stat.color === "amber" && "text-amber-600",
                      stat.color === "blue" && "text-blue-600",
                      stat.color === "red" && "text-red-600"
                    )}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-sm text-gray-500">{stat.description}</p>
                  <div
                    className={cn(
                      "flex items-center text-xs font-medium",
                      stat.trend.isPositive ? "text-green-600" : "text-red-600"
                    )}
                  >
                    {stat.trend.isPositive ? (
                      <ArrowUpIcon className="w-3 h-3 mr-1" />
                    ) : (
                      <ArrowDownIcon className="w-3 h-3 mr-1" />
                    )}
                    {stat.trend.value}%
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Orders */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Orders</CardTitle>
                  <CardDescription>
                    Latest orders from your restaurant
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-green-600 border-green-200 hover:bg-green-50"
                >
                  View all
                  <ChevronRight className="ml-1 w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between py-4 border-b last:border-0"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{order.table}</p>
                        <Badge
                          variant={
                            order.status === "Preparing"
                              ? "default"
                              : order.status === "Ready"
                              ? "outline"
                              : "secondary"
                          }
                          className={cn(
                            order.status === "Preparing" &&
                              "bg-amber-100 text-amber-800 border-amber-200",
                            order.status === "Ready" &&
                              "bg-green-100 text-green-800 border-green-200",
                            order.status === "Served" &&
                              "bg-blue-100 text-blue-800 border-blue-200"
                          )}
                        >
                          {order.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {order.time}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{order.total}</p>
                      <p className="text-sm text-muted-foreground">
                        {order.items} items
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Payments */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Payments</CardTitle>
                  <CardDescription>
                    Latest transactions from customers
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-green-600 border-green-200 hover:bg-green-50"
                >
                  View all
                  <ChevronRight className="ml-1 w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentPayments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between py-4 border-b last:border-0"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{payment.customer}</p>
                        <Badge
                          variant="outline"
                          className="bg-green-50 text-green-700 border-green-200"
                        >
                          {payment.method}
                          {payment.last4 && (
                            <span className="ml-1">•••• {payment.last4}</span>
                          )}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {payment.time}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{payment.amount}</p>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-xs",
                          payment.status === "Completed"
                            ? "bg-green-100 text-green-700"
                            : "bg-amber-100 text-amber-700"
                        )}
                      >
                        {payment.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
