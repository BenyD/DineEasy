"use client";

import type React from "react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Users,
  Star,
  Filter,
  Download,
  RefreshCw,
  Clock,
  ChevronDown,
} from "lucide-react";
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
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  const percentageChange = ((value - previousValue) / previousValue) * 100;
  const isPositive = percentageChange > 0;

  return (
    <motion.div whileHover={cardHoverVariants.hover}>
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between space-y-0">
            <h3 className="text-sm font-medium tracking-tight text-gray-500">
              {title}
            </h3>
            <motion.div whileHover={iconRotateVariants.hover}>
              {icon}
            </motion.div>
          </div>
          <motion.div
            className="mt-2"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            <div className="text-2xl font-bold">{formatter(value)}</div>
            <p className="text-xs text-gray-500">
              vs. yesterday
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`ml-2 font-medium ${
                  isPositive ? "text-green-600" : "text-red-600"
                }`}
              >
                {isPositive ? "+" : ""}
                {percentageChange.toFixed(1)}%
              </motion.span>
            </p>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default function AnalyticsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("today");
  const [selectedMetrics, setSelectedMetrics] = useState([
    "revenue",
    "orders",
    "customers",
    "avgOrderValue",
  ]);

  const resetFilters = () => {
    setSelectedPeriod("today");
    setSelectedMetrics(["revenue", "orders", "customers", "avgOrderValue"]);
  };

  const handleExportReport = () => {
    console.log(`Exporting report for ${selectedPeriod}`);
  };

  return (
    <motion.div
      className="flex-1 space-y-6 p-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header */}
      <motion.div
        className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
        variants={itemVariants}
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Track your restaurant's performance and insights
          </p>
        </div>
        <motion.div
          className="flex items-center gap-2"
          whileHover={buttonHoverVariants.hover}
          whileTap={buttonHoverVariants.tap}
        >
          <Button variant="outline" size="sm" onClick={handleExportReport}>
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </Button>
        </motion.div>
      </motion.div>

      {/* Filters Card */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters & Analytics
            </CardTitle>
            <CardDescription>
              Customize your analytics view and reporting preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              variants={itemVariants}
            >
              {/* Time Period Filter */}
              <motion.div className="space-y-2" whileHover={{ scale: 1.01 }}>
                <Label>Time Period</Label>
                <Select
                  value={selectedPeriod}
                  onValueChange={setSelectedPeriod}
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
                    <SelectItem value="thisYear">This Year</SelectItem>
                    <SelectItem value="lastYear">Last Year</SelectItem>
                  </SelectContent>
                </Select>
              </motion.div>
            </motion.div>

            <Separator />

            {/* Metrics Selection */}
            <motion.div variants={itemVariants}>
              <Label className="mb-3 block">Metrics to Display</Label>
              <motion.div
                className="flex flex-wrap gap-2"
                variants={containerVariants}
              >
                {[
                  { id: "revenue", label: "Revenue", icon: DollarSign },
                  { id: "orders", label: "Orders", icon: ShoppingCart },
                  { id: "customers", label: "Customers", icon: Users },
                  {
                    id: "avgOrderValue",
                    label: "Avg Order Value",
                    icon: TrendingUp,
                  },
                ].map(({ id, label, icon: Icon }) => (
                  <motion.div
                    key={id}
                    whileHover={buttonHoverVariants.hover}
                    whileTap={buttonHoverVariants.tap}
                  >
                    <Button
                      variant={
                        selectedMetrics.includes(id) ? "default" : "outline"
                      }
                      onClick={() => {
                        if (selectedMetrics.includes(id)) {
                          setSelectedMetrics(
                            selectedMetrics.filter((m) => m !== id)
                          );
                        } else {
                          setSelectedMetrics([...selectedMetrics, id]);
                        }
                      }}
                      className={
                        selectedMetrics.includes(id)
                          ? "bg-green-600 hover:bg-green-700"
                          : ""
                      }
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {label}
                    </Button>
                  </motion.div>
                ))}
                <motion.div
                  whileHover={buttonHoverVariants.hover}
                  whileTap={buttonHoverVariants.tap}
                >
                  <Button
                    variant="outline"
                    onClick={resetFilters}
                    className="ml-auto"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reset
                  </Button>
                </motion.div>
              </motion.div>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Key Metrics */}
      <AnimatePresence mode="wait">
        <motion.div
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
          variants={containerVariants}
        >
          {selectedMetrics.includes("revenue") && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
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
                formatter={(val) => `CHF ${val.toFixed(2)}`}
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
                formatter={(val) => `CHF ${val.toFixed(2)}`}
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
    </motion.div>
  );
}
