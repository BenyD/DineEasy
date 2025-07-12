"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ArrowLeft,
  Upload,
  MapPin,
  Globe,
  Phone,
  ChefHat,
  Building2,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createRestaurant } from "@/lib/actions/restaurant";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Logo } from "@/components/layout/Logo";
import {
  CURRENCIES,
  CURRENCY_NAMES,
  CURRENCY_SYMBOLS,
  type Currency,
} from "@/lib/constants";

const RESTAURANT_TYPES = [
  { value: "restaurant", label: "Restaurant" },
  { value: "cafe", label: "Cafe" },
  { value: "bar", label: "Bar" },
  { value: "food-truck", label: "Food Truck" },
] as const;

// Currency options for the setup form
const CURRENCY_OPTIONS = [
  { value: "USD", label: "US Dollar ($)" },
  { value: "CHF", label: "Swiss Franc (CHF)" },
  { value: "EUR", label: "Euro (€)" },
  { value: "GBP", label: "British Pound (£)" },
  { value: "INR", label: "Indian Rupee (₹)" },
  { value: "AUD", label: "Australian Dollar (A$)" },
] as const;

const PRICE_RANGES = [
  { value: "$", label: "$ - Budget friendly" },
  { value: "$$", label: "$$  - Moderate" },
  { value: "$$$", label: "$$$ - Upscale" },
  { value: "$$$$", label: "$$$$ - Fine dining" },
] as const;

interface FormData {
  name: string;
  type: string;
  description: string;
  cuisine: string;
  email: string;
  phone: string;
  website: string;
  currency: string;
  tax_rate: string;
  vat_number: string;
  price_range: string;
  logo: File | null;
  coverPhoto: File | null;
  address: string;
  city: string;
  postal_code: string;
  country: string;
  accepts_reservations: boolean;
  delivery_available: boolean;
  takeout_available: boolean;
}

