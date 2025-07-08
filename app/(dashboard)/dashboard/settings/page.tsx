"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Upload,
  Bell,
  Smartphone,
  Image as ImageIcon,
  Volume2,
  Clock,
  Users,
  Utensils,
  Camera,
  Edit2,
  Globe,
  Clock8,
  DollarSign,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useRestaurantSettings,
  CURRENCIES,
} from "@/lib/store/restaurant-settings";

const DAYS_OF_WEEK = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

const RESTAURANT_TYPES = [
  { value: "restaurant", label: "Restaurant" },
  { value: "cafe", label: "Cafe" },
  { value: "bar", label: "Bar" },
  { value: "food-truck", label: "Food Truck" },
] as const;

// Add animation variants at the top level
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
  hover: { y: -5, transition: { duration: 0.2 } },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0 },
};

export default function SettingsPage() {
  const [isEditing, setIsEditing] = useState(false);
  const { currency, setCurrency } = useRestaurantSettings();
  const [restaurantInfo, setRestaurantInfo] = useState({
    name: "Bella Vista",
    email: "info@bellavista.ch",
    phone: "+41 44 123 4567",
    address: "Bahnhofstrasse 123",
    city: "Zurich",
    postalCode: "8001",
    country: "Switzerland",
    description: "Authentic Italian cuisine in the heart of Zurich",
    website: "https://bellavista.ch",
    cuisine: "Italian",
    type: "restaurant",
    currency: currency.value,
    openingHours: {
      monday: { open: "11:00", close: "22:00" },
      tuesday: { open: "11:00", close: "22:00" },
      wednesday: { open: "11:00", close: "22:00" },
      thursday: { open: "11:00", close: "22:00" },
      friday: { open: "11:00", close: "23:00" },
      saturday: { open: "12:00", close: "23:00" },
      sunday: { open: "12:00", close: "22:00" },
    },
    priceRange: "$$",
    seatingCapacity: "80",
    acceptsReservations: true,
    deliveryAvailable: true,
    takeoutAvailable: true,
    taxRate: 7.7,
    vatNumber: "CHE-123.456.789",
  });

  const [notifications, setNotifications] = useState({
    newOrders: true,
    paymentReceived: true,
    tableRequests: true,
    kitchenUpdates: false,
    playSound: true,
  });

  const handleSave = () => {
    // Update currency in the store
    const selectedCurrency = CURRENCIES.find(
      (c) => c.value === restaurantInfo.currency
    );
    if (selectedCurrency) {
      setCurrency(selectedCurrency);
    }

    // Here you would typically save the changes to your backend
    setIsEditing(false);
  };

  const handleOpeningHourChange = (
    day: (typeof DAYS_OF_WEEK)[number],
    type: "open" | "close",
    value: string
  ) => {
    setRestaurantInfo({
      ...restaurantInfo,
      openingHours: {
        ...restaurantInfo.openingHours,
        [day]: {
          ...restaurantInfo.openingHours[day],
          [type]: value,
        },
      },
    });
  };

  const priceRanges = [
    { value: "$", label: "$ (Under 15 CHF)" },
    { value: "$$", label: "$$ (15-30 CHF)" },
    { value: "$$$", label: "$$$ (31-60 CHF)" },
    { value: "$$$$", label: "$$$$ (60+ CHF)" },
  ];

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-1"
      >
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Settings
        </h1>
        <p className="text-lg text-gray-500">
          Manage your restaurant settings and preferences
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        <Tabs defaultValue="restaurant" className="space-y-8">
          <TabsList className="grid w-full max-w-[400px] grid-cols-2">
            <TabsTrigger value="restaurant">Restaurant</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          {/* Restaurant Info */}
          <TabsContent value="restaurant">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="space-y-6"
            >
              {/* Basic Information Card */}
              <motion.div variants={cardVariants} whileHover="hover">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <div>
                      <CardTitle>Restaurant Information</CardTitle>
                      <CardDescription>
                        Update your restaurant's profile and appearance
                      </CardDescription>
                    </div>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        variant={isEditing ? "outline" : "default"}
                        onClick={() =>
                          isEditing ? handleSave() : setIsEditing(true)
                        }
                        className={
                          isEditing
                            ? "border-green-600 text-green-600 hover:bg-green-50"
                            : "bg-green-600 hover:bg-green-700 text-white"
                        }
                      >
                        {isEditing ? (
                          "Save Changes"
                        ) : (
                          <>
                            <Edit2 className="w-4 h-4 mr-2" />
                            Edit
                          </>
                        )}
                      </Button>
                    </motion.div>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    {/* Media Section */}
                    <motion.div variants={itemVariants} className="space-y-6">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Media
                      </h3>

                      {/* Cover Photo Upload */}
                      <div className="space-y-3">
                        <Label className="text-base">
                          Restaurant Cover Photo
                        </Label>
                        <div className="space-y-3">
                          <div className="relative w-full h-[240px] bg-gray-100 rounded-lg overflow-hidden">
                            <img
                              src="/placeholder.svg?height=240&width=800"
                              alt="Restaurant cover"
                              className="w-full h-full object-cover"
                            />
                            {isEditing && (
                              <Button className="absolute top-4 right-4 bg-white text-black hover:bg-white/90 transition-all duration-300 shadow-lg">
                                <Camera className="w-4 h-4 mr-2" />
                                Change Cover Photo
                              </Button>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">
                            Recommended size: 1920x640 pixels. Max file size:
                            5MB.
                          </p>
                        </div>
                      </div>

                      {/* Logo Upload */}
                      <div className="space-y-3">
                        <Label className="text-base">Restaurant Logo</Label>
                        <div className="space-y-3">
                          <div className="flex items-center gap-4">
                            <div className="relative w-32 h-32 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                              <img
                                src="/placeholder.svg?height=128&width=128"
                                alt="Restaurant logo"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            {isEditing && (
                              <Button
                                size="sm"
                                className="bg-white text-black hover:bg-white/90 transition-all duration-300 shadow-lg border border-gray-200 h-10"
                              >
                                <Camera className="w-4 h-4 mr-2" />
                                Change Logo
                              </Button>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">
                            Recommended size: 400x400 pixels. Max file size:
                            2MB.
                          </p>
                        </div>
                      </div>
                    </motion.div>

                    <Separator />

                    {/* Basic Details */}
                    <motion.div variants={itemVariants} className="space-y-6">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Basic Details
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="name" className="text-base">
                            Restaurant Name
                          </Label>
                          <Input
                            id="name"
                            value={restaurantInfo.name}
                            onChange={(e) =>
                              setRestaurantInfo({
                                ...restaurantInfo,
                                name: e.target.value,
                              })
                            }
                            className="transition-all duration-300 focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            disabled={!isEditing}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="type" className="text-base">
                            Restaurant Type
                          </Label>
                          <Select
                            value={restaurantInfo.type}
                            onValueChange={(value) =>
                              setRestaurantInfo({
                                ...restaurantInfo,
                                type: value,
                              })
                            }
                            disabled={!isEditing}
                          >
                            <SelectTrigger className="transition-all duration-300 focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                              <SelectValue placeholder="Select restaurant type" />
                            </SelectTrigger>
                            <SelectContent>
                              {RESTAURANT_TYPES.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="cuisine" className="text-base">
                            Cuisine Type
                          </Label>
                          <Input
                            id="cuisine"
                            value={restaurantInfo.cuisine}
                            onChange={(e) =>
                              setRestaurantInfo({
                                ...restaurantInfo,
                                cuisine: e.target.value,
                              })
                            }
                            className="transition-all duration-300 focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            disabled={!isEditing}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="priceRange" className="text-base">
                            Price Range
                          </Label>
                          <Select
                            value={restaurantInfo.priceRange}
                            onValueChange={(value) =>
                              setRestaurantInfo({
                                ...restaurantInfo,
                                priceRange: value,
                              })
                            }
                            disabled={!isEditing}
                          >
                            <SelectTrigger className="transition-all duration-300 focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                              <SelectValue placeholder="Select price range" />
                            </SelectTrigger>
                            <SelectContent>
                              {priceRanges.map((range) => (
                                <SelectItem
                                  key={range.value}
                                  value={range.value}
                                >
                                  {range.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="currency" className="text-base">
                            Currency
                          </Label>
                          <Select
                            value={restaurantInfo.currency}
                            onValueChange={(value) =>
                              setRestaurantInfo({
                                ...restaurantInfo,
                                currency: value,
                              })
                            }
                            disabled={!isEditing}
                          >
                            <SelectTrigger className="transition-all duration-300 focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                              <SelectValue placeholder="Select currency" />
                            </SelectTrigger>
                            <SelectContent>
                              {CURRENCIES.map((currency) => (
                                <SelectItem
                                  key={currency.value}
                                  value={currency.value}
                                >
                                  {currency.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="md:col-span-2">
                          <Label htmlFor="description" className="text-base">
                            Description
                          </Label>
                          <Textarea
                            id="description"
                            value={restaurantInfo.description}
                            onChange={(e) =>
                              setRestaurantInfo({
                                ...restaurantInfo,
                                description: e.target.value,
                              })
                            }
                            className="min-h-[100px] mt-2 transition-all duration-300 focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            disabled={!isEditing}
                          />
                        </div>
                      </div>
                    </motion.div>

                    <Separator />

                    {/* Contact Information */}
                    <motion.div variants={itemVariants} className="space-y-6">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Contact Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-base">
                            Email Address
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            value={restaurantInfo.email}
                            onChange={(e) =>
                              setRestaurantInfo({
                                ...restaurantInfo,
                                email: e.target.value,
                              })
                            }
                            className="transition-all duration-300 focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            disabled={!isEditing}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="phone" className="text-base">
                            Phone Number
                          </Label>
                          <Input
                            id="phone"
                            value={restaurantInfo.phone}
                            onChange={(e) =>
                              setRestaurantInfo({
                                ...restaurantInfo,
                                phone: e.target.value,
                              })
                            }
                            className="transition-all duration-300 focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            disabled={!isEditing}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="taxRate" className="text-base">
                            Tax Rate (%)
                          </Label>
                          <Input
                            id="taxRate"
                            type="number"
                            step="0.1"
                            value={restaurantInfo.taxRate || ""}
                            onChange={(e) =>
                              setRestaurantInfo({
                                ...restaurantInfo,
                                taxRate: parseFloat(e.target.value),
                              })
                            }
                            className="transition-all duration-300 focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            disabled={!isEditing}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="vatNumber" className="text-base">
                            VAT Number
                          </Label>
                          <Input
                            id="vatNumber"
                            value={restaurantInfo.vatNumber || ""}
                            onChange={(e) =>
                              setRestaurantInfo({
                                ...restaurantInfo,
                                vatNumber: e.target.value,
                              })
                            }
                            className="transition-all duration-300 focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            disabled={!isEditing}
                            placeholder="e.g., CHE-123.456.789"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="website" className="text-base">
                            Website
                          </Label>
                          <div className="relative">
                            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                            <Input
                              id="website"
                              value={restaurantInfo.website}
                              onChange={(e) =>
                                setRestaurantInfo({
                                  ...restaurantInfo,
                                  website: e.target.value,
                                })
                              }
                              className="pl-10 transition-all duration-300 focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                              disabled={!isEditing}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label
                            htmlFor="seatingCapacity"
                            className="text-base"
                          >
                            Seating Capacity
                          </Label>
                          <Input
                            id="seatingCapacity"
                            value={restaurantInfo.seatingCapacity}
                            onChange={(e) =>
                              setRestaurantInfo({
                                ...restaurantInfo,
                                seatingCapacity: e.target.value,
                              })
                            }
                            className="transition-all duration-300 focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            disabled={!isEditing}
                            type="number"
                          />
                        </div>
                      </div>
                    </motion.div>

                    <Separator />

                    {/* Location */}
                    <motion.div variants={itemVariants} className="space-y-6">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Location
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="address" className="text-base">
                            Street Address
                          </Label>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                            <Input
                              id="address"
                              value={restaurantInfo.address}
                              onChange={(e) =>
                                setRestaurantInfo({
                                  ...restaurantInfo,
                                  address: e.target.value,
                                })
                              }
                              className="pl-10 transition-all duration-300 focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                              disabled={!isEditing}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="city" className="text-base">
                            City
                          </Label>
                          <Input
                            id="city"
                            value={restaurantInfo.city}
                            onChange={(e) =>
                              setRestaurantInfo({
                                ...restaurantInfo,
                                city: e.target.value,
                              })
                            }
                            className="transition-all duration-300 focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            disabled={!isEditing}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="postalCode" className="text-base">
                            Postal Code
                          </Label>
                          <Input
                            id="postalCode"
                            value={restaurantInfo.postalCode}
                            onChange={(e) =>
                              setRestaurantInfo({
                                ...restaurantInfo,
                                postalCode: e.target.value,
                              })
                            }
                            className="transition-all duration-300 focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            disabled={!isEditing}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="country" className="text-base">
                            Country
                          </Label>
                          <Input
                            id="country"
                            value={restaurantInfo.country}
                            onChange={(e) =>
                              setRestaurantInfo({
                                ...restaurantInfo,
                                country: e.target.value,
                              })
                            }
                            className="transition-all duration-300 focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            disabled={!isEditing}
                          />
                        </div>
                      </div>
                    </motion.div>

                    <Separator />

                    {/* Opening Hours */}
                    <motion.div variants={itemVariants} className="space-y-6">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Opening Hours
                      </h3>
                      <div className="space-y-4">
                        {DAYS_OF_WEEK.map((day) => (
                          <motion.div
                            key={day}
                            variants={itemVariants}
                            className="grid grid-cols-1 md:grid-cols-2 gap-4"
                          >
                            <Label className="w-24 capitalize font-medium">
                              {day}
                            </Label>
                            <div className="flex items-center gap-2 flex-1">
                              <div className="flex-1">
                                <Input
                                  type="time"
                                  value={restaurantInfo.openingHours[day].open}
                                  onChange={(e) =>
                                    handleOpeningHourChange(
                                      day,
                                      "open",
                                      e.target.value
                                    )
                                  }
                                  className="transition-all duration-300 focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                  disabled={!isEditing}
                                />
                              </div>
                              <span className="text-gray-500">to</span>
                              <div className="flex-1">
                                <Input
                                  type="time"
                                  value={restaurantInfo.openingHours[day].close}
                                  onChange={(e) =>
                                    handleOpeningHourChange(
                                      day,
                                      "close",
                                      e.target.value
                                    )
                                  }
                                  className="transition-all duration-300 focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                  disabled={!isEditing}
                                />
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>

                    <Separator />

                    {/* Service Options */}
                    <motion.div variants={itemVariants} className="space-y-6">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Service Options
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="acceptsReservations"
                            checked={restaurantInfo.acceptsReservations}
                            onCheckedChange={(checked) =>
                              setRestaurantInfo({
                                ...restaurantInfo,
                                acceptsReservations: checked,
                              })
                            }
                            disabled={!isEditing}
                            className="data-[state=checked]:bg-green-600"
                          />
                          <Label htmlFor="acceptsReservations">
                            Accepts Reservations
                          </Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch
                            id="deliveryAvailable"
                            checked={restaurantInfo.deliveryAvailable}
                            onCheckedChange={(checked) =>
                              setRestaurantInfo({
                                ...restaurantInfo,
                                deliveryAvailable: checked,
                              })
                            }
                            disabled={!isEditing}
                            className="data-[state=checked]:bg-green-600"
                          />
                          <Label htmlFor="deliveryAvailable">
                            Delivery Available
                          </Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch
                            id="takeoutAvailable"
                            checked={restaurantInfo.takeoutAvailable}
                            onCheckedChange={(checked) =>
                              setRestaurantInfo({
                                ...restaurantInfo,
                                takeoutAvailable: checked,
                              })
                            }
                            disabled={!isEditing}
                            className="data-[state=checked]:bg-green-600"
                          />
                          <Label htmlFor="takeoutAvailable">
                            Takeout Available
                          </Label>
                        </div>
                      </div>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="space-y-6"
            >
              <motion.div variants={cardVariants} whileHover="hover">
                <Card>
                  <CardHeader>
                    <CardTitle>Notification Preferences</CardTitle>
                    <CardDescription>
                      Choose what notifications you want to receive
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {Object.entries(notifications).map(
                      ([key, value], index) => (
                        <motion.div
                          key={key}
                          variants={itemVariants}
                          className="flex items-center justify-between"
                        >
                          <div className="space-y-0.5">
                            <Label htmlFor={key} className="text-base">
                              {key === "newOrders"
                                ? "New Orders"
                                : key === "paymentReceived"
                                ? "Payment Received"
                                : key === "tableRequests"
                                ? "Table Requests"
                                : key === "kitchenUpdates"
                                ? "Kitchen Updates"
                                : key === "playSound"
                                ? "Play Sound"
                                : key}
                            </Label>
                            <p className="text-sm text-gray-500">
                              {key === "newOrders"
                                ? "Get notified when new orders come in"
                                : key === "paymentReceived"
                                ? "Get notified when payments are processed"
                                : key === "tableRequests"
                                ? "Get notified when customers request assistance"
                                : key === "kitchenUpdates"
                                ? "Get notified about kitchen status updates"
                                : key === "playSound"
                                ? "Play a sound with notifications"
                                : ""}
                            </p>
                          </div>
                          <Switch
                            id={key}
                            checked={value}
                            onCheckedChange={(checked) =>
                              setNotifications({
                                ...notifications,
                                [key]: checked,
                              })
                            }
                            className="data-[state=checked]:bg-green-600"
                          />
                        </motion.div>
                      )
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
