"use client";

import { motion } from "framer-motion";
import {
  Shield,
  Lock,
  Server,
  Key,
  UserCheck,
  FileCheck,
  AlertTriangle,
  Eye,
  Database,
  Globe,
  Zap,
  CheckCircle,
  Cloud,
  Cpu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { HeaderSection } from "@/components/elements/HeaderSection";
import { AnimatedSection } from "@/components/elements/AnimatedSection";
import { GradientBlob } from "@/components/elements/GradientBlob";
import { CTASection } from "@/components/elements/CTASection";

const securityFeatures = [
  {
    icon: <Database className="h-8 w-8" />,
    title: "Supabase Database Security",
    description:
      "Enterprise-grade PostgreSQL database with Row Level Security (RLS), automatic backups, and real-time data protection.",
  },
  {
    icon: <Lock className="h-8 w-8" />,
    title: "Stripe Payment Security",
    description:
      "PCI DSS Level 1 compliant payment processing through Stripe Express, with secure webhook verification and fraud protection.",
  },
  {
    icon: <Cloud className="h-8 w-8" />,
    title: "Vercel Edge Security",
    description:
      "Global CDN with automatic DDoS protection, SSL/TLS encryption, and edge computing for optimal performance and security.",
  },
  {
    icon: <Key className="h-8 w-8" />,
    title: "Row Level Security (RLS)",
    description:
      "Database-level security policies ensuring users can only access their own restaurant data with granular permissions.",
  },
  {
    icon: <UserCheck className="h-8 w-8" />,
    title: "Supabase Auth",
    description:
      "Secure authentication with email verification, password policies, session management, and JWT token security.",
  },
  {
    icon: <FileCheck className="h-8 w-8" />,
    title: "Secure File Storage",
    description:
      "Supabase Storage with RLS policies, automatic virus scanning, and secure file uploads for restaurant images.",
  },
];

const complianceCertifications = [
  {
    title: "PCI DSS",
    description:
      "Payment Card Industry Data Security Standard compliant through Stripe",
  },
  {
    title: "GDPR",
    description:
      "Full compliance with EU General Data Protection Regulation requirements",
  },
  {
    title: "SOC 2",
    description:
      "Supabase maintains SOC 2 Type II compliance for data security",
  },
  {
    title: "ISO 27001",
    description:
      "Vercel maintains ISO 27001 certification for information security",
  },
];

const securityInfrastructure = [
  {
    icon: <Server className="h-6 w-6" />,
    title: "Database Security",
    features: [
      "Row Level Security (RLS) policies on all tables",
      "Automatic data encryption at rest",
      "Secure connection pooling",
      "Real-time data validation",
    ],
  },
  {
    icon: <Globe className="h-6 w-6" />,
    title: "Network Security",
    features: [
      "Global CDN with DDoS protection",
      "Automatic SSL/TLS encryption",
      "Edge computing security",
      "Geographic data distribution",
    ],
  },
  {
    icon: <Zap className="h-6 w-6" />,
    title: "Application Security",
    features: [
      "Middleware-based route protection",
      "CSRF protection and validation",
      "Secure cookie handling",
      "Input sanitization and validation",
    ],
  },
  {
    icon: <Cpu className="h-6 w-6" />,
    title: "Infrastructure Security",
    features: [
      "Vercel Edge Runtime security",
      "Supabase service role isolation",
      "Environment variable protection",
      "Secure webhook handling",
    ],
  },
];

export default function SecurityPage() {
  return (
    <PageWrapper>
      <HeaderSection
        title={
          <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            Enterprise-Grade Security
          </span>
        }
        subtitle="Your data security and privacy is our top priority. DineEasy leverages industry-leading security infrastructure to protect your business."
      />

      <AnimatedSection className="relative py-16 sm:py-24">
        <GradientBlob
          size="lg"
          position="top-right"
          className="absolute right-0 top-0 -z-10 opacity-30"
        />
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-3xl font-bold mb-6">
                Built on Enterprise Security Infrastructure
              </h2>
              <p className="text-gray-600 mb-8">
                DineEasy is built on Supabase and Vercel, two of the most secure
                and reliable platforms in the industry. Our multi-layered
                security approach ensures your restaurant data is protected at
                every level.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-gray-700">
                    Supabase Row Level Security (RLS)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-gray-700">
                    Stripe PCI DSS Level 1 compliance
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-gray-700">
                    Vercel Edge Runtime security
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-gray-700">
                    Automatic SSL/TLS encryption
                  </span>
                </div>
              </div>
              <Button
                className="mt-8 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                size="lg"
              >
                View Security Documentation
              </Button>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="relative"
            >
              <div className="aspect-video rounded-xl overflow-hidden bg-gradient-to-br from-green-50 to-emerald-50 p-8">
                <div className="grid grid-cols-2 gap-4 h-full">
                  {complianceCertifications.map((cert, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white rounded-lg p-4 shadow-sm"
                    >
                      <h3 className="font-semibold text-lg mb-2">
                        {cert.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {cert.description}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Security Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
            {securityFeatures.map((feature, index) => (
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

          {/* Security Infrastructure Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-20"
          >
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">
                Multi-Layer Security Architecture
              </h2>
              <p className="text-lg text-gray-600">
                Our security is built on multiple layers of protection
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {securityInfrastructure.map((layer, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-white rounded-xl p-6 shadow-sm"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 bg-green-50 rounded-lg flex items-center justify-center text-green-600">
                      {layer.icon}
                    </div>
                    <h3 className="text-xl font-semibold">{layer.title}</h3>
                  </div>
                  <ul className="space-y-2">
                    {layer.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-600 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Security Process Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-xl p-8 shadow-sm mb-20"
          >
            <h2 className="text-2xl font-bold mb-6">Security Best Practices</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-4">Data Protection</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-green-600 mt-1" />
                    <span className="text-gray-600">
                      All data encrypted in transit and at rest
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Eye className="h-5 w-5 text-green-600 mt-1" />
                    <span className="text-gray-600">
                      Row Level Security prevents unauthorized access
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Lock className="h-5 w-5 text-green-600 mt-1" />
                    <span className="text-gray-600">
                      Secure session management with JWT tokens
                    </span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">Payment Security</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-green-600 mt-1" />
                    <span className="text-gray-600">
                      Stripe webhook signature verification
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Eye className="h-5 w-5 text-green-600 mt-1" />
                    <span className="text-gray-600">
                      PCI DSS Level 1 compliant processing
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-green-600 mt-1" />
                    <span className="text-gray-600">
                      Fraud detection and prevention systems
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </motion.div>

          {/* CTA Section */}
          <CTASection
            title="Ready to Secure Your Restaurant Operations?"
            subtitle="Join hundreds of restaurants who trust DineEasy with their business operations"
            buttonText="Start Free Trial"
            buttonHref="/signup"
            features={[
              "Enterprise-grade security",
              "Supabase & Vercel infrastructure",
              "PCI DSS compliant payments",
              "24/7 monitoring",
            ]}
          />
        </div>
      </AnimatedSection>
    </PageWrapper>
  );
}
