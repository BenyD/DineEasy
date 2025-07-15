"use client";

import { motion } from "framer-motion";
import {
  User,
  Building2,
  CreditCard,
  Smartphone,
  QrCode,
  Settings,
  ChevronRight,
  Clock,
  CheckCircle2,
  Globe,
  Mail,
  MapPin,
  ChefHat,
  Zap,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { HeaderSection } from "@/components/elements/HeaderSection";
import { AnimatedSection } from "@/components/elements/AnimatedSection";
import { GradientBlob } from "@/components/elements/GradientBlob";
import { CTASection } from "@/components/elements/CTASection";

const setupSteps = [
  {
    icon: <User className="h-8 w-8" />,
    title: "Create Account & Verify Email",
    description:
      "Sign up for DineEasy and verify your email address to get started.",
    time: "2 minutes",
    tasks: [
      "Fill in your name and email",
      "Create a secure password",
      "Verify your email address",
      "Complete account setup",
    ],
  },
  {
    icon: <Building2 className="h-8 w-8" />,
    title: "Set Up Restaurant Profile",
    description:
      "Configure your restaurant's basic information, contact details, and location.",
    time: "8 minutes",
    tasks: [
      "Add restaurant name and type",
      "Set cuisine and description",
      "Upload logo and cover photo",
      "Configure contact information",
      "Set business address and country",
      "Choose currency and tax settings",
      "Enable service options (reservations, delivery, takeout)",
    ],
  },
  {
    icon: <CreditCard className="h-8 w-8" />,
    title: "Choose Your Plan",
    description:
      "Select a subscription plan that fits your restaurant's needs.",
    time: "3 minutes",
    tasks: [
      "Compare Starter, Pro, and Elite plans",
      "Choose monthly or annual billing",
      "Start 14-day free trial",
      "Complete secure payment setup",
    ],
  },
  {
    icon: <Zap className="h-8 w-8" />,
    title: "Connect Stripe Express",
    description: "Set up payment processing with Stripe's Express accounts.",
    time: "5 minutes",
    tasks: [
      "Connect Stripe Express account",
      "Complete business verification",
      "Set up bank account for payouts",
      "Configure payment methods",
    ],
  },
  {
    icon: <Smartphone className="h-8 w-8" />,
    title: "Create Your Digital Menu",
    description: "Build your menu with categories, items, and pricing.",
    time: "15 minutes",
    tasks: [
      "Create menu categories",
      "Add menu items with descriptions",
      "Set prices and availability",
      "Upload item photos",
      "Configure modifiers and options",
      "Set up dietary information",
    ],
  },
  {
    icon: <QrCode className="h-8 w-8" />,
    title: "Set Up Table QR Codes",
    description: "Generate and configure QR codes for your tables.",
    time: "10 minutes",
    tasks: [
      "Create table layout",
      "Generate unique QR codes",
      "Print and laminate codes",
      "Test customer ordering flow",
      "Configure order notifications",
    ],
  },
  {
    icon: <Settings className="h-8 w-8" />,
    title: "Configure Kitchen Display",
    description: "Set up your kitchen display system and order management.",
    time: "10 minutes",
    tasks: [
      "Set up kitchen display screens",
      "Configure order routing",
      "Set up receipt printers",
      "Test order printing",
      "Configure staff notifications",
    ],
  },
];

export default function SetupGuidePage() {
  return (
    <PageWrapper>
      <HeaderSection
        title="Setup Guide"
        subtitle="Get started with DineEasy in under an hour. Follow our step-by-step guide to set up your restaurant's complete digital ordering system."
      />

      <section className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        {/* Background gradient effects */}
        <div className="absolute inset-0 overflow-hidden">
          <GradientBlob
            colors={["emerald-500/30", "green-500/30"]}
            className="-top-1/2 -right-1/2 w-full h-full"
          />
          <GradientBlob
            colors={["emerald-500/20", "green-500/20"]}
            className="-bottom-1/2 -left-1/2 w-full h-full"
          />
        </div>

        {/* Video container with enhanced styling */}
        <div className="relative">
          {/* Video title */}
          <h2 className="text-center mb-8">
            <span className="inline-block text-2xl sm:text-3xl font-semibold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              Watch How It Works
            </span>
          </h2>

          {/* Video player wrapper */}
          <div className="relative group">
            {/* Glass effect container */}
            <div className="absolute -inset-3 bg-gradient-to-r from-green-100/10 to-emerald-100/10 rounded-2xl backdrop-blur-xl group-hover:from-green-100/20 group-hover:to-emerald-100/20 transition duration-300" />

            {/* Video player */}
            <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-900 shadow-2xl ring-1 ring-gray-800/10 dark:ring-white/10">
              <video
                className="w-full h-full"
                controls
                poster="/images/setup-guide-thumbnail.jpg"
                preload="metadata"
              >
                <source src="/videos/setup-guide.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>

          {/* Video description */}
          <div className="mt-8 text-center">
            <p className="text-base text-gray-600 dark:text-gray-300">
              Learn how to set up your restaurant's complete digital ordering
              system
            </p>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Complete setup in under 1 hour
            </p>
          </div>
        </div>
      </section>

      <AnimatedSection className="relative py-16 sm:py-24">
        <GradientBlob
          size="lg"
          position="top-right"
          className="absolute right-0 top-0 -z-10 opacity-30"
        />
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-xl p-6 shadow-sm text-center"
            >
              <Clock className="h-8 w-8 mx-auto mb-4 text-green-600" />
              <h3 className="text-2xl font-bold mb-2">1 Hour</h3>
              <p className="text-gray-600">Total Setup Time</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white rounded-xl p-6 shadow-sm text-center"
            >
              <CheckCircle2 className="h-8 w-8 mx-auto mb-4 text-green-600" />
              <h3 className="text-2xl font-bold mb-2">7 Steps</h3>
              <p className="text-gray-600">Guided Process</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white rounded-xl p-6 shadow-sm text-center"
            >
              <Shield className="h-8 w-8 mx-auto mb-4 text-green-600" />
              <h3 className="text-2xl font-bold mb-2">14 Days</h3>
              <p className="text-gray-600">Free Trial</p>
            </motion.div>
          </div>

          {/* Setup Steps */}
          <div className="space-y-8">
            {setupSteps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col md:flex-row md:items-start gap-6">
                  <div className="flex-shrink-0">
                    <div className="h-16 w-16 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
                      {step.icon}
                    </div>
                  </div>
                  <div className="flex-grow">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-semibold mb-2">
                          {index + 1}. {step.title}
                        </h3>
                        <p className="text-gray-600 mb-4">{step.description}</p>
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="h-4 w-4 mr-1" />
                        {step.time}
                      </div>
                    </div>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {step.tasks.map((task, taskIndex) => (
                        <li
                          key={taskIndex}
                          className="flex items-center text-gray-700"
                        >
                          <ChevronRight className="h-4 w-4 mr-2 text-green-600" />
                          {task}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Additional Features Section */}
          <div className="mt-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold mb-4">What You Get</h2>
              <p className="text-lg text-gray-600">
                Complete restaurant management system with everything you need
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: <Globe className="h-6 w-6" />,
                  title: "Multi-Country Support",
                  description:
                    "Works in 20+ countries with local currencies and tax rates",
                },
                {
                  icon: <Mail className="h-6 w-6" />,
                  title: "Email Verification",
                  description: "Secure account setup with email verification",
                },
                {
                  icon: <MapPin className="h-6 w-6" />,
                  title: "Location Services",
                  description: "Automatic currency and country detection",
                },
                {
                  icon: <ChefHat className="h-6 w-6" />,
                  title: "Menu Management",
                  description:
                    "Easy menu creation with categories and modifiers",
                },
                {
                  icon: <QrCode className="h-6 w-6" />,
                  title: "QR Code System",
                  description: "Table-specific QR codes for seamless ordering",
                },
                {
                  icon: <Shield className="h-6 w-6" />,
                  title: "Secure Payments",
                  description:
                    "Stripe Express integration for safe transactions",
                },
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 bg-green-50 rounded-lg flex items-center justify-center text-green-600">
                      {feature.icon}
                    </div>
                    <h3 className="font-semibold">{feature.title}</h3>
                  </div>
                  <p className="text-gray-600 text-sm">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>

          <CTASection
            title="Ready to Get Started?"
            subtitle="Join thousands of restaurants using DineEasy to streamline their operations"
            buttonText="Start Free Trial"
            buttonHref="/signup"
            secondaryButtonText="Contact Support"
            secondaryButtonHref="/contact"
            features={[
              "14-day free trial",
              "No credit card required",
              "Guided setup process",
              "24/7 support available",
            ]}
          />
        </div>
      </AnimatedSection>
    </PageWrapper>
  );
}
