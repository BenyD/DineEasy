"use client"

import { useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence, useScroll } from "framer-motion"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Logo } from "./Logo"

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const { scrollYProgress } = useScroll()

  const navItems = [
    { href: "/features", label: "Features" },
    { href: "/pricing", label: "Pricing" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
  ]

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] }}
      className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-md"
    >
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between sm:h-20">
        <Logo />

        {/* Desktop Navigation */}
        <nav className="hidden gap-6 md:flex lg:gap-8">
          {navItems.map((item, index) => (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.1 }}
            >
              <Link
                href={item.href}
                className="text-sm font-medium transition-colors hover:text-green-600 hover:underline underline-offset-4"
              >
                {item.label}
              </Link>
            </motion.div>
          ))}
        </nav>

        {/* Desktop Auth Buttons */}
        <div className="hidden items-center gap-4 md:flex">
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
            <Link href="/login" className="text-sm font-medium hover:underline">
              Sign In
            </Link>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}>
            <Button asChild size="sm" variant="gradient">
              <Link href="/signup">Sign Up</Link>
            </Button>
          </motion.div>
        </div>

        {/* Mobile Menu Button */}
        <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
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
            <div className="container space-y-4 px-4 py-6">
              {navItems.map((item, index) => (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link
                    href={item.href}
                    className="block text-sm font-medium hover:text-green-600"
                    onClick={() => setIsOpen(false)}
                  >
                    {item.label}
                  </Link>
                </motion.div>
              ))}
              <div className="flex flex-col gap-3 pt-4">
                <Link href="/login" className="text-sm font-medium hover:underline" onClick={() => setIsOpen(false)}>
                  Sign In
                </Link>
                <Button asChild size="sm" variant="gradient" className="w-fit">
                  <Link href="/signup" onClick={() => setIsOpen(false)}>
                    Sign Up
                  </Link>
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gradient Progress Bar */}
      <motion.div
        className="h-1 w-full bg-linear-to-r from-green-400 via-emerald-500 to-green-600"
        style={{
          scaleX: scrollYProgress,
          transformOrigin: "0%",
        }}
      />
    </motion.header>
  )
}
