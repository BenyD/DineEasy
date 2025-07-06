"use client";

import { motion } from "framer-motion";
import {
  QrCode,
  Smartphone,
  Receipt,
  LayoutDashboard,
  CreditCard,
  BarChart,
  Clock,
  Banknote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { HeaderSection } from "@/components/elements/HeaderSection";
import { AnimatedSection } from "@/components/elements/AnimatedSection";
import { CTASection } from "@/components/elements/CTASection";

const features = [
  {
    icon: <QrCode className="h-8 w-8" />,
    title: "QR Code Ordering",
    description:
      "Generate QR codes for your food truck, enabling customers to order and pay from their phones.",
  },
  {
    icon: <Smartphone className="h-8 w-8" />,
    title: "Digital Menu",
    description:
      "Create an attractive digital menu that's easy to update as your daily specials change.",
  },
  {
    icon: <Receipt className="h-8 w-8" />,
    title: "Order Management",
    description:
      "Receive and manage orders in real-time through an intuitive dashboard interface.",
  },
  {
    icon: <LayoutDashboard className="h-8 w-8" />,
    title: "Food Truck Dashboard",
    description:
      "Monitor orders, track sales, and manage your operations from a single dashboard.",
  },
  {
    icon: <CreditCard className="h-8 w-8" />,
    title: "Payment Processing",
    description:
      "Accept payments through Stripe or cash, with automatic order confirmation.",
  },
  {
    icon: <BarChart className="h-8 w-8" />,
    title: "Analytics & Reports",
    description:
      "Track popular items, peak hours, and revenue with easy-to-understand analytics.",
  },
];

const StatCard = ({ icon, value, label, className = "" }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    whileInView={{ opacity: 1, scale: 1 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5 }}
    className={`absolute bg-white p-4 rounded-lg shadow-lg flex items-center gap-3 ${className}`}
  >
    <div className="h-10 w-10 bg-green-50 rounded-lg flex items-center justify-center text-green-600">
      {icon}
    </div>
    <div>
      <p className="text-xl font-bold text-green-600">{value}</p>
      <p className="text-sm text-gray-600">{label}</p>
    </div>
  </motion.div>
);

export default function FoodTrucksPage() {
  return (
    <PageWrapper>
      <HeaderSection
        title={
          <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            Food Truck Solutions
          </span>
        }
        subtitle="Transform your food truck operations with our QR code ordering system."
      />

      <AnimatedSection className="py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-3xl font-bold mb-6">
                Modern Food Truck Experience
              </h2>
              <p className="text-gray-600 mb-8">
                DineEasy helps food trucks streamline operations with QR
                code-based ordering. Let your customers browse the menu, place
                orders, and pay directly from their phones while you focus on
                preparing delicious food.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-green-600 rounded-full" />
                  <span className="text-gray-700">
                    Contactless ordering via QR codes
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-green-600 rounded-full" />
                  <span className="text-gray-700">Digital menu management</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-green-600 rounded-full" />
                  <span className="text-gray-700">
                    Stripe and cash payments
                  </span>
                </div>
              </div>
              <Button
                asChild
                className="mt-8 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                size="lg"
              >
                <a href="/setup-guide">See Demo</a>
              </Button>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="relative"
            >
              <div className="aspect-video rounded-xl overflow-hidden shadow-xl">
                <img
                  src="/images/food-truck-dashboard.jpg"
                  alt="Food Truck Dashboard"
                  className="w-full h-full object-cover"
                />
              </div>
              <StatCard
                icon={<Clock className="h-6 w-6" />}
                value="30s"
                label="Average Order Time"
                className="-bottom-6 -right-6"
              />
              <StatCard
                icon={<QrCode className="h-6 w-6" />}
                value="Zero Wait"
                label="Self-Service Ordering"
                className="-top-6 -right-6"
              />
              <StatCard
                icon={<Banknote className="h-6 w-6" />}
                value="Flexible"
                label="Payment Options"
                className="-top-6 -left-6"
              />
            </motion.div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="h-12 w-12 bg-green-50 rounded-lg flex items-center justify-center text-green-600 mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>

          <CTASection
            title="Ready to Modernize Your Food Truck?"
            subtitle="Join food trucks worldwide using DineEasy's QR ordering system"
            buttonText="See Demo"
            buttonHref="/setup-guide"
            secondaryButtonText="View Pricing"
            secondaryButtonHref="/pricing"
            features={[
              "Easy QR code generation",
              "Digital menu management",
              "Real-time order tracking",
              "Secure payment processing",
            ]}
          />
        </div>
      </AnimatedSection>
    </PageWrapper>
  );
}
