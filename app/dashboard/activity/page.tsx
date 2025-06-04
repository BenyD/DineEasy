"use client";

import { useState } from "react";
import {
  Activity,
  Search,
  Filter,
  Download,
  RefreshCw,
  ShoppingCart,
  FileText,
  Users,
  QrCode,
  CreditCard,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BreadcrumbHeader } from "@/components/dashboard/breadcrumb-header";

// Mock activity data
const mockActivities = [
  {
    id: "1",
    type: "order",
    action: "Order #1234 completed",
    description: "Order for Table 5 has been marked as completed",
    user: {
      name: "John Doe",
      avatar: "/placeholder.svg?height=32&width=32&text=JD",
      role: "Manager",
    },
    timestamp: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
    details: { orderId: "1234", table: "5", amount: "$45.50" },
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
      price: "$18.99",
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
    description: "Payment of $32.75 processed successfully via Stripe",
    user: {
      name: "System",
      avatar: "/placeholder.svg?height=32&width=32&text=SY",
      role: "System",
    },
    timestamp: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
    details: {
      amount: "$32.75",
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
      refundAmount: "$28.50",
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
  { value: "all", label: "All Activities", icon: Activity },
  { value: "order", label: "Orders", icon: ShoppingCart },
  { value: "menu", label: "Menu", icon: FileText },
  { value: "staff", label: "Staff", icon: Users },
  { value: "table", label: "Tables", icon: QrCode },
  { value: "payment", label: "Payments", icon: CreditCard },
  { value: "system", label: "System", icon: Settings },
];

const getActivityIcon = (type: string) => {
  const activityType = activityTypes.find((t) => t.value === type);
  return activityType ? activityType.icon : Activity;
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

export default function ActivityLogsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedUser, setSelectedUser] = useState("all");

  // Get unique users for filter
  const uniqueUsers = Array.from(
    new Set(mockActivities.map((activity) => activity.user.name))
  );

  // Filter activities
  const filteredActivities = mockActivities.filter((activity) => {
    const matchesSearch =
      activity.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType =
      selectedType === "all" || activity.type === selectedType;
    const matchesUser =
      selectedUser === "all" || activity.user.name === selectedUser;

    return matchesSearch && matchesType && matchesUser;
  });

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedType("all");
    setSelectedUser("all");
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Activity Logs</h1>
          <p className="text-muted-foreground">
            Track all system activities and user actions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
          <CardDescription>
            Filter activities by type, user, or search terms
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search activities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <label className="text-sm font-medium mb-2 block">
                Activity Type
              </label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {activityTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center">
                          <Icon className="w-4 h-4 mr-2" />
                          {type.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-48">
              <label className="text-sm font-medium mb-2 block">User</label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue placeholder="Select user" />
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
            <Button variant="outline" onClick={resetFilters}>
              <Filter className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Activity List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Activities</CardTitle>
          <CardDescription>
            Showing {filteredActivities.length} of {mockActivities.length}{" "}
            activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredActivities.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No activities found
                </h3>
                <p className="text-gray-500">
                  Try adjusting your filters or search terms.
                </p>
              </div>
            ) : (
              filteredActivities.map((activity) => {
                const Icon = getActivityIcon(activity.type);
                return (
                  <div
                    key={activity.id}
                    className="flex items-start space-x-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div
                      className={`p-2 rounded-full ${getActivityColor(
                        activity.type
                      )}`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">
                          {activity.action}
                        </p>
                        <div className="flex items-center space-x-2">
                          <Badge
                            variant="outline"
                            className={getActivityColor(activity.type)}
                          >
                            {activity.type.charAt(0).toUpperCase() +
                              activity.type.slice(1)}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {formatTimeAgo(activity.timestamp)}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {activity.description}
                      </p>
                      <div className="flex items-center mt-2">
                        <Avatar className="w-6 h-6">
                          <AvatarImage
                            src={activity.user.avatar || "/placeholder.svg"}
                            alt={activity.user.name}
                          />
                          <AvatarFallback className="text-xs">
                            {activity.user.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-gray-500 ml-2">
                          {activity.user.name} • {activity.user.role}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
