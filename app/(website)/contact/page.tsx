"use client";

import type React from "react";
import { motion } from "framer-motion";
import { useState } from "react";
import {
  Mail,
  MapPin,
  Phone,
  CheckCircle2,
  AlertCircle,
  Clock,
  Train,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { HeaderSection } from "@/components/elements/HeaderSection";
import { AnimatedSection } from "@/components/elements/AnimatedSection";
import { Alert } from "@/components/ui/alert";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function ContactPage() {
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormState({
      ...formState,
      [e.target.name]: e.target.value,
    });
    // Reset submit status when user starts typing again
    if (submitStatus !== "idle") {
      setSubmitStatus("idle");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSubmitStatus("success");
      setFormState({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
      });
    } catch (error) {
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const faqs = [
    {
      question: "What are your support hours?",
      answer:
        "Our support team is available Monday to Friday, 9:00 - 17:00 CET. For urgent matters, we provide 24/7 support for our Premium and Enterprise customers.",
    },
    {
      question: "How quickly can I expect a response?",
      answer:
        "We typically respond to all inquiries within 2-4 business hours. Premium and Enterprise customers receive priority support with response times under 1 hour.",
    },
    {
      question: "Do you offer on-site support in Switzerland?",
      answer:
        "Yes, we provide on-site support for restaurants in major Swiss cities. This service is included in our Enterprise plan and available as an add-on for Premium customers.",
    },
  ];

  return (
    <PageWrapper>
      <HeaderSection
        title={
          <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            Contact Our Swiss Team
          </span>
        }
        subtitle="Have questions? Our Zürich-based support team is here to help you succeed."
      />

      <AnimatedSection className="py-16 sm:py-24">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="space-y-8"
            >
              <div className="rounded-xl border bg-white p-8 shadow-sm hover:shadow-md transition-shadow">
                <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  Contact Information
                </h2>
                <p className="mt-2 text-gray-600">
                  Swiss quality support for your restaurant&apos;s success.
                </p>
                <div className="mt-8 space-y-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    className="flex items-start gap-4"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-green-50 to-emerald-50 text-green-600">
                      <Mail className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-medium text-lg">Email</h3>
                      <p className="text-gray-600">support@dineeasy.ch</p>
                      <p className="text-gray-600">enterprise@dineeasy.ch</p>
                    </div>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                    className="flex items-start gap-4"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-green-50 to-emerald-50 text-green-600">
                      <Phone className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-medium text-lg">Phone</h3>
                      <p className="text-gray-600">+41 44 123 45 67</p>
                      <p className="text-gray-600">Mon-Fri, 9:00-17:00 CET</p>
                    </div>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: 0.3 }}
                    className="flex items-start gap-4"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-green-50 to-emerald-50 text-green-600">
                      <MapPin className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-medium text-lg">Office</h3>
                      <p className="text-gray-600">Bahnhofstrasse 42</p>
                      <p className="text-gray-600">8001 Zürich, Switzerland</p>
                    </div>
                  </motion.div>
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="rounded-xl border bg-white p-8 shadow-sm hover:shadow-md transition-shadow"
              >
                <h3 className="text-xl font-medium mb-4 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  Frequently Asked Questions
                </h3>
                <Accordion type="single" collapsible className="w-full">
                  {faqs.map((faq, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                      <AccordionTrigger className="text-left">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-gray-600">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <form
                onSubmit={handleSubmit}
                className="rounded-xl border bg-white p-8 shadow-sm hover:shadow-md transition-shadow"
              >
                <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  Send us a message
                </h2>
                <p className="mt-2 text-gray-600">
                  We typically respond within 2-4 business hours during our
                  support hours.
                </p>

                {submitStatus === "success" && (
                  <Alert className="mt-4 bg-green-50 text-green-700 border-green-200">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="ml-2">
                      Thank you for your message! We&apos;ll get back to you
                      soon.
                    </span>
                  </Alert>
                )}

                {submitStatus === "error" && (
                  <Alert className="mt-4 bg-red-50 text-red-700 border-red-200">
                    <AlertCircle className="h-4 w-4" />
                    <span className="ml-2">
                      There was an error sending your message. Please try again.
                    </span>
                  </Alert>
                )}

                <div className="mt-8 space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-base">
                      Name
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="Your name"
                      value={formState.name}
                      onChange={handleChange}
                      required
                      className="border-gray-200 focus-visible:ring-green-500 transition-shadow hover:border-gray-300"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-base">
                        Email
                      </Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="your.email@example.com"
                        value={formState.email}
                        onChange={handleChange}
                        required
                        className="border-gray-200 focus-visible:ring-green-500 transition-shadow hover:border-gray-300"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-base">
                        Phone (optional)
                      </Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder="+41 XX XXX XX XX"
                        value={formState.phone}
                        onChange={handleChange}
                        className="border-gray-200 focus-visible:ring-green-500 transition-shadow hover:border-gray-300"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject" className="text-base">
                      Subject
                    </Label>
                    <Input
                      id="subject"
                      name="subject"
                      placeholder="What is this regarding?"
                      value={formState.subject}
                      onChange={handleChange}
                      required
                      className="border-gray-200 focus-visible:ring-green-500 transition-shadow hover:border-gray-300"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-base">
                      Message
                    </Label>
                    <Textarea
                      id="message"
                      name="message"
                      placeholder="Your message..."
                      value={formState.message}
                      onChange={handleChange}
                      required
                      className="min-h-[150px] border-gray-200 focus-visible:ring-green-500 transition-shadow hover:border-gray-300"
                    />
                  </div>
                  <Button
                    type="submit"
                    size="lg"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white transition-all duration-300 disabled:opacity-50"
                  >
                    {isSubmitting ? "Sending..." : "Send Message"}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>

          {/* Office Location Card - Full Width */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-12 rounded-xl border bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden"
          >
            <div className="grid lg:grid-cols-2">
              <div className="p-8">
                <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  Visit Our Office
                </h3>
                <p className="text-gray-600 mb-6">
                  Located in the heart of Zürich, our office is easily
                  accessible by public transport. We&apos;d love to meet you in
                  person and discuss how DineEasy can help your restaurant
                  thrive.
                </p>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-green-600" />
                    <span className="text-gray-600">
                      Bahnhofstrasse 42, 8001 Zürich
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-green-600" />
                    <span className="text-gray-600">
                      Monday - Friday: 9:00 - 17:00 CET
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Train className="h-5 w-5 text-green-600" />
                    <span className="text-gray-600">
                      2 minutes walk from Zürich HB
                    </span>
                  </div>
                </div>
                <Button
                  className="mt-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white transition-all duration-300"
                  onClick={() =>
                    window.open(
                      "https://goo.gl/maps/YOUR_GOOGLE_MAPS_LINK",
                      "_blank"
                    )
                  }
                >
                  Get Directions
                </Button>
              </div>
              <div className="h-[400px] lg:h-full">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2702.4626576422945!2d8.537337776871892!3d47.37288997116612!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47900a08cc0e6e41%3A0x9d56e4e0e4547f76!2sBahnhofstrasse%2042%2C%208001%20Z%C3%BCrich!5e0!3m2!1sen!2sch!4v1709669136317!5m2!1sen!2sch"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="w-full h-full"
                  title="DineEasy Zürich Office"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </AnimatedSection>
    </PageWrapper>
  );
}
