"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence, useScroll } from "framer-motion";
import { Menu, X, ChevronDown, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "./Logo";
import { SearchCommand } from "./SearchCommand";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { scrollYProgress } = useScroll();
  const pathname = usePathname();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const navItems = [
    {
      label: "Product",
      items: [
        {
          href: "/features",
          label: "Features",
          description: "Explore all our powerful features",
        },
        {
          href: "/pricing",
          label: "Pricing",
          description: "Simple, transparent pricing",
        },
        {
          href: "/security",
          label: "Security",
          description: "Enterprise-grade security and compliance",
        },
        {
          href: "/setup-guide",
          label: "Setup Guide",
          description: "Step-by-step guide to get started with DineEasy",
        },
      ],
    },
    {
      label: "Solutions",
      items: [
        {
          href: "/solutions/restaurants",
          label: "Restaurants",
          description: "Full-service restaurant management platform",
        },
        {
          href: "/solutions/cafes",
          label: "Cafés",
          description: "Streamlined solutions for coffee shops and cafés",
        },
        {
          href: "/solutions/bars",
          label: "Bars",
          description: "Specialized tools for bars and nightlife",
        },
        {
          href: "/solutions/food-trucks",
          label: "Food Trucks",
          description: "Mobile-first solutions for food trucks",
        },
      ],
    },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] }}
      className="sticky top-0 z-50 bg-white/80 backdrop-blur-md transition-shadow"
    >
      {/* Scroll Progress Bar */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-[1px] origin-left bg-gradient-to-r from-green-600/80 via-green-500/80 to-green-400/80"
        style={{ scaleX: scrollYProgress }}
        transition={{
          type: "spring",
          stiffness: 100,
          damping: 30,
          restDelta: 0.001,
        }}
      />

      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between sm:h-20">
          <div className="flex items-center gap-8">
            <Logo />

            {/* Desktop Navigation */}
            <nav className="hidden items-center gap-1 md:flex lg:gap-2">
              {navItems.map((item, index) =>
                "items" in item ? (
                  <div key={item.label} className="relative group">
                    <button className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-green-600">
                      {item.label}
                      <ChevronDown className="h-4 w-4 transition-transform group-hover:rotate-180" />
                    </button>

                    {/* Dropdown Menu */}
                    <div className="absolute left-0 top-[calc(100%+4px)] hidden w-64 rounded-lg border bg-white p-4 shadow-lg group-hover:block">
                      <div className="space-y-3">
                        {item.items.map((subItem) => (
                          <Link
                            key={subItem.href}
                            href={subItem.href}
                            className="block rounded-md p-2 transition-colors hover:bg-gray-50"
                          >
                            <div className="text-sm font-medium text-gray-900">
                              {subItem.label}
                            </div>
                            <div className="text-xs text-gray-500">
                              {subItem.description}
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + index * 0.1 }}
                  >
                    <Link
                      href={item.href}
                      className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-100 hover:text-green-600 ${
                        pathname === item.href
                          ? "text-green-600"
                          : "text-gray-700"
                      }`}
                    >
                      {item.label}
                    </Link>
                  </motion.div>
                )
              )}
            </nav>
          </div>

          {/* Desktop Right Section */}
          <div className="hidden items-center gap-6 md:flex">
            <SearchCommand />
            <div className="flex items-center gap-3">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Button variant="ghost" asChild size="sm">
                  <Link href="/login">Sign In</Link>
                </Button>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Button
                  asChild
                  size="sm"
                  className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-600"
                >
                  <Link href="/signup">Start Free Trial</Link>
                </Button>
              </motion.div>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setIsOpen(!isOpen)}
          >
            <AnimatePresence mode="wait">
              {isOpen ? (
                <motion.div
                  key="close"
                  initial={{ opacity: 0, rotate: -90 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: 90 }}
                  transition={{ duration: 0.2 }}
                >
                  <X className="h-5 w-5" />
                </motion.div>
              ) : (
                <motion.div
                  key="menu"
                  initial={{ opacity: 0, rotate: 90 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: -90 }}
                  transition={{ duration: 0.2 }}
                >
                  <Menu className="h-5 w-5" />
                </motion.div>
              )}
            </AnimatePresence>
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t bg-white md:hidden"
          >
            <div className="container divide-y px-4">
              {/* Navigation Items */}
              <div className="py-4">
                {navItems.map((item, index) =>
                  "items" in item ? (
                    <div key={item.label} className="mb-4">
                      <div className="mb-2 px-2 text-sm font-medium text-gray-900">
                        {item.label}
                      </div>
                      <div className="space-y-1">
                        {item.items.map((subItem) => (
                          <Link
                            key={subItem.href}
                            href={subItem.href}
                            className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            onClick={() => setIsOpen(false)}
                          >
                            {subItem.label}
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`block rounded-lg px-2 py-2 text-sm font-medium ${
                        pathname === item.href
                          ? "text-green-600"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                      onClick={() => setIsOpen(false)}
                    >
                      {item.label}
                    </Link>
                  )
                )}
              </div>

              {/* Mobile Actions */}
              <div className="flex flex-col gap-2 py-4">
                <Button variant="ghost" asChild size="sm">
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button
                  asChild
                  size="sm"
                  className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-600"
                >
                  <Link href="/signup">Start Free Trial</Link>
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
