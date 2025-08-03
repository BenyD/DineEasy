"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { updateRestaurant } from "@/lib/actions/restaurant";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";  
import { toast } from "sonner";
import { clearOnboardingProgress } from "@/lib/utils";

interface FormData {
  description: string;
  cuisine: string;
  phone: string;
  website: string;
  address: string;
  city: string;
  postal_code: string;
  seating_capacity: string;
  accepts_reservations: boolean;
  delivery_available: boolean;
  takeout_available: boolean;
}

export default function AdditionalSetupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [hasResumed, setHasResumed] = useState(false);

  // Initialize form data with localStorage persistence
  const [formData, setFormData] = useState<FormData>(() => {
    // Load from localStorage on component mount
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("additional-setup-form-data");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          return {
            description: parsed.description || "",
            cuisine: parsed.cuisine || "",
            phone: parsed.phone || "",
            website: parsed.website || "",
            address: parsed.address || "",
            city: parsed.city || "",
            postal_code: parsed.postal_code || "",
            seating_capacity: parsed.seating_capacity || "",
            accepts_reservations: parsed.accepts_reservations || false,
            delivery_available: parsed.delivery_available || false,
            takeout_available: parsed.takeout_available || false,
          };
        } catch (error) {
          console.error("Error parsing saved form data:", error);
        }
      }
    }
    return {
      description: "",
      cuisine: "",
      phone: "",
      website: "",
      address: "",
      city: "",
      postal_code: "",
      seating_capacity: "",
      accepts_reservations: false,
      delivery_available: false,
      takeout_available: false,
    };
  });

  // Save form data whenever it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "additional-setup-form-data",
        JSON.stringify(formData)
      );
    }
  }, [formData]);

  // Check for resumed data on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedData = localStorage.getItem("additional-setup-form-data");

      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          // Check if any field has data
          const hasData = Object.values(parsed).some(
            (value) =>
              value !== "" &&
              value !== false &&
              value !== null &&
              value !== undefined
          );

          if (hasData) {
            setHasResumed(true);
            // Show resume notification after a short delay
            setTimeout(() => {
              toast.info(
                "Welcome back! Your previous progress has been restored.",
                {
                  duration: 4000,
                }
              );
            }, 1000);
          }
        } catch (error) {
          console.error("Error checking for resumed data:", error);
        }
      }
    }
  }, []);

  // Handle page unload to ensure data is saved
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Save current progress before user leaves
      if (typeof window !== "undefined") {
        localStorage.setItem(
          "additional-setup-form-data",
          JSON.stringify(formData)
        );
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [formData]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);

    try {
      const submitFormData = new FormData();

      // Add all form data to FormData object
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== "") {
          if (typeof value === "boolean") {
            submitFormData.append(key, value.toString());
          } else {
            submitFormData.append(key, value.toString());
          }
        }
      });

      const result = await updateRestaurant(submitFormData);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      // Clear additional setup form data from localStorage
      if (typeof window !== "undefined") {
        localStorage.removeItem("additional-setup-form-data");
      }

      toast.success("Additional details saved successfully!");
      router.push("/select-plan");
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  const handleSkip = () => {
    // Clear additional setup form data from localStorage
    if (typeof window !== "undefined") {
      localStorage.removeItem("additional-setup-form-data");
    }
    router.push("/select-plan");
  };

  return (
    <div className="container relative min-h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-1 lg:px-0">
      {/* Resume Notification */}
      {hasResumed && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-green-50 border-b border-green-200">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-green-700">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>
                Welcome back! Your previous progress has been restored.
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[550px]">
        <div className="flex flex-col space-y-2 text-center">
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              Additional Restaurant Details
            </h1>
            <div className="flex items-center gap-2 text-xs text-green-600">
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Auto-saving</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Help customers find and learn more about your restaurant
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="grid gap-6"
        >
          <form onSubmit={onSubmit}>
            <div className="grid gap-6">
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Tell customers about your restaurant"
                  disabled={isLoading}
                  value={formData.description}
                  onChange={handleInputChange}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="cuisine">Cuisine Type</Label>
                <Input
                  id="cuisine"
                  name="cuisine"
                  placeholder="e.g., Italian, Japanese, Indian"
                  disabled={isLoading}
                  value={formData.cuisine}
                  onChange={handleInputChange}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="+41 XX XXX XX XX"
                  disabled={isLoading}
                  value={formData.phone}
                  onChange={handleInputChange}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  name="website"
                  type="url"
                  placeholder="https://your-restaurant.com"
                  disabled={isLoading}
                  value={formData.website}
                  onChange={handleInputChange}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  name="address"
                  placeholder="Street address"
                  disabled={isLoading}
                  value={formData.address}
                  onChange={handleInputChange}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    name="city"
                    placeholder="City"
                    disabled={isLoading}
                    value={formData.city}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="postal_code">Postal Code</Label>
                  <Input
                    id="postal_code"
                    name="postal_code"
                    placeholder="Postal code"
                    disabled={isLoading}
                    value={formData.postal_code}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="seating_capacity">Seating Capacity</Label>
                <Input
                  id="seating_capacity"
                  name="seating_capacity"
                  type="number"
                  min="1"
                  placeholder="Number of seats"
                  disabled={isLoading}
                  value={formData.seating_capacity}
                  onChange={handleInputChange}
                />
              </div>

              <div className="grid gap-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="accepts_reservations">
                    Accept Reservations
                  </Label>
                  <Switch
                    id="accepts_reservations"
                    name="accepts_reservations"
                    disabled={isLoading}
                    checked={formData.accepts_reservations}
                    onCheckedChange={(checked) =>
                      handleSwitchChange("accepts_reservations", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="delivery_available">Delivery Available</Label>
                  <Switch
                    id="delivery_available"
                    name="delivery_available"
                    disabled={isLoading}
                    checked={formData.delivery_available}
                    onCheckedChange={(checked) =>
                      handleSwitchChange("delivery_available", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="takeout_available">Takeout Available</Label>
                  <Switch
                    id="takeout_available"
                    name="takeout_available"
                    disabled={isLoading}
                    checked={formData.takeout_available}
                    onCheckedChange={(checked) =>
                      handleSwitchChange("takeout_available", checked)
                    }
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={handleSkip}
                  disabled={isLoading}
                >
                  Skip for Now
                </Button>
                <Button type="submit" className="flex-1" disabled={isLoading}>
                  {isLoading ? "Saving..." : "Continue"}
                </Button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
