"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createStripeAccount } from "@/lib/actions/stripe-connect";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function ConnectPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function onSubmit() {
    setIsLoading(true);

    try {
      const result = await createStripeAccount();

      if (result.error) {
        toast.error(result.error);
        return;
      }

      if (result.accountLink) {
        window.location.href = result.accountLink;
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="container relative min-h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-1 lg:px-0">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[550px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Set up payments
          </h1>
          <p className="text-sm text-muted-foreground">
            Connect your restaurant with Stripe to accept payments from
            customers
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="grid gap-6"
        >
          <div className="space-y-4 rounded-lg border bg-card p-6">
            <h2 className="font-medium">Why connect with Stripe?</h2>
            <ul className="list-disc pl-4 space-y-2 text-sm text-muted-foreground">
              <li>Accept payments from customers through the QR code menu</li>
              <li>Get paid directly to your bank account</li>
              <li>Secure payment processing with fraud protection</li>
              <li>View detailed transaction reports</li>
              <li>Handle refunds and disputes easily</li>
            </ul>
          </div>

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => router.push("/select-plan")}
              disabled={isLoading}
            >
              Skip for Now
            </Button>
            <Button onClick={onSubmit} className="flex-1" disabled={isLoading}>
              {isLoading ? "Setting up..." : "Connect with Stripe"}
            </Button>
          </div>
        </motion.div>

        <p className="text-center text-sm text-gray-500">
          You can always set this up later from your dashboard settings
        </p>
      </div>
    </div>
  );
}
