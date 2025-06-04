"use client"

import { motion } from "framer-motion"
import { Award, Globe, Heart, Target } from "lucide-react"
import { PageWrapper } from "@/components/layout/PageWrapper"
import { HeroSection } from "@/components/elements/HeroSection"
import { AnimatedSection } from "@/components/elements/AnimatedSection"
import { CTASection } from "@/components/elements/CTASection"

export default function AboutPage() {
  const teamMembers = [
    {
      name: "Alex Johnson",
      role: "CEO & Co-Founder",
      bio: "Former restaurant owner with 15 years of experience. Built DineEasy after struggling with outdated POS systems.",
      image: "/placeholder.svg?height=300&width=300",
    },
    {
      name: "Sarah Chen",
      role: "CTO & Co-Founder",
      bio: "Tech innovator specializing in real-time systems and payment processing. Expert in Stripe Connect integration.",
      image: "/placeholder.svg?height=300&width=300",
    },
    {
      name: "Michael Rodriguez",
      role: "Head of Customer Success",
      bio: "Dedicated to ensuring every restaurant maximizes their ROI with DineEasy's platform.",
      image: "/placeholder.svg?height=300&width=300",
    },
    {
      name: "Emma Wilson",
      role: "Lead Product Designer",
      bio: "Creates intuitive mobile-first interfaces that make technology accessible to restaurant staff and customers.",
      image: "/placeholder.svg?height=300&width=300",
    },
  ]

  const values = [
    {
      icon: <Heart className="h-6 w-6 text-green-600" />,
      title: "Restaurant First",
      description: "We prioritize the needs of restaurant owners and their customers in everything we build.",
    },
    {
      icon: <Target className="h-6 w-6 text-green-600" />,
      title: "Fair Pricing",
      description: "Only 2% commission on payments - no hidden fees, no setup costs, no monthly minimums.",
    },
    {
      icon: <Award className="h-6 w-6 text-green-600" />,
      title: "Reliability",
      description: "99.9% uptime with real-time order processing and automatic thermal printing that just works.",
    },
    {
      icon: <Globe className="h-6 w-6 text-green-600" />,
      title: "Innovation",
      description: "Continuously improving with AI OCR, TWINT integration, and cutting-edge restaurant technology.",
    },
  ]

  const milestones = [
    {
      year: "2020",
      title: "The Problem",
      description:
        "During the pandemic, restaurants needed contactless ordering solutions. Existing systems were expensive and complex.",
    },
    {
      year: "2021",
      title: "DineEasy Launch",
      description: "Launched with 10 pilot restaurants, focusing on QR menus and Stripe Connect integration.",
    },
    {
      year: "2022",
      title: "Rapid Growth",
      description: "Reached 500+ restaurants and added thermal printing, TWINT support, and real-time dashboards.",
    },
    {
      year: "2023",
      title: "International Expansion",
      description: "Scaled to 1,000+ restaurants across 15 countries with AI OCR and advanced analytics.",
    },
    {
      year: "2024",
      title: "Platform Maturity",
      description: "Introduced staff management, custom branding, and API access for enterprise customers.",
    },
  ]

  const stats = [
    { number: "1,000+", label: "Restaurants Served" },
    { number: "15", label: "Countries" },
    { number: "2%", label: "Commission Only" },
    { number: "99.9%", label: "Uptime" },
  ]

  return (
    <PageWrapper>
      <HeroSection
        layout="centered"
        title="Revolutionizing Restaurant Operations"
        subtitle="We're on a mission to make restaurant technology simple, affordable, and effective for businesses of all sizes."
      />

      <AnimatedSection className="container py-12 sm:py-20">
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
              <div className="text-3xl md:text-4xl font-bold text-green-600">{stat.number}</div>
              <div className="text-gray-500 mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        <div className="grid gap-12 lg:grid-cols-2 items-center max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="overflow-hidden rounded-xl border bg-white shadow-lg">
              <img src="/placeholder.svg?height=600&width=800" alt="DineEasy Team" className="w-full object-cover" />
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
            <h2 className="text-3xl font-bold tracking-tighter">Why We Built DineEasy</h2>
            <p className="text-gray-500">
              DineEasy was born from real restaurant experience. Our founders struggled with expensive, complex POS
              systems that charged high monthly fees plus transaction costs. We knew there had to be a better way.
            </p>
            <p className="text-gray-500">
              We talked to hundreds of restaurant owners and discovered the same pain points: high costs, complicated
              setup, poor customer support, and systems that didn't work on mobile. So we built DineEasy with a simple
              philosophy: fair pricing, easy setup, and features that actually matter.
            </p>
            <p className="text-gray-500">
              Today, we serve over 1,000 restaurants worldwide with our 2% commission model - no monthly fees, no setup
              costs, no hidden charges. Just a simple, fair way to modernize your restaurant.
            </p>
          </motion.div>
        </div>
      </AnimatedSection>

      <section className="bg-gray-50 py-12 sm:py-20">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="mx-auto max-w-3xl text-center mb-12 sm:mb-16">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Our Values</h2>
              <p className="mt-4 text-lg text-gray-500">The principles that guide everything we do at DineEasy</p>
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
                className="bg-white rounded-lg p-6 shadow-sm border"
              >
                <div className="mb-4 h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  {value.icon}
                </div>
                <h3 className="text-xl font-bold mb-2">{value.title}</h3>
                <p className="text-gray-500">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <AnimatedSection className="container py-12 sm:py-20">
        <div className="mx-auto max-w-3xl text-center mb-12 sm:mb-16">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Our Journey</h2>
          <p className="mt-4 text-lg text-gray-500">From startup to serving 1,000+ restaurants worldwide</p>
        </div>

        <div className="relative max-w-3xl mx-auto">
          <div className="absolute left-4 sm:left-1/2 h-full w-0.5 bg-green-200 transform -translate-x-1/2"></div>

          {milestones.map((milestone, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`relative flex flex-col sm:flex-row gap-8 mb-12 ${
                index % 2 === 0 ? "sm:flex-row" : "sm:flex-row-reverse"
              }`}
            >
              <div className="sm:w-1/2 flex flex-col items-center sm:items-end sm:pr-8">
                <div className="bg-white rounded-lg p-6 shadow-sm border w-full">
                  <div className="text-green-600 font-bold text-xl mb-2">{milestone.year}</div>
                  <h3 className="text-lg font-bold mb-2">{milestone.title}</h3>
                  <p className="text-gray-500 text-sm">{milestone.description}</p>
                </div>
              </div>

              <div className="absolute left-4 sm:left-1/2 w-8 h-8 bg-green-500 rounded-full border-4 border-white transform -translate-x-1/2 flex items-center justify-center">
                <span className="text-white font-bold text-sm">{index + 1}</span>
              </div>

              <div className="sm:w-1/2 sm:pl-8"></div>
            </motion.div>
          ))}
        </div>
      </AnimatedSection>

      <section className="bg-gray-50 py-12 sm:py-20">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="mx-auto max-w-3xl text-center mb-12 sm:mb-16">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Meet Our Team</h2>
              <p className="mt-4 text-lg text-gray-500">The passionate people behind DineEasy</p>
            </div>
          </AnimatedSection>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {teamMembers.map((member, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-lg overflow-hidden shadow-sm border"
              >
                <img
                  src={member.image || "/placeholder.svg"}
                  alt={member.name}
                  className="w-full h-64 object-cover object-center"
                />
                <div className="p-6">
                  <h3 className="text-xl font-bold">{member.name}</h3>
                  <p className="text-green-600 mb-2">{member.role}</p>
                  <p className="text-gray-500 text-sm">{member.bio}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <CTASection
        title="Ready to join 1,000+ successful restaurants?"
        subtitle="Start your 14-day free trial today. No credit card required. Only 2% commission on payments."
      />
    </PageWrapper>
  )
}
