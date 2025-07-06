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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { HeaderSection } from "@/components/elements/HeaderSection";
import { AnimatedSection } from "@/components/elements/AnimatedSection";
import { GradientBlob } from "@/components/elements/GradientBlob";
import { CTASection } from "@/components/elements/CTASection";

const securityFeatures = [
  {
    icon: <Shield className="h-8 w-8" />,
    title: "Data Encryption",
    description:
      "All data is encrypted at rest and in transit using industry-standard AES-256 encryption and TLS 1.3 protocols.",
  },
  {
    icon: <Lock className="h-8 w-8" />,
    title: "Secure Payments",
    description:
      "PCI DSS Level 1 compliant payment processing through Stripe, ensuring your customers' payment data is always protected.",
  },
  {
    icon: <Server className="h-8 w-8" />,
    title: "Swiss Data Centers",
    description:
      "All data is stored in Swiss data centers, complying with strict Swiss data protection laws and GDPR requirements.",
  },
  {
    icon: <Key className="h-8 w-8" />,
    title: "Access Control",
    description:
      "Role-based access control (RBAC) with granular permissions and two-factor authentication support.",
  },
  {
    icon: <UserCheck className="h-8 w-8" />,
    title: "User Authentication",
    description:
      "Secure authentication with password policies, session management, and automatic account lockout protection.",
  },
  {
    icon: <FileCheck className="h-8 w-8" />,
    title: "Audit Logging",
    description:
      "Comprehensive audit trails for all system access and changes, helping you maintain compliance and security.",
  },
];

const complianceCertifications = [
  {
    title: "PCI DSS",
    description:
      "Payment Card Industry Data Security Standard compliant payment processing",
  },
  {
    title: "GDPR",
    description:
      "Full compliance with EU General Data Protection Regulation requirements",
  },
  {
    title: "Swiss DPA",
    description: "Adherence to Swiss Federal Data Protection Act regulations",
  },
  {
    title: "ISO 27001",
    description: "Information security management system certified",
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
        subtitle="Your data security and privacy is our top priority. DineEasy implements industry-leading security measures to protect your business."
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
                Swiss Quality Security Standards
              </h2>
              <p className="text-gray-600 mb-8">
                As a Swiss company, we understand the importance of data
                protection and privacy. Our platform is built with security at
                its core, ensuring your business and customer data remains safe
                and compliant with all relevant regulations.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-green-600 rounded-full" />
                  <span className="text-gray-700">
                    Swiss data center hosting
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-green-600 rounded-full" />
                  <span className="text-gray-700">End-to-end encryption</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-green-600 rounded-full" />
                  <span className="text-gray-700">Regular security audits</span>
                </div>
              </div>
              <Button
                className="mt-8 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                size="lg"
              >
                Download Security Whitepaper
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

          {/* Security Process Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-xl p-8 shadow-sm"
          >
            <h2 className="text-2xl font-bold mb-6">Our Security Process</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  Proactive Monitoring
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-green-600 mt-1" />
                    <span className="text-gray-600">
                      24/7 system monitoring and threat detection
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Eye className="h-5 w-5 text-green-600 mt-1" />
                    <span className="text-gray-600">
                      Regular vulnerability assessments and penetration testing
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-green-600 mt-1" />
                    <span className="text-gray-600">
                      Automated security updates and patch management
                    </span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  Incident Response
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-green-600 mt-1" />
                    <span className="text-gray-600">
                      Dedicated security team with 24/7 availability
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Eye className="h-5 w-5 text-green-600 mt-1" />
                    <span className="text-gray-600">
                      Documented incident response procedures
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-green-600 mt-1" />
                    <span className="text-gray-600">
                      Regular disaster recovery and backup testing
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
            buttonText="Get Started"
            buttonHref="/signup"
            features={[
              "Enterprise-grade security",
              "Swiss data centers",
              "24/7 monitoring",
              "PCI DSS compliant",
            ]}
          />
        </div>
      </AnimatedSection>
    </PageWrapper>
  );
}
