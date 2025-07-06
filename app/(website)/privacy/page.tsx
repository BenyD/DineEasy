"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { HeaderSection } from "@/components/elements/HeaderSection";
import { AnimatedSection } from "@/components/elements/AnimatedSection";
import { CookiePreferences } from "@/components/elements/CookiePreferences";

// Set a fixed date for the last update
const LAST_UPDATE_DATE = "2025-07-06";

export default function PrivacyPolicy() {
  const [formattedDate, setFormattedDate] = useState(LAST_UPDATE_DATE);

  useEffect(() => {
    // Format the date on the client side to avoid hydration mismatch
    const date = new Date(LAST_UPDATE_DATE);
    setFormattedDate(date.toLocaleDateString());
  }, []);

  return (
    <PageWrapper>
      <HeaderSection
        title="Privacy Policy"
        subtitle="Learn how we collect, use, and protect your data in accordance with Swiss and EU regulations."
      />

      <AnimatedSection className="py-16 sm:py-24">
        <div className="container mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="prose prose-gray max-w-none">
            <div className="mb-8 flex items-center justify-between">
              <h1 className="text-3xl font-bold m-0">Privacy Policy</h1>
              <p className="text-sm text-gray-500 m-0">
                Last updated: {formattedDate}
              </p>
            </div>

            <div className="bg-green-50 border-l-4 border-green-600 p-4 mb-8">
              <p className="text-sm text-green-800 m-0">
                <strong>Your Privacy Matters:</strong> We are committed to
                protecting your personal data and being transparent about how we
                use it. This policy explains your rights and our
                responsibilities.
              </p>
            </div>

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

            <section id="cookie-policy" className="mb-8 scroll-mt-24">
              <h2 className="text-2xl font-semibold mb-4">7. Cookie Policy</h2>
              <p className="mb-4">
                We use cookies and similar technologies to enhance your browsing
                experience. You can manage your cookie preferences below:
              </p>
              <div className="bg-gray-50 border border-gray-100 p-6 rounded-lg shadow-sm">
                <CookiePreferences className="[&_.switch]:data-[state=checked]:bg-green-600 [&_.switch]:data-[state=checked]:hover:bg-green-700" />
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
              <div className="bg-white border border-gray-200 rounded-lg p-4 mt-4">
                <ul className="list-none pl-0 m-0 space-y-2">
                  <li className="flex items-center gap-2">
                    <span className="font-semibold min-w-24">Email:</span>
                    <a
                      href="mailto:privacy@dineeasy.ch"
                      className="text-green-600 hover:text-green-700"
                    >
                      privacy@dineeasy.ch
                    </a>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="font-semibold min-w-24">Phone:</span>
                    <a
                      href="tel:+41XXXXXXXXX"
                      className="text-green-600 hover:text-green-700"
                    >
                      +41 XX XXX XX XX
                    </a>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="font-semibold min-w-24">Address:</span>
                    <span>Bahnhofstrasse 123, 8001 Zürich, Switzerland</span>
                  </li>
                </ul>
              </div>
            </section>
          </div>
        </div>
      </AnimatedSection>
    </PageWrapper>
  );
}
