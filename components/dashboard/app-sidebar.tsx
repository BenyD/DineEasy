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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isActive = (path: string) => {
    return (
      path === window.location.pathname ||
      window.location.pathname.startsWith(path + "/")
    );
  };

  const hasActiveItemInGroup = (groupItems: any[]) => {
    return groupItems.some((item) => isActive(item.href));
  };

  // Render simple menu item
  const renderMenuItem = (item: any) => {
    const active = isActive(item.url);
    const hasSubItems = item.subItems && item.subItems.length > 0;

    const menuItemContent = (
      <div className="flex items-center w-full">
        <div className="flex items-center flex-1 min-w-0">
          <item.icon className="h-5 w-5 shrink-0" />
          <span className="ml-2 truncate">{item.name}</span>
        </div>
        <div className="flex items-center gap-2 ml-2">
          {item.badge && <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>}
          {hasSubItems && (
            <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 collapsible-trigger-icon" />
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
            className="group-data-[collapsible=icon]:justify-center w-full"
          >
            <Link
              href={item.url}
              className={`transition-all duration-200 hover:bg-slate-200/40 rounded-md relative ${
                active ? "text-green-600" : "text-gray-600"
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
                className={`group-data-[collapsible=icon]:justify-center w-full ${
                  active ? "text-green-600" : "text-gray-600"
                }`}
              >
                {menuItemContent}
              </SidebarMenuButton>
            </div>
          </CollapsibleTrigger>
        </SidebarMenuItem>
        <CollapsibleContent className="pl-4 space-y-1">
          {item.subItems.map((subItem: any) => (
            <SidebarMenuItem key={subItem.name}>
              <SidebarMenuButton
                asChild
                isActive={isActive(subItem.url)}
                tooltip={subItem.description}
                className="group-data-[collapsible=icon]:justify-center w-full"
              >
                <Link
                  href={subItem.url}
                  className={`transition-all duration-200 hover:bg-slate-200/40 rounded-md relative ${
                    isActive(subItem.url) ? "text-green-600" : "text-gray-600"
                  }`}
                >
                  <div className="flex items-center w-full">
                    <div className="flex items-center flex-1 min-w-0">
                      <subItem.icon className="h-5 w-5 shrink-0" />
                      <span className="ml-2 truncate">{subItem.name}</span>
                    </div>
                    {subItem.badge && (
                      <SidebarMenuBadge className="ml-2">
                        {subItem.badge}
                      </SidebarMenuBadge>
                    )}
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
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
    const isActive = hasActiveItemInGroup(items);
    const shouldBeOpen = mounted ? !isMobile || defaultOpen || isActive : false;

    return (
      <Collapsible
        defaultOpen={shouldBeOpen}
        className="group/collapsible"
        disabled={state === "collapsed"}
      >
        <SidebarGroup className="group-data-[collapsible=icon]:p-0">
          <SidebarGroupLabel asChild>
            <CollapsibleTrigger className="flex w-full items-center justify-between text-sm font-medium text-sidebar-foreground/70 hover:bg-slate-200/40 hover:text-sidebar-accent-foreground rounded-md px-3 py-2 transition-all duration-200 active:scale-[0.98] group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:py-3 group-data-[collapsible=icon]:pointer-events-none">
              <span className="group-data-[collapsible=icon]:hidden">
                {title}
              </span>
              <ChevronDown className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180 group-data-[collapsible=icon]:hidden" />
            </CollapsibleTrigger>
          </SidebarGroupLabel>
          <CollapsibleContent className="animate-accordion-down">
            <SidebarGroupContent>
              <SidebarMenu className="group-data-[collapsible=icon]:px-1.5">
                {items.map(renderMenuItem)}
              </SidebarMenu>
            </SidebarGroupContent>
          </CollapsibleContent>
        </SidebarGroup>
      </Collapsible>
    );
  };

  return (
    <TooltipProvider>
      <Sidebar collapsible="icon" {...props}>
        <SidebarHeader className="group-data-[collapsible=icon]:px-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:h-auto group-data-[collapsible=icon]:py-2"
                  >
                    <div className="flex items-center gap-2 group-data-[collapsible=icon]:w-8">
                      <Avatar className="h-8 w-8 rounded-lg shrink-0">
                        <AvatarImage
                          src={restaurant.logo || "/placeholder.svg"}
                          alt={restaurant.name}
                          className="object-cover"
                        />
                        <AvatarFallback className="rounded-lg bg-green-100 text-green-700">
                          {restaurant.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                        <span className="truncate font-semibold">
                          {restaurant.name}
                        </span>
                        <span className="truncate text-xs text-muted-foreground">
                          {restaurant.plan} Plan
                        </span>
                      </div>
                      <ChevronDown className="ml-auto size-4 group-data-[collapsible=icon]:hidden" />
                    </div>
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                  side="bottom"
                  align="start"
                  sideOffset={4}
                >
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/settings">
                      <Settings className="mr-2 h-4 w-4" />
                      Restaurant Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/billing">
                      <CreditCard className="mr-2 h-4 w-4" />
                      Billing & Plans
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/settings/notifications">
                      <Bell className="mr-2 h-4 w-4" />
                      Notifications
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          {mounted && (
            <>
              {/* Collapsible Main Navigation */}
              {renderCollapsibleGroup("Main", navigationData.main, true)}

              {/* Visual separator for collapsed state */}
              <div className="hidden group-data-[collapsible=icon]:block py-1.5 pointer-events-none">
                <div className="h-[1px] bg-gray-200 mx-2 opacity-80" />
              </div>

              {/* Collapsible Management Section */}
              {renderCollapsibleGroup(
                "Management",
                navigationData.management,
                true
              )}

              {/* Visual separator for collapsed state */}
              <div className="hidden group-data-[collapsible=icon]:block py-1.5 pointer-events-none">
                <div className="h-[1px] bg-gray-200 mx-2 opacity-80" />
              </div>

              {/* Collapsible Settings Section */}
              {renderCollapsibleGroup(
                "Settings",
                navigationData.settings,
                true
              )}

              {/* Visual separator for collapsed state */}
              <div className="hidden group-data-[collapsible=icon]:block py-1.5 pointer-events-none">
                <div className="h-[1px] bg-gray-200 mx-2 opacity-80" />
              </div>

              {/* Help & Support - Non-collapsible */}
              <SidebarGroup className="mt-auto group-data-[collapsible=icon]:p-0">
                <SidebarGroupContent>
                  <SidebarMenu className="group-data-[collapsible=icon]:px-1.5">
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        asChild
                        tooltip="Get help and support"
                        className="group-data-[collapsible=icon]:justify-center"
                      >
                        <Link href="/dashboard/help">
                          <div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
                            <HelpCircle className="h-4 w-4 shrink-0" />
                            <span className="group-data-[collapsible=icon]:hidden">
                              Help & Support
                            </span>
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

        <SidebarFooter className="group-data-[collapsible=icon]:px-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:h-auto group-data-[collapsible=icon]:py-2"
                  >
                    <div className="flex items-center gap-2 group-data-[collapsible=icon]:w-8">
                      <Avatar className="h-8 w-8 rounded-lg shrink-0">
                        <AvatarImage
                          src="/placeholder.svg?height=32&width=32&text=JD"
                          alt="John Doe"
                          className="object-cover"
                        />
                        <AvatarFallback className="rounded-lg">
                          JD
                        </AvatarFallback>
                      </Avatar>
                      <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                        <span className="truncate font-semibold">John Doe</span>
                        <span className="truncate text-xs text-muted-foreground">
                          Owner
                        </span>
                      </div>
                      <MoreHorizontal className="ml-auto size-4 group-data-[collapsible=icon]:hidden" />
                    </div>
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                  side="top"
                  align="start"
                  sideOffset={4}
                >
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/profile">
                      <Users className="mr-2 h-4 w-4" />
                      My Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/settings/notifications">
                      <Bell className="mr-2 h-4 w-4" />
                      Notifications
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/help">
                      <HelpCircle className="mr-2 h-4 w-4" />
                      Support
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/logout" className="text-red-600">
                      Sign Out
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
