"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { Calendar, TrendingUp, DollarSign, ShoppingCart, Users, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

// Mock analytics data
const mockAnalytics = {
  revenue: {
    today: 1250.5,
    yesterday: 980.25,
    thisWeek: 8750.0,
    lastWeek: 7200.0,
    thisMonth: 32500.0,
    lastMonth: 28900.0,
  },
  orders: {
    today: 45,
    yesterday: 38,
    thisWeek: 312,
    lastWeek: 285,
    thisMonth: 1250,
    lastMonth: 1180,
  },
  customers: {
    today: 120,
    yesterday: 95,
    thisWeek: 850,
    lastWeek: 780,
    thisMonth: 3200,
    lastMonth: 2950,
  },
  avgOrderValue: {
    today: 27.8,
    yesterday: 25.85,
    thisWeek: 28.05,
    lastWeek: 25.26,
    thisMonth: 26.0,
    lastMonth: 24.5,
  },
  topItems: [
    { name: "Margherita Pizza", orders: 89, revenue: 1958.0 },
    { name: "Caesar Salad", orders: 67, revenue: 1105.5 },
    { name: "Spaghetti Carbonara", orders: 54, revenue: 1323.0 },
    { name: "House Wine Red", orders: 78, revenue: 663.0 },
    { name: "Tiramisu", orders: 43, revenue: 408.5 },
  ],
  hourlyData: [
    { hour: "11:00", orders: 5, revenue: 125.5 },
    { hour: "12:00", orders: 12, revenue: 324.0 },
    { hour: "13:00", orders: 18, revenue: 486.5 },
    { hour: "14:00", orders: 8, revenue: 215.0 },
    { hour: "15:00", orders: 2, revenue: 45.0 },
  ],
}

export default function AnalyticsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("today")

  const getPercentageChange = (current: number, previous: number) => {
    const change = ((current - previous) / previous) * 100
    return {
      value: Math.abs(change).toFixed(1),
      isPositive: change >= 0,
    }
  }

  const StatCard = ({
    title,
    value,
    previousValue,
    icon,
    formatter = (val: number) => val.toString(),
  }: {
    title: string
    value: number
    previousValue: number
    icon: React.ReactNode
    formatter?: (val: number) => string
  }) => {
    const change = getPercentageChange(value, previousValue)

    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{title}</p>
              <p className="text-2xl font-bold text-gray-900">{formatter(value)}</p>
              <div className="flex items-center mt-1">
                <TrendingUp className={`w-4 h-4 mr-1 ${change.isPositive ? "text-green-500" : "text-red-500"}`} />
                <span className={`text-sm ${change.isPositive ? "text-green-600" : "text-red-600"}`}>
                  {change.isPositive ? "+" : "-"}
                  {change.value}%
                </span>
                <span className="text-sm text-gray-500 ml-1">vs yesterday</span>
              </div>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">{icon}</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-500">Track your restaurant's performance and insights</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="thisWeek">This Week</SelectItem>
              <SelectItem value="thisMonth">This Month</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Calendar className="w-4 h-4 mr-2" />
            Custom Range
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0 }}
        >
          <StatCard
            title="Revenue"
            value={mockAnalytics.revenue[selectedPeriod as keyof typeof mockAnalytics.revenue]}
            previousValue={mockAnalytics.revenue.yesterday}
            icon={<DollarSign className="w-6 h-6 text-green-600" />}
            formatter={(val) => `CHF ${val.toFixed(2)}`}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <StatCard
            title="Orders"
            value={mockAnalytics.orders[selectedPeriod as keyof typeof mockAnalytics.orders]}
            previousValue={mockAnalytics.orders.yesterday}
            icon={<ShoppingCart className="w-6 h-6 text-green-600" />}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <StatCard
            title="Customers"
            value={mockAnalytics.customers[selectedPeriod as keyof typeof mockAnalytics.customers]}
            previousValue={mockAnalytics.customers.yesterday}
            icon={<Users className="w-6 h-6 text-green-600" />}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <StatCard
            title="Avg Order Value"
            value={mockAnalytics.avgOrderValue[selectedPeriod as keyof typeof mockAnalytics.avgOrderValue]}
            previousValue={mockAnalytics.avgOrderValue.yesterday}
            icon={<TrendingUp className="w-6 h-6 text-green-600" />}
            formatter={(val) => `CHF ${val.toFixed(2)}`}
          />
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Menu Items */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                Top Menu Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockAnalytics.topItems.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-sm font-semibold text-green-700">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-500">{item.orders} orders</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">CHF {item.revenue.toFixed(2)}</p>
                      <Badge variant="outline" className="text-xs">
                        {(
                          (item.revenue / mockAnalytics.revenue[selectedPeriod as keyof typeof mockAnalytics.revenue]) *
                          100
                        ).toFixed(1)}
                        %
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Hourly Performance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Today's Hourly Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockAnalytics.hourlyData.map((hour, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-600 w-12">{hour.hour}</span>
                      <div className="flex-1">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-linear-to-r from-green-500 to-emerald-600 h-2 rounded-full"
                            style={{ width: `${(hour.orders / 20) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-sm font-semibold text-gray-900">{hour.orders} orders</p>
                      <p className="text-xs text-gray-500">CHF {hour.revenue.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Chart Placeholder */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.6 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-linear-to-br from-green-50 to-emerald-50 rounded-lg flex items-center justify-center border-2 border-dashed border-green-200">
              <div className="text-center">
                <TrendingUp className="w-12 h-12 text-green-400 mx-auto mb-2" />
                <p className="text-gray-500">Chart visualization coming soon</p>
                <p className="text-sm text-gray-400">Revenue trends and analytics charts</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
