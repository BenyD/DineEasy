"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Home,
  Layout,
  FileText,
  ShoppingCart,
  Settings,
  HelpCircle,
  ArrowLeft,
  Info,
  Shield,
  FileText as Terms,
  Mail,
  CreditCard,
  ChevronRight,
  BookOpen,
  Users,
  Globe,
  Zap,
  Building2,
  Coffee,
  Truck,
  Utensils,
  BarChart3,
  Activity,
  MessageSquare,
  Printer,
  Table,
  ChefHat,
  QrCode,
  Receipt,
  Calendar,
  Clock,
  TrendingUp,
  UserCheck,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

// Define the navigation items with their paths and metadata
const navigationItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    description: "Overview of your restaurant",
    icon: Layout,
    shortcut: "⌘ D",
    category: "Main",
  },
  {
    title: "Menu Management",
    href: "/dashboard/menu/manage",
    description: "Manage your menu items and categories",
    icon: FileText,
    shortcut: "⌘ M",
    category: "Management",
  },
  {
    title: "Orders",
    href: "/dashboard/orders",
    description: "View and manage customer orders",
    icon: ShoppingCart,
    shortcut: "⌘ O",
    category: "Operations",
  },
  {
    title: "Kitchen Display",
    href: "/dashboard/kitchen",
    description: "Monitor and manage kitchen orders",
    icon: ChefHat,
    shortcut: "⌘ K",
    category: "Operations",
  },
  {
    title: "Staff Management",
    href: "/dashboard/staff",
    description: "Manage your restaurant staff",
    icon: Users,
    shortcut: "⌘ S",
    category: "Management",
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    description: "Configure your restaurant settings",
    icon: Settings,
    shortcut: "⌘ ,",
    category: "System",
  },
  {
    title: "Help Center",
    href: "/help",
    description: "Get help and support",
    icon: HelpCircle,
    shortcut: "⌘ H",
    category: "Support",
  },
];

// Define dashboard pages organized by category
const dashboardPages = {
  main: [
    {
      title: "Dashboard Overview",
      href: "/dashboard",
      description: "Main dashboard with key metrics",
      icon: Layout,
    },
    {
      title: "Analytics",
      href: "/dashboard/analytics",
      description: "Business analytics and insights",
      icon: BarChart3,
    },
    {
      title: "Activity Log",
      href: "/dashboard/activity",
      description: "View system activity and logs",
      icon: Activity,
    },
  ],
  operations: [
    {
      title: "Active Orders",
      href: "/dashboard/orders/active",
      description: "Manage current orders",
      icon: Clock,
    },
    {
      title: "Order History",
      href: "/dashboard/orders/history",
      description: "View past orders",
      icon: Calendar,
    },
    {
      title: "Kitchen Display",
      href: "/dashboard/kitchen",
      description: "Kitchen order management",
      icon: ChefHat,
    },
    {
      title: "Tables",
      href: "/dashboard/tables",
      description: "Manage table layout and QR codes",
      icon: Table,
    },
  ],
  management: [
    {
      title: "Menu Management",
      href: "/dashboard/menu/manage",
      description: "Create and manage menu items",
      icon: FileText,
    },
    {
      title: "Staff Management",
      href: "/dashboard/staff",
      description: "Manage team members",
      icon: Users,
    },
    {
      title: "Feedback",
      href: "/dashboard/feedback",
      description: "Customer feedback and reviews",
      icon: MessageSquare,
    },
  ],
  financial: [
    {
      title: "Payments",
      href: "/dashboard/payments",
      description: "Payment processing and history",
      icon: CreditCard,
    },
    {
      title: "Billing",
      href: "/dashboard/billing",
      description: "Subscription and billing management",
      icon: Receipt,
    },
  ],
  system: [
    {
      title: "Settings",
      href: "/dashboard/settings",
      description: "Restaurant configuration",
      icon: Settings,
    },
    {
      title: "Printer Settings",
      href: "/dashboard/printer",
      description: "Configure receipt printers",
      icon: Printer,
    },
    {
      title: "Customer Receipts",
      href: "/dashboard/printer/customer-receipt",
      description: "Customize customer receipts",
      icon: Receipt,
    },
    {
      title: "Kitchen Orders",
      href: "/dashboard/printer/kitchen-orders",
      description: "Kitchen order printing",
      icon: ChefHat,
    },
  ],
};

// Define static pages organized by category
const staticPages = {
  main: [
    {
      title: "Home",
      href: "/",
      description: "Return to homepage",
      icon: Home,
    },
    {
      title: "About Us",
      href: "/about",
      description: "Learn more about DineEasy",
      icon: Info,
    },
    {
      title: "Features",
      href: "/features",
      description: "Explore our features",
      icon: Layout,
    },
    {
      title: "Pricing",
      href: "/pricing",
      description: "View our pricing plans",
      icon: CreditCard,
    },
    {
      title: "Setup Guide",
      href: "/setup-guide",
      description: "Step-by-step setup instructions",
      icon: BookOpen,
    },
  ],
  solutions: [
    {
      title: "Restaurants",
      href: "/solutions/restaurants",
      description: "Solutions for restaurants",
      icon: Building2,
    },
    {
      title: "Cafes",
      href: "/solutions/cafes",
      description: "Solutions for cafes",
      icon: Coffee,
    },
    {
      title: "Bars",
      href: "/solutions/bars",
      description: "Solutions for bars",
      icon: Utensils,
    },
    {
      title: "Food Trucks",
      href: "/solutions/food-trucks",
      description: "Solutions for food trucks",
      icon: Truck,
    },
  ],
  support: [
    {
      title: "Contact",
      href: "/contact",
      description: "Get in touch with us",
      icon: Mail,
    },
    {
      title: "Help Center",
      href: "/help",
      description: "Get help and support",
      icon: HelpCircle,
    },
  ],
  legal: [
    {
      title: "Privacy Policy",
      href: "/privacy",
      description: "Read our privacy policy",
      icon: Shield,
    },
    {
      title: "Terms of Service",
      href: "/terms",
      description: "View our terms of service",
      icon: Terms,
    },
    {
      title: "Security",
      href: "/security",
      description: "Learn about our security measures",
      icon: Shield,
    },
  ],
};

