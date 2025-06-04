"use client";

import { motion } from "framer-motion";
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
        <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-xl border bg-white p-8 shadow-sm"
          >
            <div className="mb-8 pb-8 border-b">
              <p className="text-gray-500">Last updated: June 3, 2025</p>
            </div>

            <div className="prose prose-green prose-lg max-w-none">
              <h2 className="text-2xl font-bold tracking-tight">
                1. Introduction
              </h2>
              <p>
                Welcome to DineEasy ("Company", "we", "our", "us")! As you have
                clicked "I agree" to these Terms of Service, you have entered
                into a binding contract with DineEasy. These Terms of Service
                ("Terms", "Terms of Service") govern your use of our website and
                platform located at dineeasy.com (together or individually
                "Service") operated by DineEasy.
              </p>
              <p>
                Our Privacy Policy also governs your use of our Service and
                explains how we collect, safeguard and disclose information that
                results from your use of our web pages. Please read it here:{" "}
                <a
                  href="/privacy"
                  className="text-green-600 hover:text-green-700"
                >
                  Privacy Policy
                </a>
                .
              </p>
              <p>
                Your agreement with us includes these Terms and our Privacy
                Policy ("Agreements"). You acknowledge that you have read and
                understood the Agreements, and agree to be bound by them.
              </p>
              <p>
                If you do not agree with (or cannot comply with) the Agreements,
                then you may not use the Service, but please let us know by
                emailing at{" "}
                <a
                  href="mailto:support@dineeasy.com"
                  className="text-green-600 hover:text-green-700"
                >
                  support@dineeasy.com
                </a>{" "}
                so we can try to find a solution.
              </p>

              <h2 className="text-2xl font-bold tracking-tight mt-12">
                2. Communications
              </h2>
              <p>
                By using our Service, you agree to subscribe to newsletters,
                marketing or promotional materials and other information we may
                send. However, you may opt out of receiving any, or all, of
                these communications from us by following the unsubscribe link
                or by emailing{" "}
                <a
                  href="mailto:support@dineeasy.com"
                  className="text-green-600 hover:text-green-700"
                >
                  support@dineeasy.com
                </a>
                .
              </p>

              <h2 className="text-2xl font-bold tracking-tight mt-12">
                3. Purchases
              </h2>
              <p>
                If you wish to purchase any product or service made available
                through the Service ("Purchase"), you may be asked to supply
                certain information relevant to your Purchase including, without
                limitation, your credit card number, the expiration date of your
                credit card, your billing address, and your shipping
                information.
              </p>
              <p>
                You represent and warrant that: (i) you have the legal right to
                use any credit card(s) or other payment method(s) in connection
                with any Purchase; and that (ii) the information you supply to
                us is true, correct and complete.
              </p>
              <p>
                The service may employ the use of third-party services for the
                purpose of facilitating payment and the completion of Purchases.
                By submitting your information, you grant us the right to
                provide the information to these third parties subject to our
                Privacy Policy.
              </p>
              <p>
                We reserve the right to refuse or cancel your order at any time
                for reasons including but not limited to: product or service
                availability, errors in the description or price of the product
                or service, error in your order or other reasons.
              </p>

              <h2 className="text-2xl font-bold tracking-tight mt-12">
                4. Subscriptions
              </h2>
              <p>
                Some parts of the Service are billed on a subscription basis
                ("Subscription(s)"). You will be billed in advance on a
                recurring and periodic basis ("Billing Cycle"). Billing cycles
                are set either on a monthly or annual basis, depending on the
                type of subscription plan you select when purchasing a
                Subscription.
              </p>
              <p>
                At the end of each Billing Cycle, your Subscription will
                automatically renew under the exact same conditions unless you
                cancel it or DineEasy cancels it. You may cancel your
                Subscription renewal either through your online account
                management page or by contacting DineEasy customer support team.
              </p>

              <h2 className="text-2xl font-bold tracking-tight mt-12">
                5. Free Trial
              </h2>
              <p>
                DineEasy may, at its sole discretion, offer a Subscription with
                a free trial for a limited period of time ("Free Trial").
              </p>
              <p>
                You may be required to enter your billing information in order
                to sign up for the Free Trial.
              </p>
              <p>
                If you do enter your billing information when signing up for the
                Free Trial, you will not be charged by DineEasy until the Free
                Trial has expired. On the last day of the Free Trial period,
                unless you cancelled your Subscription, you will be
                automatically charged the applicable Subscription fees for the
                type of Subscription you have selected.
              </p>

              <h2 className="text-2xl font-bold tracking-tight mt-12">
                6. Fee Changes
              </h2>
              <p>
                DineEasy, in its sole discretion and at any time, may modify the
                Subscription fees for the Subscriptions. Any Subscription fee
                change will become effective at the end of the then-current
                Billing Cycle.
              </p>
              <p>
                DineEasy will provide you with reasonable prior notice of any
                change in Subscription fees to give you an opportunity to
                terminate your Subscription before such change becomes
                effective.
              </p>

              <h2 className="text-2xl font-bold tracking-tight mt-12">
                7. Refunds
              </h2>
              <p>
                Except when required by law, paid Subscription fees are
                non-refundable.
              </p>

              <h2 className="text-2xl font-bold tracking-tight mt-12">
                8. Content
              </h2>
              <p>
                Our Service allows you to post, link, store, share and otherwise
                make available certain information, text, graphics, videos, or
                other material ("Content"). You are responsible for the Content
                that you post on or through the Service, including its legality,
                reliability, and appropriateness.
              </p>

              <h2 className="text-2xl font-bold tracking-tight mt-12">
                9. Prohibited Uses
              </h2>
              <p>
                You may use the Service only for lawful purposes and in
                accordance with Terms. You agree not to use the Service:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  In any way that violates any applicable national or
                  international law or regulation.
                </li>
                <li>
                  For the purpose of exploiting, harming, or attempting to
                  exploit or harm minors in any way.
                </li>
                <li>
                  To transmit any advertising or promotional material without
                  permission, including "spam" or similar solicitation.
                </li>
                <li>
                  To impersonate or attempt to impersonate Company, employees,
                  users, or others.
                </li>
              </ul>

              <h2 className="text-2xl font-bold tracking-tight mt-12">
                10. Changes to Terms
              </h2>
              <p>
                We reserve the right to modify these Terms at any time. For
                significant changes, we will provide at least 30 days notice
                prior to any new terms taking effect.
              </p>
              <p className="mt-8 text-gray-500">
                By continuing to access or use our Service after any revisions
                become effective, you agree to be bound by the revised terms. If
                you do not agree to the new terms, you are no longer authorized
                to use the Service.
              </p>
            </div>
          </motion.div>
        </div>
      </AnimatedSection>
    </PageWrapper>
  );
}
