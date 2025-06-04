"use client";

import { PageWrapper } from "@/components/layout/PageWrapper";
import { HeroSection } from "@/components/elements/HeroSection";
import { AnimatedSection } from "@/components/elements/AnimatedSection";

export default function TermsPage() {
  return (
    <PageWrapper>
      <HeroSection
        layout="centered"
        title="Terms of Service"
        subtitle="Please read these terms carefully before using DineEasy"
      />

      <AnimatedSection className="py-16 sm:py-24">
        <div className="container mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>

          <div className="prose prose-gray max-w-none">
            <p className="text-sm text-gray-500 mb-8">
              Last updated: {new Date().toLocaleDateString()}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                1. General Provisions
              </h2>
              <p>
                These Terms of Service ("Terms") govern your access to and use
                of DineEasy's website, applications, and services (collectively,
                the "Services"). These Terms constitute a legally binding
                agreement between you and DineEasy, a company registered in
                Switzerland.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                2. Applicable Law and Jurisdiction
              </h2>
              <p>
                These Terms are governed by Swiss law. Any disputes arising from
                or in connection with these Terms shall be subject to the
                exclusive jurisdiction of the courts of [Your Canton],
                Switzerland, subject to any mandatory provisions of Swiss law.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                3. Service Description
              </h2>
              <p>
                DineEasy provides a restaurant management platform that
                includes:
              </p>
              <ul className="list-disc pl-6 mt-2">
                <li>QR code-based ordering system</li>
                <li>Payment processing (including TWINT integration)</li>
                <li>Order management</li>
                <li>Analytics and reporting</li>
                <li>Menu management</li>
                <li>Table management</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                4. User Registration and Account
              </h2>
              <p>To use our Services, you must:</p>
              <ul className="list-disc pl-6 mt-2">
                <li>Be at least 18 years old</li>
                <li>Register for an account with accurate information</li>
                <li>Maintain the security of your account credentials</li>
                <li>Notify us immediately of any unauthorized use</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">5. Payment Terms</h2>
              <p>Our payment terms include:</p>
              <ul className="list-disc pl-6 mt-2">
                <li>2% commission on processed payments</li>
                <li>Monthly subscription fees based on selected plan</li>
                <li>Payment processing through Stripe and TWINT</li>
                <li>All prices are in Swiss Francs (CHF) and include VAT</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                6. Data Protection
              </h2>
              <p>
                We process personal data in accordance with the Swiss Federal
                Act on Data Protection (FADP/DSG) and, where applicable, the
                GDPR. Details can be found in our Privacy Policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                7. Intellectual Property
              </h2>
              <p>
                All intellectual property rights in the Services belong to
                DineEasy or its licensors. Users receive a limited,
                non-exclusive, non-transferable license to use the Services.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                8. Liability and Warranty
              </h2>
              <p>In accordance with Swiss law:</p>
              <ul className="list-disc pl-6 mt-2">
                <li>We provide the Services "as is" without any warranty</li>
                <li>
                  Our liability is limited to cases of intentional misconduct or
                  gross negligence
                </li>
                <li>We are not liable for indirect or consequential damages</li>
                <li>
                  Maximum liability is limited to the amount paid for the
                  Services in the last 12 months
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">9. Termination</h2>
              <p>Either party may terminate the agreement:</p>
              <ul className="list-disc pl-6 mt-2">
                <li>With 30 days written notice</li>
                <li>Immediately for material breach</li>
                <li>If the other party becomes insolvent</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                10. Changes to Terms
              </h2>
              <p>
                We may modify these Terms at any time. We will notify you of
                material changes via email or through the Services. Your
                continued use of the Services after such modifications
                constitutes acceptance of the updated Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">
                11. Contact Information
              </h2>
              <p>For any questions about these Terms, please contact us at:</p>
              <ul className="list-disc pl-6 mt-2">
                <li>Email: legal@dineeasy.ch</li>
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
