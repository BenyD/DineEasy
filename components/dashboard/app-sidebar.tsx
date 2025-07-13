"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/lib/actions/auth";
import {
  BarChart3,
  ChefHat,
  FileText,
  Home,
  Settings,
  ShoppingCart,
  Users,
  QrCode,
  CreditCard,
  Bell,
  HelpCircle,
  MoreHorizontal,
  ChevronDown,
  Printer,
  Building,
  Receipt,
  Activity,
  Menu,
  Cog,
  Clock,
  LayoutGrid,
  Settings2,
  Gauge,
  LogOut,
  User2,
  ChevronRight,
  Building2,
  CircleDot,
  MessageSquare,
  ShoppingBag,
  UtensilsCrossed,
  Table2,
  Wallet,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/animated-popover";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSidebarData } from "@/hooks/useSidebarData";

// Mock data for notifications (can be replaced with real data later)
const notifications = [
  {
    id: 1,
    message: "New order from Table 5",
    time: "2 mins ago",
    unread: true,
  },
  {
    id: 2,
    message: "Kitchen completed order #123",
    time: "5 mins ago",
    unread: true,
  },
  {
    id: 3,
    message: "Daily report is ready",
    time: "1 hour ago",
    unread: false,
  },
];

// Navigation data structure with improved organization
const navigationData = {
  main: [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: Home,
      description: "Overview of your restaurant",
    },
    {
      name: "Orders",
      href: "/dashboard/orders/active",
      icon: ShoppingCart,
      description: "Manage customer orders",
      subItems: [
        {
          name: "Active Orders",
          href: "/dashboard/orders/active",
          description: "View and manage current orders",
          badge: "3",
        },
        {
          name: "Order History",
          href: "/dashboard/orders/history",
          description: "View past orders",
        },
      ],
    },
    {
      name: "Kitchen Display",
      href: "/dashboard/kitchen",
      icon: ChefHat,
      description: "Kitchen display system",
    },
    {
      name: "Menu",
      href: "/dashboard/menu",
      icon: FileText,
      description: "Manage your menu items",
    },
    {
      name: "Tables & QR",
      href: "/dashboard/tables",
      icon: QrCode,
      description: "Manage tables and QR codes",
    },
  ],
  management: [
    {
      name: "Analytics",
      href: "/dashboard/analytics",
      icon: BarChart3,
      description: "Business insights and reports",
      badge: "Pro",
    },
    {
      name: "Staff",
      href: "/dashboard/staff",
      icon: Users,
      description: "Manage team members",
      badge: "Pro",
    },
    {
      name: "Activity",
      href: "/dashboard/activity",
      icon: Activity,
      description: "View system activity logs",
      badge: "Elite",
    },
    {
      name: "Feedback",
      href: "/dashboard/feedback",
      icon: MessageSquare,
      description: "View customer feedback",
      badge: "Pro",
    },
    {
      name: "Printer",
      href: "/dashboard/printer",
      icon: Printer,
      description: "Receipt printer settings",
      subItems: [
        {
          name: "Settings",
          href: "/dashboard/printer/settings",
          description: "General printer settings",
        },
        {
          name: "Kitchen Orders",
          href: "/dashboard/printer/kitchen-orders",
          description: "Kitchen order ticket settings",
        },
        {
          name: "Customer Receipts",
          href: "/dashboard/printer/customer-receipt",
          description: "Customer receipt settings",
        },
      ],
    },
  ],
  settings: [
    {
      name: "Settings",
      href: "/dashboard/settings",
      icon: Settings,
      description: "Restaurant settings and preferences",
    },
    {
      name: "Billing",
      href: "/dashboard/billing",
      icon: CreditCard,
      description: "Manage subscription and billing",
    },
    {
      name: "Payments",
      href: "/dashboard/payments",
      icon: Wallet,
      description: "Payment processing settings",
    },
  ],
};

function MobileMenuButton() {
  const { toggleSidebar } = useSidebar();

  return (
    <button
      onClick={toggleSidebar}
      className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white shadow-lg lg:hidden"
    >
      <Menu className="h-5 w-5" />
    </button>
  );
}

