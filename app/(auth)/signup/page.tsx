"use client";

import type React from "react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ChefHat,
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  ArrowRight,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { PLATFORM_COMMISSION, SUBSCRIPTION } from "@/lib/constants";
import { signUp } from "@/lib/actions/auth";

export default function SignUpPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    // Clear password error when user types in either password field
    if (e.target.name === "password" || e.target.name === "confirmPassword") {
      setPasswordError("");
    }
  };

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setPasswordError("Passwords do not match");
      return false;
    }

    // Check password length
    if (formData.password.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return false;
    }

    // Check for lowercase letters
    if (!/[a-z]/.test(formData.password)) {
      setPasswordError("Password must contain at least one lowercase letter");
      return false;
    }

    // Check for uppercase letters
    if (!/[A-Z]/.test(formData.password)) {
      setPasswordError("Password must contain at least one uppercase letter");
      return false;
    }

    // Check for numbers
    if (!/\d/.test(formData.password)) {
      setPasswordError("Password must contain at least one number");
      return false;
    }

    // Check for special characters
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(formData.password)) {
      setPasswordError("Password must contain at least one special character");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validate form before proceeding
    if (!validateForm()) {
      toast.error("Invalid form", {
        description: passwordError,
      });
      return;
    }

    setIsLoading(true);

    const promise = new Promise(async (resolve, reject) => {
      try {
        const formElement = e.currentTarget;
        const formData = new FormData(formElement);

        // Set the full name
        const fullName = formData.get("fullName");
        formData.set("full_name", fullName as string);

        console.log("Submitting signup form with data:", {
          email: formData.get("email"),
          fullName: formData.get("fullName"),
          full_name: formData.get("full_name"),
        });

        const result = await signUp(formData);

        if (result.error) {
          reject(new Error(result.error));
          return;
        }

        // Store the session data
        if (result.session) {
          const supabase = createClient();
          await supabase.auth.setSession(result.session);

          // Store tokens in localStorage for verification page
          localStorage.setItem("sb-access-token", result.session.access_token);
          localStorage.setItem(
            "sb-refresh-token",
            result.session.refresh_token
          );
        }

        resolve(result);
      } catch (error) {
        console.error("Signup error:", error);
        reject(new Error("An unexpected error occurred"));
      }
    });

    toast.promise(promise, {
      loading: "Creating your account...",
      success: () => {
        router.push("/verify-email");
        return "Account created successfully! Check your email to verify your account.";
      },
      error: (err: Error) => err.message,
    });

    try {
      await promise;
    } finally {
      setIsLoading(false);
    }
  };

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
            <h1 className="text-3xl font-bold mb-2">Create your account</h1>
            <p className="text-gray-500">
              Start your {SUBSCRIPTION.TRIAL_DAYS}-day free trial and transform
              your restaurant operations
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-sm font-medium">
                Full Name
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="fullName"
                  name="fullName"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  className="h-12 pl-10 border-gray-200 focus-visible:ring-green-500"
                />
              </div>
            </div>

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
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="h-12 pl-10 border-gray-200 focus-visible:ring-green-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a secure password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="h-12 pl-10 pr-10 border-gray-200 focus-visible:ring-green-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              <div className="text-sm space-y-2 mt-2">
                <p className="text-gray-500">Password must contain:</p>
                <ul className="space-y-1 text-sm">
                  <li
                    className={`flex items-center gap-2 ${
                      formData.password.length >= 8
                        ? "text-green-600"
                        : "text-gray-500"
                    }`}
                  >
                    <Check className="h-4 w-4" />
                    At least 8 characters
                  </li>
                  <li
                    className={`flex items-center gap-2 ${
                      /[a-z]/.test(formData.password)
                        ? "text-green-600"
                        : "text-gray-500"
                    }`}
                  >
                    <Check className="h-4 w-4" />
                    One lowercase letter
                  </li>
                  <li
                    className={`flex items-center gap-2 ${
                      /[A-Z]/.test(formData.password)
                        ? "text-green-600"
                        : "text-gray-500"
                    }`}
                  >
                    <Check className="h-4 w-4" />
                    One uppercase letter
                  </li>
                  <li
                    className={`flex items-center gap-2 ${
                      /\d/.test(formData.password)
                        ? "text-green-600"
                        : "text-gray-500"
                    }`}
                  >
                    <Check className="h-4 w-4" />
                    One number
                  </li>
                  <li
                    className={`flex items-center gap-2 ${
                      /[!@#$%^&*(),.?":{}|<>]/.test(formData.password)
                        ? "text-green-600"
                        : "text-gray-500"
                    }`}
                  >
                    <Check className="h-4 w-4" />
                    One special character (!@#$%^&*(),.?":{}|&lt;&gt;)
                  </li>
                </ul>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium">
                Confirm Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="h-12 pl-10 pr-10 border-gray-200 focus-visible:ring-green-500"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {passwordError && (
                <p className="text-sm text-red-500 mt-1">{passwordError}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium transition-all duration-200"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Creating Account...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  Create Account
                  <ArrowRight className="h-4 w-4" />
                </div>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-medium text-green-600 hover:text-green-700 hover:underline transition-colors"
              >
                Sign In
              </Link>
            </p>
          </div>

          <div className="mt-8 text-center pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              By signing up, you agree to our{" "}
              <Link
                href="/terms"
                className="hover:text-green-600 transition-colors"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy"
                className="hover:text-green-600 transition-colors"
              >
                Privacy Policy
              </Link>
            </p>
          </div>
        </motion.div>
      </div>

      {/* Right side - Image */}
      <div className="hidden md:block md:w-1/2 bg-green-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#e0f2e9_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
        <div className="absolute -top-40 right-0 h-[500px] w-[500px] rounded-full bg-green-200/20 blur-3xl" />

        <div className="relative h-full flex flex-col items-center justify-center p-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="max-w-md"
          >
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 mb-8">
              <img
                src="/placeholder.svg?height=300&width=400"
                alt="DineEasy Platform"
                className="w-full h-auto rounded-lg"
              />
            </div>

            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Transform Your Restaurant Operations
            </h2>
            <p className="text-gray-600 mb-6">
              Join over 1,000 restaurants using DineEasy to streamline ordering,
              increase efficiency, and delight customers with QR-based digital
              menus.
            </p>

            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center">
                  <Check className="h-4 w-4 text-green-600" />
                </div>
                <span className="text-sm">
                  {SUBSCRIPTION.TRIAL_DAYS}-day free trial
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center">
                  <Check className="h-4 w-4 text-green-600" />
                </div>
                <span className="text-sm">No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center">
                  <Check className="h-4 w-4 text-green-600" />
                </div>
                <span className="text-sm">
                  Only {PLATFORM_COMMISSION * 100}% commission
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
