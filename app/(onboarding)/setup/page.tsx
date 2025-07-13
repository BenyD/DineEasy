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
  CreditCard,
  Shield,
  Zap,
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
  COUNTRY_OPTIONS,
  type Currency,
} from "@/lib/constants";
import { getOnboardingStatus, redirectToOnboardingStep } from "@/lib/utils";

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
  { value: "vietnamese", label: "Vietnamese" },
  { value: "lebanese", label: "Lebanese" },
  { value: "turkish", label: "Turkish" },
  { value: "moroccan", label: "Moroccan" },
  { value: "brazilian", label: "Brazilian" },
  { value: "peruvian", label: "Peruvian" },
  { value: "caribbean", label: "Caribbean" },
  { value: "african", label: "African" },
  { value: "middle-eastern", label: "Middle Eastern" },
  { value: "seafood", label: "Seafood" },
  { value: "steakhouse", label: "Steakhouse" },
  { value: "pizza", label: "Pizza" },
  { value: "burger", label: "Burgers" },
  { value: "sushi", label: "Sushi" },
  { value: "bbq", label: "BBQ" },
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "gluten-free", label: "Gluten-Free" },
  { value: "fusion", label: "Fusion" },
  { value: "other", label: "Other" },
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

  const [userEmail, setUserEmail] = useState<string>("");

  // Add state to track previous values for change detection
  const [previousValues, setPreviousValues] = useState({
    country: "",
    currency: "USD",
  });

  // Add validation state
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  // Validation functions
  const validateField = (name: string, value: any): string | null => {
    switch (name) {
      case "name":
        return !value?.trim() ? "Restaurant name is required" : null;
      case "type":
        return !value ? "Restaurant type is required" : null;
      case "email":
        if (!value?.trim()) return "Business email is required";
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return !emailRegex.test(value)
          ? "Please enter a valid email address"
          : null;
      case "phone":
        if (!value?.trim()) return null; // Optional field
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        const cleanPhone = value.replace(/[\s\-\(\)]/g, "");
        return !phoneRegex.test(cleanPhone)
          ? "Please enter a valid phone number"
          : null;
      case "website":
        if (!value?.trim()) return null; // Optional field
        try {
          new URL(value.startsWith("http") ? value : `https://${value}`);
          return null;
        } catch {
          return "Please enter a valid website URL";
        }
      case "address":
        return !value?.trim() ? "Street address is required" : null;
      case "city":
        return !value?.trim() ? "City is required" : null;
      case "postal_code":
        return !value?.trim() ? "Postal code is required" : null;
      case "country":
        return !value ? "Country is required" : null;
      case "currency":
        return !value ? "Currency is required" : null;
      case "tax_rate":
        if (!value || parseFloat(value) < 0)
          return "Valid tax rate is required";
        return null;
      default:
        return null;
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Real-time validation
    const error = validateField(name, value);
    setValidationErrors((prev) => ({
      ...prev,
      [name]: error || "",
    }));
  };

  // Add a helper to map currency to country
  const getCountryByCurrency = (currency: string) => {
    const country = COUNTRY_OPTIONS.find((c) => c.currency === currency);
    return country ? country.value : "";
  };

  // Auto-sync country and currency on step 1
  useEffect(() => {
    if (step === 1) {
      // Auto-set country based on currency if country is not set
      if (!formData.country && formData.currency) {
        const countryForCurrency = getCountryByCurrency(formData.currency);
        if (countryForCurrency) {
          setFormData((prev) => ({ ...prev, country: countryForCurrency }));
        }
      }
      // Auto-set currency based on country if currency doesn't match
      if (formData.country && formData.currency) {
        const countryForCurrency = getCountryByCurrency(formData.currency);
        if (
          countryForCurrency &&
          COUNTRY_OPTIONS.find((c) => c.value === formData.country)
            ?.currency !== formData.currency
        ) {
          setFormData((prev) => ({ ...prev, country: countryForCurrency }));
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.currency, step]);

  const handleSelectChange = (name: string, value: string) => {
    let newFormData = {
      ...formData,
      [name]: value,
    };

    let showFeedback = false;
    let feedbackMessage = "";

    // Auto-set currency based on country selection
    if (name === "country") {
      const selectedCountry = COUNTRY_OPTIONS.find(
        (country) => country.value === value
      );
      if (selectedCountry && selectedCountry.currency !== formData.currency) {
        newFormData.currency = selectedCountry.currency;
        showFeedback = true;
        feedbackMessage = `Currency automatically updated to ${selectedCountry.currency} for ${selectedCountry.label.split(" ")[1]}`;
      }
    }

    // Auto-set country based on currency selection
    if (name === "currency") {
      const countryForCurrency = getCountryByCurrency(value);
      const currentCountry = COUNTRY_OPTIONS.find(
        (c) => c.value === formData.country
      );

      // Only update if country is not set or doesn't match the currency
      if (
        !formData.country ||
        (currentCountry && currentCountry.currency !== value)
      ) {
        if (countryForCurrency) {
          newFormData.country = countryForCurrency;
          showFeedback = true;
          const countryName =
            COUNTRY_OPTIONS.find(
              (c) => c.value === countryForCurrency
            )?.label.split(" ")[1] || countryForCurrency;
          feedbackMessage = `Country automatically updated to ${countryName} for ${value} currency`;
        }
      }
    }

    // Update previous values
    setPreviousValues({
      country: formData.country,
      currency: formData.currency,
    });

    setFormData(newFormData);

    // Show feedback toast if automatic update occurred
    if (showFeedback) {
      toast.info("Auto-update", {
        description: feedbackMessage,
        duration: 3000,
      });
    }
  };

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

      // Set the user's email for the business email field
      setUserEmail(user.email || "");
      setFormData((prev) => ({
        ...prev,
        email: user.email || "",
      }));

      // Check if user should be on this page
      const onboardingStatus = await getOnboardingStatus(supabase);

      if (onboardingStatus.step !== "setup") {
        // User has already completed this step or needs to go to a different step
        redirectToOnboardingStep(
          onboardingStatus.step,
          router,
          onboardingStatus.emailVerified
        );
        return;
      }

      setIsAuthenticated(true);
      setIsCheckingAuth(false);
    };

    checkAuth();
  }, [router]);

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

  const validateCurrentStep = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (step === 1) {
      if (!formData.name?.trim()) errors.push("Restaurant name is required");
      if (!formData.type) errors.push("Restaurant type is required");
      if (!formData.currency) errors.push("Currency is required");
      if (!formData.tax_rate || parseFloat(formData.tax_rate) < 0) {
        errors.push("Valid tax rate is required");
      }
    }

    if (step === 2) {
      if (!formData.email?.trim()) {
        errors.push("Business email is required");
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
          errors.push("Please enter a valid business email address");
        }
      }
    }

    if (step === 3) {
      if (!formData.address?.trim()) errors.push("Street address is required");
      if (!formData.city?.trim()) errors.push("City is required");
      if (!formData.postal_code?.trim()) errors.push("Postal code is required");
      if (!formData.country) errors.push("Country is required");
    }

    return { isValid: errors.length === 0, errors };
  };

  const handleNext = async () => {
    // Validate current step before proceeding
    const validation = validateCurrentStep();

    if (!validation.isValid) {
      toast.error("Please complete all required fields:", {
        description: validation.errors.join(", "),
      });
      return;
    }

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
      // Comprehensive validation for all steps
      const validationErrors: string[] = [];

      // Step 1 validation
      if (!formData.name?.trim()) {
        validationErrors.push("Restaurant name is required");
      }
      if (!formData.type) {
        validationErrors.push("Restaurant type is required");
      }
      if (!formData.currency) {
        validationErrors.push("Currency is required");
      }
      if (!formData.tax_rate || parseFloat(formData.tax_rate) < 0) {
        validationErrors.push("Valid tax rate is required");
      }

      // Step 2 validation
      if (!formData.email?.trim()) {
        validationErrors.push("Business email is required");
      } else {
        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
          validationErrors.push("Please enter a valid business email address");
        }
      }

      // Step 3 validation - Make location fields required for better business setup
      if (!formData.address?.trim()) {
        validationErrors.push("Street address is required");
      }
      if (!formData.city?.trim()) {
        validationErrors.push("City is required");
      }
      if (!formData.postal_code?.trim()) {
        validationErrors.push("Postal code is required");
      }
      if (!formData.country) {
        validationErrors.push("Country is required");
      }

      // Phone number validation (optional but if provided, should be valid)
      if (formData.phone?.trim()) {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        const cleanPhone = formData.phone.replace(/[\s\-\(\)]/g, "");
        if (!phoneRegex.test(cleanPhone)) {
          validationErrors.push("Please enter a valid phone number");
        }
      }

      // Website validation (optional but if provided, should be valid)
      if (formData.website?.trim()) {
        try {
          new URL(
            formData.website.startsWith("http")
              ? formData.website
              : `https://${formData.website}`
          );
        } catch {
          validationErrors.push("Please enter a valid website URL");
        }
      }

      // File validation
      if (formData.logo && formData.logo.size > 2 * 1024 * 1024) {
        validationErrors.push("Logo file size must be less than 2MB");
      }
      if (formData.coverPhoto && formData.coverPhoto.size > 5 * 1024 * 1024) {
        validationErrors.push("Cover photo file size must be less than 5MB");
      }

      // File type validation
      if (formData.logo) {
        const allowedTypes = [
          "image/jpeg",
          "image/png",
          "image/gif",
          "image/webp",
        ];
        if (!allowedTypes.includes(formData.logo.type)) {
          validationErrors.push(
            "Logo must be a valid image file (JPEG, PNG, GIF, or WebP)"
          );
        }
      }
      if (formData.coverPhoto) {
        const allowedTypes = [
          "image/jpeg",
          "image/png",
          "image/gif",
          "image/webp",
        ];
        if (!allowedTypes.includes(formData.coverPhoto.type)) {
          validationErrors.push(
            "Cover photo must be a valid image file (JPEG, PNG, GIF, or WebP)"
          );
        }
      }

      if (validationErrors.length > 0) {
        toast.error("Please fix the following errors:", {
          description: validationErrors.join(", "),
        });
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
    // Use the same validation logic as handleNext
    const validation = validateCurrentStep();

    if (!validation.isValid) {
      toast.error("Please complete all required fields:", {
        description: validation.errors.join(", "),
      });
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
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="font-medium">
                Step {step} of {totalSteps}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="border-b bg-white/60 backdrop-blur-sm">
        <div className="container max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-500">
              <span className={step >= 1 ? "text-green-600 font-medium" : ""}>
                Basic Information
              </span>
              <span className={step >= 2 ? "text-green-600 font-medium" : ""}>
                Contact & Images
              </span>
              <span className={step >= 3 ? "text-green-600 font-medium" : ""}>
                Location & Services
              </span>
            </div>
            <Progress value={progress} className="h-2" />
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

              {/* Info box about auto-sync */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="text-blue-600 mt-0.5">
                    <svg
                      className="h-5 w-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-blue-900 text-sm">
                      Country & Currency Auto-Sync
                    </h3>
                    <p className="text-blue-700 text-xs mt-1">
                      When you select a country, the currency will automatically
                      update to match. Similarly, changing the currency will
                      update the country. You'll see a notification when this
                      happens.
                    </p>
                  </div>
                </div>
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
                      {validationErrors.name && (
                        <p className="text-red-500 text-xs mt-1">
                          {validationErrors.name}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="type">
                        Restaurant Type <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={formData.type}
                        onValueChange={(value) =>
                          handleSelectChange("type", value)
                        }
                      >
                        <SelectTrigger className="h-11">
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
                      {validationErrors.type && (
                        <p className="text-red-500 text-xs mt-1">
                          {validationErrors.type}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="cuisine">Cuisine Type</Label>
                        <Select
                          name="cuisine"
                          value={formData.cuisine}
                          onValueChange={(value) =>
                            handleSelectChange("cuisine", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select cuisine" />
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
                        <Label htmlFor="price_range">Price Range</Label>
                        <Select
                          name="price_range"
                          value={formData.price_range}
                          onValueChange={(value) =>
                            handleSelectChange("price_range", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select range" />
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
                        {validationErrors.currency && (
                          <p className="text-red-500 text-xs mt-1">
                            {validationErrors.currency}
                          </p>
                        )}
                        {/* Show feedback when currency was auto-updated */}
                        {previousValues.currency &&
                          previousValues.currency !== formData.currency &&
                          formData.country && (
                            <p className="text-blue-600 text-xs mt-1 flex items-center gap-1">
                              <span>✓</span>
                              Auto-updated for{" "}
                              {
                                COUNTRY_OPTIONS.find(
                                  (c) => c.value === formData.country
                                )?.label.split(" ")[1]
                              }
                            </p>
                          )}
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
                        {validationErrors.tax_rate && (
                          <p className="text-red-500 text-xs mt-1">
                            {validationErrors.tax_rate}
                          </p>
                        )}
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
                          disabled
                          className="h-11 pl-10 bg-gray-50 cursor-not-allowed"
                          required
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        This is your signup email address. It will be used for
                        all business communications, receipts, and
                        notifications.
                      </p>
                      {validationErrors.email && (
                        <p className="text-red-500 text-xs mt-1">
                          {validationErrors.email}
                        </p>
                      )}
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
                      {validationErrors.phone && (
                        <p className="text-red-500 text-xs mt-1">
                          {validationErrors.phone}
                        </p>
                      )}
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
                      {validationErrors.website && (
                        <p className="text-red-500 text-xs mt-1">
                          {validationErrors.website}
                        </p>
                      )}
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
                      <Label htmlFor="address">
                        Street Address <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <Input
                          id="address"
                          name="address"
                          value={formData.address}
                          onChange={handleChange}
                          placeholder="123 Restaurant Street"
                          className="h-11 pl-10"
                          required
                        />
                      </div>
                      {validationErrors.address && (
                        <p className="text-red-500 text-xs mt-1">
                          {validationErrors.address}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city">
                          City <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="city"
                          name="city"
                          value={formData.city}
                          onChange={handleChange}
                          placeholder="City"
                          className="h-11"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="postal_code">
                          Postal Code <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="postal_code"
                          name="postal_code"
                          value={formData.postal_code}
                          onChange={handleChange}
                          placeholder="Postal Code"
                          className="h-11"
                          required
                        />
                      </div>
                    </div>
                    {validationErrors.postal_code && (
                      <p className="text-red-500 text-xs mt-1">
                        {validationErrors.postal_code}
                      </p>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="country">
                        Country <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        name="country"
                        value={formData.country}
                        onValueChange={(value) =>
                          handleSelectChange("country", value)
                        }
                        required
                      >
                        <SelectTrigger>
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
                      {validationErrors.country && (
                        <p className="text-red-500 text-xs mt-1">
                          {validationErrors.country}
                        </p>
                      )}
                      {/* Show feedback when country was auto-updated */}
                      {previousValues.country &&
                        previousValues.country !== formData.country &&
                        formData.currency && (
                          <p className="text-blue-600 text-xs mt-1 flex items-center gap-1">
                            <span>✓</span>
                            Auto-updated for {formData.currency} currency
                          </p>
                        )}
                      {/* Show Stripe Connect availability */}
                      {formData.country && (
                        <div className="text-xs mt-1">
                          {COUNTRY_OPTIONS.find(
                            (c) => c.value === formData.country
                          )?.stripeConnect ? (
                            <p className="text-green-600 flex items-center gap-1">
                              <span>✓</span>
                              Full payment processing available
                            </p>
                          ) : (
                            <p className="text-amber-600 flex items-center gap-1">
                              <span>⚠</span>
                              Cash payments only - contact support for payment
                              processing
                            </p>
                          )}
                        </div>
                      )}
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
              {step < totalSteps && validateCurrentStep().isValid && (
                <Button variant="ghost" onClick={handleSkip}>
                  Skip for now
                </Button>
              )}
              <Button
                onClick={handleNext}
                disabled={isLoading}
                className={`${
                  validateCurrentStep().isValid
                    ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                    : "bg-gray-300 cursor-not-allowed"
                }`}
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
