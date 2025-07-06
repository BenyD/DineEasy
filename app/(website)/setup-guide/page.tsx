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
        title={
          <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            Setup Guide
          </span>
        }
        subtitle="Get your restaurant up and running with DineEasy in under an hour. Follow our step-by-step guide to configure everything you need."
      />

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