export default function SetupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    type: "",
    description: "",
    cuisine: "",
    email: "",
    phone: "",
    website: "",
    currency: "USD",
    tax_rate: "7.7",
    vat_number: "",
    price_range: "",
    logo: null,
    coverPhoto: null,
    address: "",
    city: "",
    postal_code: "",
    country: "",
    accepts_reservations: false,
    delivery_available: false,
    takeout_available: false,
  });

  const totalSteps = 3;
  const progress = (step / totalSteps) * 100;

  // Check authentication on component mount
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Please sign in to continue");
        router.push("/login");
        return;
      }

      setIsAuthenticated(true);
      setIsCheckingAuth(false);
    };

    checkAuth();
  }, [router]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData({
      ...formData,
      [name]: checked,
    });
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: string
  ) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({
        ...formData,
        [field]: e.target.files[0],
      });
    }
  };

  const handleNext = async () => {
    if (step < totalSteps) {
      setStep(step + 1);
      window.scrollTo(0, 0);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      window.scrollTo(0, 0);
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      // Validate required fields for the current step
      if (
        !formData.name ||
        !formData.type ||
        !formData.email ||
        !formData.currency
      ) {
        toast.error("Please fill in all required fields");
        setIsLoading(false);
        return;
      }

      // Validate file sizes
      if (formData.logo && formData.logo.size > 2 * 1024 * 1024) {
        toast.error("Logo file size must be less than 2MB");
        setIsLoading(false);
        return;
      }

      if (formData.coverPhoto && formData.coverPhoto.size > 5 * 1024 * 1024) {
        toast.error("Cover photo file size must be less than 5MB");
        setIsLoading(false);
        return;
      }

      // Create FormData object with all the collected information
      const submitData = new FormData();
      (
        Object.entries(formData) as [keyof FormData, FormData[keyof FormData]][]
      ).forEach(([key, value]) => {
        if (value !== null && value !== "") {
          if (
            key === "accepts_reservations" ||
            key === "delivery_available" ||
            key === "takeout_available"
          ) {
            submitData.append(key, value.toString());
          } else if (key === "logo" || key === "coverPhoto") {
            if (value instanceof File) {
              submitData.append(key, value);
            }
          } else {
            submitData.append(key, value.toString());
          }
        }
      });

      const result = await createRestaurant(submitData);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Restaurant profile created successfully!");
      router.push("/select-plan");
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    // Only skip non-required fields
    if (
      step === 1 &&
      (!formData.name || !formData.type || !formData.currency)
    ) {
      toast.error("Please fill in all required fields before continuing");
      return;
    }
    if (step === 2 && !formData.email) {
      toast.error("Business email is required");
      return;
    }
    handleNext();
  };

  // Show loading state while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-500 border-t-transparent" />
      </div>
    );
  }

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Background Pattern */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(#e0f2e9_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
          <Logo />
          <div className="text-sm text-gray-500">
            Step {step} of {totalSteps}
          </div>
        </div>
      </div>

      <main className="container max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="space-y-8"
        >
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold">Basic Information</h2>
                <p className="text-gray-500 mt-2">
                  Tell us about your restaurant
                </p>
              </div>

              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">
                        Restaurant Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Enter your restaurant name"
                        className="h-11"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="type">
                        Restaurant Type <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        name="type"
                        value={formData.type}
                        onValueChange={(value) =>
                          handleSelectChange("type", value)
                        }
                        required
                      >
                        <SelectTrigger>
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
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Describe your restaurant"
                        className="min-h-[100px]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cuisine">Cuisine Type</Label>
                      <Input
                        id="cuisine"
                        name="cuisine"
                        value={formData.cuisine}
                        onChange={handleChange}
                        placeholder="e.g., Italian, Japanese, Mediterranean"
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="price_range">Price Range</Label>
                      <Select
                        name="price_range"
                        value={formData.price_range}
                        onValueChange={(value) =>
                          handleSelectChange("price_range", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select price range" />
                        </SelectTrigger>
                        <SelectContent>
                          {PRICE_RANGES.map((range) => (
                            <SelectItem key={range.value} value={range.value}>
                              {range.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="currency">
                          Currency <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          name="currency"
                          value={formData.currency}
                          onValueChange={(value) =>
                            handleSelectChange("currency", value)
                          }
                          required
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                          <SelectContent>
                            {CURRENCY_OPTIONS.map((currency) => (
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
                      <div className="space-y-2">
                        <Label htmlFor="tax_rate">
                          Tax Rate (%) <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="tax_rate"
                          name="tax_rate"
                          type="number"
                          step="0.1"
                          value={formData.tax_rate}
                          onChange={handleChange}
                          className="h-11"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="vat_number">VAT Number</Label>
                      <Input
                        id="vat_number"
                        name="vat_number"
                        value={formData.vat_number}
                        onChange={handleChange}
                        placeholder="Enter your VAT number"
                        className="h-11"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold">Contact & Images</h2>
                <p className="text-gray-500 mt-2">
                  Add your contact information and branding
                </p>
              </div>

              <Card>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="email">
                        Business Email <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="Enter your business email"
                          className="h-11 pl-10"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="Enter your phone number"
                          className="h-11 pl-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="website">Website (Optional)</Label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <Input
                          id="website"
                          name="website"
                          type="url"
                          value={formData.website}
                          onChange={handleChange}
                          placeholder="https://your-restaurant.com"
                          className="h-11 pl-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="logo">Restaurant Logo</Label>
                      <div className="flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50">
                        {formData.logo ? (
                          <div className="text-center">
                            <div className="w-32 h-32 mx-auto bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                              <img
                                src={URL.createObjectURL(
                                  formData.logo as unknown as Blob
                                )}
                                alt="Logo preview"
                                className="max-w-full max-h-full object-contain"
                              />
                            </div>
                            <p className="text-sm text-gray-500 mt-2">
                              {(formData.logo as unknown as File).name}
                            </p>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="mt-2"
                              onClick={() =>
                                setFormData({ ...formData, logo: null })
                              }
                            >
                              Remove
                            </Button>
                          </div>
                        ) : (
                          <div className="text-center">
                            <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                            <p className="mt-2 text-sm text-gray-500">
                              Drag and drop your logo or{" "}
                              <label
                                htmlFor="logo-upload"
                                className="text-green-600 hover:text-green-700 cursor-pointer font-medium"
                              >
                                browse
                                <input
                                  id="logo-upload"
                                  name="logo"
                                  type="file"
                                  className="sr-only"
                                  accept="image/*"
                                  onChange={(e) => handleFileChange(e, "logo")}
                                />
                              </label>
                            </p>
                            <p className="text-xs text-gray-400">
                              PNG, JPG, GIF up to 2MB
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="coverPhoto">Cover Photo</Label>
                      <div className="flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50">
                        {formData.coverPhoto ? (
                          <div className="text-center w-full">
                            <div className="w-full h-48 mx-auto bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                              <img
                                src={URL.createObjectURL(
                                  formData.coverPhoto as unknown as Blob
                                )}
                                alt="Cover photo preview"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <p className="text-sm text-gray-500 mt-2">
                              {(formData.coverPhoto as unknown as File).name}
                            </p>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="mt-2"
                              onClick={() =>
                                setFormData({ ...formData, coverPhoto: null })
                              }
                            >
                              Remove
                            </Button>
                          </div>
                        ) : (
                          <div className="text-center">
                            <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                            <p className="mt-2 text-sm text-gray-500">
                              Drag and drop your cover photo or{" "}
                              <label
                                htmlFor="cover-upload"
                                className="text-green-600 hover:text-green-700 cursor-pointer font-medium"
                              >
                                browse
                                <input
                                  id="cover-upload"
                                  name="coverPhoto"
                                  type="file"
                                  className="sr-only"
                                  accept="image/*"
                                  onChange={(e) =>
                                    handleFileChange(e, "coverPhoto")
                                  }
                                />
                              </label>
                            </p>
                            <p className="text-xs text-gray-400">
                              PNG, JPG, GIF up to 5MB
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold">Location & Services</h2>
                <p className="text-gray-500 mt-2">
                  Enter your restaurant's location and available services
                </p>
              </div>

              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="address">Street Address</Label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <Input
                          id="address"
                          name="address"
                          value={formData.address}
                          onChange={handleChange}
                          placeholder="123 Restaurant Street"
                          className="h-11 pl-10"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          name="city"
                          value={formData.city}
                          onChange={handleChange}
                          placeholder="City"
                          className="h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="postal_code">Postal Code</Label>
                        <Input
                          id="postal_code"
                          name="postal_code"
                          value={formData.postal_code}
                          onChange={handleChange}
                          placeholder="Postal Code"
                          className="h-11"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        name="country"
                        value={formData.country}
                        onChange={handleChange}
                        placeholder="Country"
                        className="h-11"
                      />
                    </div>

                    <div className="pt-6 space-y-4">
                      <h3 className="font-medium text-gray-900">
                        Available Services
                      </h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label
                            htmlFor="accepts_reservations"
                            className="cursor-pointer"
                          >
                            <div>
                              <p className="font-medium">Accept Reservations</p>
                              <p className="text-sm text-gray-500">
                                Allow customers to make table reservations
                              </p>
                            </div>
                          </Label>
                          <Switch
                            id="accepts_reservations"
                            checked={formData.accepts_reservations}
                            onCheckedChange={(checked) =>
                              handleSwitchChange(
                                "accepts_reservations",
                                checked
                              )
                            }
                            className="data-[state=checked]:bg-green-600"
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <Label
                            htmlFor="delivery_available"
                            className="cursor-pointer"
                          >
                            <div>
                              <p className="font-medium">Delivery Service</p>
                              <p className="text-sm text-gray-500">
                                Offer food delivery to customers
                              </p>
                            </div>
                          </Label>
                          <Switch
                            id="delivery_available"
                            checked={formData.delivery_available}
                            onCheckedChange={(checked) =>
                              handleSwitchChange("delivery_available", checked)
                            }
                            className="data-[state=checked]:bg-green-600"
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <Label
                            htmlFor="takeout_available"
                            className="cursor-pointer"
                          >
                            <div>
                              <p className="font-medium">Takeout Available</p>
                              <p className="text-sm text-gray-500">
                                Allow customers to pick up their orders
                              </p>
                            </div>
                          </Label>
                          <Switch
                            id="takeout_available"
                            checked={formData.takeout_available}
                            onCheckedChange={(checked) =>
                              handleSwitchChange("takeout_available", checked)
                            }
                            className="data-[state=checked]:bg-green-600"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-4">
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="flex items-start gap-3">
                          <MapPin className="h-5 w-5 text-green-600 mt-0.5" />
                          <div>
                            <h3 className="font-medium text-sm">
                              Why we need your address
                            </h3>
                            <p className="text-xs text-gray-500 mt-1">
                              Your address will be displayed on your digital
                              menu and receipts. It helps customers find your
                              restaurant and is required for payment processing.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="flex justify-between pt-6">
            {step > 1 ? (
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={isLoading}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            ) : (
              <div></div>
            )}

            <div className="flex gap-3">
              {step < totalSteps && (
                <Button variant="ghost" onClick={handleSkip}>
                  Skip for now
                </Button>
              )}
              <Button
                onClick={handleNext}
                disabled={isLoading}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    {step === totalSteps
                      ? "Creating Restaurant..."
                      : "Saving..."}
                  </div>
                ) : (
                  <>
                    {step === totalSteps ? "Create Restaurant" : "Continue"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
