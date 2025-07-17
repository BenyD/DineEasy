"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { unsubscribeFromNewsletter } from "@/lib/actions/newsletter";
import { CheckCircle, AlertCircle, Loader2, Mail } from "lucide-react";

export function UnsubscribeForm() {
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
      const result = await unsubscribeFromNewsletter(email.trim());

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
      setMessage("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-center mb-6">
        <div className="bg-red-100 p-3 rounded-full">
          <Mail className="h-6 w-6 text-red-600" />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Email Address
          </label>
          <Input
            id="email"
            type="email"
            placeholder="Enter your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            required
            className="w-full"
          />
        </div>

        <Button
          type="submit"
          disabled={isLoading || !email}
          className="w-full bg-red-600 hover:bg-red-700"
        >
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Unsubscribe
        </Button>

        {/* Status Messages */}
        {status === "success" && (
          <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-md">
            <CheckCircle className="h-4 w-4" />
            <span>{message}</span>
          </div>
        )}

        {status === "error" && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-md">
            <AlertCircle className="h-4 w-4" />
            <span>{message}</span>
          </div>
        )}
      </form>

      <div className="mt-6 text-center">
        <p className="text-xs text-gray-500">
          By unsubscribing, you will no longer receive our newsletter with
          updates, features, and restaurant management tips.
        </p>
      </div>
    </div>
  );
}
