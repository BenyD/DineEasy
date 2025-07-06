"use client";

import type React from "react";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ArrowLeft,
  Upload,
  MapPin,
  QrCode,
  FileText,
  ChefHat,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function SetupPage() {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    logo: null,
    coverPhoto: null,
    address: "",
    city: "",
    postalCode: "",
    country: "",
    tableCount: 5,
    menuUploadMethod: "manual", // 'manual' or 'ocr'
  });

  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
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

  const handleNext = () => {
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
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    window.location.href = "/dashboard";
  };

  const handleSkip = () => {
    handleNext();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Background Pattern */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(#e0f2e9_1px,transparent_1px)] bg-size-[16px_16px] mask-[radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

      <header className="bg-white border-b">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <ChefHat className="h-8 w-8 text-green-600" />
                <span className="text-2xl font-bold">DineEasy</span>
              </div>
              <div className="hidden sm:block h-6 w-px bg-gray-300" />
              <div className="hidden sm:block">
                <h1 className="text-lg font-semibold">Restaurant Setup</h1>
                <p className="text-sm text-gray-500">
                  Complete your profile to get started
                </p>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              Step {step} of {totalSteps} (Final Step)
            </div>
          </div>
          <Progress value={progress} className="h-1 mt-4" />
        </div>
      </header>

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
                <h2 className="text-2xl font-bold">
                  Upload Your Restaurant Images
                </h2>
                <p className="text-gray-500 mt-2">
                  These will be displayed to your customers
                </p>
              </div>

              <Card className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="logo">Restaurant Logo</Label>
                      <div className="flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50">
                        {formData.logo ? (
                          <div className="text-center">
                            <div className="w-32 h-32 mx-auto bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                              <img
                                src={
                                  URL.createObjectURL(
                                    formData.logo as unknown as Blob
                                  ) || "/placeholder.svg"
                                }
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
                                src={
                                  URL.createObjectURL(
                                    formData.coverPhoto as unknown as Blob
                                  ) || "/placeholder.svg"
                                }
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

          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold">Restaurant Address</h2>
                <p className="text-gray-500 mt-2">
                  Enter your restaurant's physical location
                </p>
              </div>

              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="address">Street Address</Label>
                      <Input
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        placeholder="123 Restaurant Street"
                        className="h-11"
                      />
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
                        <Label htmlFor="postalCode">Postal Code</Label>
                        <Input
                          id="postalCode"
                          name="postalCode"
                          value={formData.postalCode}
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

          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold">Table Setup</h2>
                <p className="text-gray-500 mt-2">
                  Configure your restaurant tables and QR codes
                </p>
              </div>

              <Card>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="tableCount">Number of Tables</Label>
                      <div className="flex items-center gap-4">
                        <Input
                          id="tableCount"
                          name="tableCount"
                          type="number"
                          min="1"
                          max={formData.tableCount === 5 ? "5" : "100"}
                          value={formData.tableCount}
                          onChange={handleChange}
                          className="h-11 w-24"
                        />
                        <span className="text-sm text-gray-500">
                          {formData.tableCount === 5 ? (
                            <span className="text-amber-600">
                              Starter plan limit: 5 tables.{" "}
                              <a href="/pricing" className="underline">
                                Upgrade
                              </a>{" "}
                              for more.
                            </span>
                          ) : (
                            "Tables"
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                      <div className="flex items-start gap-3">
                        <QrCode className="h-5 w-5 text-green-600 mt-0.5" />
                        <div>
                          <h3 className="font-medium text-sm">
                            QR Codes will be auto-generated
                          </h3>
                          <p className="text-xs text-gray-500 mt-1">
                            After setup, you'll be able to print QR codes for
                            each table. Customers will scan these to access your
                            digital menu and place orders.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div className="border rounded-lg p-4 bg-white">
                        <div className="flex justify-center mb-3">
                          <div className="h-24 w-24 bg-gray-100 rounded-lg flex items-center justify-center">
                            <QrCode className="h-16 w-16 text-gray-400" />
                          </div>
                        </div>
                        <div className="text-center">
                          <h4 className="font-medium">Table 1</h4>
                          <p className="text-xs text-gray-500">
                            Sample QR Code
                          </p>
                        </div>
                      </div>

                      <div className="border rounded-lg p-4 bg-white">
                        <div className="flex justify-center mb-3">
                          <div className="h-24 w-24 bg-gray-100 rounded-lg flex items-center justify-center">
                            <QrCode className="h-16 w-16 text-gray-400" />
                          </div>
                        </div>
                        <div className="text-center">
                          <h4 className="font-medium">Table 2</h4>
                          <p className="text-xs text-gray-500">
                            Sample QR Code
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold">Menu Setup</h2>
                <p className="text-gray-500 mt-2">
                  Choose how you want to create your digital menu
                </p>
              </div>

              <Card>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div
                        className={`border rounded-lg p-6 cursor-pointer transition-all ${
                          formData.menuUploadMethod === "manual"
                            ? "border-green-500 bg-green-50 ring-1 ring-green-500"
                            : "hover:border-gray-300"
                        }`}
                        onClick={() =>
                          setFormData({
                            ...formData,
                            menuUploadMethod: "manual",
                          })
                        }
                      >
                        <div className="flex justify-center mb-4">
                          <div
                            className={`h-12 w-12 rounded-full flex items-center justify-center ${
                              formData.menuUploadMethod === "manual"
                                ? "bg-green-100 text-green-600"
                                : "bg-gray-100 text-gray-400"
                            }`}
                          >
                            <FileText className="h-6 w-6" />
                          </div>
                        </div>
                        <h3 className="font-medium text-center mb-2">
                          Manual Entry
                        </h3>
                        <p className="text-sm text-gray-500 text-center">
                          Create your menu items one by one with our easy-to-use
                          menu builder
                        </p>
                      </div>

                      <div
                        className={`border rounded-lg p-6 cursor-pointer transition-all ${
                          formData.menuUploadMethod === "ocr"
                            ? "border-green-500 bg-green-50 ring-1 ring-green-500"
                            : "hover:border-gray-300"
                        }`}
                        onClick={() =>
                          setFormData({ ...formData, menuUploadMethod: "ocr" })
                        }
                      >
                        <div className="flex justify-center mb-4">
                          <div
                            className={`h-12 w-12 rounded-full flex items-center justify-center ${
                              formData.menuUploadMethod === "ocr"
                                ? "bg-green-100 text-green-600"
                                : "bg-gray-100 text-gray-400"
                            }`}
                          >
                            <Upload className="h-6 w-6" />
                          </div>
                        </div>
                        <h3 className="font-medium text-center mb-2">
                          AI OCR Upload
                        </h3>
                        <p className="text-sm text-gray-500 text-center">
                          Upload an image of your existing menu and our AI will
                          extract the items
                        </p>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                      <div className="flex items-start gap-3">
                        <FileText className="h-5 w-5 text-green-600 mt-0.5" />
                        <div>
                          <h3 className="font-medium text-sm">
                            You can always edit your menu later
                          </h3>
                          <p className="text-xs text-gray-500 mt-1">
                            After setup, you'll have full access to the menu
                            builder where you can add, edit, or remove items
                            anytime.
                          </p>
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
              <Button onClick={handleNext} disabled={isLoading}>
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    {step === totalSteps ? "Completing Setup..." : "Saving..."}
                  </div>
                ) : (
                  <>
                    {step === totalSteps ? "Complete Setup" : "Continue"}
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
