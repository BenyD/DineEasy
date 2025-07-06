"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  X,
  Star,
  Zap,
  Shield,
  Store,
  ChefHat,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { HeaderSection } from "@/components/elements/HeaderSection";
import { CTASection } from "@/components/elements/CTASection";
import { AnimatedSection } from "@/components/elements/AnimatedSection";
import { GradientBlob } from "@/components/elements/GradientBlob";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { PLANS } from "@/lib/constants";
import Link from "next/link";

const comparisonFeatures = [
  { name: "QR Menu + Ordering", starter: true, pro: true, elite: true },
  { name: "Stripe & Cash Payments", starter: true, pro: true, elite: true },
  { name: "Card Payment Commission", starter: "2%", pro: "2%", elite: "2%" },
  { name: "Cash Payment Commission", starter: "0%", pro: "0%", elite: "0%" },
  { name: "Staff Logins", starter: "1", pro: "Up to 3", elite: "Unlimited" },
  {
    name: "Staff Roles (Waiter/Supervisor)",
    starter: false,
    pro: true,
    elite: true,
  },
  { name: "Order Dashboard", starter: true, pro: true, elite: true },
  { name: "Receipt Printing", starter: true, pro: true, elite: true },
  { name: "Receipt Customization", starter: false, pro: true, elite: true },
  { name: "Daily Sales Reports", starter: false, pro: true, elite: true },
  { name: "Order Analytics", starter: false, pro: "Basic", elite: "Advanced" },
  { name: "Feedback Management", starter: false, pro: true, elite: true },
  {
    name: "Audit Trails (Logins, Orders)",
    starter: false,
    pro: false,
    elite: true,
  },
  {
    name: "Staff Performance Metrics",
    starter: false,
    pro: false,
    elite: "Coming Soon",
  },
  { name: "Early Access: AI OCR", starter: false, pro: true, elite: true },
  {
    name: "Support Level",
    starter: "Basic",
    pro: "Priority",
    elite: "24/7 Priority",
  },
];

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);

  const plans = [
    {
      ...PLANS.starter,
      highlighted: false,
      icon: Store,
      emoji: "🥗",
      color: "green",
      description:
        "Perfect for small cafés and food stalls looking to modernize their ordering process",
      bestFor: "Small cafés & food stalls",
      features: [
        { text: "AI-Powered Digital Menu", included: true },
        { text: "Secure QR Table Ordering", included: true },
        { text: "Swiss Payment Processing", included: true },
        { text: "Live Order Dashboard", included: true },
        { text: "Basic Staff Access", included: true },
        { text: "Standard Receipt Printing", included: true },
        { text: "Basic Analytics & Reports", included: true },
        { text: "Advanced Staff Management", included: false },
        { text: "Custom Branding Options", included: false },
      ],
    },
    {
      ...PLANS.pro,
      highlighted: true,
      icon: ChefHat,
      emoji: "👨‍🍳",
      color: "green",
      description:
        "Advanced features and analytics for growing restaurants that need more control",
      bestFor: "Growing restaurants & chains",
      features: [
        { text: "Everything in Starter", included: true },
        { text: "Multi-Language Menus", included: true },
        { text: "Staff Role Management", included: true },
        { text: "Custom Receipt Branding", included: true },
        { text: "Advanced Analytics Dashboard", included: true },
        { text: "Customer Feedback System", included: true },
        { text: "Inventory Management", included: true },
        { text: "Priority Support (12/7)", included: true },
        { text: "Early Access to New Features", included: true },
      ],
    },
    {
      ...PLANS.elite,
      highlighted: false,
      icon: Building2,
      emoji: "🏢",
      color: "green",
      description:
        "Enterprise-grade solution for high-volume restaurants and chains",
      bestFor: "Large restaurants & franchises",
      features: [
        { text: "Everything in Pro", included: true },
        { text: "Unlimited Staff & Locations", included: true },
        { text: "Advanced Access Control", included: true },
        { text: "Full Security Audit Logs", included: true },
        { text: "Custom Integration Options", included: true },
        { text: "AI-Powered Analytics", included: true },
        { text: "Priority Feature Development", included: true },
        { text: "24/7 Swiss Support", included: true },
        { text: "Dedicated Account Manager", included: true },
      ],
    },
  ];

  const faqs = [
    {
      question: "How is the monthly subscription fee calculated?",
      answer:
        "Our pricing is straightforward: you pay a fixed monthly subscription (CHF 15 for Starter, CHF 39 for Pro, CHF 79 for Elite) plus a 2% commission on card payments. Cash payments are always free with no additional fees. The subscription fee includes all features in your chosen plan.",
    },
    {
      question: "Are there any hidden fees or additional costs?",
      answer:
        "No hidden fees. You only pay the monthly subscription and the 2% card payment commission. There are no setup fees, no minimum transaction fees, and no long-term contracts. Cash payments are always commission-free.",
    },
    {
      question: "What happens after my 14-day free trial?",
      answer:
        "During your trial, you'll have full access to all features of your chosen plan. At the end of the trial, you can enter your payment details to continue using DineEasy. If you choose not to continue, your account will be automatically paused - no charges, no commitments.",
    },
    {
      question: "Can I change my subscription plan later?",
      answer:
        "Yes, you can upgrade or downgrade your plan at any time. When upgrading, you'll get immediate access to new features and will only be charged the difference for the remainder of your billing cycle. When downgrading, changes take effect at the start of your next billing cycle.",
    },
    {
      question: "Do you offer any discounts for annual subscriptions?",
      answer:
        "Yes! You can save 20% by choosing annual billing. This brings the effective monthly cost down to CHF 12 for Starter, CHF 31 for Pro, and CHF 63 for Elite, while keeping all the same great features.",
    },
    {
      question: "What payment methods do you accept for the subscription?",
      answer:
        "We accept all major credit and debit cards (Visa, Mastercard, American Express) through our secure payment processor, Stripe. For Swiss businesses, we also accept direct bank transfers for annual subscriptions.",
    },
    {
      question:
        "Is the 2% card payment commission negotiable for high-volume businesses?",
      answer:
        "For businesses processing over CHF 50,000 per month in card payments, we offer custom pricing plans with reduced commission rates. Contact our sales team to discuss enterprise pricing options.",
    },
    {
      question: "What happens if I need to cancel my subscription?",
      answer:
        "You can cancel your subscription at any time through your dashboard. Your service will continue until the end of your current billing period. We don't offer partial refunds for unused time, but you won't be charged again after cancellation.",
    },
  ];

  return (
    <PageWrapper>
      <HeaderSection
        title="Swiss Quality, Fair Pricing"
        subtitle={
          <span>
            Enterprise features at SMB prices{" "}
            <span className="text-gray-500">
              + only 2% commission on card payments
            </span>
          </span>
        }
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-center sm:gap-6"
        >
          {[
            { text: "14-day free trial", icon: Star },
            { text: "No credit card required", icon: Shield },
            { text: "Cancel anytime", icon: Zap },
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

      <AnimatedSection className="relative py-16 sm:py-24">
        <GradientBlob
          size="lg"
          position="top-right"
          className="absolute left-0 top-0 -z-10 opacity-30"
        />
        <GradientBlob
          size="lg"
          position="bottom-left"
          className="absolute right-0 bottom-0 -z-10 opacity-30"
        />
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mx-auto flex max-w-[300px] items-center justify-center gap-4 rounded-full border bg-white/80 p-2 shadow-sm backdrop-blur-sm"
          >
            <span
              className={`text-sm font-medium transition-colors ${
                !annual ? "text-green-600" : "text-gray-500"
              }`}
            >
              Monthly
            </span>
            <Switch
              checked={annual}
              onCheckedChange={setAnnual}
              className="data-[state=checked]:bg-green-600"
            />
            <span
              className={`text-sm font-medium transition-colors ${
                annual ? "text-green-600" : "text-gray-500"
              }`}
            >
              Yearly{" "}
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                Save 20%
              </span>
            </span>
          </motion.div>

          <div className="mt-12 grid gap-8 sm:mt-16 md:grid-cols-2 lg:grid-cols-3">
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
                className="pt-4"
              >
                <div
                  className={`relative rounded-2xl border bg-white p-8 shadow-sm transition-all hover:shadow-xl ${
                    plan.highlighted
                      ? "border-green-200 ring-1 ring-green-500"
                      : "hover:border-green-200"
                  }`}
                >
                  {/* Background gradient effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                  {plan.highlighted && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-green-600 to-green-500 px-4 py-1 text-sm font-medium text-white shadow-sm">
                      Most Popular
                    </div>
                  )}

                  <div className="relative">
                    <div className="mb-6 flex items-center gap-3">
                      <div className="flex flex-col items-start gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{plan.emoji}</span>
                          <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
                            {plan.name}
                          </h2>
                        </div>
                        <p className="text-sm text-gray-500">{plan.bestFor}</p>
                      </div>
                    </div>

                    <div className="mb-6">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-gray-900 sm:text-4xl">
                          {plan.currency}{" "}
                          {annual ? plan.price.yearly : plan.price.monthly}
                        </span>
                        <span className="text-gray-500">
                          /{annual ? "year" : "month"}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-500">
                        {plan.description}
                      </p>
                      <p className="mt-1 text-xs text-gray-400">
                        + 2% commission on card payments
                      </p>
                    </div>

                    <Link href="/signup">
                      <Button
                        className={`mb-8 w-full ${
                          plan.highlighted
                            ? "bg-green-600 text-white hover:bg-green-700"
                            : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
                        }`}
                      >
                        Start Free Trial
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>

                    <div className="space-y-3">
                      {plan.features.map((feature, featureIndex) => (
                        <div
                          key={featureIndex}
                          className="flex items-start gap-3"
                        >
                          <div className="flex-shrink-0">
                            {feature.included ? (
                              <Check className="h-5 w-5 text-green-600" />
                            ) : (
                              <X className="h-5 w-5 text-gray-300" />
                            )}
                          </div>
                          <span
                            className={`text-sm ${
                              feature.included
                                ? "text-gray-600"
                                : "text-gray-400"
                            }`}
                          >
                            {feature.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Comparison Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mt-24"
          >
            <h2 className="text-center text-3xl font-bold text-gray-900">
              Feature Comparison
            </h2>
            <div className="mt-8 overflow-x-auto">
              <table className="w-full min-w-[800px] border-collapse text-left">
                <thead>
                  <tr className="border-b">
                    <th className="py-4 pr-4 text-sm font-medium text-gray-500">
                      Feature
                    </th>
                    <th className="p-4 text-sm font-medium text-gray-500">
                      Starter
                      <span className="ml-1 text-gray-400">(CHF 15)</span>
                    </th>
                    <th className="p-4 text-sm font-medium text-gray-500">
                      Pro
                      <span className="ml-1 text-gray-400">(CHF 39)</span>
                    </th>
                    <th className="p-4 text-sm font-medium text-gray-500">
                      Elite
                      <span className="ml-1 text-gray-400">(CHF 79)</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonFeatures.map((feature, index) => (
                    <tr
                      key={index}
                      className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}
                    >
                      <td className="py-4 pr-4 text-sm text-gray-900">
                        {feature.name}
                      </td>
                      <td className="p-4 text-sm">
                        {typeof feature.starter === "boolean" ? (
                          feature.starter ? (
                            <Check className="h-5 w-5 text-green-600" />
                          ) : (
                            <X className="h-5 w-5 text-gray-300" />
                          )
                        ) : (
                          <span className="text-gray-600">
                            {feature.starter}
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-sm">
                        {typeof feature.pro === "boolean" ? (
                          feature.pro ? (
                            <Check className="h-5 w-5 text-green-600" />
                          ) : (
                            <X className="h-5 w-5 text-gray-300" />
                          )
                        ) : (
                          <span className="text-gray-600">{feature.pro}</span>
                        )}
                      </td>
                      <td className="p-4 text-sm">
                        {typeof feature.elite === "boolean" ? (
                          feature.elite ? (
                            <Check className="h-5 w-5 text-green-600" />
                          ) : (
                            <X className="h-5 w-5 text-gray-300" />
                          )
                        ) : (
                          <span className="text-gray-600">{feature.elite}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          <div className="mt-24">
            <h2 className="text-center text-3xl font-bold text-gray-900">
              Frequently Asked Questions
            </h2>
            <div className="mx-auto mt-8 max-w-3xl">
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger className="text-left">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent>{faq.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </div>
      </AnimatedSection>

      <CTASection
        title="Ready to transform your restaurant?"
        subtitle="Join thousands of restaurants already using DineEasy"
        buttonText="Start Free Trial"
        buttonHref="/signup"
      />
    </PageWrapper>
  );
}
