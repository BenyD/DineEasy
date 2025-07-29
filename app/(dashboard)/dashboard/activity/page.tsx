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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Filter,
  Search,
  Download,
  RefreshCw,
  Calendar,
  Clock,
  User,
  ShoppingCart,
  CreditCard,
  Settings,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Plus,
  Edit,
  Trash2,
  Eye,
  MoreHorizontal,
} from "lucide-react";
import { useRestaurantSettings } from "@/lib/store/restaurant-settings";
import { formatAmountWithCurrency } from "@/lib/utils/currency";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { BreadcrumbHeader } from "@/components/dashboard/breadcrumb-header";

// Mock activity data
const getMockActivities = (currency: string) => [
  {
    id: "1",
    type: "order",
    action: "Order completed",
    description: "Order for Table 5 has been marked as completed",
    user: {
      name: "John Doe",
      avatar: "/placeholder.svg?height=32&width=32&text=JD",
      role: "Manager",
    },
    timestamp: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
    details: {
      orderId: "1234",
      table: "5",
      amount: formatAmountWithCurrency(45.5, currency),
    },
  },
  {
    id: "2",
    type: "menu",
    action: "Menu item added",
    description: "New item 'Margherita Pizza' added to menu",
    user: {
      name: "Sarah Wilson",
      avatar: "/placeholder.svg?height=32&width=32&text=SW",
      role: "Chef",
    },
    timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
    details: {
      itemName: "Margherita Pizza",
      category: "Pizza",
      price: formatAmountWithCurrency(18.99, currency),
    },
  },
  {
    id: "3",
    type: "staff",
    action: "Staff member logged in",
    description: "Mike Johnson logged into the system",
    user: {
      name: "Mike Johnson",
      avatar: "/placeholder.svg?height=32&width=32&text=MJ",
      role: "Server",
    },
    timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    details: { loginTime: "2:30 PM", ipAddress: "192.168.1.100" },
  },
  {
    id: "4",
    type: "table",
    action: "QR code regenerated",
    description: "QR code for Table 8 has been regenerated",
    user: {
      name: "John Doe",
      avatar: "/placeholder.svg?height=32&width=32&text=JD",
      role: "Manager",
    },
    timestamp: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
    details: { tableNumber: "8", reason: "Customer request" },
  },
  {
    id: "5",
    type: "payment",
    action: "Payment processed",
    description: `Payment of ${formatAmountWithCurrency(32.75, currency)} processed successfully via Stripe`,
    user: {
      name: "System",
      avatar: "/placeholder.svg?height=32&width=32&text=SY",
      role: "System",
    },
    timestamp: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
    details: {
      amount: formatAmountWithCurrency(32.75, currency),
      method: "Stripe",
      transactionId: "txn_1234567890",
    },
  },
  {
    id: "6",
    type: "system",
    action: "Settings updated",
    description: "Restaurant settings have been updated",
    user: {
      name: "John Doe",
      avatar: "/placeholder.svg?height=32&width=32&text=JD",
      role: "Manager",
    },
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    details: { section: "General Settings", changes: "Business hours updated" },
  },
  {
    id: "7",
    type: "order",
    action: "Order cancelled",
    description: "Order #1230 was cancelled by customer",
    user: {
      name: "Lisa Chen",
      avatar: "/placeholder.svg?height=32&width=32&text=LC",
      role: "Server",
    },
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
    details: {
      orderId: "1230",
      reason: "Customer changed mind",
      refundAmount: formatAmountWithCurrency(28.5, currency),
    },
  },
  {
    id: "8",
    type: "menu",
    action: "Item availability changed",
    description: "Chicken Alfredo marked as unavailable",
    user: {
      name: "Sarah Wilson",
      avatar: "/placeholder.svg?height=32&width=32&text=SW",
      role: "Chef",
    },
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    details: {
      itemName: "Chicken Alfredo",
      status: "Unavailable",
      reason: "Out of ingredients",
    },
  },
];

const activityTypes = [
  { value: "all", label: "All Activities", icon: ShoppingCart },
  { value: "order", label: "Orders", icon: ShoppingCart },
  { value: "menu", label: "Menu", icon: Plus },
  { value: "staff", label: "Staff", icon: User },
  { value: "table", label: "Tables", icon: Eye },
  { value: "payment", label: "Payments", icon: CreditCard },
  { value: "system", label: "System", icon: Settings },
];

const getActivityIcon = (type: string) => {
  const activityType = activityTypes.find((t) => t.value === type);
  return activityType ? activityType.icon : ShoppingCart;
};

const getActivityColor = (type: string) => {
  const colors = {
    order: "bg-blue-100 text-blue-700 border-blue-200",
    menu: "bg-green-100 text-green-700 border-green-200",
    staff: "bg-purple-100 text-purple-700 border-purple-200",
    table: "bg-orange-100 text-orange-700 border-orange-200",
    payment: "bg-emerald-100 text-emerald-700 border-emerald-200",
    system: "bg-gray-100 text-gray-700 border-gray-200",
  };
  return colors[type as keyof typeof colors] || colors.system;
};

const formatTimeAgo = (date: Date) => {
  const now = new Date();
  const diffInMinutes = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60)
  );

  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60)
    return `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""} ago`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24)
    return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;

  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
};

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