export default function NotFound() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createClient();
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (session && !error) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Error checking auth:", error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handleSignOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      toast.success("Signed out successfully");
      setIsAuthenticated(false);
    } catch (error) {
      toast.error("Error signing out");
    }
  };

  // Group navigation items by category
  const groupedItems = navigationItems.reduce(
    (acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    },
    {} as Record<string, typeof navigationItems>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-emerald-50/30">
      {/* Background Pattern */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-white/50 via-emerald-50/20 to-transparent" />
      </div>

      <div className="relative">
        {/* Header Section */}
        <div className="pt-16 pb-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <div className="relative inline-block">
              <span className="text-[10rem] font-bold text-emerald-900/[0.03] select-none pointer-events-none">
                404
              </span>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-2xl font-medium text-gray-900">
                  Page not found
                </div>
              </div>
            </div>
            <p className="text-gray-600 max-w-md mx-auto text-lg">
              The page you&apos;re looking for doesn&apos;t exist or has been
              moved.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="default"
                size="lg"
                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/10"
                asChild
              >
                <Link href="/">
                  <Home className="w-4 h-4 mr-2" />
                  Return Home
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="shadow-sm border-gray-300 hover:border-emerald-200 hover:bg-emerald-50/50"
                onClick={() => window.history.back()}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white/80 rounded-2xl shadow-xl border border-emerald-100 backdrop-blur-sm"
          >
            {/* Dashboard Pages Section (if authenticated) */}
            {!isLoading && isAuthenticated && (
              <div className="p-6 sm:p-8 border-b border-emerald-100">
                <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                  <span className="w-8 h-0.5 bg-emerald-600/30 rounded-full mr-3" />
                  Dashboard Pages
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {Object.entries(dashboardPages).map(([category, pages]) => (
                    <div key={category} className="space-y-4">
                      <h3 className="text-sm font-medium text-emerald-800/60 uppercase tracking-wider">
                        {category === "main"
                          ? "Main"
                          : category === "operations"
                            ? "Operations"
                            : category === "management"
                              ? "Management"
                              : category === "financial"
                                ? "Financial"
                                : "System"}
                      </h3>
                      <div className="space-y-1">
                        {pages.map((page) => (
                          <Link
                            key={page.href}
                            href={page.href}
                            className="group flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-emerald-50/70 transition-colors"
                          >
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100/50 text-emerald-700 group-hover:bg-emerald-100 group-hover:text-emerald-800 transition-colors">
                              <page.icon className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-900 truncate group-hover:text-emerald-800">
                                {page.title}
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-emerald-400 group-hover:text-emerald-600" />
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Links Section */}
            <div className="p-6 sm:p-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <span className="w-8 h-0.5 bg-emerald-600/30 rounded-full mr-3" />
                Popular Destinations
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Object.entries(groupedItems).map(([category, items]) => (
                  <div key={category} className="space-y-4">
                    <h3 className="text-sm font-medium text-emerald-800/60 uppercase tracking-wider">
                      {category}
                    </h3>
                    <div className="space-y-1">
                      {items.slice(0, 4).map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="group flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-emerald-50/70 transition-colors"
                        >
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100/50 text-emerald-700 group-hover:bg-emerald-100 group-hover:text-emerald-800 transition-colors">
                            <item.icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate group-hover:text-emerald-800">
                              {item.title}
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-emerald-400 group-hover:text-emerald-600" />
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Static Pages Section */}
            <div className="border-t border-emerald-100">
              <div className="p-6 sm:p-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                  <span className="w-8 h-0.5 bg-emerald-600/30 rounded-full mr-3" />
                  All Pages
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {Object.entries(staticPages).map(([category, pages]) => (
                    <div key={category} className="space-y-4">
                      <h3 className="text-sm font-medium text-emerald-800/60 uppercase tracking-wider">
                        {category === "main"
                          ? "Main Pages"
                          : category === "solutions"
                            ? "Solutions"
                            : category === "support"
                              ? "Support"
                              : "Legal"}
                      </h3>
                      <div className="space-y-1">
                        {pages.map((page) => (
                          <Link
                            key={page.href}
                            href={page.href}
                            className="group flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-emerald-50/70 transition-colors"
                          >
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100/50 text-emerald-700 group-hover:bg-emerald-100 group-hover:text-emerald-800 transition-colors">
                              <page.icon className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-900 truncate group-hover:text-emerald-800">
                                {page.title}
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-emerald-400 group-hover:text-emerald-600" />
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sign Out Section (if authenticated) */}
            {!isLoading && isAuthenticated && (
              <div className="border-t border-emerald-100">
                <div className="p-6 sm:p-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <UserCheck className="h-5 w-5 text-emerald-600" />
                      <span className="text-sm text-gray-600">
                        You are signed in
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSignOut}
                      className="text-gray-500 hover:text-red-600 border-gray-300 hover:border-red-300"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
