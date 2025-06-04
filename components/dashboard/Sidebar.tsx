"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3, ChefHat, FileText, Home, Settings, ShoppingCart, Users, QrCode, Menu } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/layout/Logo"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Menu", href: "/dashboard/menu", icon: FileText },
  { name: "Orders", href: "/dashboard/orders", icon: ShoppingCart },
  { name: "Tables", href: "/dashboard/tables", icon: QrCode },
  { name: "Kitchen", href: "/dashboard/kitchen", icon: ChefHat },
  { name: "Staff", href: "/dashboard/staff", icon: Users },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  return (
    <div
      className={cn(
        "flex h-screen flex-col border-r bg-white transition-all duration-300",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <div className="flex h-16 items-center justify-between px-4">
        <Logo showText={!collapsed} />
        <Button variant="ghost" size="sm" onClick={() => setCollapsed(!collapsed)} className="h-8 w-8 p-0">
          <Menu className="h-4 w-4" />
        </Button>
      </div>

      <nav className="flex-1 space-y-1 px-2 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive ? "bg-green-100 text-green-700" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