export default function ActivityLogsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedUser, setSelectedUser] = useState("all");
  const [timeRange, setTimeRange] = useState("all");
  const { currency } = useRestaurantSettings();

  // Get unique users for filter
  const uniqueUsers = Array.from(
    new Set(getMockActivities(currency).map((activity) => activity.user.name))
  );

  // Filter activities
  const filteredActivities = getMockActivities(currency).filter((activity) => {
    const matchesSearch =
      activity.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType =
      selectedType === "all" || activity.type === selectedType;
    const matchesUser =
      selectedUser === "all" || activity.user.name === selectedUser;

    // Add time range filtering
    if (timeRange !== "all") {
      const now = new Date();
      const activityTime = activity.timestamp;
      const hoursDiff =
        (now.getTime() - activityTime.getTime()) / (1000 * 60 * 60);

      switch (timeRange) {
        case "24h":
          if (hoursDiff > 24) return false;
          break;
        case "7d":
          if (hoursDiff > 24 * 7) return false;
          break;
        case "30d":
          if (hoursDiff > 24 * 30) return false;
          break;
      }
    }

    return matchesSearch && matchesType && matchesUser;
  });

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedType("all");
    setSelectedUser("all");
    setTimeRange("all");
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
          <h1 className="text-3xl font-bold tracking-tight">Activity Logs</h1>
          <p className="text-muted-foreground">
            Track all system activities and user actions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <motion.div
            whileHover={buttonHoverVariants.hover}
            whileTap={buttonHoverVariants.tap}
          >
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </motion.div>
          <motion.div
            whileHover={buttonHoverVariants.hover}
            whileTap={buttonHoverVariants.tap}
          >
            <Button variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* Filters Card */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters & Search
            </CardTitle>
            <CardDescription>
              Filter and search through activity logs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
              variants={itemVariants}
            >
              {/* Search Input */}
              <motion.div
                className="relative col-span-full lg:col-span-2"
                whileHover={{ scale: 1.01 }}
              >
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search activities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </motion.div>

              {/* Time Range Filter */}
              <motion.div whileHover={{ scale: 1.01 }}>
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Time Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="24h">Last 24 Hours</SelectItem>
                    <SelectItem value="7d">Last 7 Days</SelectItem>
                    <SelectItem value="30d">Last 30 Days</SelectItem>
                  </SelectContent>
                </Select>
              </motion.div>

              {/* User Filter */}
              <motion.div className="flex gap-2" whileHover={{ scale: 1.01 }}>
                <div className="flex-1">
                  <Select value={selectedUser} onValueChange={setSelectedUser}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select User" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      {uniqueUsers.map((user) => (
                        <SelectItem key={user} value={user}>
                          {user}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <motion.div
                  whileHover={buttonHoverVariants.hover}
                  whileTap={buttonHoverVariants.tap}
                >
                  <Button
                    variant="outline"
                    onClick={resetFilters}
                    className="shrink-0"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reset
                  </Button>
                </motion.div>
              </motion.div>
            </motion.div>

            {/* Activity Type Filters */}
            <motion.div
              className="flex flex-wrap gap-2"
              variants={itemVariants}
            >
              {activityTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <motion.div
                    key={type.value}
                    whileHover={buttonHoverVariants.hover}
                    whileTap={buttonHoverVariants.tap}
                  >
                    <Button
                      variant={
                        selectedType === type.value ? "default" : "outline"
                      }
                      onClick={() => setSelectedType(type.value)}
                      className={`flex-1 md:flex-none ${
                        selectedType === type.value
                          ? "bg-green-600 hover:bg-green-700"
                          : ""
                      }`}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {type.label}
                    </Button>
                  </motion.div>
                );
              })}
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Activity List */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Activity Logs</CardTitle>
            <CardDescription>
              Showing {filteredActivities.length} of{" "}
              {getMockActivities(currency).length} activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AnimatePresence mode="wait">
              {filteredActivities.length === 0 ? (
                <motion.div
                  key="no-activities"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="text-center py-8"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                  >
                    <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  </motion.div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No activities found
                  </h3>
                  <p className="text-gray-500">
                    Try adjusting your filters or search terms.
                  </p>
                </motion.div>
              ) : (
                <motion.div className="space-y-4" variants={containerVariants}>
                  {filteredActivities.map((activity, index) => {
                    const Icon = getActivityIcon(activity.type);
                    return (
                      <motion.div
                        key={activity.id}
                        variants={itemVariants}
                        initial="hidden"
                        animate="visible"
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={cardHoverVariants.hover}
                        className="flex items-start space-x-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <motion.div
                          className={`p-2 rounded-full ${getActivityColor(
                            activity.type
                          )}`}
                          whileHover={{ scale: 1.1 }}
                        >
                          <Icon className="w-4 h-4" />
                        </motion.div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900">
                              {activity.action}
                            </p>
                            <div className="flex items-center space-x-2">
                              <motion.div whileHover={{ scale: 1.1 }}>
                                <Badge
                                  variant="outline"
                                  className={getActivityColor(activity.type)}
                                >
                                  {activity.type.charAt(0).toUpperCase() +
                                    activity.type.slice(1)}
                                </Badge>
                              </motion.div>
                              <span className="text-xs text-gray-500">
                                {formatTimeAgo(activity.timestamp)}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {activity.description}
                          </p>
                          <motion.div
                            className="flex items-center mt-2"
                            whileHover={{ scale: 1.02 }}
                          >
                            <User className="w-6 h-6" />
                            <span className="text-xs text-gray-500 ml-2">
                              {activity.user.name} • {activity.user.role}
                            </span>
                          </motion.div>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
