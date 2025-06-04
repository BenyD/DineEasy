import type { Metadata } from "next"
import {
  Search,
  MessageCircle,
  Phone,
  Mail,
  FileText,
  Video,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  BookOpen,
  Headphones,
  Zap,
  Shield,
  Globe,
  ArrowRight,
  ExternalLink,
  Star,
  Send,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { BreadcrumbHeader } from "@/components/dashboard/breadcrumb-header"

export const metadata: Metadata = {
  title: "Help & Support | DineEasy Dashboard",
  description: "Get help and support for your DineEasy restaurant management platform",
}

// Mock data for support content
const supportStats = [
  {
    label: "Average Response Time",
    value: "< 2 hours",
    icon: Clock,
    description: "For Pro and Elite plans",
  },
  {
    label: "Customer Satisfaction",
    value: "98.5%",
    icon: Star,
    description: "Based on recent surveys",
  },
  {
    label: "Articles in Knowledge Base",
    value: "150+",
    icon: BookOpen,
    description: "Comprehensive guides",
  },
  {
    label: "System Uptime",
    value: "99.9%",
    icon: CheckCircle,
    description: "Last 30 days",
  },
]

const contactMethods = [
  {
    title: "Live Chat",
    description: "Get instant help from our support team",
    icon: MessageCircle,
    availability: "24/7 for Elite, 9AM-6PM for Pro",
    action: "Start Chat",
    primary: true,
  },
  {
    title: "Email Support",
    description: "Send us a detailed message",
    icon: Mail,
    availability: "Response within 24 hours",
    action: "Send Email",
    email: "support@dineeasy.com",
  },
  {
    title: "Phone Support",
    description: "Speak directly with our experts",
    icon: Phone,
    availability: "Mon-Fri 9AM-6PM EST",
    action: "Call Now",
    phone: "+1 (555) 123-4567",
  },
  {
    title: "Video Call",
    description: "Screen sharing and personalized help",
    icon: Video,
    availability: "By appointment (Pro & Elite)",
    action: "Schedule Call",
  },
]

const quickLinks = [
  {
    title: "Getting Started Guide",
    description: "Complete setup walkthrough for new restaurants",
    icon: Zap,
    category: "Setup",
    readTime: "10 min",
  },
  {
    title: "Menu Management",
    description: "How to add, edit, and organize your menu items",
    icon: FileText,
    category: "Menu",
    readTime: "5 min",
  },
  {
    title: "QR Code Setup",
    description: "Generate and customize QR codes for your tables",
    icon: Globe,
    category: "QR Codes",
    readTime: "3 min",
  },
  {
    title: "Payment Processing",
    description: "Configure Stripe and other payment methods",
    icon: Shield,
    category: "Payments",
    readTime: "8 min",
  },
  {
    title: "Staff Management",
    description: "Add team members and manage permissions",
    icon: Users,
    category: "Staff",
    readTime: "6 min",
  },
  {
    title: "Kitchen Display",
    description: "Set up and optimize your kitchen workflow",
    icon: Headphones,
    category: "Kitchen",
    readTime: "7 min",
  },
]

const faqData = [
  {
    question: "How do I add new menu items?",
    answer:
      "Navigate to Dashboard > Menu, then click 'Add Menu Item'. Fill in the item details including name, description, price, and category. You can also upload an image and set dietary restrictions.",
  },
  {
    question: "Can customers pay directly through the QR menu?",
    answer:
      "Yes! Customers can scan the QR code, browse your menu, add items to cart, and pay directly using Stripe. They'll receive an order confirmation and you'll get notified in your dashboard.",
  },
  {
    question: "How do I generate QR codes for my tables?",
    answer:
      "Go to Dashboard > Tables & QR, click 'Add Table', enter the table number and capacity. The system will automatically generate a unique QR code that you can download and print.",
  },
  {
    question: "What payment methods are supported?",
    answer:
      "We support all major credit cards, debit cards, Apple Pay, Google Pay, and TWINT through Stripe. You can also accept cash orders and mark them as paid in the dashboard.",
  },
  {
    question: "Can I customize the QR menu appearance?",
    answer:
      "Yes! You can customize colors, add your logo, set menu categories, and control which items are visible. The menu automatically adapts to your restaurant's branding.",
  },
  {
    question: "How do I manage staff permissions?",
    answer:
      "In Dashboard > Staff, you can add team members and assign specific roles (Manager, Chef, Server, etc.) with granular permissions for different areas of the platform.",
  },
  {
    question: "Is there a mobile app for staff?",
    answer:
      "The dashboard is fully responsive and works great on mobile devices. We're also developing dedicated mobile apps for iOS and Android (coming Q2 2024).",
  },
  {
    question: "How do I handle refunds?",
    answer:
      "Go to Dashboard > Orders > History, find the order, and click 'Process Refund'. For Stripe payments, refunds are processed automatically. For cash orders, mark them as refunded manually.",
  },
]

const videoTutorials = [
  {
    title: "Complete Setup Walkthrough",
    duration: "12:34",
    views: "2.1K",
    thumbnail: "/placeholder.svg?height=120&width=200&text=Setup+Tutorial",
  },
  {
    title: "Menu Management Best Practices",
    duration: "8:45",
    views: "1.8K",
    thumbnail: "/placeholder.svg?height=120&width=200&text=Menu+Tutorial",
  },
  {
    title: "QR Code Generation & Printing",
    duration: "6:12",
    views: "1.5K",
    thumbnail: "/placeholder.svg?height=120&width=200&text=QR+Tutorial",
  },
  {
    title: "Kitchen Display Optimization",
    duration: "10:23",
    views: "1.2K",
    thumbnail: "/placeholder.svg?height=120&width=200&text=Kitchen+Tutorial",
  },
]

export default function HelpSupportPage() {
  return (
    <div className="flex-1 space-y-6 p-6">
      <BreadcrumbHeader
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Help & Support", href: "/dashboard/help" },
        ]}
      />

      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2">How can we help you today?</h1>
          <p className="text-blue-100 mb-6 max-w-2xl">
            Get instant answers, browse our knowledge base, or contact our support team. We're here to help you succeed
            with DineEasy.
          </p>

          {/* Search Bar */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search for help articles..."
              className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-blue-200"
            />
          </div>
        </div>

        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24" />
      </div>

      {/* Support Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {supportStats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <stat.icon className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="contact" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="contact">Contact Support</TabsTrigger>
          <TabsTrigger value="faq">FAQ</TabsTrigger>
          <TabsTrigger value="guides">Guides</TabsTrigger>
          <TabsTrigger value="videos">Video Tutorials</TabsTrigger>
          <TabsTrigger value="ticket">Submit Ticket</TabsTrigger>
        </TabsList>

        {/* Contact Support Tab */}
        <TabsContent value="contact" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {contactMethods.map((method, index) => (
              <Card key={index} className={method.primary ? "ring-2 ring-green-500" : ""}>
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${method.primary ? "bg-green-100" : "bg-gray-100"}`}>
                      <method.icon className={`w-5 h-5 ${method.primary ? "text-green-600" : "text-gray-600"}`} />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{method.title}</CardTitle>
                      {method.primary && <Badge className="ml-2">Recommended</Badge>}
                    </div>
                  </div>
                  <CardDescription>{method.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">{method.availability}</p>
                  {method.email && (
                    <p className="text-sm mb-4">
                      <Mail className="w-4 h-4 inline mr-2" />
                      {method.email}
                    </p>
                  )}
                  {method.phone && (
                    <p className="text-sm mb-4">
                      <Phone className="w-4 h-4 inline mr-2" />
                      {method.phone}
                    </p>
                  )}
                  <Button
                    className={method.primary ? "w-full" : "w-full"}
                    variant={method.primary ? "default" : "outline"}
                  >
                    {method.action}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* FAQ Tab */}
        <TabsContent value="faq" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
              <CardDescription>Find quick answers to the most common questions about DineEasy</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {faqData.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Guides Tab */}
        <TabsContent value="guides" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quickLinks.map((link, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <link.icon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-base">{link.title}</CardTitle>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {link.category}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{link.readTime}</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-4">{link.description}</CardDescription>
                  <Button variant="outline" size="sm" className="w-full">
                    Read Guide
                    <ExternalLink className="w-3 h-3 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Video Tutorials Tab */}
        <TabsContent value="videos" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {videoTutorials.map((video, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer">
                <div className="relative">
                  <img
                    src={video.thumbnail || "/placeholder.svg"}
                    alt={video.title}
                    className="w-full h-32 object-cover rounded-t-lg"
                  />
                  <div className="absolute inset-0 bg-black/20 rounded-t-lg flex items-center justify-center">
                    <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center">
                      <Video className="w-6 h-6 text-gray-700" />
                    </div>
                  </div>
                  <Badge className="absolute top-2 right-2 bg-black/70 text-white">{video.duration}</Badge>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2">{video.title}</h3>
                  <p className="text-sm text-muted-foreground">{video.views} views</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Submit Ticket Tab */}
        <TabsContent value="ticket" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Submit a Support Ticket</CardTitle>
              <CardDescription>
                Can't find what you're looking for? Send us a detailed message and we'll get back to you soon.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input id="subject" placeholder="Brief description of your issue" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low - General question</SelectItem>
                      <SelectItem value="medium">Medium - Feature request</SelectItem>
                      <SelectItem value="high">High - Issue affecting operations</SelectItem>
                      <SelectItem value="urgent">Urgent - System down</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technical">Technical Issue</SelectItem>
                    <SelectItem value="billing">Billing & Payments</SelectItem>
                    <SelectItem value="feature">Feature Request</SelectItem>
                    <SelectItem value="setup">Setup & Configuration</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Please provide as much detail as possible about your issue or question..."
                  className="min-h-[120px]"
                />
              </div>

              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <p className="text-sm text-muted-foreground">
                  For urgent issues, please use live chat or call our support line directly.
                </p>
              </div>

              <Button className="w-full">
                <Send className="w-4 h-4 mr-2" />
                Submit Ticket
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Additional Resources */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Resources</CardTitle>
          <CardDescription>More ways to get help and stay updated</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <Globe className="w-6 h-6" />
              <span className="font-medium">System Status</span>
              <span className="text-xs text-muted-foreground">Check service health</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <Users className="w-6 h-6" />
              <span className="font-medium">Community Forum</span>
              <span className="text-xs text-muted-foreground">Connect with other users</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <BookOpen className="w-6 h-6" />
              <span className="font-medium">API Documentation</span>
              <span className="text-xs text-muted-foreground">For developers</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
