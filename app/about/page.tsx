"use client";

import { motion } from "framer-motion";
import { Award, Globe, Heart, Target } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { HeroSection } from "@/components/elements/HeroSection";
import { AnimatedSection } from "@/components/elements/AnimatedSection";
import { CTASection } from "@/components/elements/CTASection";

export default function AboutPage() {
  const values = [
    {
      icon: <Heart className="h-6 w-6 text-green-600" />,
      title: "Restaurant First",
      description:
        "We prioritize the needs of restaurant owners and their customers in everything we build.",
    },
    {
      icon: <Target className="h-6 w-6 text-green-600" />,
      title: "Fair Pricing",
      description:
        "Only 2% commission on payments - no hidden fees, no setup costs, no monthly minimums.",
    },
    {
      icon: <Award className="h-6 w-6 text-green-600" />,
      title: "Reliability",
      description:
        "99.9% uptime with real-time order processing and automatic thermal printing that just works.",
    },
    {
      icon: <Globe className="h-6 w-6 text-green-600" />,
      title: "Innovation",
      description:
        "Continuously improving with AI OCR, TWINT integration, and cutting-edge restaurant technology.",
    },
  ];

  const stats = [
    { number: "1,000+", label: "Restaurants Served" },
    { number: "15", label: "Countries" },
    { number: "2%", label: "Commission Only" },
    { number: "99.9%", label: "Uptime" },
  ];

  return (
    <PageWrapper>
      <HeroSection
        layout="centered"
        title="Revolutionizing Restaurant Operations"
        subtitle="We're on a mission to make restaurant technology simple, affordable, and effective for businesses of all sizes."
      />

      <AnimatedSection className="py-16 sm:py-24">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 mb-16">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-bold text-green-600">
                  {stat.number}
                </div>
                <div className="text-gray-500 mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </div>

          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="overflow-hidden rounded-xl border bg-white shadow-lg">
                <img
                  src="/placeholder.svg?height=600&width=800"
                  alt="DineEasy Team"
                  className="w-full object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 -z-10 h-[200px] w-[200px] rounded-full bg-green-400/20 blur-2xl" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="flex flex-col justify-center space-y-6"
            >
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Why We Built DineEasy
              </h2>
              <p className="text-lg text-gray-500">
                DineEasy was born from real restaurant experience. Our founders
                struggled with expensive, complex POS systems that charged high
                monthly fees plus transaction costs. We knew there had to be a
                better way.
              </p>
              <p className="text-lg text-gray-500">
                We talked to hundreds of restaurant owners and discovered the
                same pain points: high costs, complicated setup, poor customer
                support, and systems that didn't work on mobile. So we built
                DineEasy with a simple philosophy: fair pricing, easy setup, and
                features that actually matter.
              </p>
              <p className="text-lg text-gray-500">
                Today, we serve over 1,000 restaurants worldwide with our 2%
                commission model - no monthly fees, no setup costs, no hidden
                charges. Just a simple, fair way to modernize your restaurant.
              </p>
            </motion.div>
          </div>
        </div>
      </AnimatedSection>

      <section className="bg-gray-50 py-16 sm:py-24">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="mx-auto max-w-4xl text-center mb-12 sm:mb-16">
              <h2 className="text-2xl font-bold tracking-tighter sm:text-3xl md:text-4xl lg:text-5xl">
                Our Values
              </h2>
              <p className="mt-4 text-lg text-gray-500">
                The principles that guide everything we do at DineEasy
              </p>
            </div>
          </AnimatedSection>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {values.map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-lg p-8 shadow-xs border hover:shadow-md transition-shadow"
              >
                <div className="mb-4 h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  {value.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{value.title}</h3>
                <p className="text-gray-500">{value.description}</p>
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
  );
}
