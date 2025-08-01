"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { HeaderSection } from "@/components/elements/HeaderSection";
import { AnimatedSection } from "@/components/elements/AnimatedSection";
import { Shield, Scale, FileText, AlertCircle } from "lucide-react";

// Set a fixed date for the last update
const LAST_UPDATE_DATE = "2025-07-06";

export default function TermsPage() {
  const [formattedDate, setFormattedDate] = useState(LAST_UPDATE_DATE);

  useEffect(() => {
    // Format the date on the client side to avoid hydration mismatch
    const date = new Date(LAST_UPDATE_DATE);
    setFormattedDate(date.toLocaleDateString());
  }, []);

  return (
    <PageWrapper>
      <HeaderSection
        title="Terms of Service"
        subtitle="Our commitment to transparency and fair business practices in accordance with Swiss law."
      />

      <AnimatedSection className="py-16 sm:py-24">
        <div className="container mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="prose prose-gray max-w-none">
            <div className="mb-8 flex items-center justify-between">
              <h1 className="text-3xl font-bold m-0">Terms of Service</h1>
              <p className="text-sm text-gray-500 m-0">
                Last updated: {formattedDate}
              </p>
            </div>

            <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-green-100 p-2">
                    <Shield className="h-5 w-5 text-green-600" />
                  </div>
                  <h3 className="m-0 text-base font-semibold">Swiss Quality</h3>
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  Operating under Swiss law with the highest standards of
                  service quality and data protection.
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-green-100 p-2">
                    <Scale className="h-5 w-5 text-green-600" />
                  </div>
                  <h3 className="m-0 text-base font-semibold">Fair Terms</h3>
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  Transparent pricing with no hidden fees. Only 2% commission on
                  payments.
                </p>
              </div>
            </div>

            <div className="mb-8 rounded-lg border-l-4 border-yellow-400 bg-yellow-50 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-1 h-5 w-5 text-yellow-600" />
                <div>
                  <h3 className="m-0 text-base font-semibold text-yellow-800">
                    Important Notice
                  </h3>
                  <p className="mt-1 text-sm text-yellow-700">
                    Please read these terms carefully as they constitute a
                    legally binding agreement between you and DineEasy.
                  </p>
                </div>
              </div>
            </div>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                1. General Provisions
              </h2>
              <div className="rounded-lg border border-gray-100 bg-white p-6">
                <p className="text-gray-600">
                  These Terms of Service (&quot;Terms&quot;) govern your access to and use
                  of DineEasy&apos;s website, applications, and services
                  (collectively, the &quot;Services&quot;). These Terms constitute a
                  legally binding agreement between you and DineEasy, a company
                  registered in Switzerland.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                2. Applicable Law and Jurisdiction
              </h2>
              <div className="rounded-lg border border-gray-100 bg-white p-6">
                <p className="text-gray-600">
                  These Terms are governed by Swiss law. Any disputes arising
                  from or in connection with these Terms shall be subject to the
                  exclusive jurisdiction of the courts of Zürich, Switzerland,
                  subject to any mandatory provisions of Swiss law.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                3. Service Description
              </h2>
              <div className="rounded-lg border border-gray-100 bg-white p-6">
                <p className="text-gray-600 mb-4">
                  DineEasy provides a comprehensive restaurant management
                  platform that includes:
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg bg-gray-50 p-4">
                    <h4 className="text-base font-medium mb-2">
                      Core Features
                    </h4>
                    <ul className="list-none space-y-2 pl-0">
                      <li className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
                        QR code-based ordering system
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
                        Payment processing with TWINT
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
                        Order management
                      </li>
                    </ul>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-4">
                    <h4 className="text-base font-medium mb-2">
                      Additional Tools
                    </h4>
                    <ul className="list-none space-y-2 pl-0">
                      <li className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
                        Analytics and reporting
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
                        Menu management
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
                        Table management
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                4. User Registration and Account
              </h2>
              <div className="rounded-lg border border-gray-100 bg-white p-6">
                <p className="text-gray-600 mb-4">
                  To use our Services, you must meet the following requirements:
                </p>
                <ul className="grid gap-3 sm:grid-cols-2">
                  <li className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
                    <div className="flex-shrink-0">
                      <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    </div>
                    <span className="flex-1">Be at least 18 years old</span>
                  </li>
                  <li className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
                    <div className="flex-shrink-0">
                      <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    </div>
                    <span className="flex-1">
                      Register with accurate information
                    </span>
                  </li>
                  <li className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
                    <div className="flex-shrink-0">
                      <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    </div>
                    <span className="flex-1">Maintain account security</span>
                  </li>
                  <li className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
                    <div className="flex-shrink-0">
                      <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    </div>
                    <span className="flex-1">Report unauthorized access</span>
                  </li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">5. Payment Terms</h2>
              <div className="rounded-lg border border-gray-100 bg-white p-6">
                <div className="mb-4 rounded-lg bg-green-50 p-4">
                  <p className="m-0 text-green-800">
                    <strong>Transparent Pricing:</strong> We believe in clear,
                    straightforward pricing with no hidden fees.
                  </p>
                </div>
                <div className="grid gap-4">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                    <span className="font-medium">Commission Rate</span>
                    <span className="text-green-600">2% per transaction</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                    <span className="font-medium">Currency</span>
                    <span>Swiss Francs (CHF)</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                    <span className="font-medium">Payment Methods</span>
                    <span>Stripe, TWINT</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">VAT</span>
                    <span>Included in all prices</span>
                  </div>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                6. Data Protection
              </h2>
              <div className="rounded-lg border border-gray-100 bg-white p-6">
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-green-100 p-2">
                    <Shield className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-gray-600">
                      We process personal data in accordance with the Swiss
                      Federal Act on Data Protection (FADP/DSG) and, where
                      applicable, the GDPR. For detailed information, please
                      refer to our{" "}
                      <a
                        href="/privacy"
                        className="text-green-600 hover:text-green-700"
                      >
                        Privacy Policy
                      </a>
                      .
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                7. Intellectual Property
              </h2>
              <div className="rounded-lg border border-gray-100 bg-white p-6">
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-green-100 p-2">
                    <FileText className="h-5 w-5 text-green-600" />
                  </div>
                  <p className="text-gray-600">
                    All intellectual property rights in the Services belong to
                    DineEasy or its licensors. Users receive a limited,
                    non-exclusive, non-transferable license to use the Services.
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                8. Liability and Warranty
              </h2>
              <div className="rounded-lg border border-gray-100 bg-white p-6">
                <p className="text-gray-600 mb-4">
                  In accordance with Swiss law:
                </p>
                <div className="grid gap-3">
                  <div className="rounded-lg bg-gray-50 p-4">
                    <h4 className="text-base font-medium mb-2">
                      Service Warranty
                    </h4>
                    <p className="text-sm text-gray-600">
                      Services are provided &quot;as is&quot; without any warranty
                    </p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-4">
                    <h4 className="text-base font-medium mb-2">
                      Liability Scope
                    </h4>
                    <p className="text-sm text-gray-600">
                      Limited to cases of intentional misconduct or gross
                      negligence
                    </p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-4">
                    <h4 className="text-base font-medium mb-2">
                      Damage Coverage
                    </h4>
                    <p className="text-sm text-gray-600">
                      No liability for indirect or consequential damages
                    </p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-4">
                    <h4 className="text-base font-medium mb-2">
                      Maximum Liability
                    </h4>
                    <p className="text-sm text-gray-600">
                      Limited to the amount paid for Services in the last 12
                      months
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">9. Termination</h2>
              <div className="rounded-lg border border-gray-100 bg-white p-6">
                <p className="text-gray-600 mb-4">
                  Either party may terminate the agreement under the following
                  conditions:
                </p>
                <div className="grid gap-3">
                  <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-4">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    <span>With 30 days written notice</span>
                  </div>
                  <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-4">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    <span>Immediately for material breach</span>
                  </div>
                  <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-4">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    <span>If the other party becomes insolvent</span>
                  </div>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                10. Changes to Terms
              </h2>
              <div className="rounded-lg border border-gray-100 bg-white p-6">
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-yellow-100 p-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                  </div>
                  <p className="text-gray-600">
                    We may modify these Terms at any time. We will notify you of
                    material changes via email or through the Services. Your
                    continued use of the Services after such modifications
                    constitutes acceptance of the updated Terms.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">
                11. Contact Information
              </h2>
              <div className="rounded-lg border border-gray-100 bg-white p-6">
                <p className="text-gray-600 mb-4">
                  For any questions about these Terms, please contact us:
                </p>
                <div className="bg-white rounded-lg p-4">
                  <ul className="list-none pl-0 m-0 space-y-2">
                    <li className="flex items-center gap-2">
                      <span className="font-semibold min-w-24">Email:</span>
                      <a
                        href="mailto:legal@dineeasy.ch"
                        className="text-green-600 hover:text-green-700"
                      >
                        legal@dineeasy.ch
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
              </div>
            </section>
          </div>
        </div>
      </AnimatedSection>
    </PageWrapper>
  );
}
