"use client"

import { use } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Building2,
  Mail,
  CreditCard,
  Calendar,
  ShoppingBag,
  Users,
  ChefHat,
  MapPin,
  RefreshCw,
  Flag,
  ArrowLeft,
} from "lucide-react"
import Link from "next/link"
import { AdminBreadcrumbHeader } from "@/components/admin/admin-breadcrumb-header"

// Mock data - in real app this would come from API
const restaurantData = {
  1: {
    id: 1,
    name: "Bella Vista Restaurant",
    email: "owner@bellavista.com",
    logo: "/placeholder.svg?height=80&width=80",
    address: "123 Main Street, Downtown, NY 10001",
    plan: "Pro",
    trialEndDate: "2024-02-15",
    stripeStatus: "Connected",
    signupDate: "2024-01-01",
    orderCount: 1247,
    menuItems: 45,
    tables: 12,
    staffUsers: 8,
    recentActivity: [
      { id: 1, timestamp: "2024-01-30 14:30", type: "Order", message: "New order #1247 received" },
      { id: 2, timestamp: "2024-01-30 12:15", type: "Menu", message: "Menu item 'Pasta Carbonara' updated" },
      { id: 3, timestamp: "2024-01-30 09:45", type: "Staff", message: "New staff member added: John Doe" },
      { id: 4, timestamp: "2024-01-29 18:20", type: "Payment", message: "Payment processed: $156.50" },
      { id: 5, timestamp: "2024-01-29 16:10", type: "System", message: "QR code regenerated for Table 5" },
    ],
  },
}

interface RestaurantDetailProps {
  params: Promise<{ id: string }>
}

export default function RestaurantDetail({ params }: RestaurantDetailProps) {
  const { id } = use(params)
  const restaurant = restaurantData[id as keyof typeof restaurantData]

  if (!restaurant) {
    return (
      <>
        <AdminBreadcrumbHeader
          items={[
            { label: "Admin", href: "/admin" },
            { label: "Restaurants", href: "/admin/restaurants" },
            { label: "Restaurant Not Found" },
          ]}
        />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Restaurant not found</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <AdminBreadcrumbHeader
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Restaurants", href: "/admin/restaurants" },
          { label: restaurant.name },
        ]}
      />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/restaurants">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Restaurants
            </Link>
          </Button>
        </div>

        {/* Restaurant Header */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-6">
              <Avatar className="h-20 w-20">
                <AvatarImage src={restaurant.logo || "/placeholder.svg"} alt={restaurant.name} />
                <AvatarFallback className="text-lg">
                  {restaurant.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h1 className="text-2xl font-bold mb-2">{restaurant.name}</h1>
                <div className="flex items-center gap-4 text-muted-foreground mb-4">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span>{restaurant.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{restaurant.address}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{restaurant.plan} Plan</Badge>
                  <Badge variant={restaurant.stripeStatus === "Connected" ? "default" : "destructive"}>
                    Stripe {restaurant.stripeStatus}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Account Details */}
          <Card>
            <CardHeader>
              <CardTitle>Account Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                  <span className="text-muted-foreground">Plan</span>
                </div>
                <Badge variant="outline">{restaurant.plan}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <span className="text-muted-foreground">Trial End Date</span>
                </div>
                <span className="font-medium">{restaurant.trialEndDate}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                  <span className="text-muted-foreground">Stripe Status</span>
                </div>
                <Badge variant={restaurant.stripeStatus === "Connected" ? "default" : "destructive"}>
                  {restaurant.stripeStatus}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <span className="text-muted-foreground">Signup Date</span>
                </div>
                <span className="font-medium">{restaurant.signupDate}</span>
              </div>
            </CardContent>
          </Card>

          {/* Usage Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Usage Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ShoppingBag className="h-5 w-5 text-muted-foreground" />
                  <span className="text-muted-foreground">Total Orders</span>
                </div>
                <span className="font-bold text-xl">{restaurant.orderCount.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ChefHat className="h-5 w-5 text-muted-foreground" />
                  <span className="text-muted-foreground">Menu Items</span>
                </div>
                <span className="font-bold text-xl">{restaurant.menuItems}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                  <span className="text-muted-foreground">Tables</span>
                </div>
                <span className="font-bold text-xl">{restaurant.tables}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <span className="text-muted-foreground">Staff Users</span>
                </div>
                <span className="font-bold text-xl">{restaurant.staffUsers}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Message</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {restaurant.recentActivity.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell className="font-mono text-sm">{activity.timestamp}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{activity.type}</Badge>
                    </TableCell>
                    <TableCell>{activity.message}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset Stripe
              </Button>
              <Button variant="outline">
                <Mail className="h-4 w-4 mr-2" />
                Email Restaurant
              </Button>
              <Button variant="outline">
                <Flag className="h-4 w-4 mr-2" />
                Flag Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
