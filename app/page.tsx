"use client"

import { ArrowRight, CheckCircle, QrCode, Timer, Smartphone } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { PageWrapper } from "@/components/layout/PageWrapper"
import { HeroSection } from "@/components/elements/HeroSection"
import { FeatureCard } from "@/components/elements/FeatureCard"
import { CTASection } from "@/components/elements/CTASection"
import { GradientBlob } from "@/components/elements/GradientBlob"
import { AnimatedSection } from "@/components/elements/AnimatedSection"

export default function LandingPage() {
  return (
    <PageWrapper>
      <HeroSection>
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 xl:gap-16 items-center max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="flex flex-col justify-center space-y-6 sm:space-y-8"
          >
            <div className="space-y-4 sm:space-y-6">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
                Modern Restaurant Management Made Simple
              </h1>
              <p className="max-w-[600px] text-base text-gray-500 sm:text-lg md:text-xl">
                Transform your restaurant with QR-based ordering, real-time dashboards, and seamless payments. Accept
                Stripe, TWINT, and cash payments with automatic thermal printing.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  size="lg"
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 sm:w-auto"
                  onClick={() => (window.location.href = "/signup")}
                >
                  Start 14-Day Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={() => (window.location.href = "/features")}
                >
                  See Features
                </Button>
              </motion.div>
            </div>
            <div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:gap-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="flex items-center gap-2"
              >
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>14-day free trial</span>
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="flex items-center gap-2"
              >
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>No credit card required</span>
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="flex items-center gap-2"
              >
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>2% commission only</span>
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="relative mx-auto w-full max-w-[500px]"
          >
            <div className="relative z-10 overflow-hidden rounded-2xl border bg-white shadow-xl">
              <img
                src="/placeholder.svg?height=600&width=400"
                alt="DineEasy Dashboard"
                className="w-full object-cover"
              />
            </div>
            <GradientBlob size="md" position="bottom-left" />
          </motion.div>
        </div>
      </HeroSection>

      <AnimatedSection className="container py-12 sm:py-20">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-2xl font-bold tracking-tighter sm:text-3xl md:text-4xl lg:text-5xl">How It Works</h2>
          <p className="mt-3 text-gray-500 sm:mt-4">
            DineEasy simplifies restaurant operations in just three easy steps
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:mt-16 sm:gap-8 md:grid-cols-3">
          {[
            {
              icon: <QrCode className="h-8 w-8 text-green-600 sm:h-10 sm:w-10" />,
              title: "Scan QR Code",
              description: "Customers scan a unique QR code at their table to access your digital menu instantly",
            },
            {
              icon: <Timer className="h-8 w-8 text-green-600 sm:h-10 sm:w-10" />,
              title: "Place Orders",
              description: "Orders are sent directly to your real-time dashboard and auto-printed on thermal printers",
            },
            {
              icon: <Smartphone className="h-8 w-8 text-green-600 sm:h-10 sm:w-10" />,
              title: "Pay Seamlessly",
              description: "Customers pay via Stripe, TWINT, or cash with funds going directly to your account",
            },
          ].map((step, index) => (
            <FeatureCard key={index} {...step} index={index} />
          ))}
        </div>
      </AnimatedSection>

      <AnimatedSection className="container py-12 sm:py-20">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-2xl font-bold tracking-tighter sm:text-3xl md:text-4xl lg:text-5xl">Key Features</h2>
          <p className="mt-3 text-gray-500 sm:mt-4">Everything you need to modernize your restaurant operations</p>
        </div>
        <div className="mt-12 grid gap-6 sm:mt-16 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: "QR Menu System",
              description: "Digital menus with AI OCR upload and real-time updates",
            },
            {
              title: "Multi-Payment Support",
              description: "Accept Stripe, TWINT, and cash payments seamlessly",
            },
            {
              title: "Auto Thermal Printing",
              description: "Automatic receipt and kitchen ticket printing",
            },
            {
              title: "Real-time Dashboard",
              description: "Live order tracking and analytics for your team",
            },
          ].map((feature, index) => (
            <FeatureCard
              key={index}
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  className="h-6 w-6 text-green-600"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              }
              {...feature}
              index={index}
            />
          ))}
        </div>
      </AnimatedSection>

      <section className="bg-gray-50 py-12 sm:py-20">
        <div className="container">
          <AnimatedSection>
            <div className="mx-auto max-w-4xl text-center">
              <h2 className="text-2xl font-bold tracking-tighter sm:text-3xl md:text-4xl lg:text-5xl">
                Trusted by 1000+ Restaurants Worldwide
              </h2>
              <p className="mt-3 text-gray-500 sm:mt-4">See what restaurant owners are saying about DineEasy</p>
            </div>
          </AnimatedSection>
          <div className="mt-12 grid gap-6 sm:mt-16 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                quote:
                  "DineEasy transformed our operations completely. The 2% commission is fair, and the automatic printing saves us hours daily. Our customers love the TWINT integration!",
                author: "Maria Rodriguez",
                role: "Owner, Bella Cucina",
              },
              {
                quote:
                  "The real-time dashboard reduced our order errors by 90%. The 14-day trial convinced us immediately - we upgraded to Pro after just 3 days.",
                author: "James Chen",
                role: "Manager, Urban Plate",
              },
              {
                quote:
                  "Staff management on the Elite plan is incredible. Our team can access orders from anywhere, and the analytics help us optimize our menu pricing.",
                author: "Sarah Johnson",
                role: "Owner, Harvest Table",
              },
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.1,
                  ease: [0.21, 0.47, 0.32, 0.98],
                }}
                whileHover={{ y: -5 }}
                className="rounded-lg border bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-6"
              >
                <div className="mb-3 text-green-500 sm:mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="inline-block">
                      ★
                    </span>
                  ))}
                </div>
                <blockquote className="mb-3 text-sm sm:mb-4 sm:text-base">"{testimonial.quote}"</blockquote>
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="h-10 w-10 rounded-full bg-gray-200 sm:h-12 sm:w-12">
                    <img
                      src={`/placeholder.svg?height=48&width=48&query=portrait%20${index}`}
                      alt={testimonial.author}
                      className="h-10 w-10 rounded-full object-cover sm:h-12 sm:w-12"
                    />
                  </div>
                  <div>
                    <div className="text-sm font-medium sm:text-base">{testimonial.author}</div>
                    <div className="text-xs text-gray-500 sm:text-sm">{testimonial.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <CTASection
        title="Ready to transform your restaurant?"
        subtitle="Start your 14-day free trial today. No credit card required. Only 2% commission on payments."
        buttonHref="/signup"
      />
    </PageWrapper>
  )
}
