"use client";

import { motion } from "framer-motion";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { HeroSection } from "@/components/elements/HeroSection";
import { AnimatedSection } from "@/components/elements/AnimatedSection";
import { CookiePreferences } from "@/components/elements/CookiePreferences";

export default function PrivacyPolicy() {
  return (
    <PageWrapper>
      <HeroSection
        layout="centered"
        title="Privacy Policy"
        subtitle="Learn how we collect, use, and protect your information"
      />

      <AnimatedSection className="py-16 sm:py-24">
        <div className="container mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>

          <div className="prose prose-gray max-w-none">
            <p className="text-sm text-gray-500 mb-8">
              Last updated: {new Date().toLocaleDateString()}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
              <p>
                DineEasy ("we", "our", or "us") respects your privacy and is
                committed to protecting your personal data. This privacy policy
                explains how we handle your data when you visit our website or
                use our services in accordance with the Swiss Federal Act on
                Data Protection (FADP/DSG) and the EU General Data Protection
                Regulation (GDPR).
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                2. Data Controller
              </h2>
              <p>
                DineEasy is the data controller responsible for your personal
                data. For all data protection related inquiries, please contact
                our Data Protection Officer at:
              </p>
              <ul className="list-disc pl-6 mt-2">
                <li>Email: privacy@dineeasy.ch</li>
                <li>Address: [Your Swiss Business Address]</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                3. Data We Collect
              </h2>
              <p>
                We collect and process the following categories of personal
                data:
              </p>
              <ul className="list-disc pl-6 mt-2">
                <li>Identity Data (name, username)</li>
                <li>Contact Data (email address, phone number)</li>
                <li>
                  Technical Data (IP address, browser type, device information)
                </li>
                <li>Usage Data (analytics about how you use our service)</li>
                <li>Transaction Data (payment details, order history)</li>
                <li>Marketing and Communications Data (your preferences)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                4. Legal Basis for Processing
              </h2>
              <p>We process your personal data on the following legal bases:</p>
              <ul className="list-disc pl-6 mt-2">
                <li>Contract fulfillment for our services</li>
                <li>Legal obligations under Swiss and EU law</li>
                <li>Legitimate business interests</li>
                <li>Your consent, where explicitly given</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                5. Data Storage and Transfer
              </h2>
              <p>
                Your data is stored on secure servers in Switzerland. We may
                transfer data to third countries outside Switzerland and the
                EU/EEA only when adequate protection is ensured through:
              </p>
              <ul className="list-disc pl-6 mt-2">
                <li>EU Commission adequacy decisions</li>
                <li>Standard contractual clauses</li>
                <li>Binding corporate rules</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">6. Your Rights</h2>
              <p>
                Under Swiss data protection law and GDPR, you have the right to:
              </p>
              <ul className="list-disc pl-6 mt-2">
                <li>Access your personal data</li>
                <li>Rectify inaccurate data</li>
                <li>Request erasure of your data</li>
                <li>Restrict or object to processing</li>
                <li>Data portability</li>
                <li>Withdraw consent at any time</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">7. Cookie Policy</h2>
              <p className="mb-4">
                We use cookies and similar technologies to enhance your browsing
                experience. You can manage your cookie preferences below:
              </p>
              <div className="bg-gray-50 p-6 rounded-lg">
                <CookiePreferences />
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">8. Data Security</h2>
              <p>
                We implement appropriate technical and organizational measures
                to protect your personal data against unauthorized or unlawful
                processing, accidental loss, destruction, or damage. These
                measures include:
              </p>
              <ul className="list-disc pl-6 mt-2">
                <li>Encryption of data in transit and at rest</li>
                <li>Regular security assessments</li>
                <li>Access controls and authentication</li>
                <li>Staff training on data protection</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">9. Data Retention</h2>
              <p>
                We retain your personal data only for as long as necessary to
                fulfill the purposes for which it was collected, including
                legal, accounting, or reporting requirements. When data is no
                longer needed, it is securely deleted or anonymized.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">10. Complaints</h2>
              <p>
                You have the right to lodge a complaint with the Swiss Federal
                Data Protection and Information Commissioner (FDPIC) or your
                local data protection authority. However, we appreciate the
                chance to address your concerns first.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                11. Changes to This Policy
              </h2>
              <p>
                We may update this privacy policy from time to time. We will
                notify you of any significant changes by posting the new policy
                on this page and updating the "last updated" date.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">12. Contact Us</h2>
              <p>
                For any questions about this privacy policy or our data
                practices, please contact us at:
              </p>
              <ul className="list-disc pl-6 mt-2">
                <li>Email: privacy@dineeasy.ch</li>
                <li>Phone: [Your Swiss Phone Number]</li>
                <li>Address: [Your Swiss Business Address]</li>
              </ul>
            </section>
          </div>
        </div>
      </AnimatedSection>
    </PageWrapper>
  );
}
