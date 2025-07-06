"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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

// Mock data for the restaurant
const restaurant = {
  name: "Bella Vista Restaurant",
  logo: "/placeholder.svg",
  plan: "Pro",
  status: "open", // 'open' | 'closed'
};

// Mock data for the user
const user = {
  name: "John Smith",
  role: "Restaurant Owner",
  avatar: "/placeholder.svg?height=32&width=32&text=JS",
};

// Mock data for notifications
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
      href: "/dashboard/orders",
      icon: ShoppingCart,
      description: "Manage customer orders",
      subItems: [
        {
          name: "Active Orders",
          href: "/dashboard/orders",
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
      badge: "Elite",
    },
    {
      name: "Activity",
      href: "/dashboard/activity",
      icon: Activity,
      description: "View system activity logs",
    },
    {
      name: "Printer",
      href: "/dashboard/printer",
      icon: Printer,
      description: "Receipt printer settings",
    },
  ],
  settings: [
    {
      name: "Restaurant",
      href: "/dashboard/settings",
      icon: Building,
      description: "Business information",
    },
    {
      name: "Billing",
      href: "/dashboard/billing",
      icon: Receipt,
      description: "Subscription and payments",
      badge: "12d",
    },
    {
      name: "Payments",
      href: "/dashboard/payments",
      icon: CreditCard,
      description: "Payment processing settings",
    },
  ],
};

// Navigation items grouped by section
const navigationItems = {
  main: [
    { name: "Dashboard", icon: Home, href: "/dashboard" },
    { name: "Kitchen", icon: ChefHat, href: "/dashboard/kitchen" },
    { name: "Orders", icon: Menu, href: "/dashboard/orders", badge: "3 New" },
    { name: "Tables", icon: QrCode, href: "/dashboard/tables" },
    { name: "Menu", icon: FileText, href: "/dashboard/menu" },
  ],
  management: [
    { name: "Analytics", icon: BarChart3, href: "/dashboard/analytics" },
    { name: "Staff", icon: Users, href: "/dashboard/staff" },
    { name: "Payments", icon: CreditCard, href: "/dashboard/payments" },
    { name: "Settings", icon: Settings, href: "/dashboard/settings" },
  ],
  tools: [
    { name: "QR Codes", icon: QrCode, href: "/dashboard/qr-codes" },
    { name: "Printer", icon: Printer, href: "/dashboard/printer" },
    { name: "Order History", icon: Clock, href: "/dashboard/orders/history" },
  ],
};

// Add this new component before the AppSidebar component
function MobileMenuButton() {
  const { toggleSidebar } = useSidebar();

  return (
    <button
      onClick={toggleSidebar}
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-green-600 text-white shadow-lg transition-all hover:bg-green-500 hover:scale-105 active:scale-95 md:hidden focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2"
      aria-label="Toggle Menu"
      style={{
        boxShadow: "0 4px 14px 0 rgba(22, 163, 74, 0.3)",
      }}
    >
      <Menu className="h-6 w-6" />
    </button>
  );
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [mounted, setMounted] = React.useState(false);
  const { state, isMobile } = useSidebar();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [openNotifications, setOpenNotifications] = React.useState(false);
  const [openSections, setOpenSections] = React.useState<
    Record<string, boolean>
  >({
    orders: pathname.startsWith("/dashboard/orders"),
  });

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const hasActiveChild = (item: any): boolean => {
    if (item.subItems) {
      return item.subItems.some((subItem: any) => isActive(subItem.href));
    }
    return false;
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
                active || activeChild
                  ? "text-green-700"
                  : "text-gray-400 group-hover:text-gray-900"
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

  return (
    <>
      <Sidebar {...props}>
        <SidebarHeader className="border-b">
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="h-12 w-12 rounded-xl border-2 border-white shadow-md">
                  <AvatarImage
                    src={restaurant.logo}
                    alt={restaurant.name}
                    className="object-cover"
                  />
                  <AvatarFallback className="rounded-xl bg-gradient-to-b from-green-50 to-emerald-100 text-emerald-700">
                    {restaurant.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <Badge
                  variant="outline"
                  className="absolute -bottom-1 -right-1 h-5 px-1.5 bg-white border-gray-200"
                >
                  {restaurant.plan}
                </Badge>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-semibold text-gray-900 truncate">
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
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback>
                    {user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="font-medium">{user.name}</span>
                  <span className="text-xs text-gray-500">{user.role}</span>
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
                  onClick={() => console.log("Sign out")}
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
