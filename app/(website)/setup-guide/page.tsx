"use client";

import { motion } from "framer-motion";
import {
  Store,
  Users,
  CreditCard,
  Smartphone,
  Printer,
  QrCode,
  Settings,
  ChevronRight,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { HeaderSection } from "@/components/elements/HeaderSection";
import { AnimatedSection } from "@/components/elements/AnimatedSection";
import { GradientBlob } from "@/components/elements/GradientBlob";
import { CTASection } from "@/components/elements/CTASection";

const setupSteps = [
  {
    icon: <Store className="h-8 w-8" />,
    title: "Create Your Account",
    description:
      "Sign up for DineEasy and verify your email address to get started.",
    time: "2 minutes",
    tasks: [
      "Fill in your business details",
      "Verify your email address",
      "Choose your subscription plan",
    ],
  },
  {
    icon: <Settings className="h-8 w-8" />,
    title: "Configure Restaurant Profile",
    description:
      "Set up your restaurant's basic information and operating hours.",
    time: "5 minutes",
    tasks: [
      "Add restaurant name and description",
      "Set business hours",
      "Upload logo and photos",
      "Configure service areas",
    ],
  },
  {
    icon: <CreditCard className="h-8 w-8" />,
    title: "Set Up Payments",
    description: "Connect your Stripe account to start accepting payments.",
    time: "5 minutes",
    tasks: [
      "Connect Stripe account",
      "Set up payment methods",
      "Configure auto-payouts",
      "Test payment processing",
    ],
  },
  {
    icon: <Users className="h-8 w-8" />,
    title: "Add Staff Members",
    description: "Invite your team and set up role-based permissions.",
    time: "10 minutes",
    tasks: [
      "Create staff accounts",
      "Assign roles and permissions",
      "Set up staff PIN codes",
      "Configure work schedules",
    ],
  },
  {
    icon: <Smartphone className="h-8 w-8" />,
    title: "Create Your Menu",
    description:
      "Build your digital menu with categories, items, and modifiers.",
    time: "15 minutes",
    tasks: [
      "Create menu categories",
      "Add menu items and prices",
      "Set up modifiers and options",
      "Upload item photos",
    ],
  },
  {
    icon: <QrCode className="h-8 w-8" />,
    title: "Set Up Table QR Codes",
    description: "Generate and print QR codes for your tables.",
    time: "10 minutes",
    tasks: [
      "Create table layout",
      "Generate QR codes",
      "Print and laminate codes",
      "Test order flow",
    ],
  },
  {
    icon: <Printer className="h-8 w-8" />,
    title: "Configure Kitchen Display",
    description: "Set up your kitchen display system and receipt printers.",
    time: "10 minutes",
    tasks: [
      "Connect receipt printer",
      "Configure KDS screens",
      "Set up order routing",
      "Test order printing",
    ],
  },
];

export default function SetupGuidePage() {
  return (
    <PageWrapper>
      <HeaderSection
        title="Setup Guide"
        subtitle="Get started with DineEasy in minutes. Follow our step-by-step guide to set up your restaurant's digital ordering system."
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
              Learn how to set up your restaurant's digital menu, QR codes, and
              ordering system
            </p>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Complete setup in under 10 minutes
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
              <p className="text-gray-600">Easy to Follow</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white rounded-xl p-6 shadow-sm text-center"
            >
              <Users className="h-8 w-8 mx-auto mb-4 text-green-600" />
              <h3 className="text-2xl font-bold mb-2">24/7</h3>
              <p className="text-gray-600">Support Available</p>
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

          <CTASection
            title="Ready to Get Started?"
            subtitle="Our team is here to help you set up your restaurant in under an hour"
            buttonText="Start Setup Now"
            buttonHref="/signup"
            secondaryButtonText="Contact Support"
            secondaryButtonHref="/contact"
            features={[
              "Guided setup process",
              "24/7 support available",
              "1-hour setup time",
              "Personalized onboarding",
            ]}
          />
        </div>
      </AnimatedSection>
    </PageWrapper>
  );
}
