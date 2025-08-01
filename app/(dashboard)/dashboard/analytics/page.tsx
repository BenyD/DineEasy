"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Calendar,
  Download,
  RefreshCw,
  Filter,
  Eye,
  BarChart3,
} from "lucide-react";
import { useRestaurantSettings } from "@/lib/store/restaurant-settings";
import { formatAmountWithCurrency } from "@/lib/utils/currency";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Area,
} from "recharts";

import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Mock data
const mockAnalytics = {
  revenue: {
    today: 1245.67,
    yesterday: 1189.34,
    thisWeek: 8234.56,
    lastWeek: 7890.12,
    thisMonth: 32456.78,
    lastMonth: 29876.45,
  },
  orders: {
    today: 45,
    yesterday: 42,
    thisWeek: 312,
    lastWeek: 298,
    thisMonth: 1245,
    lastMonth: 1189,
  },
  customers: {
    today: 23,
    yesterday: 21,
    thisWeek: 156,
    lastWeek: 149,
    thisMonth: 623,
    lastMonth: 594,
  },
  avgOrderValue: {
    today: 27.68,
    yesterday: 28.32,
    thisWeek: 26.39,
    lastWeek: 26.48,
    thisMonth: 26.07,
    lastMonth: 25.13,
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
    { hour: "16:00", orders: 6, revenue: 156.0 },
    { hour: "17:00", orders: 15, revenue: 405.0 },
    { hour: "18:00", orders: 25, revenue: 675.0 },
    { hour: "19:00", orders: 30, revenue: 810.0 },
    { hour: "20:00", orders: 28, revenue: 756.0 },
    { hour: "21:00", orders: 20, revenue: 540.0 },
    { hour: "22:00", orders: 10, revenue: 270.0 },
  ],
  weeklyData: [
    { date: "Mon", revenue: 1250, orders: 45, customers: 120 },
    { date: "Tue", revenue: 1420, orders: 52, customers: 145 },
    { date: "Wed", revenue: 1680, orders: 61, customers: 168 },
    { date: "Thu", revenue: 1580, orders: 58, customers: 162 },
    { date: "Fri", revenue: 1890, orders: 70, customers: 189 },
    { date: "Sat", revenue: 2100, orders: 78, customers: 210 },
    { date: "Sun", revenue: 1940, orders: 72, customers: 195 },
  ],
};

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
    },
  },
};

const cardHoverVariants = {
  hover: {
    scale: 1.02,
    transition: {
      type: "spring",
      stiffness: 400,
    },
  },
};

const buttonHoverVariants = {
  hover: { scale: 1.05 },
  tap: { scale: 0.95 },
};

const iconRotateVariants = {
  hover: {
    rotate: 360,
    transition: {
      duration: 0.5,
    },
  },
};

