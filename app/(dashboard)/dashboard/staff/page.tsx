"use client";

import type React from "react";
import type { LucideIcon } from "lucide-react";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Edit,
  Trash2,
  MoreHorizontal,
  UserPlus,
  Mail,
  Phone,
  Calendar,
  Clock,
  Shield,
  ShieldCheck,
  Crown,
  Eye,
  Download,
  Settings,
  AlertCircle,
  Users,
  Filter,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDate } from "@/lib/utils";
import { useRouter } from "next/navigation";

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

const badgeHoverVariants = {
  hover: { scale: 1.1 },
};

// Mock staff data
const mockStaff = [
  {
    id: "1",
    name: "Sarah Johnson",
    email: "sarah.johnson@bellavista.com",
    phone: "+41 79 123 4567",
    role: "manager",
    status: "active",
    avatar: "/placeholder.svg?height=40&width=40",
    joinDate: "2023-01-15",
    lastLogin: "2024-01-15 14:30",
    permissions: ["orders", "menu", "staff", "analytics", "settings"],

    hourlyRate: 28.5,
  },
  {
    id: "2",
    name: "Marco Rossi",
    email: "marco.rossi@bellavista.com",
    phone: "+41 79 234 5678",
    role: "chef",
    status: "active",
    avatar: "/placeholder.svg?height=40&width=40",
    joinDate: "2023-03-20",
    lastLogin: "2024-01-15 12:15",
    permissions: ["kitchen", "menu"],

    hourlyRate: 26.0,
  },
  {
    id: "3",
    name: "Emma Weber",
    email: "emma.weber@bellavista.com",
    phone: "+41 79 345 6789",
    role: "server",
    status: "active",
    avatar: "/placeholder.svg?height=40&width=40",
    joinDate: "2023-06-10",
    lastLogin: "2024-01-15 16:45",
    permissions: ["orders", "tables"],

    hourlyRate: 22.0,
  },
  {
    id: "4",
    name: "Luca Müller",
    email: "luca.mueller@bellavista.com",
    phone: "+41 79 456 7890",
    role: "server",
    status: "inactive",
    avatar: "/placeholder.svg?height=40&width=40",
    joinDate: "2023-08-05",
    lastLogin: "2024-01-10 18:20",
    permissions: ["orders", "tables"],

    hourlyRate: 22.0,
  },
  {
    id: "5",
    name: "Anna Schmidt",
    email: "anna.schmidt@bellavista.com",
    phone: "+41 79 567 8901",
    role: "cashier",
    status: "active",
    avatar: "/placeholder.svg?height=40&width=40",
    joinDate: "2023-09-12",
    lastLogin: "2024-01-15 11:30",
    permissions: ["orders", "payments"],

    hourlyRate: 24.0,
  },
];

interface Permission {
  value: string;
  label: string;
  description: string;
}

interface PermissionGroup {
  group: string;
  permissions: Permission[];
}

interface Role {
  value: string;
  label: string;
  icon: LucideIcon;
  color: string;
  defaultPermissions: string[];
}

