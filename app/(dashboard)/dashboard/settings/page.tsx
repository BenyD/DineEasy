"use client";

import { useState, useEffect } from "react";
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
  Loader2,
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
import { useRestaurantSettings } from "@/lib/store/restaurant-settings";
import { CURRENCIES, COUNTRY_OPTIONS, type Currency } from "@/lib/constants";
import { toast } from "sonner";

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

const PRICE_RANGES = [
  { value: "$", label: "$ (Under 15 CHF)" },
  { value: "$$", label: "$$ (15-30 CHF)" },
  { value: "$$$", label: "$$$ (31-60 CHF)" },
  { value: "$$$$", label: "$$$$ (60+ CHF)" },
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
  const [isSaving, setIsSaving] = useState(false);
  const {
    currency,
    setCurrency,
    restaurant,
    isLoading,
    error,
    fetchRestaurant,
    updateRestaurant,
    toggleRestaurantStatus,
    updateNotifications,
  } = useRestaurantSettings();

  // Fetch restaurant data on component mount
  useEffect(() => {
    fetchRestaurant();
  }, [fetchRestaurant]);

  // Initialize form data from restaurant
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    country: "",
    description: "",
    website: "",
    cuisine: "",
    type: "restaurant" as const,
    currency: currency,
    taxRate: 0,
    vatNumber: "",
    priceRange: "$" as const,
    seatingCapacity: "",
    acceptsReservations: false,
    deliveryAvailable: false,
    takeoutAvailable: false,
    openingHours: {
      monday: { open: "09:00", close: "17:00" },
      tuesday: { open: "09:00", close: "17:00" },
      wednesday: { open: "09:00", close: "17:00" },
      thursday: { open: "09:00", close: "17:00" },
      friday: { open: "09:00", close: "17:00" },
      saturday: { open: "10:00", close: "16:00" },
      sunday: { open: "10:00", close: "16:00" },
    },
  });

  const [notifications, setNotifications] = useState({
    newOrders: true,
    paymentReceived: true,
    tableRequests: true,
    kitchenUpdates: false,
    playSound: true,
  });

  // Update form data when restaurant data is loaded
  useEffect(() => {
    if (restaurant) {
      setFormData({
        name: restaurant.name || "",
        email: restaurant.email || "",
        phone: restaurant.phone || "",
        address: restaurant.address || "",
        city: restaurant.city || "",
        postalCode: restaurant.postal_code || "",
        country: restaurant.country || "",
        description: restaurant.description || "",
        website: restaurant.website || "",
        cuisine: restaurant.cuisine || "",
        type: restaurant.type || "restaurant",
        currency: restaurant.currency || "CHF",
        taxRate: restaurant.tax_rate || 0,
        vatNumber: restaurant.vat_number || "",
        priceRange: restaurant.price_range || "$",
        seatingCapacity: restaurant.seating_capacity?.toString() || "",
        acceptsReservations: restaurant.accepts_reservations || false,
        deliveryAvailable: restaurant.delivery_available || false,
        takeoutAvailable: restaurant.takeout_available || false,
        openingHours: restaurant.opening_hours || {
          monday: { open: "09:00", close: "17:00" },
          tuesday: { open: "09:00", close: "17:00" },
          wednesday: { open: "09:00", close: "17:00" },
          thursday: { open: "09:00", close: "17:00" },
          friday: { open: "09:00", close: "17:00" },
          saturday: { open: "10:00", close: "16:00" },
          sunday: { open: "10:00", close: "16:00" },
        },
      });

      // Set notifications from database
      if (restaurant.notification_settings) {
        setNotifications(restaurant.notification_settings);
      }
    }
  }, [restaurant]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Update restaurant data
      await updateRestaurant({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        postal_code: formData.postalCode,
        country: formData.country,
        description: formData.description,
        website: formData.website,
        cuisine: formData.cuisine,
        type: formData.type,
        currency: formData.currency,
        tax_rate: formData.taxRate,
        vat_number: formData.vatNumber,
        price_range: formData.priceRange,
        seating_capacity: formData.seatingCapacity
          ? parseInt(formData.seatingCapacity)
          : null,
        accepts_reservations: formData.acceptsReservations,
        delivery_available: formData.deliveryAvailable,
        takeout_available: formData.takeoutAvailable,
        opening_hours: formData.openingHours,
      });

      // Update notification settings
      await updateNotifications(notifications);

      setIsEditing(false);
      toast.success("Settings saved successfully");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpeningHourChange = (
    day: (typeof DAYS_OF_WEEK)[number],
    type: "open" | "close",
    value: string
  ) => {
    setFormData({
      ...formData,
      openingHours: {
        ...formData.openingHours,
        [day]: {
          ...formData.openingHours[day],
          [type]: value,
        },
      },
    });
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading restaurant settings...</span>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600">
            Error Loading Settings
          </h2>
          <p className="text-gray-600 mt-2">{error}</p>
          <Button onClick={fetchRestaurant} className="mt-4" variant="outline">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Show no restaurant state
  if (!restaurant) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">
            No Restaurant Found
          </h2>
          <p className="text-gray-600 mt-2">
            Please set up your restaurant first.
          </p>
        </div>
      </div>
    );
  }

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
                        disabled={isSaving}
                        className={
                          isEditing
                            ? "border-green-600 text-green-600 hover:bg-green-50"
                            : "bg-green-600 hover:bg-green-700 text-white"
                        }
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : isEditing ? (
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
                              src={
                                restaurant.cover_url ||
                                "/placeholder.svg?height=240&width=800"
                              }
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
                                src={
                                  restaurant.logo_url ||
                                  "/placeholder.svg?height=128&width=128"
                                }
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
                            value={formData.name}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
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
                            value={formData.type}
                            onValueChange={(value) =>
                              setFormData({
                                ...formData,
                                type: value as typeof formData.type,
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
                            value={formData.cuisine}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
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
                            value={formData.priceRange}
                            onValueChange={(value) =>
                              setFormData({
                                ...formData,
                                priceRange: value as typeof formData.priceRange,
                              })
                            }
                            disabled={!isEditing}
                          >
                            <SelectTrigger className="transition-all duration-300 focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                              <SelectValue placeholder="Select price range" />
                            </SelectTrigger>
                            <SelectContent>
                              {PRICE_RANGES.map((range) => (
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
                            value={formData.currency}
                            onValueChange={(value) =>
                              setFormData({
                                ...formData,
                                currency: value as Currency,
                              })
                            }
                            disabled={!isEditing}
                          >
                            <SelectTrigger className="transition-all duration-300 focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                              <SelectValue placeholder="Select currency" />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.values(CURRENCIES).map((currency) => (
                                <SelectItem key={currency} value={currency}>
                                  {currency}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {formData.country && (
                            <p className="text-sm text-gray-500">
                              💡 Currency automatically set based on your
                              country selection
                            </p>
                          )}
                        </div>

                        <div className="md:col-span-2">
                          <Label htmlFor="description" className="text-base">
                            Description
                          </Label>
                          <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
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
                            value={formData.email}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
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
                            value={formData.phone}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
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
                            value={formData.taxRate || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                taxRate: parseFloat(e.target.value) || 0,
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
                            value={formData.vatNumber || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
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
                              value={formData.website}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
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
                            value={formData.seatingCapacity}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
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
                              value={formData.address}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
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
                            value={formData.city}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
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
                            value={formData.postalCode}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
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
                          <Select
                            value={formData.country}
                            onValueChange={(value) => {
                              const newFormData = {
                                ...formData,
                                country: value,
                              };

                              // Auto-set currency based on country selection
                              const selectedCountry = COUNTRY_OPTIONS.find(
                                (country) => country.value === value
                              );
                              if (selectedCountry) {
                                newFormData.currency = selectedCountry.currency;
                              }

                              setFormData(newFormData);
                            }}
                            disabled={!isEditing}
                          >
                            <SelectTrigger className="transition-all duration-300 focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                              <SelectValue placeholder="Select your country" />
                            </SelectTrigger>
                            <SelectContent>
                              {COUNTRY_OPTIONS.map((country) => (
                                <SelectItem
                                  key={country.value}
                                  value={country.value}
                                >
                                  {country.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
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
                                  value={formData.openingHours[day].open}
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
                                  value={formData.openingHours[day].close}
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

                    {/* Restaurant Status */}
                    <motion.div variants={itemVariants} className="space-y-6">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Restaurant Status
                      </h3>
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="space-y-1">
                          <Label className="text-base font-medium">
                            Restaurant Status
                          </Label>
                          <p className="text-sm text-gray-500">
                            {restaurant.is_open
                              ? "Currently open for business"
                              : "Currently closed"}
                          </p>
                        </div>
                        <Button
                          onClick={toggleRestaurantStatus}
                          variant={
                            restaurant.is_open ? "destructive" : "default"
                          }
                          className={
                            restaurant.is_open
                              ? "bg-red-600 hover:bg-red-700"
                              : "bg-green-600 hover:bg-green-700"
                          }
                        >
                          {restaurant.is_open
                            ? "Close Restaurant"
                            : "Open Restaurant"}
                        </Button>
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
                            checked={formData.acceptsReservations}
                            onCheckedChange={(checked) =>
                              setFormData({
                                ...formData,
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
                            checked={formData.deliveryAvailable}
                            onCheckedChange={(checked) =>
                              setFormData({
                                ...formData,
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
                            checked={formData.takeoutAvailable}
                            onCheckedChange={(checked) =>
                              setFormData({
                                ...formData,
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
                      Choose which notifications you want to receive
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
