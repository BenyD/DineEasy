"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Filter, Search } from "lucide-react"
import { format } from "date-fns"
import { AdminBreadcrumbHeader } from "@/components/admin/admin-breadcrumb-header"

const activityLogs = [
  {
    id: 1,
    timestamp: "2024-01-30 14:30:25",
    eventType: "Signup",
    restaurant: "Bella Vista Restaurant",
    description: "New restaurant registration completed",
  },
  {
    id: 2,
    timestamp: "2024-01-30 14:15:10",
    eventType: "Payment",
    restaurant: "Corner Café",
    description: "Monthly subscription payment processed: $29.99",
  },
  {
    id: 3,
    timestamp: "2024-01-30 13:45:33",
    eventType: "Stripe Connect",
    restaurant: "The Garden Bistro",
    description: "Stripe account successfully connected",
  },
  {
    id: 4,
    timestamp: "2024-01-30 12:20:15",
    eventType: "Order",
    restaurant: "Urban Kitchen",
    description: "Order #1247 processed successfully",
  },
  {
    id: 5,
    timestamp: "2024-01-30 11:55:42",
    eventType: "Signup",
    restaurant: "Seaside Grill",
    description: "Trial account created",
  },
  {
    id: 6,
    timestamp: "2024-01-30 10:30:18",
    eventType: "Payment",
    restaurant: "Mountain View Diner",
    description: "Payment failed - card declined",
  },
  {
    id: 7,
    timestamp: "2024-01-30 09:15:27",
    eventType: "Order",
    restaurant: "City Bistro",
    description: "Large order processed: $245.80",
  },
  {
    id: 8,
    timestamp: "2024-01-30 08:45:55",
    eventType: "Stripe Connect",
    restaurant: "Rooftop Restaurant",
    description: "Stripe connection attempt failed",
  },
]

export default function ActivityLogsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [dateFrom, setDateFrom] = useState<Date>()
  const [dateTo, setDateTo] = useState<Date>()

  const filteredLogs = activityLogs.filter((log) => {
    const matchesSearch =
      log.restaurant.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === "all" || log.eventType.toLowerCase().replace(" ", "") === typeFilter

    return matchesSearch && matchesType
  })

  const getEventTypeBadge = (eventType: string) => {
    switch (eventType) {
      case "Signup":
        return <Badge variant="default">Signup</Badge>
      case "Payment":
        return <Badge variant="secondary">Payment</Badge>
      case "Stripe Connect":
        return <Badge variant="outline">Stripe Connect</Badge>
      case "Order":
        return <Badge variant="secondary">Order</Badge>
      default:
        return <Badge variant="outline">{eventType}</Badge>
    }
  }

  return (
    <>
      <AdminBreadcrumbHeader items={[{ label: "Admin", href: "/admin" }, { label: "Activity Logs" }]} />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold md:text-2xl">Activity Logs</h1>
            <p className="text-sm text-muted-foreground">
              {filteredLogs.length} of {activityLogs.length} events
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
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Event Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="signup">Signup</SelectItem>
                  <SelectItem value="payment">Payment</SelectItem>
                  <SelectItem value="stripeconnect">Stripe Connect</SelectItem>
                  <SelectItem value="order">Order</SelectItem>
                </SelectContent>
              </Select>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom ? format(dateFrom, "PPP") : "From date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, "PPP") : "To date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus />
                </PopoverContent>
              </Popover>

              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("")
                  setTypeFilter("all")
                  setDateFrom(undefined)
                  setDateTo(undefined)
                }}
              >
                <Filter className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Activity Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle>System Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Event Type</TableHead>
                  <TableHead>Affected Restaurant</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-sm">{log.timestamp}</TableCell>
                    <TableCell>{getEventTypeBadge(log.eventType)}</TableCell>
                    <TableCell className="font-medium">{log.restaurant}</TableCell>
                    <TableCell className="text-muted-foreground">{log.description}</TableCell>
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