const roles: Role[] = [
  {
    value: "owner",
    label: "Owner",
    icon: Crown,
    color: "text-purple-600",
    defaultPermissions: [
      "orders.view",
      "orders.manage",
      "kitchen.view",
      "kitchen.manage",
      "menu.view",
      "menu.manage",
      "menu.categories",
      "menu.pricing",
      "tables.view",
      "tables.manage",
      "qr.view",
      "qr.manage",
      "analytics.view",
      "analytics.detailed",
      "analytics.export",
      "staff.view",
      "staff.manage",
      "staff.permissions",
      "payments.view",
      "payments.manage",
      "billing.view",
      "billing.manage",
      "settings.view",
      "settings.manage",
      "settings.branding",
    ],
  },
  {
    value: "manager",
    label: "Manager",
    icon: ShieldCheck,
    color: "text-blue-600",
    defaultPermissions: [
      "orders.view",
      "orders.manage",
      "kitchen.view",
      "kitchen.manage",
      "menu.view",
      "menu.manage",
      "menu.categories",
      "menu.pricing",
      "tables.view",
      "tables.manage",
      "qr.view",
      "qr.manage",
      "analytics.view",
      "analytics.detailed",
      "staff.view",
      "staff.manage",
      "payments.view",
      "payments.manage",
      "settings.view",
      "settings.manage",
    ],
  },
  {
    value: "chef",
    label: "Chef",
    icon: Shield,
    color: "text-orange-600",
    defaultPermissions: [
      "orders.view",
      "orders.manage",
      "kitchen.view",
      "kitchen.manage",
      "menu.view",
      "menu.manage",
      "menu.categories",
    ],
  },
  {
    value: "server",
    label: "Server",
    icon: Shield,
    color: "text-green-600",
    defaultPermissions: [
      "orders.view",
      "orders.manage",
      "kitchen.view",
      "menu.view",
      "tables.view",
      "tables.manage",
    ],
  },
  {
    value: "cashier",
    label: "Cashier",
    icon: Shield,
    color: "text-gray-600",
    defaultPermissions: [
      "orders.view",
      "orders.manage",
      "payments.view",
      "payments.manage",
    ],
  },
];

const permissions: PermissionGroup[] = [
  {
    group: "Orders & Kitchen",
    permissions: [
      {
        value: "orders.view",
        label: "View Orders",
        description: "View incoming orders and order history",
      },
      {
        value: "orders.manage",
        label: "Manage Orders",
        description:
          "Update order status, process refunds, and manage order flow",
      },
      {
        value: "kitchen.view",
        label: "View Kitchen Display",
        description: "View kitchen display system and order queue",
      },
      {
        value: "kitchen.manage",
        label: "Manage Kitchen",
        description: "Update kitchen status, manage preparation flow",
      },
    ],
  },
  {
    group: "Menu Management",
    permissions: [
      {
        value: "menu.view",
        label: "View Menu",
        description: "View menu items and categories",
      },
      {
        value: "menu.manage",
        label: "Manage Menu",
        description: "Create, edit, and delete menu items",
      },
      {
        value: "menu.categories",
        label: "Manage Categories",
        description: "Create and organize menu categories",
      },
      {
        value: "menu.pricing",
        label: "Manage Pricing",
        description: "Set prices, discounts, and special offers",
      },
    ],
  },
  {
    group: "Tables & QR",
    permissions: [
      {
        value: "tables.view",
        label: "View Tables",
        description: "View table status and layout",
      },
      {
        value: "tables.manage",
        label: "Manage Tables",
        description: "Update table status, manage seating",
      },
      {
        value: "qr.view",
        label: "View QR Codes",
        description: "View generated QR codes",
      },
      {
        value: "qr.manage",
        label: "Manage QR Codes",
        description: "Generate and customize QR codes",
      },
    ],
  },
  {
    group: "Analytics & Reports",
    permissions: [
      {
        value: "analytics.view",
        label: "View Analytics",
        description: "Access basic analytics and reports",
      },
      {
        value: "analytics.detailed",
        label: "Detailed Analytics",
        description: "Access detailed insights and trends",
      },
      {
        value: "analytics.export",
        label: "Export Reports",
        description: "Export analytics data and reports",
      },
    ],
  },
  {
    group: "Staff Management",
    permissions: [
      {
        value: "staff.view",
        label: "View Staff",
        description: "View staff list and basic info",
      },
      {
        value: "staff.manage",
        label: "Manage Staff",
        description: "Add, edit, or remove staff members",
      },
      {
        value: "staff.permissions",
        label: "Manage Permissions",
        description: "Assign and modify staff permissions",
      },
    ],
  },
  {
    group: "Financial & Billing",
    permissions: [
      {
        value: "payments.view",
        label: "View Payments",
        description: "View payment history and transactions",
      },
      {
        value: "payments.manage",
        label: "Manage Payments",
        description: "Process payments and handle refunds",
      },
      {
        value: "billing.view",
        label: "View Billing",
        description: "View subscription and billing information",
      },
      {
        value: "billing.manage",
        label: "Manage Billing",
        description: "Manage subscription and billing settings",
      },
    ],
  },
  {
    group: "Settings & Configuration",
    permissions: [
      {
        value: "settings.view",
        label: "View Settings",
        description: "View restaurant settings and configuration",
      },
      {
        value: "settings.manage",
        label: "Manage Settings",
        description: "Modify restaurant settings and preferences",
      },
      {
        value: "settings.branding",
        label: "Manage Branding",
        description: "Customize restaurant branding and appearance",
      },
    ],
  },
];

