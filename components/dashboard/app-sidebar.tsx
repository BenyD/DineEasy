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
} from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

// Mock data for the restaurant
const restaurant = {
  name: "Bella Vista",
  plan: "Pro",
  logo: "/placeholder.svg?height=32&width=32&text=BV",
};

// Navigation data structure - simplified without sub-items
const navigationData = {
  main: [
    {
      name: "Dashboard",
      url: "/dashboard",
      icon: Home,
      description: "Overview of your restaurant",
    },
    {
      name: "Orders",
      url: "/dashboard/orders",
      icon: ShoppingCart,
      description: "Manage customer orders",
      subItems: [
        {
          name: "All Orders",
          url: "/dashboard/orders",
          icon: ShoppingCart,
          description: "View and manage all orders",
        },
        {
          name: "Kitchen Display",
          url: "/dashboard/kitchen",
          icon: ChefHat,
          description: "Kitchen display system",
        },
        {
          name: "Order History",
          url: "/dashboard/orders/history",
          icon: Clock,
          description: "View past orders",
        },
      ],
    },
    {
      name: "Menu",
      url: "/dashboard/menu",
      icon: FileText,
      description: "Manage your menu items",
    },
    {
      name: "Tables & QR",
      url: "/dashboard/tables",
      icon: QrCode,
      description: "Manage tables and QR codes",
    },
  ],
  management: [
    {
      name: "Analytics",
      url: "/dashboard/analytics",
      icon: BarChart3,
      description: "Business insights and reports",
      badge: "Pro",
    },
    {
      name: "Staff",
      url: "/dashboard/staff",
      icon: Users,
      description: "Manage team members",
      badge: "Elite",
    },
    {
      name: "Activity Logs",
      url: "/dashboard/activity",
      icon: Activity,
      description: "View system activity logs",
    },
    {
      name: "Printer",
      url: "/dashboard/printer",
      icon: Printer,
      description: "Receipt printer settings",
    },
  ],
  settings: [
    {
      name: "Restaurant",
      url: "/dashboard/settings",
      icon: Building,
      description: "Business information",
    },
    {
      name: "Billing",
      url: "/dashboard/billing",
      icon: Receipt,
      description: "Subscription and payments",
      badge: "12d",
    },
    {
      name: "Payments",
      url: "/dashboard/payments",
      icon: CreditCard,
      description: "Payment processing settings",
    },
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

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isActive = (href: string) => {
    if (!href) return false;

    // Special case for dashboard index
    if (href === "/dashboard" && pathname === "/dashboard") {
      return true;
    }

    // For other routes, ensure we don't match parent paths unless exact
    if (href === "/dashboard" && pathname !== "/dashboard") {
      return false;
    }

    // For nested routes, check if the current path starts with the href
    // but make sure it's a complete segment match
    if (href !== "/dashboard") {
      const hrefSegments = href.split("/");
      const pathSegments = pathname.split("/");

      // Compare segments up to the href length
      for (let i = 0; i < hrefSegments.length; i++) {
        if (hrefSegments[i] !== pathSegments[i]) {
          return false;
        }
      }

      // If we're checking a parent route (like /dashboard/orders)
      // don't mark it active for child routes (like /dashboard/orders/123)
      // unless the segments match exactly
      return pathSegments.length === hrefSegments.length;
    }

    return false;
  };

  const hasActiveItemInGroup = (groupItems: any[]) => {
    return groupItems.some((item) => isActive(item.href));
  };

  // Render simple menu item
  const renderMenuItem = (item: any) => {
    const active = isActive(item.url);
    const hasSubItems = item.subItems && item.subItems.length > 0;

    const menuItemContent = (
      <div className="flex items-center w-full py-2 px-4">
        <div className="flex items-center flex-1 min-w-0">
          <item.icon className="h-4 w-4 shrink-0 text-muted-foreground opacity-60" />
          <span className="ml-3 truncate text-sm">{item.name}</span>
        </div>
        <div className="flex items-center gap-2 ml-2">
          {item.badge && (
            <SidebarMenuBadge className="bg-slate-100 text-slate-700">
              {item.badge}
            </SidebarMenuBadge>
          )}
          {hasSubItems && (
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground opacity-60 transition-transform duration-200 data-[state=open]:rotate-180" />
          )}
        </div>
      </div>
    );

    if (!hasSubItems) {
      return (
        <SidebarMenuItem key={item.name}>
          <SidebarMenuButton
            asChild
            isActive={active}
            tooltip={item.description}
            className="w-full"
          >
            <Link
              href={item.url}
              className={`relative flex w-full transition-colors duration-200 hover:bg-slate-50 rounded-md ${
                active
                  ? "bg-slate-50 before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-4/5 before:w-1 before:bg-gradient-to-b before:from-green-500 before:to-emerald-600 before:rounded-full"
                  : ""
              }`}
            >
              {menuItemContent}
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      );
    }

    return (
      <Collapsible
        key={item.name}
        defaultOpen={active || hasActiveSubItem(item.subItems)}
      >
        <SidebarMenuItem>
          <CollapsibleTrigger asChild>
            <div className="w-full">
              <SidebarMenuButton
                tooltip={item.description}
                className={`w-full ${active ? "bg-slate-50" : ""}`}
              >
                {menuItemContent}
              </SidebarMenuButton>
            </div>
          </CollapsibleTrigger>
        </SidebarMenuItem>
        <CollapsibleContent className="transition-all duration-200 ease-in-out data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
          <SidebarGroupContent>
            <SidebarMenu className="py-1">
              {item.subItems.map((subItem: any) => (
                <SidebarMenuItem key={subItem.name}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(subItem.url)}
                    tooltip={subItem.description}
                    className="w-full"
                  >
                    <Link
                      href={subItem.url}
                      className={`relative flex w-full transition-colors duration-200 hover:bg-slate-50 rounded-md ${
                        isActive(subItem.url)
                          ? "bg-slate-50 before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-4/5 before:w-1 before:bg-gradient-to-b before:from-green-500 before:to-emerald-600 before:rounded-full"
                          : ""
                      }`}
                    >
                      <div className="flex items-center w-full py-2 pl-11 pr-4">
                        <div className="flex items-center flex-1 min-w-0">
                          <subItem.icon className="h-4 w-4 shrink-0 text-muted-foreground opacity-60" />
                          <span className="ml-3 truncate text-sm">
                            {subItem.name}
                          </span>
                        </div>
                        {subItem.badge && (
                          <SidebarMenuBadge className="ml-2 bg-slate-100 text-slate-700">
                            {subItem.badge}
                          </SidebarMenuBadge>
                        )}
                      </div>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </Collapsible>
    );
  };

  const hasActiveSubItem = (subItems: any[]) => {
    return subItems.some((item) => isActive(item.url));
  };

  // Render collapsible sidebar group
  const renderCollapsibleGroup = (
    title: string,
    items: any[],
    defaultOpen = true
  ) => {
    const icons = {
      Main: LayoutGrid,
      Management: Gauge,
      Settings: Settings2,
    };
    const SectionIcon = icons[title as keyof typeof icons];

    return (
      <SidebarGroup>
        <Collapsible defaultOpen={defaultOpen}>
          <SidebarGroupLabel asChild>
            <CollapsibleTrigger className="w-full">
              <div className="flex items-center gap-2 py-2 px-4 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors duration-200">
                {SectionIcon && (
                  <SectionIcon className="h-4 w-4 shrink-0 opacity-60" />
                )}
                <span className="flex-1 text-left uppercase tracking-wider">
                  {title}
                </span>
                <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 data-[state=open]:rotate-180 ml-auto opacity-60" />
              </div>
            </CollapsibleTrigger>
          </SidebarGroupLabel>
          <CollapsibleContent className="transition-all duration-200 ease-in-out data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => renderMenuItem(item))}
              </SidebarMenu>
            </SidebarGroupContent>
          </CollapsibleContent>
        </Collapsible>
      </SidebarGroup>
    );
  };

  return (
    <TooltipProvider>
      <Sidebar collapsible="offcanvas" className="bg-white border-r" {...props}>
        <SidebarHeader className="border-b">
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="w-full hover:bg-slate-50 transition-colors duration-200"
                  >
                    <div className="flex items-center gap-3 px-4 py-3">
                      <Avatar className="h-9 w-9 rounded-xl shrink-0">
                        <AvatarImage
                          src={restaurant.logo || "/placeholder.svg"}
                          alt={restaurant.name}
                          className="object-cover"
                        />
                        <AvatarFallback className="rounded-xl bg-gradient-to-b from-green-100 to-emerald-100 text-green-700">
                          {restaurant.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="grid flex-1 text-left">
                        <span className="font-medium truncate text-sm">
                          {restaurant.name}
                        </span>
                        <span className="truncate text-xs text-muted-foreground">
                          {restaurant.plan} Plan
                        </span>
                      </div>
                      <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground opacity-60" />
                    </div>
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-[240px] rounded-lg"
                  side="bottom"
                  align="start"
                  sideOffset={8}
                >
                  <DropdownMenuItem asChild>
                    <Link
                      href="/dashboard/settings"
                      className="flex items-center gap-2 py-2"
                    >
                      <Settings className="h-4 w-4 text-muted-foreground" />
                      <span>Restaurant Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href="/dashboard/billing"
                      className="flex items-center gap-2 py-2"
                    >
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <span>Billing & Plans</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href="/dashboard/settings/notifications"
                      className="flex items-center gap-2 py-2"
                    >
                      <Bell className="h-4 w-4 text-muted-foreground" />
                      <span>Notifications</span>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent className="py-2">
          {mounted && (
            <>
              {/* Main Navigation */}
              {renderCollapsibleGroup("Main", navigationData.main, true)}

              <div className="my-2 mx-4 border-t border-slate-100" />

              {/* Management Section */}
              {renderCollapsibleGroup(
                "Management",
                navigationData.management,
                true
              )}

              <div className="my-2 mx-4 border-t border-slate-100" />

              {/* Settings Section */}
              {renderCollapsibleGroup(
                "Settings",
                navigationData.settings,
                true
              )}

              <div className="my-2 mx-4 border-t border-slate-100" />

              {/* Help & Support */}
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild tooltip="Get help and support">
                        <Link
                          href="/dashboard/help"
                          className={`relative flex w-full transition-colors duration-200 hover:bg-slate-50 rounded-md ${
                            isActive("/dashboard/help")
                              ? "bg-slate-50 before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-4/5 before:w-1 before:bg-gradient-to-b before:from-green-500 before:to-emerald-600 before:rounded-full"
                              : ""
                          }`}
                        >
                          <div className="flex items-center w-full py-2 px-4">
                            <div className="flex items-center flex-1 min-w-0">
                              <HelpCircle className="h-4 w-4 shrink-0 text-muted-foreground opacity-60" />
                              <span className="ml-3 truncate text-sm">
                                Help & Support
                              </span>
                            </div>
                          </div>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </>
          )}
        </SidebarContent>

        <SidebarFooter className="border-t">
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="w-full hover:bg-slate-50 transition-colors duration-200"
                  >
                    <div className="flex items-center gap-3 px-4 py-3">
                      <Avatar className="h-9 w-9 rounded-xl shrink-0">
                        <AvatarImage
                          src="/placeholder.svg?height=32&width=32&text=JD"
                          alt="John Doe"
                          className="object-cover"
                        />
                        <AvatarFallback className="rounded-xl bg-gradient-to-b from-slate-100 to-slate-200">
                          JD
                        </AvatarFallback>
                      </Avatar>
                      <div className="grid flex-1 text-left">
                        <span className="font-medium truncate text-sm">
                          John Doe
                        </span>
                        <span className="truncate text-xs text-muted-foreground">
                          Owner
                        </span>
                      </div>
                      <MoreHorizontal className="h-4 w-4 shrink-0 text-muted-foreground opacity-60" />
                    </div>
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-[240px] rounded-lg"
                  side="top"
                  align="start"
                  sideOffset={8}
                >
                  <DropdownMenuItem asChild>
                    <Link
                      href="/dashboard/profile"
                      className="flex items-center gap-2 py-2"
                    >
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>My Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href="/dashboard/settings/notifications"
                      className="flex items-center gap-2 py-2"
                    >
                      <Bell className="h-4 w-4 text-muted-foreground" />
                      <span>Notifications</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href="/dashboard/help"
                      className="flex items-center gap-2 py-2"
                    >
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      <span>Support</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link
                      href="/logout"
                      className="flex items-center gap-2 py-2 text-red-600"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign Out</span>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <MobileMenuButton />
    </TooltipProvider>
  );
}
