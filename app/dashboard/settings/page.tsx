"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Upload, CreditCard, Printer, Bell, ExternalLink, Smartphone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

export default function SettingsPage() {
  const [restaurantInfo, setRestaurantInfo] = useState({
    name: "Bella Vista",
    email: "info@bellavista.ch",
    phone: "+41 44 123 4567",
    address: "Bahnhofstrasse 123",
    city: "Zurich",
    postalCode: "8001",
    country: "Switzerland",
    description: "Authentic Italian cuisine in the heart of Zurich",
  })

  const [printerSettings, setPrinterSettings] = useState({
    autoPrint: true,
    printerName: "EPSON TM-T20III",
    receiptHeader: "Bella Vista Restaurant",
    receiptFooter: "Thank you for dining with us!",
    taxRate: 7.7,
  })

  const [notifications, setNotifications] = useState({
    newOrders: true,
    paymentReceived: true,
    lowStock: false,
    dailyReports: true,
  })

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500">Manage your restaurant settings and preferences</p>
      </div>

      <Tabs defaultValue="restaurant" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="restaurant">Restaurant</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="printer">Printer</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        {/* Restaurant Info */}
        <TabsContent value="restaurant">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <Card>
              <CardHeader>
                <CardTitle>Restaurant Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Logo Upload */}
                <div className="space-y-2">
                  <Label>Restaurant Logo</Label>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                      <img
                        src="/placeholder.svg?height=80&width=80"
                        alt="Restaurant logo"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <Button variant="outline">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload New Logo
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Restaurant Name</Label>
                    <Input
                      id="name"
                      value={restaurantInfo.name}
                      onChange={(e) => setRestaurantInfo({ ...restaurantInfo, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={restaurantInfo.email}
                      onChange={(e) => setRestaurantInfo({ ...restaurantInfo, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={restaurantInfo.phone}
                      onChange={(e) => setRestaurantInfo({ ...restaurantInfo, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={restaurantInfo.address}
                      onChange={(e) => setRestaurantInfo({ ...restaurantInfo, address: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={restaurantInfo.city}
                      onChange={(e) => setRestaurantInfo({ ...restaurantInfo, city: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Postal Code</Label>
                    <Input
                      id="postalCode"
                      value={restaurantInfo.postalCode}
                      onChange={(e) => setRestaurantInfo({ ...restaurantInfo, postalCode: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={restaurantInfo.description}
                    onChange={(e) => setRestaurantInfo({ ...restaurantInfo, description: e.target.value })}
                    placeholder="Describe your restaurant..."
                    className="min-h-[100px]"
                  />
                </div>

                <Button className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700">
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Billing */}
        <TabsContent value="billing">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <Card>
              <CardHeader>
                <CardTitle>Subscription & Billing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Current Plan */}
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                  <div>
                    <h3 className="font-semibold text-green-900">Pro Plan</h3>
                    <p className="text-sm text-green-700">CHF 11.99/month • Trial ends in 12 days</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Active Trial</Badge>
                </div>

                {/* Billing Info */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Next billing date</span>
                    <span className="font-medium">January 28, 2024</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Payment method</span>
                    <span className="font-medium">•••• •••• •••• 4242</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Billing email</span>
                    <span className="font-medium">billing@bellavista.ch</span>
                  </div>
                </div>

                <Separator />

                <div className="flex gap-2">
                  <Button variant="outline">
                    <CreditCard className="w-4 h-4 mr-2" />
                    Update Payment Method
                  </Button>
                  <Button variant="outline">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Billing Portal
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Usage This Month</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Orders processed</span>
                    <span className="font-medium">1,247</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Commission fees</span>
                    <span className="font-medium">CHF 650.00</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Active tables</span>
                    <span className="font-medium">12</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Payments */}
        <TabsContent value="payments">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <Card>
              <CardHeader>
                <CardTitle>Payment Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Stripe Status */}
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded flex items-center justify-center">
                      <span className="text-white font-bold text-sm">S</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-green-900">Stripe Connected</h3>
                      <p className="text-sm text-green-700">Payments go directly to your bank account</p>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Connected</Badge>
                </div>

                {/* Payment Methods */}
                <div className="space-y-4">
                  <h4 className="font-medium">Accepted Payment Methods</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-blue-600" />
                        <span className="text-sm font-medium">Credit Cards</span>
                      </div>
                      <Switch checked={true} />
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Smartphone className="w-5 h-5 text-blue-600" />
                        <span className="text-sm font-medium">TWINT</span>
                      </div>
                      <Switch checked={true} />
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 text-green-600">💵</span>
                        <span className="text-sm font-medium">Cash</span>
                      </div>
                      <Switch checked={true} />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium">Payout Settings</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Payout schedule</span>
                      <span className="font-medium">Daily</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Bank account</span>
                      <span className="font-medium">CH93 0076 2011 6238 5295 7</span>
                    </div>
                  </div>
                </div>

                <Button variant="outline">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Manage in Stripe Dashboard
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Printer Settings */}
        <TabsContent value="printer">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <Card>
              <CardHeader>
                <CardTitle>Thermal Printer Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Printer Status */}
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-3">
                    <Printer className="w-6 h-6 text-green-600" />
                    <div>
                      <h3 className="font-semibold text-green-900">Printer Connected</h3>
                      <p className="text-sm text-green-700">{printerSettings.printerName}</p>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Online</Badge>
                </div>

                {/* Auto Print Setting */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="autoPrint">Auto-print receipts</Label>
                    <p className="text-sm text-gray-500">Automatically print receipts when orders are received</p>
                  </div>
                  <Switch
                    id="autoPrint"
                    checked={printerSettings.autoPrint}
                    onCheckedChange={(checked) => setPrinterSettings({ ...printerSettings, autoPrint: checked })}
                  />
                </div>

                <Separator />

                {/* Receipt Customization */}
                <div className="space-y-4">
                  <h4 className="font-medium">Receipt Customization</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="receiptHeader">Receipt Header</Label>
                      <Input
                        id="receiptHeader"
                        value={printerSettings.receiptHeader}
                        onChange={(e) => setPrinterSettings({ ...printerSettings, receiptHeader: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="taxRate">Tax Rate (%)</Label>
                      <Input
                        id="taxRate"
                        type="number"
                        step="0.1"
                        value={printerSettings.taxRate}
                        onChange={(e) =>
                          setPrinterSettings({ ...printerSettings, taxRate: Number.parseFloat(e.target.value) })
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="receiptFooter">Receipt Footer</Label>
                    <Textarea
                      id="receiptFooter"
                      value={printerSettings.receiptFooter}
                      onChange={(e) => setPrinterSettings({ ...printerSettings, receiptFooter: e.target.value })}
                      className="min-h-[80px]"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline">Test Print</Button>
                  <Button className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700">
                    Save Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="newOrders">New Orders</Label>
                      <p className="text-sm text-gray-500">Get notified when new orders are received</p>
                    </div>
                    <Switch
                      id="newOrders"
                      checked={notifications.newOrders}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, newOrders: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="paymentReceived">Payment Received</Label>
                      <p className="text-sm text-gray-500">Get notified when payments are processed</p>
                    </div>
                    <Switch
                      id="paymentReceived"
                      checked={notifications.paymentReceived}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, paymentReceived: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="lowStock">Low Stock Alerts</Label>
                      <p className="text-sm text-gray-500">Get notified when menu items are running low</p>
                    </div>
                    <Switch
                      id="lowStock"
                      checked={notifications.lowStock}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, lowStock: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="dailyReports">Daily Reports</Label>
                      <p className="text-sm text-gray-500">Receive daily sales and performance reports</p>
                    </div>
                    <Switch
                      id="dailyReports"
                      checked={notifications.dailyReports}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, dailyReports: checked })}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium">Notification Methods</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">Email notifications to info@bellavista.ch</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">Push notifications (coming soon)</span>
                    </div>
                  </div>
                </div>

                <Button className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700">
                  Save Preferences
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
