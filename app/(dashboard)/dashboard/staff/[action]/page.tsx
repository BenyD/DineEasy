"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { use } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Shield,
  ShieldCheck,
  Crown,
  ArrowLeft,
  User,
  Mail,
  Phone,
  Building,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

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

export default function StaffActionPage({
  params,
}: {
  params: Promise<{ action: string }>;
}) {
  const router = useRouter();
  const { action } = use(params);
  const isEdit = action === "edit";
  const [selectedRole, setSelectedRole] = useState("server");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [isCustomPermissions, setIsCustomPermissions] = useState(false);

  // Auto-select permissions based on role
  const updatePermissionsForRole = (role: string) => {
    const selectedRole = roles.find((r) => r.value === role);
    if (selectedRole) {
      setSelectedPermissions(selectedRole.defaultPermissions);
      setIsCustomPermissions(false); // Reset to role defaults
    }
  };

  // Initialize permissions when component mounts
  useEffect(() => {
    updatePermissionsForRole(selectedRole);
  }, []);

  const handleRoleChange = (newRole: string) => {
    setSelectedRole(newRole);
    if (!isCustomPermissions) {
      updatePermissionsForRole(newRole);
    }
  };

  const handlePermissionChange = (permission: string, checked: boolean) => {
    setIsCustomPermissions(true); // User is customizing permissions
    if (checked) {
      setSelectedPermissions([...selectedPermissions, permission]);
    } else {
      setSelectedPermissions(
        selectedPermissions.filter((p) => p !== permission)
      );
    }
  };

  const resetToRoleDefaults = () => {
    updatePermissionsForRole(selectedRole);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Handle form submission
    router.push("/dashboard/staff");
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/dashboard/staff")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">
              {isEdit ? "Edit Staff Member" : "Add Staff Member"}
            </h1>
          </div>
          <p className="text-muted-foreground">
            {isEdit
              ? "Update staff member details and permissions"
              : "Add a new staff member to your restaurant"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Enter the staff member's personal and contact information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name*</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="name"
                    placeholder="Enter full name"
                    className="pl-9"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address*</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@example.com"
                    className="pl-9"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="phone"
                    placeholder="+41 79 123 4567"
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <div className="relative">
                  <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="department"
                    placeholder="e.g., Kitchen, Service"
                    className="pl-9"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Role & Status */}
        <Card>
          <CardHeader>
            <CardTitle>Role & Status</CardTitle>
            <CardDescription>
              Set the staff member's role and account status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role">Role*</Label>
                <Select value={selectedRole} onValueChange={handleRoleChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        <div className="flex items-center gap-2">
                          <role.icon className={`h-4 w-4 ${role.color}`} />
                          {role.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Each role comes with predefined permissions that you can
                  customize below
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select defaultValue="active">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Permissions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Permissions</CardTitle>
                <CardDescription>
                  {isCustomPermissions
                    ? "Custom permissions selected"
                    : `Using default permissions for ${selectedRole} role`}
                </CardDescription>
              </div>
              {isCustomPermissions && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={resetToRoleDefaults}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reset to Role Defaults
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {permissions.map((group) => (
                <div key={group.group}>
                  <h3 className="font-medium mb-3">{group.group}</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {group.permissions.map((permission) => (
                      <div
                        key={permission.value}
                        className="flex items-start space-x-3 p-3 rounded-lg border"
                      >
                        <Switch
                          id={permission.value}
                          checked={selectedPermissions.includes(
                            permission.value
                          )}
                          onCheckedChange={(checked) =>
                            handlePermissionChange(permission.value, checked)
                          }
                          className="data-[state=checked]:bg-green-600"
                        />
                        <div className="space-y-1">
                          <Label
                            htmlFor={permission.value}
                            className="text-sm font-medium leading-none"
                          >
                            {permission.label}
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            {permission.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard/staff")}
          >
            Cancel
          </Button>
          <Button type="submit" className="bg-green-600 hover:bg-green-700">
            {isEdit ? "Update Staff Member" : "Add Staff Member"}
          </Button>
        </div>
      </form>
    </div>
  );
}
