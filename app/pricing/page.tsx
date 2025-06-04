"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { ArrowRight, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { PageWrapper } from "@/components/layout/PageWrapper"
import { HeroSection } from "@/components/elements/HeroSection"
import { CTASection } from "@/components/elements/CTASection"
import { AnimatedSection } from "@/components/elements/AnimatedSection"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { PLANS } from "@/lib/constants"
import Link from "next/link"

export default function PricingPage() {
  const [annual, setAnnual] = useState(false)

  const plans = [
    {
      ...PLANS.starter,
      highlighted: false,
    },
    {
      ...PLANS.pro,
      highlighted: true,
    },
    {
      ...PLANS.elite,
      highlighted: false,
    },
  ]

  const faqs = [
    {
      question: "How does the 14-day free trial work?",
      answer:
        "All plans come with a 14-day free trial. You get full access to your chosen plan's features without any commitment. No credit card is required to start your trial. After the trial, you'll be automatically charged unless you cancel.",
    },
    {
      question: "What is the 2% commission fee?",
      answer:
        "We charge a 2% commission only on customer payments processed through Stripe or TWINT. This fee is automatically deducted, and the remaining 98% goes directly to your restaurant's bank account. Cash payments have no commission.",
    },
    {
      question: "Can I switch plans later?",
      answer:
        "Yes, you can upgrade or downgrade your plan at any time. When upgrading, you'll get immediate access to new features. When downgrading, changes will take effect at the end of your billing cycle.",
    },
    {
      question: "How does TWINT integration work?",
      answer:
        "TWINT is available on all plans. Swiss customers can pay directly using the TWINT mobile app by scanning a QR code. Payments are processed instantly and go directly to your account with our standard 2% commission.",
    },
    {
      question: "What's included in the thermal printing feature?",
      answer:
        "All plans include automatic thermal printing for receipts and kitchen tickets. We support ESC/POS compatible printers. Orders are automatically printed when received, and you can customize receipt formats.",
    },
    {
      question: "How does staff management work on the Elite plan?",
      answer:
        "The Elite plan allows you to invite multiple staff members with different role permissions. Staff can access the order dashboard, mark orders as complete, and manage day-to-day operations without accessing sensitive settings.",
    },
    {
      question: "Is there a limit to the number of menu items?",
      answer:
        "No, all plans allow unlimited menu items and categories. You can create as extensive a menu as needed and use our AI OCR feature to quickly upload existing menus.",
    },
    {
      question: "What kind of support do you offer?",
      answer:
        "Starter plans include email support with 24-48 hour response times. Pro plans get priority email support (under 12 hours). Elite plans include 24/7 phone support and a dedicated account manager.",
    },
  ]

  return (
    <PageWrapper>
      <HeroSection
        layout="centered"
        title="Simple, Transparent Pricing"
        subtitle="Choose the plan that's right for your restaurant. All plans include a 14-day free trial."
      />

      <AnimatedSection className="container pb-12 sm:pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto flex max-w-[300px] items-center justify-center gap-4 rounded-full border bg-white p-1 shadow-sm"
        >
          <span className={`text-sm ${!annual ? "font-medium text-green-600" : "text-gray-500"}`}>Monthly</span>
          <Switch checked={annual} onCheckedChange={setAnnual} className="data-[state=checked]:bg-green-600" />
          <span className={`text-sm ${annual ? "font-medium text-green-600" : "text-gray-500"}`}>
            Yearly <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">Save 20%</span>
          </span>
        </motion.div>

        <div className="mt-12 grid gap-6 sm:mt-16 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan, index) => (
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
              className={`relative rounded-xl border bg-white p-6 shadow-sm transition-all hover:shadow-lg sm:p-8 ${
                plan.highlighted ? "border-green-200 ring-1 ring-green-500 shadow-md" : ""
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-0 right-0 mx-auto w-fit rounded-full bg-gradient-to-r from-green-500 to-emerald-600 px-4 py-1 text-sm font-medium text-white">
                  Most Popular
                </div>
              )}
              <div className="mb-6">
                <h2 className="text-xl font-bold sm:text-2xl">{plan.name}</h2>
                <p className="mt-2 text-sm text-gray-500">
                  {plan.name === "Starter" && "Perfect for small restaurants just getting started"}
                  {plan.name === "Pro" && "Ideal for growing restaurants with analytics needs"}
                  {plan.name === "Elite" && "For established restaurants with multiple staff"}
                </p>
              </div>
              <div className="mb-6">
                <div className="flex items-end">
                  <span className="text-3xl font-bold sm:text-4xl">
                    ${annual ? plan.price.yearly : plan.price.monthly}
                  </span>
                  <span className="text-gray-500">/{annual ? "year" : "month"}</span>
                </div>
                {annual && (
                  <p className="mt-1 text-sm text-green-600">
                    Save ${(plan.price.monthly * 12 - plan.price.yearly).toFixed(2)} per year
                  </p>
                )}
              </div>
              <ul className="mb-6 space-y-2 sm:mb-8 sm:space-y-3">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500 sm:h-5 sm:w-5" />
                    <span className="text-sm sm:text-base">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link href="/signup">
                <Button
                  className={`w-full ${
                    plan.highlighted
                      ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                      : ""
                  }`}
                >
                  Start 14-Day Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </motion.div>
          ))}
        </div>

        <AnimatedSection delay={0.3}>
          <div className="mt-8 text-center text-sm text-gray-500 sm:mt-12">
            All plans include a 14-day free trial. Only 2% commission on Stripe & TWINT payments. Cancel anytime.
          </div>
        </AnimatedSection>
      </AnimatedSection>

      <section className="bg-gray-50 py-12 sm:py-20">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="mx-auto max-w-4xl text-center">
              <h2 className="text-2xl font-bold tracking-tighter sm:text-3xl md:text-4xl">
                Frequently Asked Questions
              </h2>
              <p className="mt-3 text-gray-500 sm:mt-4">
                Have questions about our pricing? Find answers to common questions below.
              </p>
            </div>
          </AnimatedSection>

          <div className="mt-8 mx-auto max-w-3xl sm:mt-12">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <AccordionItem value={`item-${index}`} className="border-b border-gray-200">
                    <AccordionTrigger className="text-left font-medium py-4 hover:text-green-600 hover:no-underline">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-500 pb-4">{faq.answer}</AccordionContent>
                  </AccordionItem>
                </motion.div>
              ))}
            </Accordion>
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
