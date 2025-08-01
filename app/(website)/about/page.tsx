"use client";

import { motion } from "framer-motion";
import {
  Award,
  Globe,
  Heart,
  Target,
  Users,
  Clock,
  Coffee,
  ChefHat,
  Star,
  Shield,
  Zap,
} from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { HeaderSection } from "@/components/elements/HeaderSection";
import { AnimatedSection } from "@/components/elements/AnimatedSection";
import { CTASection } from "@/components/elements/CTASection";
import { GradientBlob } from "@/components/elements/GradientBlob";

export default function AboutPage() {
  const values = [
    {
      icon: <Heart className="h-6 w-6 text-green-600" />,
      title: "Swiss Excellence",
      description:
        "We embody Swiss values in everything we do - from our precise engineering to our reliable service and transparent pricing model.",
    },
    {
      icon: <Target className="h-6 w-6 text-green-600" />,
      title: "Innovation First",
      description:
        "Leading the future of restaurant technology with AI-powered features, smart analytics, and continuous innovation focused on real business impact.",
    },
    {
      icon: <Shield className="h-6 w-6 text-green-600" />,
      title: "Security & Privacy",
      description:
        "Built to exceed Swiss data protection standards. Your data is stored in Switzerland with enterprise-grade security and encryption.",
    },
    {
      icon: <Zap className="h-6 w-6 text-green-600" />,
      title: "Local Support",
      description:
        "Our Swiss-based support team is available 24/7 for Elite customers, ensuring you get help when you need it, in your language.",
    },
  ];

  const stats = [
    {
      number: "2,000+",
      label: "Restaurants",
      description: "Across Switzerland",
    },
    {
      number: "10M+",
      label: "Orders",
      description: "Processed securely",
    },
    {
      number: "99.99%",
      label: "Uptime",
      description: "Swiss reliability",
    },
    {
      number: "24/7",
      label: "Support",
      description: "Based in Switzerland",
    },
  ];

  const features = [
    {
      icon: <Coffee className="h-6 w-6" />,
      title: "Cafés & Bars",
      description:
        "Perfect for quick service and busy environments. Streamline orders and manage peak hours efficiently.",
    },
    {
      icon: <ChefHat className="h-6 w-6" />,
      title: "Restaurants",
      description:
        "Full-service dining with table management, kitchen coordination, and staff oversight.",
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Food Trucks",
      description:
        "Mobile-first ordering and compact solutions perfect for on-the-go service.",
    },
  ];

  return (
    <PageWrapper>
      <HeaderSection
        title={
          <span>
            Swiss Innovation in
            <br />
            <span className="bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent">
              Restaurant Technology
            </span>
          </span>
        }
        subtitle="Built in Switzerland with precision, reliability, and innovation at our core. We're transforming how restaurants operate in the digital age."
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-center sm:gap-6"
        >
          {[
            { text: "Swiss Made 🇨🇭", icon: Shield },
            { text: "24/7 Support", icon: Users },
            { text: "Simple Pricing", icon: Target },
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
          className="absolute right-0 top-0 -z-10 opacity-30"
        />
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative overflow-hidden rounded-2xl border bg-white p-6 shadow-sm transition-all hover:shadow-lg"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="text-3xl font-bold text-green-600 md:text-4xl">
                  {stat.number}
                </div>
                <div className="mt-1 font-medium text-gray-900">
                  {stat.label}
                </div>
                <div className="mt-1 text-sm text-gray-500">
                  {stat.description}
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-24 grid gap-12 lg:grid-cols-2 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="overflow-hidden rounded-2xl border bg-white shadow-lg">
                <img
                  src="/images/about-hero.jpg"
                  alt="DineEasy Platform"
                  className="w-full object-cover aspect-[4/3]"
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
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                Why We Built DineEasy
              </h2>
              <p className="text-lg text-gray-600">
                DineEasy was born from real restaurant experience. We saw
                firsthand how traditional POS systems were holding businesses
                back with high costs, complex setups, and poor mobile support.
              </p>
              <p className="text-lg text-gray-600">
                After talking to hundreds of restaurant owners, we discovered a
                common thread: the need for simple, affordable technology that
                actually works. That&apos;s why we built DineEasy with a clear
                focus on what matters most to restaurants.
              </p>
              <p className="text-lg text-gray-600">
                Today, we&apos;re proud to serve over 1,000 restaurants with our
                transparent pricing model: just 2% commission on card payments,
                no hidden fees, and all the features you need to succeed.
              </p>
            </motion.div>
          </div>
        </div>
      </AnimatedSection>

      <section className="relative bg-gradient-to-b from-gray-50/50 to-white py-16 sm:py-24">
        <GradientBlob
          size="lg"
          position="bottom-left"
          className="absolute left-0 bottom-0 -z-10 opacity-30"
        />
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="mx-auto max-w-3xl text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                Built for Every Food Business
              </h2>
              <p className="mt-4 text-lg text-gray-600">
                Whether you run a café, restaurant, or food truck, DineEasy
                adapts to your unique needs
              </p>
            </div>
          </AnimatedSection>

          <div className="grid gap-8 md:grid-cols-3">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group relative overflow-hidden rounded-2xl bg-white p-8 shadow-sm transition-all hover:shadow-lg"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="relative">
                  <div className="mb-4 h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative bg-white py-16 sm:py-24">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="mx-auto max-w-3xl text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                Our Core Values
              </h2>
              <p className="mt-4 text-lg text-gray-600">
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
                className="group relative overflow-hidden rounded-2xl bg-white p-8 shadow-sm transition-all hover:shadow-lg border border-gray-100"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="relative">
                  <div className="mb-4 h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center">
                    {value.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-2">{value.title}</h3>
                  <p className="text-gray-600">{value.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <CTASection
        title="Ready to modernize your restaurant?"
        subtitle="Join over 1,000 restaurants already using DineEasy"
        buttonText="Start Free Trial"
        buttonHref="/signup"
        features={[
          "14-day free trial",
          "No credit card required",
          "Cancel anytime",
        ]}
      />
    </PageWrapper>
  );
}
