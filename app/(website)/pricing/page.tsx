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
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  PRICING,
  CURRENCIES,
  CURRENCY_SYMBOLS,
  CURRENCY_NAMES,
  getPrice,
  formatPrice,
} from "@/lib/constants";
import Link from "next/link";

interface PlanFeature {
  text: string;
  included: boolean;
}

const FEATURE_COMPARISON = [
  {
    name: "Digital Menu & QR Ordering",
    starter: true,
    pro: true,
    elite: true,
  },
  {
    name: "Menu Items",
    starter: "Up to 25 items",
    pro: "Up to 100 items",
    elite: "Unlimited",
  },
  {
    name: "Number of Tables/QR Codes",
    starter: "Up to 6",
    pro: "Up to 12",
    elite: "Unlimited",
  },
  {
    name: "Real-Time Order Dashboard",
    starter: true,
    pro: true,
    elite: true,
  },
  {
    name: "Stripe & Cash Payments",
    starter: true,
    pro: true,
    elite: true,
  },
  {
    name: "Receipt Printing",
    starter: "Basic Setup",
    pro: "Basic Setup",
    elite: "Assisted Setup",
  },
  {
    name: "Multi-Factor Authentication (MFA)",
    starter: true,
    pro: true,
    elite: true,
  },
  {
    name: "Staff Accounts",
    starter: "1 User",
    pro: "Up to 3 Users",
    elite: "Unlimited",
  },
  {
    name: "Role-Based Access Control",
    starter: false,
    pro: true,
    elite: true,
  },
  {
    name: "Sales Reports",
    starter: "Weekly (Email)",
    pro: "Daily (Email + Download)",
    elite: "Daily + Audit Logs",
  },
  {
    name: "Analytics",
    starter: false,
    pro: "Basic Order Analytics",
    elite: "Enhanced Analytics",
  },
  {
    name: "Early Access Features",
    starter: false,
    pro: "New Features",
    elite: "New + Experimental AI",
  },
  {
    name: "Onboarding",
    starter: "Self-Service",
    pro: "Self-Service",
    elite: "Dedicated Session",
  },
  {
    name: "Feature Requests",
    starter: false,
    pro: false,
    elite: "Priority Queue",
  },
  {
    name: "Support",
    starter: "Email",
    pro: "Priority Email",
    elite: "24/7 Email + Phone",
  },
];

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);
  // Remove currency selection and force CHF
  const selectedCurrency = "CHF";

  const plans = [
    {
      id: "starter",
      ...PRICING.starter,
      highlighted: false,
      icon: Store,
      emoji: "🥗",
      color: "green",
      description:
        "Perfect for independent owners, food stalls & small cafés with no staff complexity",
      bestFor: "Independent owners",
      features: [
        ...PRICING.starter.features.map(
          (text) => ({ text, included: true }) as PlanFeature
        ),
      ],
    },
    {
      id: "pro",
      ...PRICING.pro,
      highlighted: true,
      icon: ChefHat,
      emoji: "🍽️",
      color: "green",
      description:
        "Ideal for busy cafés, bars, and growing restaurants with staff management needs",
      bestFor: "Growing restaurants",
      features: [
        ...PRICING.pro.features.map(
          (text) => ({ text, included: true }) as PlanFeature
        ),
      ],
    },
    {
      id: "elite",
      ...PRICING.elite,
      highlighted: false,
      icon: Building2,
      emoji: "🏢",
      color: "green",
      description:
        "Enterprise-grade solution for high-volume restaurants with unlimited features",
      bestFor: "High-volume restaurants",
      features: [
        ...PRICING.elite.features.map(
          (text) => ({ text, included: true }) as PlanFeature
        ),
      ],
    },
  ];

  const faqs = [
    {
      question: "How is the subscription fee calculated?",
      answer:
        "Monthly billing starts after the 30-day trial ends. You can upgrade/downgrade anytime.",
    },
    {
      question: "Is the 2% commission charged on all orders?",
      answer:
        "Only on Stripe card payments. Cash orders are completely fee-free.",
    },
    {
      question: "Can I switch plans later?",
      answer: "Yes. You can upgrade, downgrade, or cancel at any time.",
    },
    {
      question: "Do you offer annual discounts?",
      answer: `Yes — save 20% when paying yearly. (Starter: ${formatPrice(getPrice("starter", selectedCurrency, "yearly"), selectedCurrency)}/yr, Pro: ${formatPrice(getPrice("pro", selectedCurrency, "yearly"), selectedCurrency)}/yr, Elite: ${formatPrice(getPrice("elite", selectedCurrency, "yearly"), selectedCurrency)}/yr)`,
    },
    {
      question: "Is support included for all plans?",
      answer:
        "Yes, but Pro & Elite customers get priority support with faster response times.",
    },
    {
      question: "What happens after the trial?",
      answer:
        "You'll be asked to choose a plan. If you don't subscribe, your account will pause — no charges.",
    },
  ];

  return (
    <PageWrapper>
      <HeaderSection
        title="Swiss Quality, Fair Pricing"
        subtitle={
          <>
            <span>Enterprise features at SMB prices</span>
            <span className="text-gray-500">
              {" "}
              — built for growing restaurants, with just a 2% commission on card
              payments.
            </span>
          </>
        }
      >
        <div className="mt-4 flex flex-col items-center gap-2 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-500" />
            <span>30-day free trial — No credit card required</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-500" />
            <span>Cancel anytime — No hidden fees</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-500" />
            <span>Stripe & Cash Payments Supported</span>
          </div>
        </div>
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
          {/* Remove currency selection and force CHF */}
          {/*
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mx-auto mb-8 flex max-w-[400px] items-center justify-center gap-4 rounded-full border bg-white/80 p-3 shadow-sm backdrop-blur-sm"
          >
            <Globe className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Currency:</span>
            <Select
              value={selectedCurrency}
              onValueChange={(value) =>
                setSelectedCurrency(value as keyof typeof CURRENCIES)
              }
            >
              <SelectTrigger className="w-32 border-0 bg-transparent shadow-none focus:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CURRENCIES).map(([code, symbol]) => (
                  <SelectItem key={code} value={code}>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{symbol}</span>
                      <span className="text-gray-500">
                        ({CURRENCY_NAMES[code as keyof typeof CURRENCIES]})
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </motion.div>
          */}

          {/* Billing Toggle */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
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
                          {formatPrice(
                            getPrice(
                              plan.id as keyof typeof PRICING,
                              selectedCurrency,
                              annual ? "yearly" : "monthly"
                            ),
                            selectedCurrency
                          )}
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
                    {/* Render negative features greyed out with X mark */}
                    {plan.negativeFeatures && (
                      <div className="mt-4 space-y-3">
                        {plan.negativeFeatures.map(
                          (feature: string, idx: number) => (
                            <div
                              key={idx}
                              className="flex items-start gap-3 opacity-60"
                            >
                              <div className="flex-shrink-0">
                                <X className="h-5 w-5 text-gray-400" />
                              </div>
                              <span className="text-sm text-gray-400 line-through">
                                {feature}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    )}
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
                      <span className="ml-1 text-gray-400">
                        (
                        {formatPrice(
                          getPrice("starter", selectedCurrency, "monthly"),
                          selectedCurrency
                        )}
                        )
                      </span>
                    </th>
                    <th className="p-4 text-sm font-medium text-gray-500">
                      Pro
                      <span className="ml-1 text-gray-400">
                        (
                        {formatPrice(
                          getPrice("pro", selectedCurrency, "monthly"),
                          selectedCurrency
                        )}
                        )
                      </span>
                    </th>
                    <th className="p-4 text-sm font-medium text-gray-500">
                      Elite
                      <span className="ml-1 text-gray-400">
                        (
                        {formatPrice(
                          getPrice("elite", selectedCurrency, "monthly"),
                          selectedCurrency
                        )}
                        )
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {FEATURE_COMPARISON.map((feature, index) => (
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
