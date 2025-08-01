"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Eye, EyeOff, Lock, ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { resetPassword } from "@/lib/actions/auth";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/layout/Logo";

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
    const verifyResetToken = async () => {
      // Check if we have the necessary parameters from the reset link
      const token = searchParams.get("token");
      const email = searchParams.get("email");

      console.log("Reset password URL params:", { token, email });

      if (!token || !email) {
        console.log("Invalid URL parameters for password reset");
        setIsTokenValid(false);
        toast.error("Invalid or expired reset link");
        return;
      }

      try {
        // For custom tokens, we just need to validate the token format
        // The actual verification will be done in the server action
        if (!token || token.length < 10) {
          console.error("Invalid token format");
          setIsTokenValid(false);
          toast.error("Invalid reset token format");
          return;
        }

        console.log("Custom reset token format validated successfully");
        setIsTokenValid(true);
      } catch (error) {
        console.error("Error validating reset token:", error);
        setIsTokenValid(false);
        toast.error("Failed to validate reset link");
      }
    };

    verifyResetToken();
  }, [searchParams]);

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return "Password must be at least 8 characters";
    }
    if (!/[A-Z]/.test(password)) {
      return "Password must contain at least one uppercase letter";
    }
    if (!/[a-z]/.test(password)) {
      return "Password must contain at least one lowercase letter";
    }
    if (!/[0-9]/.test(password)) {
      return "Password must contain at least one number";
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return "Password must contain at least one special character";
    }
    return null;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Validate password as user types
    if (name === "password") {
      const error = validatePassword(value);
      setPasswordError(error || "");
    }

    // Check if passwords match when typing confirm password
    if (name === "confirmPassword" && value !== formData.password) {
      setPasswordError("Passwords do not match");
    } else if (name === "confirmPassword" && value === formData.password) {
      setPasswordError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Final password validation
      const passwordValidationError = validatePassword(formData.password);
      if (passwordValidationError) {
        setPasswordError(passwordValidationError);
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        setPasswordError("Passwords do not match");
        return;
      }

      // Get the token and email from URL params
      const token = searchParams.get("token");
      const email = searchParams.get("email");
      if (!token || !email) {
        toast.error("Invalid reset token");
        return;
      }

      // Create form data for server action
      const formDataToSend = new FormData();
      formDataToSend.append("password", formData.password);
      formDataToSend.append("confirmPassword", formData.confirmPassword);
      formDataToSend.append("token", token);
      formDataToSend.append("email", email);

      const result = await resetPassword(formDataToSend);

      if (result.error) {
        throw new Error(result.error);
      }

      toast.success(
        "Password updated successfully! Please sign in with your new password."
      );

      // Clear any existing sessions
      const supabase = createClient();
      await supabase.auth.signOut();

      // Redirect to login after a short delay
      setTimeout(() => {
        router.push("/login");
        router.refresh();
      }, 2000);
    } catch (error: any) {
      console.error("Password reset error:", error);
      toast.error(error.message || "Failed to update password");
    } finally {
      setIsLoading(false);
    }
  };

  // Rest of the component remains the same...
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
            <Logo />
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
                      One special character (!@#$%^&*(),.?&quot;:{}|&lt;&gt;)
                    </li>
                  </ul>
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
                disabled={isLoading || !!passwordError}
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
                alt="Password Reset"
                className="w-full h-auto rounded-lg"
              />
            </div>

            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Create a Strong Password
            </h2>
            <p className="text-gray-600 mb-6">
              Choose a strong, unique password that you haven&apos;t used
              elsewhere. This helps keep your account secure and protects your
              restaurant&apos;s data.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
