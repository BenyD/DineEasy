"use client"
import { motion } from "framer-motion"
import { ChefHat, CreditCard, FileText, LayoutDashboard, Printer, QrCode, Settings, Users } from "lucide-react"
import { PageWrapper } from "@/components/layout/PageWrapper"
import { HeroSection } from "@/components/elements/HeroSection"
import { FeatureCard } from "@/components/elements/FeatureCard"
import { CTASection } from "@/components/elements/CTASection"
import { AnimatedSection } from "@/components/elements/AnimatedSection"
import { GradientBlob } from "@/components/elements/GradientBlob"

export default function FeaturesPage() {
  return (
    <PageWrapper>
      <HeroSection
        layout="centered"
        title="Powerful Features for Modern Restaurants"
        subtitle="Everything you need to streamline your restaurant operations and enhance the dining experience"
      />

      <AnimatedSection className="container py-12 sm:py-20">
        <div className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: <FileText className="h-8 w-8 text-green-600 sm:h-10 sm:w-10" />,
              title: "Menu Builder",
              description:
                "Create beautiful digital menus with images, descriptions, and customization options. Import existing menus with AI OCR parsing.",
            },
            {
              icon: <QrCode className="h-8 w-8 text-green-600 sm:h-10 sm:w-10" />,
              title: "Table QR Codes",
              description:
                "Generate unique QR codes for each table that customers can scan to access your digital menu and place orders.",
            },
            {
              icon: <LayoutDashboard className="h-8 w-8 text-green-600 sm:h-10 sm:w-10" />,
              title: "Orders Dashboard",
              description:
                "Manage all incoming orders in real-time with status tracking, modifications, and customer information.",
            },
            {
              icon: <ChefHat className="h-8 w-8 text-green-600 sm:h-10 sm:w-10" />,
              title: "Kitchen Display",
              description:
                "Auto-updating kitchen display system that shows incoming orders, preparation times, and completion status.",
            },
            {
              icon: <CreditCard className="h-8 w-8 text-green-600 sm:h-10 sm:w-10" />,
              title: "Stripe & TWINT Payments",
              description:
                "Accept payments directly through the app with Stripe and TWINT integration for a seamless checkout experience.",
            },
            {
              icon: <Printer className="h-8 w-8 text-green-600 sm:h-10 sm:w-10" />,
              title: "Thermal Printing",
              description: "Automatically print receipts and kitchen tickets with our thermal printer integration.",
            },
            {
              icon: <Users className="h-8 w-8 text-green-600 sm:h-10 sm:w-10" />,
              title: "Staff Access",
              description:
                "Multi-user access with role-based permissions for admins, managers, servers, and kitchen staff.",
            },
            {
              icon: <Settings className="h-8 w-8 text-green-600 sm:h-10 sm:w-10" />,
              title: "Analytics & Insights",
              description:
                "Track sales, popular items, peak hours, and customer feedback to optimize your restaurant operations.",
            },
          ].map((feature, index) => (
            <FeatureCard key={index} {...feature} index={index} />
          ))}
        </div>
      </AnimatedSection>

      <section className="bg-gray-50 py-12 sm:py-20">
        <div className="container">
          <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12 max-w-7xl mx-auto">
            <AnimatedSection direction="left">
              <h2 className="text-2xl font-bold tracking-tighter sm:text-3xl md:text-4xl">Digital Menu Builder</h2>
              <p className="mt-3 text-gray-500 sm:mt-4">
                Create beautiful, interactive digital menus that showcase your dishes with high-quality images and
                detailed descriptions. Easily update prices, add seasonal items, or mark items as sold out in real-time.
              </p>
              <ul className="mt-4 space-y-2 sm:mt-6 sm:space-y-3">
                {[
                  "Drag-and-drop interface",
                  "Image upload and management",
                  "AI OCR menu parsing",
                  "Categorization and filtering",
                  "Allergen and dietary information",
                ].map((item, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-2"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-green-500 sm:h-5 sm:w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-sm sm:text-base">{item}</span>
                  </motion.li>
                ))}
              </ul>
            </AnimatedSection>
            <AnimatedSection direction="right" className="relative mx-auto w-full max-w-[500px]">
              <div className="overflow-hidden rounded-xl border bg-white shadow-lg">
                <img
                  src="/placeholder.svg?height=400&width=600"
                  alt="Menu Builder Interface"
                  className="w-full object-cover"
                />
              </div>
              <GradientBlob size="sm" position="bottom-left" />
            </AnimatedSection>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-20">
        <div className="container">
          <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12 max-w-7xl mx-auto">
            <AnimatedSection direction="left" className="order-2 lg:order-1 relative mx-auto w-full max-w-[500px]">
              <div className="overflow-hidden rounded-xl border bg-white shadow-lg">
                <img
                  src="/placeholder.svg?height=400&width=600"
                  alt="Kitchen Display System"
                  className="w-full object-cover"
                />
              </div>
              <GradientBlob size="sm" position="bottom-left" />
            </AnimatedSection>
            <AnimatedSection direction="right" className="order-1 lg:order-2">
              <h2 className="text-2xl font-bold tracking-tighter sm:text-3xl md:text-4xl">
                Real-time Order Management
              </h2>
              <p className="mt-3 text-gray-500 sm:mt-4">
                Streamline your kitchen operations with our real-time order management system. Orders flow directly from
                customers to the kitchen display, reducing errors and improving efficiency.
              </p>
              <ul className="mt-4 space-y-2 sm:mt-6 sm:space-y-3">
                {[
                  "Instant order transmission",
                  "Auto-updating kitchen display",
                  "Order status tracking",
                  "Preparation time estimates",
                  "Order modification handling",
                ].map((item, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-2"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-green-500 sm:h-5 sm:w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-sm sm:text-base">{item}</span>
                  </motion.li>
                ))}
              </ul>
            </AnimatedSection>
          </div>
        </div>
      </section>

      <CTASection
        title="Ready to transform your restaurant?"
        subtitle="Start your 14-day free trial today. No credit card required."
      />
    </PageWrapper>
  )
}
