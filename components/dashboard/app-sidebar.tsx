"use client"

import type * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
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
} from "lucide-react"
import { TooltipProvider } from "@/components/ui/tooltip"

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
} from "@/components/ui/sidebar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

// Mock data for the restaurant
const restaurant = {
  name: "Bella Vista",
  plan: "Pro",
  logo: "/placeholder.svg?height=32&width=32&text=BV",
}

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
      badge: "3",
      description: "Manage customer orders",
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
    {
      name: "Kitchen",
      url: "/dashboard/kitchen",
      icon: ChefHat,
      description: "Kitchen display system",
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
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()

  // Check if a path is active (exact match or starts with for parent routes)
  const isActive = (path: string) => {
    if (path === "/dashboard" && pathname === "/dashboard") {
      return true
    }
    return path !== "/dashboard" && pathname.startsWith(path)
  }

  // Check if any item in a group is active
  const hasActiveItemInGroup = (groupItems: any[]) => {
    return groupItems.some((item) => isActive(item.url))
  }

  // Render simple menu item
  const renderMenuItem = (item: any) => {
    return (
      <SidebarMenuItem key={item.name}>
        <SidebarMenuButton asChild tooltip={item.description} isActive={isActive(item.url)}>
          <Link href={item.url}>
            {item.icon && <item.icon />}
            <span>{item.name}</span>
            {item.badge && (
              <SidebarMenuBadge
                className={
                  item.badge === "Pro" || item.badge === "Elite"
                    ? "bg-purple-100 text-purple-700"
                    : item.badge.endsWith("d")
                      ? "bg-amber-100 text-amber-700"
                      : "bg-green-100 text-green-700"
                }
              >
                {item.badge}
              </SidebarMenuBadge>
            )}
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    )
  }

  // Render collapsible sidebar group
  const renderCollapsibleGroup = (title: string, items: any[], defaultOpen = true) => {
    return (
      <Collapsible defaultOpen={defaultOpen || hasActiveItemInGroup(items)} className="group/collapsible">
        <SidebarGroup>
          <SidebarGroupLabel asChild>
            <CollapsibleTrigger className="flex w-full items-center justify-between text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-md px-2 py-1.5 transition-colors">
              {title}
              <ChevronDown className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
            </CollapsibleTrigger>
          </SidebarGroupLabel>
          <CollapsibleContent>
            <SidebarGroupContent>
              <SidebarMenu>{items.map(renderMenuItem)}</SidebarMenu>
            </SidebarGroupContent>
          </CollapsibleContent>
        </SidebarGroup>
      </Collapsible>
    )
  }

  return (
    <TooltipProvider>
      <Sidebar collapsible="icon" {...props}>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  >
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage src={restaurant.logo || "/placeholder.svg"} alt={restaurant.name} />
                      <AvatarFallback className="rounded-lg bg-green-100 text-green-700">
                        {restaurant.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">{restaurant.name}</span>
                      <span className="truncate text-xs text-muted-foreground">{restaurant.plan} Plan</span>
                    </div>
                    <ChevronDown className="ml-auto size-4" />
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
          {/* Collapsible Main Navigation */}
          {renderCollapsibleGroup("Main", navigationData.main, true)}

          {/* Collapsible Management Section */}
          {renderCollapsibleGroup("Management", navigationData.management, true)}

          {/* Collapsible Settings Section */}
          {renderCollapsibleGroup("Settings", navigationData.settings, true)}

          {/* Help & Support - Non-collapsible */}
          <SidebarGroup className="mt-auto">
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Get help and support">
                    <Link href="/dashboard/help">
                      <HelpCircle />
                      <span>Help & Support</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  >
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage src="/placeholder.svg?height=32&width=32&text=JD" alt="John Doe" />
                      <AvatarFallback className="rounded-lg">JD</AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">John Doe</span>
                      <span className="truncate text-xs text-muted-foreground">Owner</span>
                    </div>
                    <MoreHorizontal className="ml-auto size-4" />
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
    </TooltipProvider>
  )
}
