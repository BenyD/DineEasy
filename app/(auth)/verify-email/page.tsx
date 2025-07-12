"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, RotateCw } from "lucide-react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/Logo";
import {
  resendVerificationEmail,
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

export default function VerifyEmailPage() {
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
          setError(`Verification failed: ${verifyError.message}`);
          return;
        }

        const response = data as VerificationResponse;

        if (!response?.success) {
          console.error("Verification failed:", response);
          setVerificationStatus("error");
          setError(
            response?.error || "Failed to verify email. Please try again."
          );
          setDebugInfo(response?.debug);
          return;
        }

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

        // Get onboarding status and redirect accordingly
        const onboardingStatus = await getOnboardingStatus(supabase);
        setVerificationStatus("success");
        setTimeout(() => {
          redirectToOnboardingStep(onboardingStatus.step, router);
        }, 2000);
      } catch (error) {
        console.error("Error during email verification:", error);
        setVerificationStatus("error");
        setError("An unexpected error occurred. Please try again.");
      }
    };

    verifyEmail();
  }, [token, router]);

  const handleResendEmail = async () => {
    if (!email) {
      toast.error("No email address found");
      return;
    }

    setIsResending(true);
    try {
      const result = await resendVerificationEmail(email);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(
          result.message || "Verification email resent successfully"
        );
      }
    } catch (error) {
      toast.error("Failed to resend verification email");
    } finally {
      setIsResending(false);
    }
  };

  const handleDebug = async () => {
    if (!email) {
      toast.error("No email address found");
      return;
    }

    try {
      const result = await debugEmailVerification(email);
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
              We sent you a verification link. Please check your email and click
              the link to verify your account.
            </p>
            <div className="flex flex-col items-center gap-4 mt-6">
              <p className="text-sm text-gray-500">
                Didn't receive the email? Check your spam folder or click below
                to resend.
              </p>
              <Button
                onClick={handleResendEmail}
                variant="outline"
                disabled={isResending}
                className="w-full max-w-xs"
              >
                {isResending ? (
                  <>
                    <RotateCw className="h-4 w-4 mr-2 animate-spin" />
                    Resending...
                  </>
                ) : (
                  "Resend Verification Email"
                )}
              </Button>
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
            <p className="text-gray-500">
              Your email has been verified successfully. Redirecting you...
            </p>
          </>
        )}

        {verificationStatus === "error" && (
          <>
            <h1 className="text-2xl font-bold text-red-600">
              Verification failed
            </h1>
            <p className="text-gray-500">{error}</p>

            {/* Debug information */}
            {debugInfo && (
              <div className="bg-gray-100 p-4 rounded-lg text-left text-sm">
                <h3 className="font-semibold mb-2">Debug Information:</h3>
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </div>
            )}

            <div className="flex flex-col items-center gap-4 mt-6">
              <Button
                onClick={() => window.location.reload()}
                variant="ghost"
                size="sm"
                className="text-green-600 hover:text-green-700 hover:bg-green-50"
              >
                <RotateCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              {email && (
                <>
                  <Button
                    onClick={handleResendEmail}
                    variant="outline"
                    disabled={isResending}
                    className="w-full max-w-xs"
                  >
                    {isResending ? (
                      <>
                        <RotateCw className="h-4 w-4 mr-2 animate-spin" />
                        Resending...
                      </>
                    ) : (
                      "Resend Verification Email"
                    )}
                  </Button>
                  <Button
                    onClick={handleDebug}
                    variant="ghost"
                    size="sm"
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  >
                    Debug Info
                  </Button>
                </>
              )}
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
