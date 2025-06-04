"use client";

import { motion } from "framer-motion";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { HeroSection } from "@/components/elements/HeroSection";
import { AnimatedSection } from "@/components/elements/AnimatedSection";

export default function PrivacyPage() {
  return (
    <PageWrapper>
      <HeroSection
        layout="centered"
        title="Privacy Policy"
        subtitle="Learn how we collect, use, and protect your information"
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
              <p className="lead">
                This Privacy Policy describes how DineEasy ("we", "us", or
                "our") collects, uses, and discloses your personal information
                when you visit, use our services, or make a purchase from
                dineeasy.com (the "Site") or otherwise communicate with us
                (collectively, the "Services").
              </p>
              <p>
                Please read this Privacy Policy carefully. By using our
                Services, you agree to the practices described in this Privacy
                Policy. If you do not agree to this Privacy Policy, please do
                not access the Site or otherwise use our Services.
              </p>

              <h2 className="text-2xl font-bold tracking-tight mt-12">
                1. Personal Information We Collect
              </h2>
              <p>
                When you use our Services, we may collect the following types of
                personal information:
              </p>
              <h3 className="text-xl font-semibold mt-8 mb-4">
                Information You Provide to Us
              </h3>
              <p>
                We collect information you provide directly to us. For example,
                we collect information when you:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Create an account or sign up for our Services</li>
                <li>Make a purchase</li>
                <li>
                  Sign up to receive our newsletter or marketing communications
                </li>
                <li>Participate in a survey, contest, or promotion</li>
                <li>
                  Contact customer service or otherwise communicate with us
                </li>
              </ul>

              <h3 className="text-xl font-semibold mt-8 mb-4">
                Information We Collect Automatically
              </h3>
              <p>
                When you use our Services, we automatically collect certain
                information, including:
              </p>
              <ul className="list-disc pl-6 space-y-4">
                <li>
                  <strong>Device Information:</strong> We collect information
                  about the device you use to access our Services, including the
                  hardware model, operating system and version, unique device
                  identifiers, and mobile network information.
                </li>
                <li>
                  <strong>Log Information:</strong> We collect log information
                  about your use of our Services, including the type of browser
                  you use, access times, pages viewed, your IP address, and the
                  page you visited before navigating to our Services.
                </li>
                <li>
                  <strong>Location Information:</strong> We may collect
                  information about your location, including precise location
                  information when you provide permission through your device
                  settings.
                </li>
                <li>
                  <strong>Cookies and Similar Technologies:</strong> We use
                  various technologies to collect information, including cookies
                  and web beacons. These help us improve our Services, see which
                  areas and features are popular, and count visits.
                </li>
              </ul>

              <h2 className="text-2xl font-bold tracking-tight mt-12">
                2. How We Use Your Information
              </h2>
              <p>We use the information we collect to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide, maintain, and improve our Services</li>
                <li>Process transactions and send related information</li>
                <li>Send technical notices, updates, and support messages</li>
                <li>Respond to your comments and questions</li>
                <li>Communicate about products, services, and promotions</li>
                <li>Monitor and analyze trends and usage</li>
                <li>Detect and prevent fraudulent transactions</li>
                <li>Personalize and improve the Services</li>
              </ul>

              <h2 className="text-2xl font-bold tracking-tight mt-12">
                3. Information Sharing
              </h2>
              <p>We may share your personal information as follows:</p>
              <ul className="list-disc pl-6 space-y-4">
                <li>
                  <strong>Service Providers:</strong> With vendors and service
                  providers who need access to such information to carry out
                  work on our behalf
                </li>
                <li>
                  <strong>Business Partners:</strong> With partners who offer
                  co-branded services or engage in joint marketing activities
                </li>
                <li>
                  <strong>Legal Requirements:</strong> When required by
                  applicable law, regulation, or legal process
                </li>
                <li>
                  <strong>Business Transfers:</strong> In connection with a
                  merger, acquisition, or sale of assets
                </li>
              </ul>

              <h2 className="text-2xl font-bold tracking-tight mt-12">
                4. Your Choices
              </h2>
              <h3 className="text-xl font-semibold mt-8 mb-4">
                Account Information
              </h3>
              <p>
                You may update, correct, or delete your account information at
                any time by logging into your online account or emailing us at{" "}
                <a
                  href="mailto:privacy@dineeasy.com"
                  className="text-green-600 hover:text-green-700"
                >
                  privacy@dineeasy.com
                </a>
                .
              </p>

              <h3 className="text-xl font-semibold mt-8 mb-4">
                Marketing Communications
              </h3>
              <p>
                You may opt out of receiving promotional emails by following the
                instructions in those emails or by emailing{" "}
                <a
                  href="mailto:privacy@dineeasy.com"
                  className="text-green-600 hover:text-green-700"
                >
                  privacy@dineeasy.com
                </a>
                . Even if you opt out, we may still send you non-promotional
                emails.
              </p>

              <h2 className="text-2xl font-bold tracking-tight mt-12">
                5. Data Security
              </h2>
              <p>
                We take reasonable measures to help protect information about
                you from loss, theft, misuse, unauthorized access, disclosure,
                alteration, and destruction. However, no security system is
                impenetrable and we cannot guarantee the security of our systems
                100%.
              </p>

              <h2 className="text-2xl font-bold tracking-tight mt-12">
                6. Children's Privacy
              </h2>
              <p>
                Our Services are not directed to children under 16. We do not
                knowingly collect personal information from children under 16.
                If you are a parent or guardian and believe your child has
                provided us with personal information, please contact us at{" "}
                <a
                  href="mailto:privacy@dineeasy.com"
                  className="text-green-600 hover:text-green-700"
                >
                  privacy@dineeasy.com
                </a>
                .
              </p>

              <h2 className="text-2xl font-bold tracking-tight mt-12">
                7. Changes to this Policy
              </h2>
              <p>
                We may update this Privacy Policy from time to time. If we make
                material changes, we will notify you by email or through the
                Services prior to the changes becoming effective.
              </p>
              <p className="mt-8 text-gray-500">
                Your continued use of our Services after any changes to this
                Privacy Policy indicates your agreement with the terms of the
                revised Privacy Policy.
              </p>

              <h2 className="text-2xl font-bold tracking-tight mt-12">
                8. Contact Us
              </h2>
              <p>
                If you have questions about this Privacy Policy, please contact
                us:
              </p>
              <ul className="list-none space-y-2 mt-4">
                <li>
                  Email:{" "}
                  <a
                    href="mailto:privacy@dineeasy.com"
                    className="text-green-600 hover:text-green-700"
                  >
                    privacy@dineeasy.com
                  </a>
                </li>
                <li>Phone: +1 (555) 123-4567</li>
                <li>
                  Address: 123 Restaurant Row
                  <br />
                  San Francisco, CA 94103
                </li>
              </ul>
            </div>
          </motion.div>
        </div>
      </AnimatedSection>
    </PageWrapper>
  );
}
