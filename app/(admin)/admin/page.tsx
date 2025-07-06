"use client"

import { AdminBreadcrumbHeader } from "@/components/admin/admin-breadcrumb-header"
import { StatCard } from "@/components/admin/StatCard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

// Mock data for the chart
const signupData = [
  { day: "Mon", signups: 12 },
  { day: "Tue", signups: 19 },
  { day: "Wed", signups: 8 },
  { day: "Thu", signups: 15 },
  { day: "Fri", signups: 22 },
  { day: "Sat", signups: 18 },
  { day: "Sun", signups: 14 },
]

// Mock data for trial expirations
const trialExpirations = [
  { restaurant: "Bella Vista", owner: "Marco Rossi", expiresIn: "2 days", plan: "Pro" },
  { restaurant: "Sushi Zen", owner: "Yuki Tanaka", expiresIn: "5 days", plan: "Premium" },
  { restaurant: "The Burger Joint", owner: "Mike Johnson", expiresIn: "1 week", plan: "Pro" },
  { restaurant: "Café Luna", owner: "Sofia Garcia", expiresIn: "1 week", plan: "Basic" },
]

export default function AdminDashboard() {
  return (
    <>
      <AdminBreadcrumbHeader items={[{ label: "Admin", href: "/admin" }, { label: "Dashboard" }]} />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Restaurants"
            value="1,247"
            change="+12%"
            trend="up"
            description="Active restaurants on platform"
          />
          <StatCard
            title="Monthly Revenue"
            value="$89,432"
            change="+8.2%"
            trend="up"
            description="Total subscription revenue"
          />
          <StatCard
            title="Active Trials"
            value="156"
            change="-3%"
            trend="down"
            description="Currently in trial period"
          />
          <StatCard title="Support Tickets" value="23" change="+15%" trend="up" description="Open support requests" />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>New Signups (Last 7 Days)</CardTitle>
              <CardDescription>Daily restaurant registrations</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={signupData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="signups" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Upcoming Trial Expirations</CardTitle>
              <CardDescription>Restaurants with trials ending soon</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Restaurant</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Expires</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trialExpirations.map((trial, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{trial.restaurant}</div>
                          <div className="text-sm text-muted-foreground">{trial.owner}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{trial.plan}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{trial.expiresIn}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
