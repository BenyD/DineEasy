"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChefHat, Eye, EyeOff, Lock, ArrowLeft, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [isTokenValid, setIsTokenValid] = useState(false);

  useEffect(() => {
    // Check if we have the necessary parameters from the reset link
    const hasParams = searchParams.has("code") && searchParams.has("type");
    setIsTokenValid(hasParams);

    if (!hasParams) {
      toast.error("Invalid or expired reset link");
    }
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    // Clear password error when user types
    if (e.target.name === "password" || e.target.name === "confirmPassword") {
      setPasswordError("");
    }
  };

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setPasswordError("Passwords do not match");
      return false;
    }
    if (formData.password.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: formData.password,
      });

      if (error) {
        throw error;
      }

      toast.success("Password updated successfully!");
      router.push("/login");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to update password");
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
            <h1 className="text-3xl font-bold mb-2">Create new password</h1>
            <p className="text-gray-500">
              Enter your new password below to regain access to your account
            </p>
          </div>

          {!isTokenValid ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Alert className="bg-red-50 border-red-200 mb-6">
                <AlertDescription className="text-red-800">
                  This password reset link is invalid or has expired. Please
                  request a new password reset link.
                </AlertDescription>
              </Alert>

              <div className="text-center">
                <Link
                  href="/forgot-password"
                  className="inline-flex items-center gap-2 text-sm text-green-600 hover:text-green-700 hover:underline"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Request new reset link
                </Link>
              </div>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  New Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your new password"
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
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="confirmPassword"
                  className="text-sm font-medium"
                >
                  Confirm New Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your new password"
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
                    Updating Password...
                  </div>
                ) : (
                  "Update Password"
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
              <Link
                href="/help"
                className="hover:text-green-600 transition-colors"
              >
                Need Help?
              </Link>
              <span>•</span>
              <Link
                href="/contact"
                className="hover:text-green-600 transition-colors"
              >
                Contact Support
              </Link>
            </div>
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
                alt="Password Security"
                className="w-full h-auto rounded-lg"
              />
            </div>

            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Strong Password, Strong Security
            </h2>
            <p className="text-gray-600 mb-6">
              Choose a strong password that you haven't used before. A
              combination of letters, numbers, and symbols makes your account
              more secure.
            </p>

            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center">
                  <Shield className="h-4 w-4 text-green-600" />
                </div>
                <span className="text-sm">Minimum 8 characters</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center">
                  <Shield className="h-4 w-4 text-green-600" />
                </div>
                <span className="text-sm">Mix of characters</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center">
                  <Shield className="h-4 w-4 text-green-600" />
                </div>
                <span className="text-sm">Unique password</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
