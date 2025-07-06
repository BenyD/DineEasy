"use client"

import { useState } from "react"
import { AdminBreadcrumbHeader } from "@/components/admin/admin-breadcrumb-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Eye, Search, Filter } from "lucide-react"
import Link from "next/link"

const restaurants = [
  {
    id: 1,
    name: "Bella Vista Restaurant",
    email: "owner@bellavista.com",
    plan: "Pro",
    trialEndDate: "2024-02-15",
    stripeStatus: "Connected",
    signupDate: "2024-01-01",
  },
  {
    id: 2,
    name: "Corner Café",
    email: "info@cornercafe.com",
    plan: "Starter",
    trialEndDate: "2024-02-20",
    stripeStatus: "Pending",
    signupDate: "2024-01-05",
  },
  {
    id: 3,
    name: "The Garden Bistro",
    email: "contact@gardenbistro.com",
    plan: "Elite",
    trialEndDate: "2024-02-25",
    stripeStatus: "Connected",
    signupDate: "2024-01-10",
  },
  {
    id: 4,
    name: "Urban Kitchen",
    email: "hello@urbankitchen.com",
    plan: "Pro",
    trialEndDate: "2024-03-01",
    stripeStatus: "Not Connected",
    signupDate: "2024-01-15",
  },
  {
    id: 5,
    name: "Seaside Grill",
    email: "info@seasidegrill.com",
    plan: "Starter",
    trialEndDate: "2024-03-05",
    stripeStatus: "Connected",
    signupDate: "2024-01-20",
  },
]

export default function RestaurantsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [planFilter, setPlanFilter] = useState("all")
  const [stripeFilter, setStripeFilter] = useState("all")
  const [trialFilter, setTrialFilter] = useState("all")

  const filteredRestaurants = restaurants.filter((restaurant) => {
    const matchesSearch =
      restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      restaurant.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesPlan = planFilter === "all" || restaurant.plan.toLowerCase() === planFilter
    const matchesStripe =
      stripeFilter === "all" ||
      (stripeFilter === "yes" && restaurant.stripeStatus === "Connected") ||
      (stripeFilter === "no" && restaurant.stripeStatus !== "Connected")
    const matchesTrial =
      trialFilter === "all" ||
      (trialFilter === "yes" && new Date(restaurant.trialEndDate) > new Date()) ||
      (trialFilter === "no" && new Date(restaurant.trialEndDate) <= new Date())

    return matchesSearch && matchesPlan && matchesStripe && matchesTrial
  })

  return (
    <>
      <AdminBreadcrumbHeader items={[{ label: "Admin", href: "/admin" }, { label: "Restaurants" }]} />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold md:text-2xl">All Restaurants</h1>
            <p className="text-sm text-muted-foreground">
              {filteredRestaurants.length} of {restaurants.length} restaurants
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search restaurants..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={planFilter} onValueChange={setPlanFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plans</SelectItem>
                  <SelectItem value="starter">Starter</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="elite">Elite</SelectItem>
                </SelectContent>
              </Select>

              <Select value={stripeFilter} onValueChange={setStripeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Stripe Connected" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="yes">Connected</SelectItem>
                  <SelectItem value="no">Not Connected</SelectItem>
                </SelectContent>
              </Select>

              <Select value={trialFilter} onValueChange={setTrialFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Trial Active" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Trials</SelectItem>
                  <SelectItem value="yes">Active</SelectItem>
                  <SelectItem value="no">Expired</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("")
                  setPlanFilter("all")
                  setStripeFilter("all")
                  setTrialFilter("all")
                }}
              >
                <Filter className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Restaurants Table */}
        <Card>
          <CardHeader>
            <CardTitle>Restaurants</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Restaurant Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Trial End Date</TableHead>
                  <TableHead>Stripe Status</TableHead>
                  <TableHead>Signup Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRestaurants.map((restaurant) => (
                  <TableRow key={restaurant.id}>
                    <TableCell className="font-medium">{restaurant.name}</TableCell>
                    <TableCell className="text-muted-foreground">{restaurant.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{restaurant.plan}</Badge>
                    </TableCell>
                    <TableCell>{restaurant.trialEndDate}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          restaurant.stripeStatus === "Connected"
                            ? "default"
                            : restaurant.stripeStatus === "Pending"
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {restaurant.stripeStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>{restaurant.signupDate}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/admin/restaurants/${restaurant.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
