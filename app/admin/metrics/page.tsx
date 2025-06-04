"use client"

import { AdminBreadcrumbHeader } from "@/components/admin/admin-breadcrumb-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

const revenueData = [
  { month: "Jan", revenue: 45000 },
  { month: "Feb", revenue: 52000 },
  { month: "Mar", revenue: 48000 },
  { month: "Apr", revenue: 61000 },
  { month: "May", revenue: 55000 },
  { month: "Jun", revenue: 67000 },
]

const ordersData = [
  { day: "Mon", orders: 245 },
  { day: "Tue", orders: 189 },
  { day: "Wed", orders: 267 },
  { day: "Thu", orders: 198 },
  { day: "Fri", orders: 312 },
  { day: "Sat", orders: 398 },
  { day: "Sun", orders: 156 },
]

const paymentData = [
  { name: "Stripe", value: 65, color: "hsl(var(--chart-1))" },
  { name: "Cash", value: 25, color: "hsl(var(--chart-2))" },
  { name: "TWINT", value: 10, color: "hsl(var(--chart-3))" },
]

const ocrUsageData = [
  { week: "Week 1", usage: 1200 },
  { week: "Week 2", usage: 1450 },
  { week: "Week 3", usage: 1380 },
  { week: "Week 4", usage: 1620 },
]

export default function MetricsPage() {
  return (
    <>
      <AdminBreadcrumbHeader items={[{ label: "Admin", href: "/admin" }, { label: "Metrics" }]} />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold md:text-2xl">Platform Metrics</h1>
            <p className="text-sm text-muted-foreground">Real-time analytics and usage data</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Total Revenue */}
          <Card>
            <CardHeader>
              <CardTitle>Total Revenue</CardTitle>
              <p className="text-sm text-muted-foreground">Monthly revenue trends</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, "Revenue"]} />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Orders Per Day */}
          <Card>
            <CardHeader>
              <CardTitle>Orders Per Day</CardTitle>
              <p className="text-sm text-muted-foreground">Daily order volume</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={ordersData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="orders" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Payment Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Breakdown</CardTitle>
              <p className="text-sm text-muted-foreground">Payment method distribution</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={paymentData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}%`}
                  >
                    {paymentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value}%`, "Share"]} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* AI OCR Usage */}
          <Card>
            <CardHeader>
              <CardTitle>AI OCR Usage</CardTitle>
              <p className="text-sm text-muted-foreground">Weekly OCR processing volume</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={ocrUsageData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value.toLocaleString()}`, "Requests"]} />
                  <Line
                    type="monotone"
                    dataKey="usage"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Summary Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold">$328K</div>
              <div className="text-sm text-muted-foreground">Total Revenue (6 months)</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold">12,847</div>
              <div className="text-sm text-muted-foreground">Total Orders</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold">6,050</div>
              <div className="text-sm text-muted-foreground">OCR Requests (Month)</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold">98.5%</div>
              <div className="text-sm text-muted-foreground">Platform Uptime</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
