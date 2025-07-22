"use client";

import {
  ArrowRight,
  CheckCircle,
  QrCode,
  Timer,
  Smartphone,
  ScanLine,
  CreditCard,
  Printer,
  LayoutDashboard,
  UtensilsCrossed,
  Receipt,
  CreditCard as PaymentIcon,
  ArrowDown,
  Search,
  Clock,
  ChefHat,
  Bell,
  Sparkles,
  Zap,
  Shield,
  Settings,
  LineChart,
  Users,
  Wallet,
  Laptop,
  Star,
  Globe2,
  TrendingUp,
  Clock4,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { HeroSection } from "@/components/elements/HeroSection";
import { FeatureCard } from "@/components/elements/FeatureCard";
import { CTASection } from "@/components/elements/CTASection";
import { GradientBlob } from "@/components/elements/GradientBlob";
import { AnimatedSection } from "@/components/elements/AnimatedSection";
import { calculateCircularPosition } from "@/lib/utils";
import Script from "next/script";

export default function LandingPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "DineEasy",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description:
      "Modern restaurant management system with QR-based ordering, real-time dashboards, and seamless payments.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "CHF",
      description: "14-day free trial",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "5",
      ratingCount: "1000",
      bestRating: "5",
      worstRating: "1",
    },
    featureList: [
      "QR Menu System",
      "Multi-Payment Support",
      "Auto Thermal Printing",
      "Real-time Dashboard",
    ],
  };

  return (
    <>
      <Script id="schema-org" type="application/ld+json">
        {JSON.stringify(jsonLd)}
      </Script>
      <PageWrapper>
        <HeroSection size="full">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-center min-h-[calc(100vh-5rem)]">
            <div className="grid gap-4 lg:grid-cols-2 lg:gap-8 xl:gap-12 items-center max-w-6xl mx-auto w-full">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, ease: [0.21, 0.47, 0.32, 0.98] }}
                className="flex flex-col justify-center space-y-4 sm:space-y-6"
              >
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex flex-col gap-3">
                    <motion.div className="flex gap-3 items-center">
                      <motion.span
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="inline-flex items-center rounded-full bg-green-50/80 px-3 py-1 text-sm font-medium text-green-700 ring-1 ring-inset ring-green-600/20 hover:bg-green-100 transition-colors backdrop-blur-sm"
                      >
                        <span className="mr-2 text-lg">🇨🇭</span>
                        Made in Switzerland
                      </motion.span>
                      <motion.span
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        className="inline-flex items-center rounded-full bg-green-600/10 px-3 py-1 text-sm font-medium text-green-700"
                      >
                        <Star className="mr-1 h-3.5 w-3.5 text-green-600" />
                        Rated 4.9/5
                      </motion.span>
                    </motion.div>
                    <motion.h1
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl"
                    >
                      Modern{" "}
                      <span className="relative">
                        <span className="relative z-10 bg-gradient-to-br from-green-600 via-green-500 to-green-600 bg-clip-text text-transparent">
                          Restaurant Management
                        </span>
                        <motion.span
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: 1 }}
                          transition={{
                            delay: 0.5,
                            duration: 0.8,
                            ease: "easeOut",
                          }}
                          className="absolute inset-x-0 bottom-0 h-2 w-full origin-left bg-green-100/40"
                        />
                      </span>{" "}
                      Made Simple
                    </motion.h1>
                  </div>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-base text-gray-600 sm:text-lg md:text-xl md:leading-relaxed max-w-xl"
                  >
                    Modernize your restaurant with digital ordering and seamless
                    operations. Let your customers order via QR codes while you
                    manage everything from a powerful dashboard. Accept Stripe
                    and cash payments with automatic thermal printing.
                  </motion.p>
                </div>

                {/* CTA Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="flex flex-col gap-3 sm:flex-row sm:gap-4"
                >
                  <Button
                    size="lg"
                    className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-green-600 via-green-500 to-green-600 px-6 py-4 text-base font-semibold text-white transition-all hover:shadow-lg sm:w-auto"
                    onClick={() => (window.location.href = "/signup")}
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      Start 14-Day Free Trial
                      <motion.span
                        animate={{ x: [0, 4, 0] }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      >
                        <ArrowRight className="h-4 w-4" />
                      </motion.span>
                    </span>
                    <div className="absolute inset-0 -z-10 bg-gradient-to-br from-green-500 via-green-600 to-green-500 opacity-0 transition-opacity group-hover:opacity-100" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="group rounded-xl border-2 border-green-200 px-6 py-4 text-base font-semibold text-green-700 transition-all hover:border-green-300 hover:bg-green-50 sm:w-auto"
                    onClick={() => (window.location.href = "/features")}
                  >
                    <span className="flex items-center gap-2">
                      See Features
                      <motion.span
                        animate={{ y: [0, -2, 0] }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </motion.span>
                    </span>
                  </Button>
                </motion.div>

                {/* Trust Points */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-6"
                >
                  {[
                    { text: "14-day free trial", delay: 0, icon: Clock4 },
                    {
                      text: "No credit card required",
                      delay: 0.1,
                      icon: Shield,
                    },
                    { text: "2% commission only", delay: 0.2, icon: Wallet },
                  ].map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 + item.delay }}
                      className="flex items-center gap-2 text-sm text-gray-600"
                    >
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100/80 backdrop-blur-sm">
                        <item.icon className="h-3 w-3 text-green-600" />
                      </div>
                      <span>{item.text}</span>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>

              {/* Hero Image */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  duration: 0.8,
                  delay: 0.2,
                  ease: [0.21, 0.47, 0.32, 0.98],
                }}
                className="relative mx-auto w-full max-w-[500px] lg:mx-0"
              >
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-green-100 bg-white shadow-2xl">
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-tr from-green-100/40 via-transparent to-green-50/20"
                    animate={{
                      opacity: [0.5, 0.3, 0.5],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                  <img
                    src="/placeholder.svg?height=600&width=800"
                    alt="DineEasy Dashboard"
                    className="h-full w-full object-cover"
                  />

                  {/* Floating Elements */}
                  <motion.div
                    className="absolute -right-4 -top-4 rounded-xl bg-white/90 p-3 shadow-lg backdrop-blur-sm ring-1 ring-green-100"
                    animate={{
                      y: [0, -8, 0],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <QrCode className="h-6 w-6 text-green-600" />
                  </motion.div>
                  <motion.div
                    className="absolute -bottom-3 -left-3 rounded-xl bg-white/90 p-3 shadow-lg backdrop-blur-sm ring-1 ring-green-100"
                    animate={{
                      y: [0, 8, 0],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <LineChart className="h-6 w-6 text-green-600" />
                  </motion.div>

                  {/* Additional Floating Elements */}
                  <motion.div
                    className="absolute top-1/4 -right-2 rounded-lg bg-white/90 px-3 py-2 shadow-md backdrop-blur-sm ring-1 ring-green-100"
                    animate={{
                      x: [0, -5, 0],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4 text-green-600" />
                      <span className="text-xs font-medium text-green-800">
                        New Order
                      </span>
                    </div>
                  </motion.div>
                  <motion.div
                    className="absolute bottom-1/4 -left-2 rounded-lg bg-white/90 px-3 py-2 shadow-md backdrop-blur-sm ring-1 ring-green-100"
                    animate={{
                      x: [0, 5, 0],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="text-xs font-medium text-green-800">
                        +23% Sales
                      </span>
                    </div>
                  </motion.div>
                </div>

                {/* Stats Overlay */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="absolute -bottom-4 left-1/2 -translate-x-1/2 rounded-xl bg-white/90 p-3 shadow-lg backdrop-blur-sm ring-1 ring-green-100"
                >
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="text-sm font-semibold text-green-800">
                        500+
                      </div>
                      <div className="text-xs text-gray-600">Restaurants</div>
                    </div>
                    <div className="h-8 w-px bg-gray-200" />
                    <div className="text-center">
                      <div className="text-sm font-semibold text-green-800">
                        1M+
                      </div>
                      <div className="text-xs text-gray-600">Orders</div>
                    </div>
                    <div className="h-8 w-px bg-gray-200" />
                    <div className="text-center">
                      <div className="text-sm font-semibold text-green-800">
                        99.9%
                      </div>
                      <div className="text-xs text-gray-600">Uptime</div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </HeroSection>

        <AnimatedSection className="relative py-16 sm:py-24">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-4xl text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <span className="mb-4 inline-block rounded-full bg-green-100 px-4 py-1 text-sm font-medium text-green-800">
                  Simple Process
                </span>
                <h2 className="text-2xl font-bold tracking-tighter sm:text-3xl md:text-4xl lg:text-5xl">
                  How It Works
                </h2>
                <p className="mt-3 text-gray-500 sm:mt-4">
                  Get your restaurant online and start accepting digital orders
                  in three simple steps
                </p>
              </motion.div>
            </div>

            <div className="relative mt-12 sm:mt-16">
              {/* Vertical line connector */}
              <div className="absolute left-1/2 top-0 h-full w-px bg-green-200/50 md:left-[calc(50%-0.5px)]" />

              {[
                {
                  icon: (
                    <Settings className="h-8 w-8 text-green-600 sm:h-10 sm:w-10" />
                  ),
                  secondaryIcons: [
                    <UtensilsCrossed
                      key="menu"
                      className="h-6 w-6 text-green-500"
                    />,
                    <QrCode key="qr" className="h-6 w-6 text-green-500" />,
                  ],
                  title: "Quick Setup",
                  subtitle: "Menu & QR Configuration",
                  description:
                    "Create your digital menu in minutes using our intuitive menu builder. Generate unique QR codes for each table and customize their design to match your brand.",
                  benefits: [
                    "Easy menu creation",
                    "Custom QR code design",
                    "Table management",
                  ],
                },
                {
                  icon: (
                    <LayoutDashboard className="h-8 w-8 text-green-600 sm:h-10 sm:w-10" />
                  ),
                  secondaryIcons: [
                    <ChefHat
                      key="kitchen"
                      className="h-6 w-6 text-green-500"
                    />,
                    <Printer key="print" className="h-6 w-6 text-green-500" />,
                  ],
                  title: "Manage Orders",
                  subtitle: "Real-time Operations",
                  description:
                    "Receive orders instantly on your dashboard and kitchen display. Manage order flow, track preparation times, and automatically print receipts and kitchen tickets.",
                  benefits: [
                    "Real-time order management",
                    "Automatic printing",
                    "Kitchen display system",
                  ],
                },
                {
                  icon: (
                    <LineChart className="h-8 w-8 text-green-600 sm:h-10 sm:w-10" />
                  ),
                  secondaryIcons: [
                    <PaymentIcon
                      key="payment"
                      className="h-6 w-6 text-green-500"
                    />,
                    <TrendingUp
                      key="analytics"
                      className="h-6 w-6 text-green-500"
                    />,
                  ],
                  title: "Grow Revenue",
                  subtitle: "Insights & Payments",
                  description:
                    "Accept Stripe and cash payments seamlessly. Track sales, analyze popular items, and get insights to optimize your menu and operations.",
                  benefits: [
                    "Secure payment processing",
                    "Sales analytics",
                    "Performance insights",
                  ],
                },
              ].map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: index * 0.2 }}
                  className="relative mb-16 md:mb-24 last:mb-0"
                >
                  {/* Step number circle - Positioned differently for mobile and desktop */}
                  <motion.div
                    className="absolute left-1/2 z-10 -translate-x-1/2 md:translate-y-0"
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.2 + 0.3 }}
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-green-500 to-green-600 text-2xl font-bold text-white shadow-lg">
                      {index + 1}
                    </div>
                  </motion.div>

                  <div
                    className={`flex flex-col gap-8 pt-8 md:pt-0 md:flex-row ${
                      index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                    } items-center md:gap-12`}
                  >
                    {/* Content card */}
                    <div className="w-full rounded-2xl border border-green-100 bg-white p-6 shadow-lg transition-all hover:shadow-xl md:w-1/2">
                      <div className="mb-4 flex items-center gap-4">
                        <div className="rounded-full bg-green-50 p-3">
                          {step.icon}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold sm:text-2xl">
                            {step.title}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {step.subtitle}
                          </p>
                        </div>
                      </div>
                      <p className="mb-4 text-gray-600">{step.description}</p>
                      <ul className="space-y-2">
                        {step.benefits.map((benefit, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-500" />
                            <span className="text-sm text-gray-600">
                              {benefit}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Visual elements */}
                    <div className="relative flex w-full items-center justify-center md:w-1/2">
                      <div className="relative h-64 w-64">
                        <motion.div
                          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transform rounded-full bg-green-100/80 backdrop-blur-sm p-8"
                          animate={{
                            scale: [1, 1.1, 1],
                            rotate: [0, 5, -5, 0],
                          }}
                          transition={{
                            duration: 4,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                        >
                          {step.icon}
                        </motion.div>
                        {step.secondaryIcons.map((icon, i) => {
                          const position = calculateCircularPosition(i, 3);
                          return (
                            <motion.div
                              key={i}
                              className="absolute"
                              style={position}
                              animate={{
                                scale: [1, 1.2, 1],
                                rotate: [0, 10, -10, 0],
                              }}
                              transition={{
                                duration: 3,
                                delay: i * 0.5,
                                repeat: Infinity,
                                ease: "easeInOut",
                              }}
                            >
                              <div className="rounded-full bg-white/90 p-3 shadow-md backdrop-blur-sm ring-1 ring-green-100">
                                {icon}
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Connection arrow - Only show between steps */}
                  {index < 2 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.7 + index * 0.2 }}
                      className="absolute left-1/2 -bottom-8 flex -translate-x-1/2 transform justify-center"
                    >
                      <ArrowDown className="h-6 w-6 text-green-400" />
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection className="relative overflow-hidden py-16 sm:py-24">
          <div className="container relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* Background decoration */}
            <div className="absolute inset-0 -z-10 overflow-hidden">
              <motion.div
                className="absolute -top-1/2 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-green-100/30 blur-3xl"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.5, 0.3],
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              <motion.div
                className="absolute -bottom-1/2 right-0 h-96 w-96 rounded-full bg-blue-100/30 blur-3xl"
                animate={{
                  scale: [1.2, 1, 1.2],
                  opacity: [0.3, 0.5, 0.3],
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="relative mx-auto max-w-4xl text-center"
            >
              <span className="mb-4 inline-block rounded-full bg-green-100 px-4 py-1 text-sm font-medium text-green-800">
                Powerful Features
              </span>
              <h2 className="text-2xl font-bold tracking-tighter sm:text-3xl md:text-4xl lg:text-5xl">
                Everything You Need to Run Your Restaurant
              </h2>
              <p className="mt-4 text-gray-500 sm:text-lg">
                Comprehensive tools and features designed to streamline your
                operations and enhance customer experience
              </p>
            </motion.div>

            <div className="mt-16 grid gap-8 sm:mt-20 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  title: "Smart QR Menu System",
                  description:
                    "Digital menus with instant updates and customization options for easy menu management",
                  icon: <QrCode className="h-6 w-6" />,
                  highlights: [
                    "Instant menu updates",
                    "Category organization",
                    "Beautiful menu design",
                  ],
                  delay: 0,
                },
                {
                  title: "Secure Payments",
                  description:
                    "Accept payments securely with Stripe integration and cash handling",
                  icon: <Wallet className="h-6 w-6" />,
                  highlights: [
                    "Stripe integration",
                    "Cash management",
                    "Automatic reconciliation",
                  ],
                  delay: 0.1,
                },
                {
                  title: "Smart Printing System",
                  description:
                    "Automated thermal printing for kitchen tickets and customer receipts",
                  icon: <Printer className="h-6 w-6" />,
                  highlights: [
                    "Auto-printing",
                    "Multiple printer support",
                    "Custom templates",
                  ],
                  delay: 0.2,
                },
                {
                  title: "Real-time Analytics",
                  description:
                    "Comprehensive dashboard with sales metrics and menu insights",
                  icon: <LineChart className="h-6 w-6" />,
                  highlights: [
                    "Sales tracking",
                    "Popular items",
                    "Revenue analytics",
                  ],
                  delay: 0.3,
                },
                {
                  title: "Team Access Control",
                  description:
                    "Secure access management for your restaurant staff",
                  icon: <Users className="h-6 w-6" />,
                  highlights: [
                    "Role-based access",
                    "Secure permissions",
                    "Activity logging",
                  ],
                  delay: 0.4,
                },
                {
                  title: "Cloud Platform",
                  description:
                    "Access your restaurant management system from anywhere, anytime",
                  icon: <Laptop className="h-6 w-6" />,
                  highlights: [
                    "24/7 availability",
                    "Auto backups",
                    "Multi-device sync",
                  ],
                  delay: 0.5,
                },
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: feature.delay }}
                  className="group relative overflow-hidden rounded-2xl border bg-white p-6 shadow-lg transition-all duration-300 hover:shadow-xl"
                >
                  {/* Hover effect background */}
                  <div className="absolute inset-0 -z-10 bg-gradient-to-br from-emerald-50/50 to-emerald-100/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                  {/* Feature icon */}
                  <div className="mb-4 inline-flex rounded-xl bg-emerald-50 p-3">
                    <div className="text-emerald-600">{feature.icon}</div>
                  </div>

                  {/* Content */}
                  <h3 className="mb-2 text-xl font-bold">{feature.title}</h3>
                  <p className="mb-4 text-sm text-gray-500">
                    {feature.description}
                  </p>

                  {/* Highlights */}
                  <ul className="space-y-2">
                    {feature.highlights.map((highlight, i) => (
                      <motion.li
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{
                          duration: 0.3,
                          delay: feature.delay + i * 0.1,
                        }}
                        className="flex items-center gap-2 text-sm text-gray-600"
                      >
                        <Sparkles className="h-4 w-4 text-emerald-500" />
                        {highlight}
                      </motion.li>
                    ))}
                  </ul>

                  {/* Learn more link */}
                  <motion.a
                    href="/features"
                    whileHover={{ x: 5 }}
                    className="mt-4 inline-flex cursor-pointer items-center gap-1 text-sm font-medium text-emerald-600"
                  >
                    Learn more
                    <ArrowRight className="h-4 w-4" />
                  </motion.a>
                </motion.div>
              ))}
            </div>

            {/* CTA Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="mt-16 text-center sm:mt-20"
            >
              <Button
                size="lg"
                className="bg-green-600 hover:bg-green-700"
                onClick={() => (window.location.href = "/features")}
              >
                Explore All Features
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </motion.div>
          </div>
        </AnimatedSection>

        <AnimatedSection className="relative overflow-hidden bg-gray-50 py-16 sm:py-24">
          <div className="container relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* Background decoration */}
            <div className="absolute inset-0 -z-10 overflow-hidden">
              <motion.div
                className="absolute -top-1/2 right-0 h-96 w-96 rounded-full bg-green-100/30 blur-3xl"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.5, 0.3],
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="relative mx-auto max-w-4xl text-center"
            >
              <span className="mb-4 inline-block rounded-full bg-green-100 px-4 py-1 text-sm font-medium text-green-800">
                Global Trust
              </span>
              <h2 className="text-2xl font-bold tracking-tighter sm:text-3xl md:text-4xl lg:text-5xl">
                Trusted by 1000+ Restaurants Worldwide
              </h2>
              <p className="mt-4 text-gray-500 sm:text-lg">
                Join the growing community of restaurants transforming their
                business with DineEasy
              </p>
            </motion.div>

            {/* Stats */}
            <div className="mt-16 grid gap-8 sm:mt-20 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  icon: <Globe2 className="h-6 w-6" />,
                  stat: "1000+",
                  label: "Restaurants",
                  description: "Across 15+ countries",
                },
                {
                  icon: <Star className="h-6 w-6" />,
                  stat: "4.9/5",
                  label: "Customer Rating",
                  description: "Based on 2000+ reviews",
                },
                {
                  icon: <TrendingUp className="h-6 w-6" />,
                  stat: "2M+",
                  label: "Orders Processed",
                  description: "Monthly transactions",
                },
                {
                  icon: <Clock4 className="h-6 w-6" />,
                  stat: "99.9%",
                  label: "Uptime",
                  description: "Reliable service",
                },
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="relative overflow-hidden rounded-2xl border bg-white p-6 text-center shadow-lg"
                >
                  <div className="mb-4 inline-flex rounded-xl bg-green-50 p-3 text-green-600">
                    {stat.icon}
                  </div>
                  <div className="text-3xl font-bold text-gray-900">
                    {stat.stat}
                  </div>
                  <div className="font-medium text-gray-900">{stat.label}</div>
                  <div className="mt-1 text-sm text-gray-500">
                    {stat.description}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Testimonials */}
            <div className="mt-16 grid gap-8 sm:mt-20 md:grid-cols-3">
              {[
                {
                  quote:
                    "DineEasy transformed our restaurant operations. The QR ordering system has significantly improved our efficiency.",
                  author: "Sarah Chen",
                  role: "Restaurant Owner",
                  location: "Zürich",
                },
                {
                  quote:
                    "The real-time analytics helped us optimize our menu and increase our revenue by 30% in just three months.",
                  author: "Marco Rossi",
                  role: "Restaurant Manager",
                  location: "Geneva",
                },
                {
                  quote:
                    "Outstanding customer support and constant platform improvements. It's been a game-changer for our business.",
                  author: "Thomas Mueller",
                  role: "Restaurant Owner",
                  location: "Basel",
                },
              ].map((testimonial, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                  className="relative rounded-2xl border bg-white p-6 shadow-lg"
                >
                  <div className="mb-4 flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-5 w-5 fill-current text-yellow-400"
                      />
                    ))}
                  </div>
                  <blockquote className="mb-4 text-gray-700">
                    "{testimonial.quote}"
                  </blockquote>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gray-100" />
                    <div>
                      <div className="font-medium text-gray-900">
                        {testimonial.author}
                      </div>
                      <div className="text-sm text-gray-500">
                        {testimonial.role} • {testimonial.location}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Trust Badges */}
            <div className="mt-16 sm:mt-20">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="grid gap-8 grayscale sm:grid-cols-2 md:grid-cols-4"
              >
                {[
                  "Stripe Verified",
                  "ISO 27001 Certified",
                  "GDPR Compliant",
                  "Swiss Made Software",
                ].map((badge, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-center rounded-lg border bg-white px-6 py-4 text-sm font-medium text-gray-600"
                  >
                    {badge}
                  </div>
                ))}
              </motion.div>
            </div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="mt-16 text-center sm:mt-20"
            >
              <Button
                size="lg"
                className="bg-green-600 hover:bg-green-700"
                onClick={() => (window.location.href = "/signup")}
              >
                Join Successful Restaurants
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </motion.div>
          </div>
        </AnimatedSection>

        <CTASection
          title="Ready to Transform Your Restaurant?"
          subtitle="Join thousands of restaurants already using DineEasy to streamline their operations and delight customers."
          buttonText="Start 14-Day Free Trial"
          buttonHref="/signup"
        />
      </PageWrapper>
    </>
  );
}
