"use client"

import type React from "react"

import { useState } from "react"
import { Mail, MapPin, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { PageWrapper } from "@/components/layout/PageWrapper"

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
      <main className="flex-1">
        <section className="relative overflow-hidden py-20 md:py-32">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(#e0f2e9_1px,transparent_1px)] bg-size-[16px_16px] mask-[radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
          <div className="absolute -top-40 right-0 -z-10 h-[500px] w-[500px] rounded-full bg-green-200/20 blur-3xl" />
          <div className="container relative">
            <div className="mx-auto max-w-[800px] text-center">
              <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">Get in Touch</h1>
              <p className="mt-6 text-xl text-gray-500">Have questions about DineEasy? We're here to help.</p>
            </div>
          </div>
        </section>

        <section className="container pb-20">
          <div className="grid gap-12 lg:grid-cols-2">
            <div className="space-y-6">
              <div className="rounded-xl border bg-white p-6 shadow-xs">
                <h2 className="text-2xl font-bold">Contact Information</h2>
                <p className="mt-2 text-gray-500">Reach out to our team for any questions or support needs.</p>
                <div className="mt-6 space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-medium">Email</h3>
                      <p className="text-sm text-gray-500">info@dineeasy.com</p>
                      <p className="text-sm text-gray-500">support@dineeasy.com</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600">
                      <Phone className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-medium">Phone</h3>
                      <p className="text-sm text-gray-500">+1 (555) 123-4567</p>
                      <p className="text-sm text-gray-500">Mon-Fri, 9am-5pm EST</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-medium">Office</h3>
                      <p className="text-sm text-gray-500">123 Restaurant Row</p>
                      <p className="text-sm text-gray-500">San Francisco, CA 94103</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border bg-white p-6 shadow-xs">
                <h3 className="mb-4 text-lg font-medium">Our Location</h3>
                <div className="aspect-video overflow-hidden rounded-lg">
                  <img
                    src="/placeholder.svg?height=300&width=600"
                    alt="Map location"
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            </div>
            <div>
              <form onSubmit={handleSubmit} className="rounded-xl border bg-white p-6 shadow-xs">
                <h2 className="text-2xl font-bold">Send us a message</h2>
                <p className="mt-2 text-gray-500">
                  Fill out the form below and we'll get back to you as soon as possible.
                </p>
                <div className="mt-6 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
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
                    <Label htmlFor="email">Email</Label>
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
                    <Label htmlFor="subject">Subject</Label>
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
                    <Label htmlFor="message">Message</Label>
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
                    className="w-full bg-linear-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                  >
                    Send Message
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </section>
      </main>
    </PageWrapper>
  )
}