const StatCard = ({
  title,
  value,
  previousValue,
  icon,
  formatter = (val: number) => val.toString(),
}: {
  title: string;
  value: number;
  previousValue: number;
  icon: React.ReactNode;
  formatter?: (val: number) => string;
}) => {
  const { currency } = useRestaurantSettings();
  const change = value - previousValue;
  const changePercent = previousValue > 0 ? (change / previousValue) * 100 : 0;
  const isPositive = change >= 0;

  return (
    <Card className="bg-white shadow-sm border-gray-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatter(value)}
            </p>
            <div className="flex items-center space-x-1">
              {isPositive ? (
                <TrendingUp className="w-4 h-4 text-green-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500" />
              )}
              <span
                className={`text-sm font-medium ${
                  isPositive ? "text-green-600" : "text-red-600"
                }`}
              >
                {isPositive ? "+" : ""}
                {changePercent.toFixed(1)}%
              </span>
              <span className="text-sm text-gray-500">vs yesterday</span>
            </div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function AnalyticsPage() {
  const [selectedPeriod, setSelectedPeriod] =
    useState<keyof typeof mockAnalytics.revenue>("today");
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([
    "revenue",
    "orders",
    "customers",
    "avgOrderValue",
  ]);
  const [selectedChart, setSelectedChart] = useState("revenue");
  const { currency } = useRestaurantSettings();

  const resetFilters = () => {
    setSelectedPeriod("today");
    setSelectedMetrics(["revenue", "orders", "customers", "avgOrderValue"]);
    setSelectedChart("revenue");
  };

  const handleExportReport = () => {
    // Mock export functionality
    console.log("Exporting analytics report...");
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-500">
            Track your restaurant&apos;s performance and insights
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={resetFilters}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Reset
          </Button>
          <Button
            size="sm"
            onClick={handleExportReport}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="period" className="text-sm font-medium">
                Time Period
              </Label>
              <Select
                value={selectedPeriod}
                onValueChange={(value) =>
                  setSelectedPeriod(value as keyof typeof mockAnalytics.revenue)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                  <SelectItem value="thisWeek">This Week</SelectItem>
                  <SelectItem value="lastWeek">Last Week</SelectItem>
                  <SelectItem value="thisMonth">This Month</SelectItem>
                  <SelectItem value="lastMonth">Last Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="metrics" className="text-sm font-medium">
                Metrics
              </Label>
              <Select
                value={selectedMetrics.join(",")}
                onValueChange={(value) => setSelectedMetrics(value.split(","))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="revenue,orders,customers,avgOrderValue">
                    All Metrics
                  </SelectItem>
                  <SelectItem value="revenue">Revenue Only</SelectItem>
                  <SelectItem value="orders">Orders Only</SelectItem>
                  <SelectItem value="customers">Customers Only</SelectItem>
                  <SelectItem value="avgOrderValue">
                    Avg Order Value Only
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="chart" className="text-sm font-medium">
                Chart Type
              </Label>
              <Select value={selectedChart} onValueChange={setSelectedChart}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="revenue">Revenue Trend</SelectItem>
                  <SelectItem value="orders">Orders Trend</SelectItem>
                  <SelectItem value="customers">Customers Trend</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${selectedPeriod}-${selectedMetrics.join(",")}`}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {selectedMetrics.includes("revenue") && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, delay: 0 }}
              layout
            >
              <StatCard
                title="Revenue"
                value={
                  mockAnalytics.revenue[
                    selectedPeriod as keyof typeof mockAnalytics.revenue
                  ]
                }
                previousValue={mockAnalytics.revenue.yesterday}
                icon={<DollarSign className="w-6 h-6 text-green-600" />}
                formatter={(val) => formatAmountWithCurrency(val, currency)}
              />
            </motion.div>
          )}

          {selectedMetrics.includes("orders") && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              layout
            >
              <StatCard
                title="Orders"
                value={
                  mockAnalytics.orders[
                    selectedPeriod as keyof typeof mockAnalytics.orders
                  ]
                }
                previousValue={mockAnalytics.orders.yesterday}
                icon={<ShoppingCart className="w-6 h-6 text-blue-600" />}
              />
            </motion.div>
          )}

          {selectedMetrics.includes("customers") && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              layout
            >
              <StatCard
                title="Customers"
                value={
                  mockAnalytics.customers[
                    selectedPeriod as keyof typeof mockAnalytics.customers
                  ]
                }
                previousValue={mockAnalytics.customers.yesterday}
                icon={<Users className="w-6 h-6 text-purple-600" />}
              />
            </motion.div>
          )}

          {selectedMetrics.includes("avgOrderValue") && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, delay: 0.3 }}
              layout
            >
              <StatCard
                title="Avg Order Value"
                value={
                  mockAnalytics.avgOrderValue[
                    selectedPeriod as keyof typeof mockAnalytics.avgOrderValue
                  ]
                }
                previousValue={mockAnalytics.avgOrderValue.yesterday}
                icon={<TrendingUp className="w-6 h-6 text-amber-600" />}
                formatter={(val) => formatAmountWithCurrency(val, currency)}
              />
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Charts */}
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        variants={containerVariants}
      >
        {/* Weekly Revenue Trend */}
        <motion.div
          variants={itemVariants}
          whileHover={cardHoverVariants.hover}
        >
          <Card>
            <CardHeader>
              <CardTitle>Weekly Revenue Trend</CardTitle>
              <CardDescription>
                Revenue performance over the past week
              </CardDescription>
            </CardHeader>
            <CardContent>
              <motion.div
                className="h-[300px] w-full"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={mockAnalytics.weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ fill: "#10b981" }}
                      name="Revenue (CHF)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Hourly Orders Distribution */}
        <motion.div
          variants={itemVariants}
          whileHover={cardHoverVariants.hover}
        >
          <Card>
            <CardHeader>
              <CardTitle>Hourly Orders Distribution</CardTitle>
              <CardDescription>
                Order patterns throughout the day
              </CardDescription>
            </CardHeader>
            <CardContent>
              <motion.div
                className="h-[300px] w-full"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mockAnalytics.hourlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="orders" fill="#6366f1" name="Orders" />
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Top Menu Items */}
        <motion.div
          variants={itemVariants}
          whileHover={cardHoverVariants.hover}
        >
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Menu Items</CardTitle>
              <CardDescription>
                Top performing menu items by revenue
              </CardDescription>
            </CardHeader>
            <CardContent>
              <motion.div
                className="h-[300px] w-full"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={mockAnalytics.topItems}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name} (${(percent * 100).toFixed(0)}%)`
                      }
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="revenue"
                    >
                      {mockAnalytics.topItems.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Weekly Performance */}
        <motion.div
          variants={itemVariants}
          whileHover={cardHoverVariants.hover}
        >
          <Card>
            <CardHeader>
              <CardTitle>Weekly Performance Overview</CardTitle>
              <CardDescription>
                Combined view of key performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <motion.div
                className="h-[300px] w-full"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={mockAnalytics.weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Bar
                      yAxisId="left"
                      dataKey="orders"
                      fill="#6366f1"
                      name="Orders"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="customers"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      name="Customers"
                    />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="revenue"
                      fill="#10b981"
                      stroke="#059669"
                      name="Revenue (CHF)"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
