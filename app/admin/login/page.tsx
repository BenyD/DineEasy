import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, Lock, ShieldAlert } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"

export const metadata: Metadata = {
  title: "Admin Login | DineEasy",
  description: "Login to the DineEasy admin dashboard",
}

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-muted/50 to-muted p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="rounded-full bg-primary/10 p-3">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">Admin Access</h1>
          <p className="text-muted-foreground">Secure login for DineEasy platform administrators</p>
        </div>

        <Card className="w-full">
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>Enter your credentials to access the admin dashboard</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" placeholder="admin@dineeasy.com" type="email" autoComplete="email" required />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="#" className="text-sm font-medium text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <Input id="password" type="password" placeholder="••••••••" autoComplete="current-password" required />
            </div>

            {/* Example error state - normally would be conditionally rendered */}
            <Alert variant="destructive" className="hidden">
              <ShieldAlert className="h-4 w-4" />
              <AlertDescription>Invalid email or password. Please try again.</AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Button className="w-full" size="lg" asChild>
              <Link href="/admin">
                Login to Admin Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <div className="text-center text-sm text-muted-foreground">
          <p>Protected area. Unauthorized access is prohibited.</p>
          <Link href="/" className="text-primary hover:underline mt-2 inline-block">
            Return to DineEasy Homepage
          </Link>
        </div>
      </div>

      <div className="fixed bottom-4 left-4 flex items-center gap-2 text-sm text-muted-foreground">
        <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
        <span>DineEasy Admin v1.0</span>
      </div>
    </div>
  )
}
