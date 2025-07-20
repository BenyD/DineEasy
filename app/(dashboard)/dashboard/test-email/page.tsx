"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/layout/Label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { testEmailSending } from "@/lib/email";
import { toast } from "sonner";

export default function TestEmailPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleTestEmail = async () => {
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const testResult = await testEmailSending(email);
      setResult(testResult);
      toast.success("Test email sent successfully!");
    } catch (error) {
      console.error("Test email failed:", error);
      setResult({
        error: error instanceof Error ? error.message : "Unknown error",
      });
      toast.error("Failed to send test email");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container max-w-2xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>🧪 Email System Test</CardTitle>
          <CardDescription>
            Test the email sending functionality to debug welcome email issues
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter email to test"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <Button
            onClick={handleTestEmail}
            disabled={isLoading || !email}
            className="w-full"
          >
            {isLoading ? "Sending Test Email..." : "Send Test Email"}
          </Button>

          {result && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium mb-2">Test Result:</h3>
              <pre className="text-sm overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-800 mb-2">
              Debug Information:
            </h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Check browser console for detailed logs</li>
              <li>• Verify RESEND_API_KEY is set in environment</li>
              <li>• Check if email domain is verified in Resend</li>
              <li>• Look for any error messages in the result above</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
