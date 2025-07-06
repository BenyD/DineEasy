"use client";
import { motion } from "framer-motion";
import {
  ChefHat,
  CreditCard,
  FileText,
  LayoutDashboard,
  Printer,
  QrCode,
  Settings,
  Users,
  Star,
  Zap,
  Clock,
  Shield,
  Wallet,
  ArrowRight,
  CheckCircle2,
  Smartphone,
  Receipt,
  LineChart,
  Bell,
  Utensils,
  Table,
  TrendingUp,
} from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { HeaderSection } from "@/components/elements/HeaderSection";
import { FeatureCard } from "@/components/elements/FeatureCard";
import { CTASection } from "@/components/elements/CTASection";
import { AnimatedSection } from "@/components/elements/AnimatedSection";
import { GradientBlob } from "@/components/elements/GradientBlob";
import { Button } from "@/components/ui/button";

export default function FeaturesPage() {
  const mainFeatures = [
    {
      icon: <FileText className="h-8 w-8 text-green-600 sm:h-10 sm:w-10" />,
      title: "Smart Menu Management",
      description:
        "Take control of your menu with our intelligent system that adapts to your business needs. Update prices, items, and categories in real-time.",
      benefits: [
        "AI-powered menu optimization",
        "One-click seasonal updates",
        "Smart pricing strategies",
        "Multi-language support",
        "Real-time availability control",
      ],
    },
    {
      icon: <QrCode className="h-8 w-8 text-green-600 sm:h-10 sm:w-10" />,
      title: "Seamless QR Ordering",
      description:
        "Reduce wait times and increase table turnover with our Swiss-engineered QR ordering system. Beautiful, fast, and reliable.",
      benefits: [
        "Custom-branded QR codes",
        "99.9% uptime guarantee",
        "Instant order processing",
        "Multi-language menus",
        "Smart upsell suggestions",
      ],
    },
    {
      icon: (
        <LayoutDashboard className="h-8 w-8 text-green-600 sm:h-10 sm:w-10" />
      ),
      title: "Powerful Dashboard",
      description:
        "Take control of your restaurant with comprehensive analytics, real-time order management, and business insights.",
      benefits: [
        "Real-time order tracking",
        "Sales performance metrics",
        "Inventory management",
        "Customer behavior insights",
        "Business trend analysis",
      ],
    },
  ];

  const additionalFeatures = [
    {
      icon: <ChefHat className="h-6 w-6 text-green-600" />,
      title: "Kitchen Display System",
      description:
        "Streamline kitchen operations with real-time order management and timing.",
    },
    {
      icon: <CreditCard className="h-6 w-6 text-green-600" />,
      title: "Secure Payments",
      description:
        "Accept payments via Stripe and cash with automatic reconciliation.",
    },
    {
      icon: <Printer className="h-6 w-6 text-green-600" />,
      title: "Smart Printing",
      description:
        "Automated receipt and kitchen ticket printing with customizable templates.",
    },
    {
      icon: <Users className="h-6 w-6 text-green-600" />,
      title: "Staff Management",
      description: "Secure role-based access control for your entire team.",
    },
    {
      icon: <Table className="h-6 w-6 text-green-600" />,
      title: "Table Management",
      description:
        "Digital floor plan with real-time table status and ordering.",
    },
    {
      icon: <TrendingUp className="h-6 w-6 text-green-600" />,
      title: "Business Analytics",
      description:
        "Comprehensive insights into sales, popular items, and peak hours.",
    },
  ];

  return (
    <PageWrapper>
      <HeaderSection
        title="Streamline Your Restaurant, Delight Your Guests"
        subtitle="Swiss-made restaurant technology that puts you in control - from ordering to analytics"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center sm:gap-4"
        >
          <Button
            size="lg"
            className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-green-600 via-green-500 to-green-600 px-6 py-4 text-base font-semibold text-white transition-all hover:shadow-lg sm:w-auto"
            onClick={() => (window.location.href = "/signup")}
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              Try Free for 14 Days
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
            onClick={() => (window.location.href = "/contact")}
          >
            Book a Demo
          </Button>
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-center sm:gap-6"
        >
          {[
            { text: "14-day free trial", icon: Clock },
            { text: "No credit card required", icon: Shield },
            { text: "2% commission only", icon: Wallet },
          ].map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 + index * 0.1 }}
              className="flex items-center gap-2 text-sm text-gray-600"
            >
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100/80 backdrop-blur-sm">
                <item.icon className="h-3 w-3 text-green-600" />
              </div>
              <span>{item.text}</span>
            </motion.div>
          ))}
        </motion.div>
      </HeaderSection>

      {/* Main Features */}
      <section className="relative overflow-hidden bg-white py-16 sm:py-24">
        <GradientBlob
          colors={["#dcfce7", "#bbf7d0"]}
          className="absolute left-0 top-0 -z-10 opacity-50"
        />
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {mainFeatures.map((feature, index) => (
            <AnimatedSection
              key={index}
              className={`grid items-center gap-12 lg:grid-cols-2 ${
                index % 2 === 0 ? "" : "lg:grid-flow-dense"
              } ${index !== 0 ? "mt-24 lg:mt-32" : ""}`}
            >
              <motion.div
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className={index % 2 === 0 ? "" : "lg:col-start-2"}
              >
                <div className="flex items-center gap-4">
                  <div className="rounded-2xl bg-green-50 p-3 ring-1 ring-green-100">
                    {feature.icon}
                  </div>
                  <h2 className="text-2xl font-bold tracking-tighter text-gray-900 sm:text-3xl md:text-4xl">
                    {feature.title}
                  </h2>
                </div>
                <p className="mt-4 text-lg leading-relaxed text-gray-600">
                  {feature.description}
                </p>
                <ul className="mt-8 space-y-4">
                  {feature.benefits.map((benefit, benefitIndex) => (
                    <motion.li
                      key={benefitIndex}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: benefitIndex * 0.1 }}
                      className="flex items-center gap-3"
                    >
                      <div className="rounded-full bg-green-100 p-1">
                        <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-600" />
                      </div>
                      <span className="text-gray-700">{benefit}</span>
                    </motion.li>
                  ))}
                </ul>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5 }}
                  className="mt-8"
                >
                  <Button
                    variant="link"
                    className="group text-green-600 hover:text-green-700"
                    onClick={() => (window.location.href = "/signup")}
                  >
                    Learn more
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </motion.div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: index % 2 === 0 ? 50 : -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className={`relative mx-auto w-full max-w-[560px] ${
                  index % 2 === 0 ? "lg:col-start-2" : ""
                }`}
              >
                <div className="overflow-hidden rounded-xl border bg-white shadow-xl">
                  <div className="aspect-[4/3] relative">
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
                      src={`/images/features/${index + 1}.png`}
                      alt={feature.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>
              </motion.div>
            </AnimatedSection>
          ))}
        </div>
      </section>

      {/* Additional Features */}
      <section className="relative bg-gray-50 py-16 sm:py-24">
        <GradientBlob
          colors={["#dcfce7", "#bbf7d0"]}
          className="absolute right-0 top-0 -z-10 opacity-50"
        />
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Everything You Need to Succeed
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
              Comprehensive tools and features designed specifically for modern
              restaurant operations
            </p>
          </div>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {additionalFeatures.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group relative rounded-2xl bg-white p-6 shadow-sm transition-all hover:shadow-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="rounded-xl bg-green-50 p-2 ring-1 ring-green-100 transition-colors group-hover:bg-green-100">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {feature.title}
                  </h3>
                </div>
                <p className="mt-4 text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <CTASection
        title="Ready to Transform Your Restaurant?"
        description="Join thousands of restaurants already using DineEasy to streamline their operations and delight their customers."
        primaryAction={{
          text: "Start Free Trial",
          href: "/signup",
        }}
        secondaryAction={{
          text: "Contact Sales",
          href: "/contact",
        }}
      />
    </PageWrapper>
  );
}
