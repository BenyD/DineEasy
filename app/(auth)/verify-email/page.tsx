"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail } from "lucide-react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [verificationStatus, setVerificationStatus] = useState<
    "pending" | "success" | "error"
  >("pending");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        // No token - just show the waiting screen
        return;
      }

      try {
        const supabase = createClient();

        // First try to get the session
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          console.log("No session found, attempting to recover from URL");
          // If no session, check if we have a hash in the URL (Supabase adds this on redirects)
          const hashParams = new URLSearchParams(
            window.location.hash.substring(1)
          );
          const access_token = hashParams.get("access_token");
          const refresh_token = hashParams.get("refresh_token");

          if (access_token && refresh_token) {
            // Try to set the session from the URL parameters
            const { error: sessionError } = await supabase.auth.setSession({
              access_token,
              refresh_token,
            });

            if (sessionError) {
              console.error("Error setting session:", sessionError);
              setVerificationStatus("error");
              setError("Session expired. Please try signing up again.");
              return;
            }
          }
        }

        // Get the current user
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          console.error("User error:", userError);
          setVerificationStatus("error");
          setError("Session expired. Please try signing up again.");
          return;
        }

        console.log("User metadata:", user.user_metadata);

        // Verify the token matches and hasn't expired
        const storedToken = user.user_metadata?.verification_token;
        const expiresAt = user.user_metadata?.verification_token_expires_at;

        if (!storedToken || !expiresAt) {
          console.error("No verification token found in metadata");
          setVerificationStatus("error");
          setError("Invalid verification link. Please try signing up again.");
          return;
        }

        if (storedToken !== token) {
          console.error("Token mismatch");
          setVerificationStatus("error");
          setError("Invalid verification token. Please try signing up again.");
          return;
        }

        if (new Date(expiresAt) < new Date()) {
          console.error("Token expired");
          setVerificationStatus("error");
          setError(
            "Verification link has expired. Please try signing up again."
          );
          return;
        }

        // Update user metadata to mark as verified
        const { error: updateError } = await supabase.auth.updateUser({
          data: {
            email_verified: true,
            verification_token: null,
            verification_token_expires_at: null,
          },
        });

        if (updateError) {
          console.error("Update error:", updateError);
          setVerificationStatus("error");
          setError("Error verifying email. Please try again.");
          return;
        }

        setVerificationStatus("success");

        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          router.push("/dashboard");
        }, 2000);
      } catch (error) {
        console.error("Error during email verification:", error);
        setVerificationStatus("error");
        setError("An unexpected error occurred. Please try again.");
      }
    };

    verifyEmail();
  }, [token, router]);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md w-full text-center space-y-6"
      >
        <div className="flex justify-center">
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
              Your email has been verified successfully. Redirecting you to the
              dashboard...
            </p>
          </>
        )}

        {verificationStatus === "error" && (
          <>
            <h1 className="text-2xl font-bold text-red-600">
              Verification failed
            </h1>
            <p className="text-gray-500">{error}</p>
            <Button onClick={() => router.push("/signup")} className="mt-4">
              Back to Sign Up
            </Button>
          </>
        )}
      </motion.div>
    </div>
  );
}