interface SidebarLink {
  title: string;
  href: string;
  icon?: any;
  submenu?: {
    title: string;
    href: string;
  }[];
}

function SidebarItem({ link }: { link: SidebarLink }) {
  const pathname = usePathname();
  const isActive = pathname === link.href;

  return (
    <Link
      href={link.href}
      className={cn(
        "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        isActive
          ? "bg-green-50 text-green-700 hover:bg-green-100"
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
      )}
    >
      {link.icon && (
        <link.icon
          className={cn(
            "h-4 w-4 shrink-0",
            isActive ? "text-green-700" : "text-gray-600"
          )}
        />
      )}
      <span>{link.title}</span>
    </Link>
  );
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [mounted, setMounted] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const pathname = usePathname();

  // Use real-time data from the hook
  const { restaurant, user, isLoading, error } = useSidebarData();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isActive = (href: string) => {
    // Special case for Dashboard - only active when exactly /dashboard
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    // For other items, check exact match or if path starts with href + "/"
    return pathname === href || pathname.startsWith(href + "/");
  };

  const hasActiveChild = (item: any): boolean => {
    if (!item.subItems) return false;
    return item.subItems.some((subItem: any) => isActive(subItem.href));
  };

  const renderNavItem = (item: any, isSubItem = false) => {
    const active = isActive(item.href);
    const hasChildren = item.subItems && item.subItems.length > 0;
    const isOpen = openSections[item.name.toLowerCase()];
    const activeChild = hasChildren && hasActiveChild(item);

    return (
      <div key={item.href} className={cn("flex flex-col", isSubItem && "ml-4")}>
        <Link
          href={hasChildren ? "#" : item.href}
          className={cn(
            "group relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            active || activeChild
              ? "bg-green-50 text-green-700 hover:bg-green-100"
              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          )}
          onClick={(e) => {
            if (hasChildren) {
              e.preventDefault();
              setOpenSections((prev) => ({
                ...prev,
                [item.name.toLowerCase()]: !prev[item.name.toLowerCase()],
              }));
            }
          }}
        >
          {item.icon && (
            <item.icon
              className={cn(
                "h-4 w-4 shrink-0",
                active || activeChild ? "text-green-700" : "text-gray-600"
              )}
            />
          )}
          <span>{item.name}</span>
          {item.badge && (
            <Badge
              variant={active || activeChild ? "default" : "secondary"}
              className={cn(
                "ml-auto text-xs",
                active && "bg-green-100 text-green-700"
              )}
            >
              {item.badge}
            </Badge>
          )}
          {hasChildren && (
            <ChevronRight
              className={cn(
                "ml-auto h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200",
                isOpen && "rotate-90"
              )}
            />
          )}
        </Link>
        {hasChildren && isOpen && (
          <div className="mt-1 space-y-1">
            {item.subItems.map((subItem: any) => renderNavItem(subItem, true))}
          </div>
        )}
      </div>
    );
  };

  const renderSection = (title: string, items: any[]) => (
    <SidebarGroup key={title}>
      <SidebarGroupLabel className="px-3 text-xs font-medium text-gray-500">
        {title}
      </SidebarGroupLabel>
      <SidebarGroupContent className="space-y-1">
        {items.map((item) => renderNavItem(item))}
      </SidebarGroupContent>
    </SidebarGroup>
  );

  if (!mounted) {
    return null;
  }

  // Show loading state
  if (isLoading) {
    return (
      <>
        <Sidebar {...props}>
          <SidebarHeader className="border-b">
            <div className="p-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="h-14 w-14 rounded-xl bg-gray-100 flex items-center justify-center animate-pulse">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-100 rounded animate-pulse mb-2"></div>
                  <div className="h-3 bg-gray-100 rounded animate-pulse w-16"></div>
                  <div className="h-3 bg-gray-100 rounded animate-pulse w-24 mt-2"></div>
                </div>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <div className="p-4">
              <div className="space-y-2">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="h-8 bg-gray-100 rounded animate-pulse"
                  ></div>
                ))}
              </div>
            </div>
          </SidebarContent>
        </Sidebar>
        <MobileMenuButton />
      </>
    );
  }

  // Show error state
  if (error || !restaurant || !user) {
    return (
      <>
        <Sidebar {...props}>
          <SidebarHeader className="border-b">
            <div className="p-4">
              <div className="text-center">
                <div className="h-12 w-12 rounded-xl bg-red-100 flex items-center justify-center mx-auto mb-2">
                  <CircleDot className="h-6 w-6 text-red-500" />
                </div>
                <p className="text-sm text-red-600">Failed to load data</p>
                <p className="text-xs text-gray-500 mt-1">{error}</p>
              </div>
            </div>
          </SidebarHeader>
        </Sidebar>
        <MobileMenuButton />
      </>
    );
  }

  return (
    <>
      <Sidebar {...props}>
        <SidebarHeader className="border-b">
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar
                  className="h-14 w-14 rounded-xl border-2 border-white shadow-lg hover:shadow-xl transition-shadow duration-200 cursor-pointer"
                  onClick={() => {
                    // Navigate to restaurant settings when logo is clicked
                    window.location.href = "/dashboard/settings";
                  }}
                  title="Click to edit restaurant settings"
                >
                  <AvatarImage
                    src={restaurant.logo_url || "/placeholder.svg"}
                    alt={restaurant.name}
                    className="object-cover"
                    onError={(e) => {
                      // Fallback to placeholder if logo fails to load
                      const target = e.target as HTMLImageElement;
                      console.warn(
                        `Logo failed to load for ${restaurant.name}, using placeholder`
                      );
                      target.src = "/placeholder.svg";
                    }}
                    onLoad={() => {
                      console.log(
                        `Logo loaded successfully for ${restaurant.name}`
                      );
                    }}
                  />
                  <AvatarFallback className="rounded-xl bg-gradient-to-br from-green-50 to-emerald-100 text-emerald-700 font-semibold text-lg">
                    {restaurant.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                {/* Subscription Plan Badge */}
                {restaurant.subscription_plan && (
                  <Badge
                    variant="outline"
                    className="absolute -bottom-1 -right-1 h-5 px-1.5 bg-white border-gray-200 text-xs font-medium shadow-sm"
                  >
                    {restaurant.subscription_plan.charAt(0).toUpperCase() +
                      restaurant.subscription_plan.slice(1).toLowerCase()}
                  </Badge>
                )}
                {/* Status Indicator */}
                <div
                  className={cn(
                    "absolute -top-1 -right-1 h-3 w-3 rounded-full border-2 border-white shadow-sm",
                    restaurant.status === "open"
                      ? "bg-green-500"
                      : "bg-gray-400"
                  )}
                  title={`Restaurant is ${restaurant.status}`}
                />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-semibold text-gray-900 truncate hover:text-gray-700 transition-colors">
                  {restaurant.name}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <CircleDot
                    className={cn(
                      "h-3 w-3",
                      restaurant.status === "open"
                        ? "text-green-500"
                        : "text-gray-400"
                    )}
                  />
                  <span
                    className={cn(
                      "text-xs font-medium capitalize",
                      restaurant.status === "open"
                        ? "text-green-600"
                        : "text-gray-500"
                    )}
                  >
                    {restaurant.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent>
          {renderSection("Overview", navigationData.main)}
          {renderSection("Management", navigationData.management)}
          {renderSection("Settings", navigationData.settings)}
        </SidebarContent>

        <SidebarFooter className="border-t p-3">
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-gray-100">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={user.avatar_url || undefined}
                    alt={user.name}
                  />
                  <AvatarFallback>
                    {user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="font-medium">{user.name}</span>
                  <span className="text-xs text-gray-500 capitalize">
                    {user.role}
                  </span>
                </div>
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              className="w-[240px] p-1"
              sideOffset={8}
            >
              <div className="grid gap-1">
                <Link
                  href="/dashboard/settings"
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-gray-100"
                >
                  <Settings2 className="h-4 w-4" />
                  Settings
                </Link>
                <Link
                  href="/dashboard/help"
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-gray-100"
                >
                  <HelpCircle className="h-4 w-4" />
                  Help & Support
                </Link>
                <button
                  onClick={() => signOut()}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            </PopoverContent>
          </Popover>
        </SidebarFooter>
      </Sidebar>
      <MobileMenuButton />
    </>
  );
}
