"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { ChefHat, Mail, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))

    setIsLoading(false)
    setIsSubmitted(true)
  }

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row">
      {/* Left side - Form */}
      <div className="w-full md:w-1/2 flex flex-col justify-center p-4 sm:p-8 md:p-12 lg:p-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-md mx-auto w-full"
        >
          <div className="flex items-center gap-2 mb-8">
            <ChefHat className="h-8 w-8 text-green-600" />
            <span className="text-2xl font-bold">DineEasy</span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Reset your password</h1>
            <p className="text-gray-500">Enter your email address and we'll send you a link to reset your password</p>
          </div>

          {isSubmitted ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <Alert className="bg-green-50 border-green-200 mb-6">
                <AlertDescription className="text-green-800">
                  If an account exists with {email}, we've sent a password reset link to this email address.
                </AlertDescription>
              </Alert>

              <div className="text-center">
                <p className="text-sm text-gray-500 mb-6">
                  Didn't receive an email? Check your spam folder or try again.
                </p>

                <Button variant="outline" className="w-full h-12" onClick={() => setIsSubmitted(false)}>
                  Try again
                </Button>

                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 mt-4 text-sm text-green-600 hover:text-green-700 hover:underline"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to sign in
                </Link>
              </div>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={handleChange}
                    required
                    className="h-12 pl-10 border-gray-200 focus-visible:ring-green-500"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-linear-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium transition-all duration-200"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Sending Reset Link...
                  </div>
                ) : (
                  "Send Reset Link"
                )}
              </Button>

              <div className="text-center pt-4">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-sm text-green-600 hover:text-green-700 hover:underline"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to sign in
                </Link>
              </div>
            </form>
          )}

          <div className="mt-8 text-center pt-6 border-t border-gray-100">
            <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
              <Link href="/help" className="hover:text-green-600 transition-colors">
                Need Help?
              </Link>
              <span>•</span>
              <Link href="/contact" className="hover:text-green-600 transition-colors">
                Contact Support
              </Link>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Right side - Image */}
      <div className="hidden md:block md:w-1/2 bg-green-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#e0f2e9_1px,transparent_1px)] bg-size-[16px_16px] mask-[radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
        <div className="absolute -top-40 right-0 h-[500px] w-[500px] rounded-full bg-green-200/20 blur-3xl" />

        <div className="relative h-full flex flex-col items-center justify-center p-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="max-w-md"
          >
            <div className="bg-white/80 backdrop-blur-xs rounded-2xl shadow-xl p-8 mb-8">
              <img
                src="/placeholder.svg?height=300&width=400"
                alt="Password Reset"
                className="w-full h-auto rounded-lg"
              />
            </div>

            <h2 className="text-2xl font-bold text-gray-800 mb-4">Account Security</h2>
            <p className="text-gray-600 mb-6">
              We take your account security seriously. After resetting your password, you'll regain access to your
              restaurant dashboard and all your data.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
