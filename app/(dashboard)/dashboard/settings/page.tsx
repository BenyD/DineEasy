"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  updateProfileWithLiveUpdate,
  deleteAvatarWithLiveUpdate,
} from "@/lib/actions/profile-client";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  updateRestaurantImagesWithLiveUpdate,
  removeRestaurantImageWithLiveUpdate,
} from "@/lib/actions/restaurant-client";

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

const CUISINE_TYPES = [
  { value: "italian", label: "Italian" },
  { value: "japanese", label: "Japanese" },
  { value: "chinese", label: "Chinese" },
  { value: "indian", label: "Indian" },
  { value: "mexican", label: "Mexican" },
  { value: "thai", label: "Thai" },
  { value: "french", label: "French" },
  { value: "mediterranean", label: "Mediterranean" },
  { value: "american", label: "American" },
  { value: "greek", label: "Greek" },
  { value: "spanish", label: "Spanish" },
  { value: "korean", label: "Korean" },
  { value: "seafood", label: "Seafood" },
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "fusion", label: "Fusion" },
  { value: "other", label: "Other" },
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
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("restaurant");
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

  // Fetch profile data on component mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { data: profile, error } = await supabase
            .from("profiles")
            .select("full_name, avatar_url")
            .eq("id", user.id)
            .single();

          if (!error && profile) {
            setProfileData({
              fullName: profile.full_name || "",
              avatarUrl: profile.avatar_url || "",
            });
          }
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };

    fetchProfile();
  }, []);

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

  // Profile state
  const [isProfileEditing, setIsProfileEditing] = useState(false);
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [profileData, setProfileData] = useState({
    fullName: "",
    avatarUrl: "",
  });
  const [selectedAvatar, setSelectedAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Restaurant image upload state
  const [selectedLogo, setSelectedLogo] = useState<File | null>(null);
  const [selectedCover, setSelectedCover] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  // Handle tab switching from URL parameters
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && ["restaurant", "profile", "notifications"].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

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
      // Handle image uploads first if any
      if (selectedLogo || selectedCover) {
        const formData = new FormData();

        if (selectedLogo) {
          formData.append("logo", selectedLogo);
        }

        if (selectedCover) {
          formData.append("cover", selectedCover);
        }

        const imageResult =
          await updateRestaurantImagesWithLiveUpdate(formData);

        if (imageResult.error) {
          toast.error(imageResult.error);
          return;
        }

        // Clear the image form
        setSelectedLogo(null);
        setSelectedCover(null);
        setLogoPreview(null);
        setCoverPreview(null);
      }

      // Update restaurant data (email is locked and cannot be changed)
      await updateRestaurant({
        name: formData.name,
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

  // Profile handling functions
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check if file exists
      if (!file) {
        toast.error("No file selected");
        return;
      }

      // Check if file is empty
      if (file.size === 0) {
        toast.error("File is empty");
        return;
      }

      // Check if file is too small (corrupted)
      if (file.size < 10) {
        toast.error("File appears to be corrupted or empty");
        return;
      }

      // Validate file size (1MB limit)
      if (file.size > 1 * 1024 * 1024) {
        toast.error("Avatar file size must be less than 1MB");
        return;
      }

      // Validate file type
      const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Avatar must be a JPEG, PNG, or WebP image");
        return;
      }

      // Validate file extension
      const fileExtension = file.name.split(".").pop()?.toLowerCase();
      if (
        !fileExtension ||
        !["jpg", "jpeg", "png", "webp"].includes(fileExtension)
      ) {
        toast.error("Invalid file extension. Allowed: jpg, jpeg, png, webp");
        return;
      }

      setSelectedAvatar(file);

      // Create preview with error handling
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.onerror = () => {
        toast.error("Failed to read file. Please try a different image.");
        setSelectedAvatar(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileSave = async () => {
    setIsProfileSaving(true);
    try {
      const formData = new FormData();
      formData.append("full_name", profileData.fullName);

      if (selectedAvatar) {
        formData.append("avatar", selectedAvatar);
      }

      const result = await updateProfileWithLiveUpdate(formData);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      // Update local state
      if (selectedAvatar && avatarPreview) {
        setProfileData((prev) => ({
          ...prev,
          avatarUrl: avatarPreview,
        }));
      }

      setSelectedAvatar(null);
      setAvatarPreview(null);
      setIsProfileEditing(false);
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsProfileSaving(false);
    }
  };

  const handleDeleteAvatar = async () => {
    try {
      const result = await deleteAvatarWithLiveUpdate();

      if (result.error) {
        toast.error(result.error);
        return;
      }

      setProfileData((prev) => ({
        ...prev,
        avatarUrl: "",
      }));
      setSelectedAvatar(null);
      setAvatarPreview(null);
      toast.success("Avatar removed successfully");
    } catch (error) {
      console.error("Error deleting avatar:", error);
      toast.error("Failed to delete avatar");
    }
  };

  // Restaurant image handling functions
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (1MB limit)
      if (file.size > 1 * 1024 * 1024) {
        toast.error("Logo file size must be less than 1MB");
        return;
      }

      // Validate file type
      const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Logo must be a JPEG, PNG, or WebP image");
        return;
      }

      setSelectedLogo(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please select a valid image file");
        return;
      }

      // Validate file size (1MB limit)
      if (file.size > 1 * 1024 * 1024) {
        toast.error("Image size must be less than 1MB");
        return;
      }

      setSelectedCover(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setCoverPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = async () => {
    try {
      const result = await removeRestaurantImageWithLiveUpdate("logo");

      if (result.error) {
        toast.error(result.error);
        return;
      }

      setSelectedLogo(null);
      setLogoPreview(null);
      toast.success("Logo removed successfully");

      // Refresh restaurant data
      fetchRestaurant();
    } catch (error) {
      console.error("Error removing logo:", error);
      toast.error("Failed to remove logo");
    }
  };

  const handleRemoveCover = async () => {
    try {
      const result = await removeRestaurantImageWithLiveUpdate("cover");

      if (result.error) {
        toast.error(result.error);
        return;
      }

      setSelectedCover(null);
      setCoverPreview(null);
      toast.success("Cover photo removed successfully");

      // Refresh restaurant data
      fetchRestaurant();
    } catch (error) {
      console.error("Error removing cover photo:", error);
      toast.error("Failed to remove cover photo");
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        {/* Header Skeleton */}
        <div className="space-y-1">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-6 w-80" />
        </div>

        {/* Tabs Skeleton */}
        <div className="space-y-8">
          <div className="flex space-x-2 max-w-[400px]">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-32" />
          </div>

          {/* Restaurant Info Tab Content Skeleton */}
          <div className="space-y-6">
            {/* Basic Information Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div className="space-y-2">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-64" />
                </div>
                <Skeleton className="h-10 w-24" />
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Media Section */}
                <div className="space-y-6">
                  <Skeleton className="h-6 w-20" />

                  {/* Cover Photo Skeleton */}
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-60 w-full rounded-lg" />
                    <Skeleton className="h-4 w-64" />
                  </div>

                  {/* Logo Skeleton */}
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-28" />
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-32 w-32 rounded-lg" />
                      <Skeleton className="h-10 w-24" />
                    </div>
                    <Skeleton className="h-4 w-56" />
                  </div>
                </div>

                <Separator />

                {/* Basic Details */}
                <div className="space-y-6">
                  <Skeleton className="h-6 w-32" />

                  {/* Form Fields Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="space-y-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                    ))}
                  </div>

                  {/* Textarea */}
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-24 w-full" />
                  </div>

                  {/* Select Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="space-y-2">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Business Details */}
                <div className="space-y-6">
                  <Skeleton className="h-6 w-36" />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="space-y-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Opening Hours */}
                <div className="space-y-6">
                  <Skeleton className="h-6 w-32" />

                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <Skeleton className="h-4 w-20" />
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-10 w-20" />
                          <span className="text-gray-400">to</span>
                          <Skeleton className="h-10 w-20" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
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
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-8"
        >
          <TabsList className="grid w-full max-w-[600px] grid-cols-3">
            <TabsTrigger value="restaurant">Restaurant</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
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
                        onClick={() => {
                          if (isEditing) {
                            handleSave();
                          } else {
                            setIsEditing(true);
                          }
                        }}
                        disabled={isSaving || isUploadingImages}
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
                        <div className="space-y-4">
                          <div className="relative w-full h-[240px] bg-gray-100 rounded-lg overflow-hidden">
                            <img
                              src={
                                coverPreview ||
                                restaurant.cover_url ||
                                "/placeholder.svg?height=240&width=800"
                              }
                              alt="Restaurant cover"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          {isEditing && (
                            <>
                              <div>
                                <Label
                                  htmlFor="cover-upload"
                                  className="text-base"
                                >
                                  Upload New Cover Photo
                                </Label>
                                <Input
                                  id="cover-upload"
                                  type="file"
                                  accept="image/*"
                                  onChange={handleCoverChange}
                                  className="mt-2"
                                  disabled={isSaving}
                                />
                                <p className="text-sm text-gray-500 mt-1">
                                  Recommended size: 1920x640 pixels. Max file
                                  size: 1MB. Supported: JPEG, PNG, WebP.
                                </p>
                              </div>
                              {(coverPreview || restaurant.cover_url) && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={handleRemoveCover}
                                  disabled={isSaving}
                                  className="text-red-600 border-red-200 hover:bg-red-50"
                                >
                                  Remove Current Cover Photo
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      {/* Logo Upload */}
                      <div className="space-y-3">
                        <Label className="text-base">Restaurant Logo</Label>
                        <div className="space-y-4">
                          <div className="flex items-center gap-6">
                            <div className="relative">
                              <div className="w-32 h-32 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                <img
                                  src={
                                    logoPreview ||
                                    restaurant.logo_url ||
                                    "/placeholder.svg?height=128&width=128"
                                  }
                                  alt="Restaurant logo"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            </div>
                            <div className="space-y-3">
                              {isEditing && (
                                <>
                                  <div>
                                    <Label
                                      htmlFor="logo-upload"
                                      className="text-base"
                                    >
                                      Upload New Logo
                                    </Label>
                                    <Input
                                      id="logo-upload"
                                      type="file"
                                      accept="image/*"
                                      onChange={handleLogoChange}
                                      className="mt-2"
                                      disabled={isSaving}
                                    />
                                    <p className="text-sm text-gray-500 mt-1">
                                      Recommended size: 400x400 pixels. Max file
                                      size: 1MB. Supported: JPEG, PNG, WebP.
                                    </p>
                                  </div>
                                  {(logoPreview || restaurant.logo_url) && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={handleRemoveLogo}
                                      disabled={isSaving}
                                      className="text-red-600 border-red-200 hover:bg-red-50"
                                    >
                                      Remove Current Logo
                                    </Button>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
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
                          <Select
                            value={formData.cuisine}
                            onValueChange={(value) =>
                              setFormData({
                                ...formData,
                                cuisine: value as typeof formData.cuisine,
                              })
                            }
                            disabled={!isEditing}
                          >
                            <SelectTrigger className="transition-all duration-300 focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                              <SelectValue placeholder="Select cuisine type" />
                            </SelectTrigger>
                            <SelectContent>
                              {CUISINE_TYPES.map((cuisine) => (
                                <SelectItem
                                  key={cuisine.value}
                                  value={cuisine.value}
                                >
                                  {cuisine.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
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
                          <Label
                            htmlFor="currency"
                            className="text-base flex items-center gap-2"
                          >
                            Currency
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                              Locked
                            </span>
                          </Label>
                          <Select
                            value={formData.currency}
                            onValueChange={(value) =>
                              setFormData({
                                ...formData,
                                currency: value as Currency,
                              })
                            }
                            disabled={true}
                          >
                            <SelectTrigger className="transition-all duration-300 focus:ring-2 focus:ring-offset-2 focus:ring-green-500 bg-gray-50 cursor-not-allowed">
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
                          <p className="text-sm text-gray-500">
                            🔒 Currency is locked and cannot be changed after
                            setup
                          </p>
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
                          <Label
                            htmlFor="email"
                            className="text-base flex items-center gap-2"
                          >
                            Email Address
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                              Locked
                            </span>
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
                            className="transition-all duration-300 focus:ring-2 focus:ring-offset-2 focus:ring-green-500 bg-gray-50 cursor-not-allowed"
                            disabled={true}
                          />
                          <p className="text-sm text-gray-500">
                            🔒 Email address is locked and cannot be changed.
                            This is your signup email used for all business
                            communications.
                          </p>
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
                            MWST Number
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
                          <p className="text-xs text-gray-500 mt-1">
                            Swiss VAT number (Mehrwertsteuer) - format:
                            CHE-XXX.XXX.XXX
                          </p>
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
                          <Label
                            htmlFor="country"
                            className="text-base flex items-center gap-2"
                          >
                            Country
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                              Locked
                            </span>
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
                                newFormData.currency =
                                  selectedCountry.currency as Currency;
                              }

                              setFormData(newFormData);
                            }}
                            disabled={true}
                          >
                            <SelectTrigger className="transition-all duration-300 focus:ring-2 focus:ring-offset-2 focus:ring-green-500 bg-gray-50 cursor-not-allowed">
                              <SelectValue placeholder="Select your country" />
                            </SelectTrigger>
                            <SelectContent>
                              {COUNTRY_OPTIONS.map((country) => (
                                <SelectItem
                                  key={country.value}
                                  value={country.value}
                                >
                                  <div className="flex items-center justify-between w-full">
                                    <span>{country.label}</span>
                                    {!country.stripeConnect && (
                                      <span className="text-xs text-amber-600 ml-2">
                                        Limited payment options
                                      </span>
                                    )}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <p className="text-sm text-gray-500">
                            🔒 Country is locked and cannot be changed after
                            setup
                          </p>
                          {/* Show Stripe Connect availability */}
                          {restaurant.country && (
                            <div className="text-xs mt-1">
                              {COUNTRY_OPTIONS.find(
                                (c) => c.value === restaurant.country
                              )?.stripeConnect ? (
                                <p className="text-green-600 flex items-center gap-1">
                                  <span>✓</span>
                                  Full payment processing available
                                </p>
                              ) : (
                                <p className="text-amber-600 flex items-center gap-1">
                                  <span>⚠</span>
                                  Cash payments only - contact support for
                                  payment processing
                                </p>
                              )}
                            </div>
                          )}
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

          {/* Profile */}
          <TabsContent value="profile">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="space-y-6"
            >
              <motion.div variants={cardVariants} whileHover="hover">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <div>
                      <CardTitle>Profile Information</CardTitle>
                      <CardDescription>
                        Update your personal profile and avatar
                      </CardDescription>
                    </div>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        variant={isProfileEditing ? "outline" : "default"}
                        onClick={() =>
                          isProfileEditing
                            ? handleProfileSave()
                            : setIsProfileEditing(true)
                        }
                        disabled={isProfileSaving}
                        className={
                          isProfileEditing
                            ? "border-green-600 text-green-600 hover:bg-green-50"
                            : "bg-green-600 hover:bg-green-700 text-white"
                        }
                      >
                        {isProfileSaving ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : isProfileEditing ? (
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
                    {/* Avatar Section */}
                    <motion.div variants={itemVariants} className="space-y-6">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Profile Picture
                      </h3>
                      <div className="space-y-4">
                        <div className="flex items-center gap-6">
                          <div className="relative">
                            <Avatar className="h-24 w-24 rounded-xl border-2 border-white shadow-lg">
                              <AvatarImage
                                src={
                                  avatarPreview ||
                                  profileData.avatarUrl ||
                                  "/placeholder.svg?height=96&width=96"
                                }
                                alt="Profile picture"
                                className="object-cover"
                              />
                              <AvatarFallback className="rounded-xl bg-gradient-to-br from-green-50 to-emerald-100 text-emerald-700 font-semibold text-2xl">
                                {profileData.fullName
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .toUpperCase()
                                  .slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                          <div className="space-y-3">
                            {isProfileEditing && (
                              <>
                                <div>
                                  <Label htmlFor="avatar" className="text-base">
                                    Upload New Picture
                                  </Label>
                                  <Input
                                    id="avatar"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleAvatarChange}
                                    className="mt-2"
                                    disabled={isProfileSaving}
                                  />
                                  <p className="text-sm text-gray-500 mt-1">
                                    Recommended size: 400x400 pixels. Max file
                                    size: 1MB. Supported: JPEG, PNG, WebP.
                                  </p>
                                </div>
                                {profileData.avatarUrl && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleDeleteAvatar}
                                    disabled={isProfileSaving}
                                    className="text-red-600 border-red-200 hover:bg-red-50"
                                  >
                                    Remove Current Picture
                                  </Button>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>

                    <Separator />

                    {/* Basic Information */}
                    <motion.div variants={itemVariants} className="space-y-6">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Basic Information
                      </h3>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="fullName" className="text-base">
                            Full Name <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="fullName"
                            value={profileData.fullName}
                            onChange={(e) =>
                              setProfileData({
                                ...profileData,
                                fullName: e.target.value,
                              })
                            }
                            className="transition-all duration-300 focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            disabled={!isProfileEditing}
                            placeholder="Enter your full name"
                          />
                          <p className="text-sm text-gray-500">
                            This name will be displayed in the sidebar and used
                            for communications.
                          </p>
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
