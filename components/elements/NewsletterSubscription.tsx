"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { subscribeToNewsletter } from "@/lib/actions/newsletter";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";

interface NewsletterSubscriptionProps {
  variant?: "default" | "compact";
  className?: string;
  placeholder?: string;
  buttonText?: string;
  successMessage?: string;
  errorMessage?: string;
}

export function NewsletterSubscription({
  variant = "default",
  className = "",
  placeholder = "Enter your email",
  buttonText = "Subscribe",
  successMessage = "Successfully subscribed to newsletter!",
  errorMessage = "Failed to subscribe. Please try again.",
}: NewsletterSubscriptionProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes("@")) {
      setStatus("error");
      setMessage("Please enter a valid email address.");
      return;
    }

    setIsLoading(true);
    setStatus("idle");

    try {
      const result = await subscribeToNewsletter({
        email: email.trim(),
        source: "website",
      });

      if (result.success) {
        setStatus("success");
        setMessage(result.message);
        setEmail("");
      } else {
        setStatus("error");
        setMessage(result.message);
      }
    } catch (error) {
      setStatus("error");
      setMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const isCompact = variant === "compact";

  return (
    <div className={className}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div
          className={`flex ${isCompact ? "flex-col gap-2" : "flex-col gap-3 sm:flex-row"}`}
        >
          <Input
            type="email"
            placeholder={placeholder}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            className={`${isCompact ? "w-full" : "w-full sm:flex-1"}`}
            required
          />
          <Button
            type="submit"
            disabled={isLoading || !email}
            className={`bg-green-600 hover:bg-green-700 ${
              isCompact ? "w-full" : "w-full sm:w-auto"
            }`}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {buttonText}
          </Button>
        </div>

        {/* Status Messages */}
        {status === "success" && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span>{message}</span>
          </div>
        )}

        {status === "error" && (
          <div className="flex items-center gap-2 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span>{message}</span>
          </div>
        )}
      </form>
    </div>
  );
}
