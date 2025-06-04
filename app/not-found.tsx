"use client";

import React from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
    href: "/dashboard/menu",
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
    icon: ShoppingCart,
    shortcut: "⌘ K",
    category: "Operations",
  },
  {
    title: "Staff Management",
    href: "/dashboard/staff",
    description: "Manage your restaurant staff",
    icon: Settings,
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

// Define static pages
const staticPages = [
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
    title: "Contact",
    href: "/contact",
    description: "Get in touch with us",
    icon: Mail,
  },
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
];

export default function NotFound() {
  const router = useRouter();

  // Group navigation items by category
  const groupedItems = navigationItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof navigationItems>);

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
              The page you're looking for doesn't exist or has been moved.
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
                  Other Resources
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {staticPages.map((page) => (
                    <Link
                      key={page.href}
                      href={page.href}
                      className="group relative flex items-start gap-4 rounded-xl p-4 hover:bg-emerald-50/70 transition-colors"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100/50 text-emerald-700 group-hover:bg-emerald-100 group-hover:text-emerald-800 transition-colors">
                        <page.icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 group-hover:text-emerald-800">
                          {page.title}
                        </div>
                        <div className="mt-1 text-sm text-gray-500 group-hover:text-emerald-600/80 line-clamp-2">
                          {page.description}
                        </div>
                      </div>
                      <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400 group-hover:text-emerald-600 transition-colors" />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
