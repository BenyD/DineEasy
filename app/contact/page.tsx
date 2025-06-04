"use client"

import type React from "react"
import { motion } from "framer-motion"
import { useState } from "react"
import { Mail, MapPin, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { PageWrapper } from "@/components/layout/PageWrapper"
import { HeroSection } from "@/components/elements/HeroSection"
import { AnimatedSection } from "@/components/elements/AnimatedSection"

export default function ContactPage() {
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormState({
      ...formState,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission - would connect to API in real implementation
    console.log("Form submitted:", formState)
    alert("Thank you for your message! We'll get back to you soon.")
    setFormState({
      name: "",
      email: "",
      subject: "",
      message: "",
    })
  }

  return (
    <PageWrapper>
      <HeroSection
        layout="centered"
        title="Get in Touch"
        subtitle="Have questions about DineEasy? We're here to help you transform your restaurant operations."
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
                <h2 className="text-2xl font-bold tracking-tight">Contact Information</h2>
                <p className="mt-2 text-gray-500">Reach out to our team for any questions or support needs.</p>
                <div className="mt-8 space-y-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    className="flex items-start gap-4"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
                      <Mail className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-medium text-lg">Email</h3>
                      <p className="text-gray-500">info@dineeasy.com</p>
                      <p className="text-gray-500">support@dineeasy.com</p>
                    </div>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                    className="flex items-start gap-4"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
                      <Phone className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-medium text-lg">Phone</h3>
                      <p className="text-gray-500">+1 (555) 123-4567</p>
                      <p className="text-gray-500">Mon-Fri, 9am-5pm EST</p>
                    </div>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: 0.3 }}
                    className="flex items-start gap-4"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
                      <MapPin className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-medium text-lg">Office</h3>
                      <p className="text-gray-500">123 Restaurant Row</p>
                      <p className="text-gray-500">San Francisco, CA 94103</p>
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
                <h3 className="text-xl font-medium mb-4">Our Location</h3>
                <div className="aspect-video overflow-hidden rounded-lg">
                  <img
                    src="/placeholder.svg?height=300&width=600"
                    alt="Map location"
                    className="h-full w-full object-cover"
                  />
                </div>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <form onSubmit={handleSubmit} className="rounded-xl border bg-white p-8 shadow-sm hover:shadow-md transition-shadow">
                <h2 className="text-2xl font-bold tracking-tight">Send us a message</h2>
                <p className="mt-2 text-gray-500">
                  Fill out the form below and we'll get back to you as soon as possible.
                </p>
                <div className="mt-8 space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-base">Name</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="Your name"
                      value={formState.name}
                      onChange={handleChange}
                      required
                      className="border-gray-200 focus-visible:ring-green-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-base">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={formState.email}
                      onChange={handleChange}
                      required
                      className="border-gray-200 focus-visible:ring-green-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject" className="text-base">Subject</Label>
                    <Input
                      id="subject"
                      name="subject"
                      placeholder="What is this regarding?"
                      value={formState.subject}
                      onChange={handleChange}
                      required
                      className="border-gray-200 focus-visible:ring-green-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-base">Message</Label>
                    <Textarea
                      id="message"
                      name="message"
                      placeholder="Your message..."
                      value={formState.message}
                      onChange={handleChange}
                      required
                      className="min-h-[150px] border-gray-200 focus-visible:ring-green-500"
                    />
                  </div>
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    Send Message
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        </div>
      </AnimatedSection>
    </PageWrapper>
  )
}