const shifts = [
  { value: "morning", label: "Morning (6:00 - 14:00)" },
  { value: "afternoon", label: "Afternoon (14:00 - 22:00)" },
  { value: "evening", label: "Evening (18:00 - 02:00)" },
  { value: "night", label: "Night (22:00 - 06:00)" },
  { value: "flexible", label: "Flexible" },
];

// Helper function to flatten permissions array for UI
const flattenedPermissions = permissions.flatMap((group) =>
  group.permissions.map((perm) => ({
    ...perm,
    group: group.group,
  }))
);

export default function StaffPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [timeRange, setTimeRange] = useState("all");

  // Add function to toggle staff status
  const toggleStaffStatus = (staffId: string, currentStatus: string) => {
    // In a real app, this would make an API call
    console.log(`Toggling status for staff ${staffId} from ${currentStatus}`);
  };

  const filteredStaff = mockStaff.filter((staff) => {
    const matchesSearch =
      staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === "all" || staff.role === selectedRole;
    const matchesStatus =
      selectedStatus === "all" || staff.status === selectedStatus;

    // Add time range filtering
    if (timeRange !== "all") {
      const now = new Date();
      const lastLoginTime = new Date(staff.lastLogin);
      const hoursDiff =
        (now.getTime() - lastLoginTime.getTime()) / (1000 * 60 * 60);

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

    return matchesSearch && matchesRole && matchesStatus;
  });

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedRole("all");
    setSelectedStatus("all");
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
          <h1 className="text-3xl font-bold tracking-tight">
            Staff Management
          </h1>
          <p className="text-muted-foreground">
            Manage your restaurant team and permissions
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
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => router.push("/dashboard/staff/add")}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Add Staff
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
              Filter and search through staff members
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
                  placeholder="Search staff..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </motion.div>

              {/* Time Range Filter */}
              <motion.div whileHover={{ scale: 1.01 }}>
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Last Active" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="24h">Last 24 Hours</SelectItem>
                    <SelectItem value="7d">Last 7 Days</SelectItem>
                    <SelectItem value="30d">Last 30 Days</SelectItem>
                  </SelectContent>
                </Select>
              </motion.div>

              {/* Status Filter */}
              <motion.div className="flex gap-2" whileHover={{ scale: 1.01 }}>
                <div className="flex-1">
                  <Select
                    value={selectedStatus}
                    onValueChange={setSelectedStatus}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
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

            <Separator />

            {/* Role Filters */}
            <motion.div
              className="flex flex-wrap gap-2"
              variants={itemVariants}
            >
              <motion.div
                whileHover={buttonHoverVariants.hover}
                whileTap={buttonHoverVariants.tap}
              >
                <Button
                  variant={selectedRole === "all" ? "default" : "outline"}
                  onClick={() => setSelectedRole("all")}
                  className={`flex-1 md:flex-none ${
                    selectedRole === "all"
                      ? "bg-green-600 hover:bg-green-700"
                      : ""
                  }`}
                >
                  <Users className="w-4 h-4 mr-2" />
                  All Roles
                </Button>
              </motion.div>
              {roles.map((role) => {
                const Icon = role.icon;
                return (
                  <motion.div
                    key={role.value}
                    whileHover={buttonHoverVariants.hover}
                    whileTap={buttonHoverVariants.tap}
                  >
                    <Button
                      variant={
                        selectedRole === role.value ? "default" : "outline"
                      }
                      onClick={() =>
                        setSelectedRole(
                          role.value === selectedRole ? "all" : role.value
                        )
                      }
                      className={`flex-1 md:flex-none ${
                        selectedRole === role.value
                          ? "bg-green-600 hover:bg-green-700"
                          : ""
                      }`}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {role.label}
                    </Button>
                  </motion.div>
                );
              })}
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Staff List */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Staff Members</CardTitle>
            <CardDescription>
              Showing {filteredStaff.length} of {mockStaff.length} staff members
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AnimatePresence mode="wait">
              {filteredStaff.length === 0 ? (
                <motion.div
                  key="no-staff"
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
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  </motion.div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No staff members found
                  </h3>
                  <p className="text-gray-500">
                    Try adjusting your filters or search terms
                  </p>
                </motion.div>
              ) : (
                <motion.div className="space-y-4" variants={containerVariants}>
                  {filteredStaff.map((staff, index) => {
                    const roleData = roles.find((r) => r.value === staff.role);
                    return (
                      <motion.div
                        key={staff.id}
                        variants={itemVariants}
                        initial="hidden"
                        animate="visible"
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={cardHoverVariants.hover}
                        className="flex items-start space-x-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <motion.div whileHover={{ scale: 1.1 }}>
                          <Avatar className="w-10 h-10">
                            <AvatarFallback>
                              {staff.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                        </motion.div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-medium">{staff.name}</h3>
                              <motion.div
                                className="flex items-center gap-2 text-sm text-gray-500"
                                whileHover={{ scale: 1.01 }}
                              >
                                <Mail className="w-3 h-3" />
                                {staff.email}
                                {staff.phone && (
                                  <>
                                    <span className="mx-1">•</span>
                                    <Phone className="w-3 h-3" />
                                    {staff.phone}
                                  </>
                                )}
                              </motion.div>
                            </div>
                            <div className="flex items-center gap-2">
                              {roleData && (
                                <motion.div
                                  whileHover={badgeHoverVariants.hover}
                                >
                                  <Badge
                                    variant="outline"
                                    className={`flex items-center gap-1 ${roleData.color}`}
                                  >
                                    <roleData.icon className="w-3 h-3" />
                                    {roleData.label}
                                  </Badge>
                                </motion.div>
                              )}
                              <motion.div whileHover={badgeHoverVariants.hover}>
                                <Badge
                                  variant={
                                    staff.status === "active"
                                      ? "outline"
                                      : staff.status === "inactive"
                                      ? "secondary"
                                      : "outline"
                                  }
                                  className={
                                    staff.status === "active"
                                      ? "bg-green-100 text-green-700"
                                      : staff.status === "inactive"
                                      ? "bg-gray-100 text-gray-700"
                                      : "bg-amber-100 text-amber-700"
                                  }
                                >
                                  {staff.status.charAt(0).toUpperCase() +
                                    staff.status.slice(1)}
                                </Badge>
                              </motion.div>
                              <motion.div
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <MoreHorizontal className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent
                                    align="end"
                                    className="w-48"
                                  >
                                    <DropdownMenuItem
                                      onClick={() =>
                                        router.push(
                                          `/dashboard/staff/edit?id=${staff.id}`
                                        )
                                      }
                                    >
                                      <Edit className="w-4 h-4 mr-2" />
                                      Edit Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        toggleStaffStatus(
                                          staff.id,
                                          staff.status
                                        )
                                      }
                                    >
                                      {staff.status === "active" ? (
                                        <>
                                          <AlertCircle className="w-4 h-4 mr-2 text-amber-600" />
                                          <span className="text-amber-600">
                                            Make Inactive
                                          </span>
                                        </>
                                      ) : (
                                        <>
                                          <ShieldCheck className="w-4 h-4 mr-2 text-green-600" />
                                          <span className="text-green-600">
                                            Make Active
                                          </span>
                                        </>
                                      )}
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-red-600">
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      Delete Staff
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </motion.div>
                            </div>
                          </div>
                          <motion.div
                            className="mt-2 text-sm text-gray-500 flex items-center gap-1"
                            whileHover={{ scale: 1.01 }}
                          >
                            <Clock className="w-3 h-3" />
                            Last active: {formatDate(new Date(staff.lastLogin))}
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
