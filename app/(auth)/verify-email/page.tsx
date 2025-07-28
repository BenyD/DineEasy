"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, RotateCw, Edit, X, Check } from "lucide-react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/layout/Logo";
import {
  resendVerificationEmail,
  updateEmailAndResendVerification,
  debugEmailVerification,
} from "@/lib/actions/auth";
import { getOnboardingStatus, redirectToOnboardingStep } from "@/lib/utils";
import { toast } from "sonner";

interface VerificationResponse {
  success: boolean;
  error?: string;
  debug?: {
    token_provided: string;
    token_found: boolean;
    token_count: number;
    expired_count: number;
    verified_count: number;
  };
  user_id?: string;
}

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Email verification error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="flex flex-col items-center gap-6">
              <Logo />
              <div className="rounded-full bg-red-100 p-3">
                <Mail className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-red-600">
              Something went wrong
            </h1>
            <p className="text-gray-500">
              We encountered an error while verifying your email. Please try
              again.
            </p>
            <Button onClick={() => window.location.reload()} className="w-full">
              Try Again
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function VerifyEmailPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");
  const [verificationStatus, setVerificationStatus] = useState<
    "pending" | "success" | "error"
  >("pending");
  const [error, setError] = useState<string>("");
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [isResending, setIsResending] = useState(false);
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [currentEmail, setCurrentEmail] = useState(email || "");
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [tempEmail, setTempEmail] = useState("");
  const [isPolling, setIsPolling] = useState(false);

  // Update currentEmail when email parameter changes
  useEffect(() => {
    if (email) {
      setCurrentEmail(email);
    }
  }, [email]);

  // Try to get email from user session if not in URL
  useEffect(() => {
    const getEmailFromSession = async () => {
      if (!email && !currentEmail) {
        try {
          const supabase = createClient();
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (user?.email) {
            setCurrentEmail(user.email);
          }
        } catch (error) {
          console.log("Could not get email from session");
        }
      }
    };

    getEmailFromSession();
  }, [email, currentEmail]);

  // Function to check verification status
  const checkVerificationStatus = async () => {
    try {
      const supabase = createClient();

      // Get current user session
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        return false;
      }

      // Check if email is verified using our custom verification system
      const { data: verificationStatus, error: statusError } =
        await supabase.rpc("is_email_verified", { p_user_id: user.id });

      if (statusError) {
        console.error("Error checking verification status:", statusError);
        return false;
      }

      return verificationStatus === true;
    } catch (error) {
      console.error("Error checking verification status:", error);
      return false;
    }
  };

  // Function to handle successful verification
  const handleSuccessfulVerification = async (isTokenVerification = false) => {
    try {
      const supabase = createClient();

      // Get the user session
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.error("Session error:", sessionError);
        setVerificationStatus("error");
        setError("Session error. Please try signing in again.");
        return;
      }

      if (!session) {
        // If no session, redirect to login
        setVerificationStatus("success");
        setTimeout(() => {
          router.push("/login");
        }, 2000);
        return;
      }

      // If this is a token verification (new tab), show "safe to close" message
      if (isTokenVerification) {
        setVerificationStatus("success");
        return; // Don't redirect, just show success message
      }

      // Get onboarding status and redirect accordingly (for polling-based verification)
      try {
        const onboardingStatus = await getOnboardingStatus(supabase);
        setVerificationStatus("success");
        setTimeout(() => {
          redirectToOnboardingStep(
            onboardingStatus.step,
            router,
            onboardingStatus.emailVerified
          );
        }, 2000);
      } catch (onboardingError) {
        console.error("Onboarding error:", onboardingError);
        setVerificationStatus("success");
        setTimeout(() => {
          router.push("/dashboard");
        }, 2000);
      }
    } catch (error) {
      console.error("Error handling successful verification:", error);
      setVerificationStatus("error");
      setError(
        "An unexpected error occurred. Please try again or contact support."
      );
    }
  };

  // Effect for immediate token verification
  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        // No token - just show the waiting screen
        return;
      }

      try {
        const supabase = createClient();

        console.log("Attempting to verify token:", token);

        // Call the verify_email function
        const { data, error: verifyError } = await supabase
          .rpc("verify_email", { p_token: token })
          .single();

        console.log("Verification response:", { data, error: verifyError });

        if (verifyError) {
          console.error("Verification error:", verifyError);
          setVerificationStatus("error");
          setError(
            "Email verification failed. The link may be invalid or expired."
          );
          return;
        }

        const response = data as VerificationResponse;

        if (!response?.success) {
          console.error("Verification failed:", response);
          setVerificationStatus("error");
          setError(
            response?.error ||
              "Email verification failed. Please try again or request a new verification link."
          );
          // Only show debug info in development
          if (process.env.NODE_ENV === "development") {
            setDebugInfo(response?.debug);
          }
          return;
        }

        // Handle successful verification
        await handleSuccessfulVerification(true);
      } catch (error) {
        console.error("Error during email verification:", error);
        setVerificationStatus("error");
        setError(
          "An unexpected error occurred. Please try again or contact support."
        );
      }
    };

    // Wrap the entire verification in a try-catch to prevent unhandled errors
    try {
      verifyEmail();
    } catch (error) {
      console.error("Critical error in email verification:", error);
      setVerificationStatus("error");
      setError(
        "A critical error occurred. Please refresh the page and try again."
      );
    }
  }, [token, router]);

  // Effect for polling verification status (when no token is present)
  useEffect(() => {
    if (token || verificationStatus !== "pending") {
      // Don't poll if we have a token or verification is already complete/error
      return;
    }

    let pollInterval: NodeJS.Timeout;

    const startPolling = () => {
      pollInterval = setInterval(async () => {
        const isVerified = await checkVerificationStatus();

        if (isVerified) {
          console.log("Email verification detected via polling");
          clearInterval(pollInterval);
          await handleSuccessfulVerification();
        }
      }, 3000); // Check every 3 seconds
    };

    // Start polling after a short delay
    const startDelay = setTimeout(() => {
      startPolling();
    }, 2000); // Start polling after 2 seconds

    // Cleanup function
    return () => {
      clearTimeout(startDelay);
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [token, verificationStatus, router]);

  const handleResendEmail = async () => {
    const emailToUse = currentEmail || tempEmail;

    if (!emailToUse) {
      // Show email input if no email is available
      setShowEmailInput(true);
      toast.error("Please enter your email address");
      return;
    }

    setIsResending(true);
    try {
      const result = await resendVerificationEmail(emailToUse);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(
          result.message || "Verification email resent successfully"
        );
        // Update current email if we used temp email
        if (!currentEmail && tempEmail) {
          setCurrentEmail(tempEmail);
          setTempEmail("");
          setShowEmailInput(false);
        }
      }
    } catch (error) {
      toast.error("Failed to resend verification email");
    } finally {
      setIsResending(false);
    }
  };

  const handleUpdateEmail = async () => {
    if (!newEmail.trim()) {
      toast.error("Please enter a new email address");
      return;
    }

    if (!currentEmail) {
      toast.error("No current email address found");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (newEmail === currentEmail) {
      toast.error("New email must be different from current email");
      return;
    }

    setIsUpdatingEmail(true);
    try {
      const result = await updateEmailAndResendVerification(
        currentEmail,
        newEmail
      );

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(result.message || "Email updated and verification sent");
        setCurrentEmail(newEmail);
        setNewEmail("");
        setShowEmailForm(false);
      }
    } catch (error) {
      toast.error("Failed to update email");
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  const handleDebug = async () => {
    if (!currentEmail) {
      toast.error("No email address found");
      return;
    }

    try {
      const result = await debugEmailVerification(currentEmail);
      console.log("Debug result:", result);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Debug info logged to console");
        console.log("Debug information:", result);
      }
    } catch (error) {
      toast.error("Debug failed");
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md w-full text-center space-y-6"
      >
        <div className="flex flex-col items-center gap-6">
          <Logo />
          <div className="rounded-full bg-green-100 p-3">
            <Mail className="h-6 w-6 text-green-600" />
          </div>
        </div>

        {verificationStatus === "pending" && !token && (
          <>
            <h1 className="text-2xl font-bold">Check your email</h1>
            <p className="text-gray-500">
              We sent you a verification link to{" "}
              <span className="font-medium text-gray-700">
                {currentEmail || "your email address"}
              </span>
              . Please check your email and click the link to verify your
              account.
            </p>

            {/* Active checking indicator */}
            <div className="flex items-center justify-center gap-2 text-sm text-blue-600">
              <RotateCw className="h-4 w-4 animate-spin" />
              <span>Checking for verification...</span>
            </div>

            <div className="flex flex-col items-center gap-4 mt-6">
              <p className="text-sm text-gray-500">
                Current email:{" "}
                <span className="font-medium">
                  {currentEmail || "Not available"}
                </span>
              </p>

              {/* Email Input for Missing Email */}
              {showEmailInput && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="w-full max-w-xs space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200"
                >
                  <div className="space-y-2">
                    <Label
                      htmlFor="tempEmail"
                      className="text-sm font-medium text-blue-900"
                    >
                      Enter your email address
                    </Label>
                    <Input
                      id="tempEmail"
                      type="email"
                      value={tempEmail}
                      onChange={(e) => setTempEmail(e.target.value)}
                      placeholder="Enter your email address"
                      className="h-10"
                      disabled={isResending}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleResendEmail}
                      disabled={isResending || !tempEmail.trim()}
                      size="sm"
                      className="flex-1"
                    >
                      {isResending ? (
                        <>
                          <RotateCw className="h-4 w-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Mail className="h-4 w-4 mr-2" />
                          Send Verification
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => {
                        setShowEmailInput(false);
                        setTempEmail("");
                      }}
                      variant="outline"
                      size="sm"
                      disabled={isResending}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Email Change Form */}
              {showEmailForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="w-full max-w-xs space-y-4 p-4 bg-gray-50 rounded-lg border"
                >
                  <div className="space-y-2">
                    <Label htmlFor="newEmail" className="text-sm font-medium">
                      New Email Address
                    </Label>
                    <Input
                      id="newEmail"
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="Enter new email address"
                      className="h-10"
                      disabled={isUpdatingEmail}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleUpdateEmail}
                      disabled={isUpdatingEmail || !newEmail.trim()}
                      size="sm"
                      className="flex-1"
                    >
                      {isUpdatingEmail ? (
                        <>
                          <RotateCw className="h-4 w-4 mr-2 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Update Email
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => {
                        setShowEmailForm(false);
                        setNewEmail("");
                      }}
                      variant="outline"
                      size="sm"
                      disabled={isUpdatingEmail}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 w-full max-w-xs">
                <Button
                  onClick={handleResendEmail}
                  variant="outline"
                  disabled={isResending}
                  className="w-full"
                >
                  {isResending ? (
                    <>
                      <RotateCw className="h-4 w-4 mr-2 animate-spin" />
                      Resending...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      {currentEmail
                        ? `Resend to ${currentEmail}`
                        : "Resend Verification Email"}
                    </>
                  )}
                </Button>

                <Button
                  onClick={() => setShowEmailForm(!showEmailForm)}
                  variant="ghost"
                  size="sm"
                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  {showEmailForm ? "Cancel" : "Change Email Address"}
                </Button>
              </div>
            </div>
          </>
        )}

        {verificationStatus === "pending" && token && (
          <>
            <h1 className="text-2xl font-bold">Verifying your email</h1>
            <p className="text-gray-500">
              Please wait while we verify your email address...
            </p>
          </>
        )}

        {verificationStatus === "success" && (
          <>
            <h1 className="text-2xl font-bold text-green-600">
              Email verified!
            </h1>
            {token ? (
              <div className="space-y-4">
                <p className="text-gray-500">
                  Your email has been verified successfully.
                </p>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800 font-medium">
                    ✅ You can safely close this tab
                  </p>
                  <p className="text-green-700 text-sm mt-1">
                    Return to your original tab to continue with the setup
                    process.
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">
                Your email has been verified successfully. Redirecting you...
              </p>
            )}
          </>
        )}

        {verificationStatus === "error" && (
          <>
            <h1 className="text-2xl font-bold text-red-600">
              Verification failed
            </h1>
            <p className="text-gray-500">{error}</p>

            {/* Debug information - only show in development */}
            {debugInfo && process.env.NODE_ENV === "development" && (
              <div className="bg-gray-100 p-4 rounded-lg text-left text-sm">
                <h3 className="font-semibold mb-2">Debug Information:</h3>
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </div>
            )}

            <div className="flex flex-col items-center gap-4 mt-6">
              <p className="text-sm text-gray-500">
                Current email:{" "}
                <span className="font-medium">
                  {currentEmail || "Not available"}
                </span>
              </p>

              {/* Email Input for Missing Email */}
              {showEmailInput && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="w-full max-w-xs space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200"
                >
                  <div className="space-y-2">
                    <Label
                      htmlFor="tempEmail"
                      className="text-sm font-medium text-blue-900"
                    >
                      Enter your email address
                    </Label>
                    <Input
                      id="tempEmail"
                      type="email"
                      value={tempEmail}
                      onChange={(e) => setTempEmail(e.target.value)}
                      placeholder="Enter your email address"
                      className="h-10"
                      disabled={isResending}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleResendEmail}
                      disabled={isResending || !tempEmail.trim()}
                      size="sm"
                      className="flex-1"
                    >
                      {isResending ? (
                        <>
                          <RotateCw className="h-4 w-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Mail className="h-4 w-4 mr-2" />
                          Send Verification
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => {
                        setShowEmailInput(false);
                        setTempEmail("");
                      }}
                      variant="outline"
                      size="sm"
                      disabled={isResending}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Email Change Form */}
              {showEmailForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="w-full max-w-xs space-y-4 p-4 bg-gray-50 rounded-lg border"
                >
                  <div className="space-y-2">
                    <Label htmlFor="newEmail" className="text-sm font-medium">
                      New Email Address
                    </Label>
                    <Input
                      id="newEmail"
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="Enter new email address"
                      className="h-10"
                      disabled={isUpdatingEmail}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleUpdateEmail}
                      disabled={isUpdatingEmail || !newEmail.trim()}
                      size="sm"
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    >
                      {isUpdatingEmail ? (
                        <>
                          <RotateCw className="h-4 w-4 mr-2 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Update Email
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => {
                        setShowEmailForm(false);
                        setNewEmail("");
                      }}
                      variant="outline"
                      size="sm"
                      disabled={isUpdatingEmail}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 w-full max-w-xs">
                <Button
                  onClick={() => window.location.reload()}
                  variant="ghost"
                  size="sm"
                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                >
                  <RotateCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>

                <Button
                  onClick={handleResendEmail}
                  variant="outline"
                  disabled={isResending}
                  className="w-full"
                >
                  {isResending ? (
                    <>
                      <RotateCw className="h-4 w-4 mr-2 animate-spin" />
                      Resending...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      {currentEmail
                        ? `Resend to ${currentEmail}`
                        : "Resend Verification Email"}
                    </>
                  )}
                </Button>

                <Button
                  onClick={() => setShowEmailForm(!showEmailForm)}
                  variant="ghost"
                  size="sm"
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  {showEmailForm ? "Cancel" : "Change Email Address"}
                </Button>

                {/* Debug button - only show in development */}
                {process.env.NODE_ENV === "development" && (
                  <Button
                    onClick={handleDebug}
                    variant="ghost"
                    size="sm"
                    className="text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                  >
                    Debug Info
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <ErrorBoundary>
      <VerifyEmailPageContent />
    </ErrorBoundary>
  );
}
