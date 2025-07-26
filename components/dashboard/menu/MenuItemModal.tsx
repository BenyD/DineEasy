"use client";

import { useCallback, useState, useEffect, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DollarSign,
  Clock,
  Upload,
  AlertCircle,
  CheckCircle,
  Lock,
  Plus,
  X,
  Image as ImageIcon,
  Info,
  ArrowRight,
} from "lucide-react";
import { useMenuForm } from "@/hooks/useMenuForm";
import { toast } from "sonner";
import { uploadImage } from "@/lib/actions/upload";
import { bytesToSize } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { type MenuItemAllergen } from "@/types";

const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB
const ACCEPTED_IMAGE_TYPES = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
};

// Image compression utility
const compressImage = (
  file: File,
  maxWidth: number = 800,
  quality: number = 0.8
): Promise<File> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions while maintaining aspect ratio
      let { width, height } = img;

      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;

      // Draw and compress image
      ctx?.drawImage(img, 0, 0, width, height);

      // Convert to blob with compression
      canvas.toBlob(
        (blob) => {
          if (blob) {
            // Create new file with compressed data
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            reject(new Error("Failed to compress image"));
          }
        },
        file.type,
        quality
      );
    };

    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(file);
  });
};

interface MenuItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: any;
  menuCategories: any[];
  menuAllergens: any[];
  isAddingCategoryOrAllergen: boolean;
  onAddCategory: (name: string, description: string) => Promise<any>;
  onAddAllergen: (name: string, icon: string) => Promise<any>;
  onSubmit: (formData: FormData) => Promise<void>;
  currencySymbol: string;
}

export function MenuItemModal({
  open,
  onOpenChange,
  item,
  menuCategories,
  menuAllergens,
  isAddingCategoryOrAllergen,
  onAddCategory,
  onAddAllergen,
  onSubmit,
  currencySymbol,
}: MenuItemModalProps) {
  // Local state for categories and allergens to avoid re-render issues
  const [localCategories, setLocalCategories] = useState(menuCategories);
  const [localAllergens, setLocalAllergens] = useState(menuAllergens);
  const lastAddedCategoryId = useRef<string | null>(null);

  // Update local state when props change
  useEffect(() => {
    setLocalCategories(menuCategories);
  }, [menuCategories]);

  useEffect(() => {
    setLocalAllergens(menuAllergens);
  }, [menuAllergens]);

  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddAllergen, setShowAddAllergen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryDescription, setNewCategoryDescription] = useState("");
  const [newAllergenName, setNewAllergenName] = useState("");
  const [newAllergenIcon, setNewAllergenIcon] = useState("");

  const {
    formState,
    setFormState,
    validateForm,
    updateFormData,
    handleTabChange,
    handleSubmit,
    handleImageUpload,
    handleAddCategory,
    handleAddAllergen,
    hasResumed,
  } = useMenuForm({
    item,
    onClose: () => onOpenChange(false),
    onSubmit: async (formData) => {
      // If the parent expects a browser FormData, convert if needed
      if (formData instanceof window.FormData) {
        await onSubmit(formData);
      } else {
        // Convert plain object to FormData
        const fd = new window.FormData();
        Object.entries(formData).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            value.forEach((v) => fd.append(key, v));
          } else {
            fd.append(key, value as any);
          }
        });
        await onSubmit(fd);
      }
    },
    onAddCategory,
    onAddAllergen,
    onUploadImage: async (file) => {
      // Use the uploadImage function imported above
      return await uploadImage(file, "menu-item");
    },
  });

  // Auto-select last added category if present
  useEffect(() => {
    if (lastAddedCategoryId.current) {
      const found = localCategories.find(
        (c) => c.id === lastAddedCategoryId.current
      );
      if (found) {
        updateFormData({ category: found.id });
        lastAddedCategoryId.current = null;
      }
    }
  }, [localCategories, updateFormData]);

  // Safety mechanism to reset upload state if it gets stuck
  useEffect(() => {
    if (formState.isUploading) {
      const timeout = setTimeout(() => {
        setFormState((prev) => ({
          ...prev,
          isUploading: false,
          isImageUploading: false,
          uploadProgress: 0,
        }));
        console.log("Upload state reset due to timeout");
      }, 10000); // 10 seconds timeout

      return () => clearTimeout(timeout);
    }
  }, [formState.isUploading, setFormState]);

  // Handle modal close with different behaviors
  const handleModalClose = (shouldClear: boolean = false) => {
    if (shouldClear) {
      // Clear form data when Cancel is clicked
      setFormState((prev) => ({
        ...prev,
        formData: {
          name: "",
          description: "",
          price: "",
          category: "",
          preparationTime: "",
          available: true,
          popular: false,
          allergens: [],
          image: "",
        },
        formErrors: {},
        activeTab: "basic",
        visitedSteps: new Set(),
        isSubmitting: false,
        isUploading: false,
      }));
      // Clear local state
      setShowAddCategory(false);
      setShowAddAllergen(false);
      setNewCategoryName("");
      setNewCategoryDescription("");
      setNewAllergenName("");
      setNewAllergenIcon("");
    }
    onOpenChange(false);
  };

  // Handle tab changes
  const handleNext = useCallback(() => {
    if (formState.activeTab === "basic") {
      handleTabChange("details");
    } else if (formState.activeTab === "details") {
      handleTabChange("image");
    }
  }, [formState.activeTab, handleTabChange]);

  // Handle form submission
  const handleSubmitForm = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // If not on the last tab, validate current tab and move to next
      if (formState.activeTab !== "image") {
        if (!validateForm()) {
          return;
        }
        handleNext();
        return;
      }

      // Final validation - validate all required fields
      const errors: Record<string, string> = {};

      if (!formState.formData.name.trim()) {
        errors.name = "Name is required";
      }

      if (
        !formState.formData.price ||
        parseFloat(formState.formData.price) <= 0
      ) {
        errors.price = "Valid price is required";
      }

      if (
        !formState.formData.preparationTime ||
        parseInt(formState.formData.preparationTime) <= 0
      ) {
        errors.preparationTime = "Preparation time is required";
      }

      if (!formState.formData.category) {
        errors.category = "Category is required";
      }

      if (Object.keys(errors).length > 0) {
        setFormState((prev) => ({
          ...prev,
          formErrors: errors,
        }));
        toast.error("Please fix the errors before submitting");
        return;
      }

      setFormState((prev) => ({ ...prev, isSubmitting: true }));

      console.log("Submitting form with data:", formState.formData);

      try {
        // Create FormData
        const formDataToSubmit = new FormData();
        formDataToSubmit.append("name", formState.formData.name);
        formDataToSubmit.append("description", formState.formData.description);
        formDataToSubmit.append("price", formState.formData.price);
        formDataToSubmit.append("category", formState.formData.category);
        formDataToSubmit.append(
          "preparationTime",
          formState.formData.preparationTime
        );
        formDataToSubmit.append(
          "available",
          formState.formData.available.toString()
        );
        formDataToSubmit.append(
          "popular",
          formState.formData.popular.toString()
        );

        // Handle image URL properly for editing vs creating
        if (item) {
          // Editing existing item - only include imageUrl if it's different from the original
          if (formState.formData.image !== item.image) {
            formDataToSubmit.append("imageUrl", formState.formData.image);
          }
        } else {
          // Creating new item - always include imageUrl
          formDataToSubmit.append("imageUrl", formState.formData.image);
        }

        // Add allergens
        if (
          formState.formData.allergens &&
          formState.formData.allergens.length > 0
        ) {
          formState.formData.allergens.forEach((allergen: MenuItemAllergen) => {
            if (allergen && allergen.id) {
              formDataToSubmit.append("allergens", allergen.id);
            }
          });
        }

        await onSubmit(formDataToSubmit);
        handleModalClose(true); // Clear form after successful submission
      } catch (error: any) {
        console.error("Error submitting form:", error);
        toast.error(error.message || "Failed to save menu item");
      } finally {
        setFormState((prev) => ({ ...prev, isSubmitting: false }));
      }
    },
    [
      formState.activeTab,
      formState.formData,
      validateForm,
      handleNext,
      setFormState,
      onSubmit,
      handleModalClose,
      item,
    ]
  );

  // Add local step completion logic
  const isStep1Completed =
    Boolean(
      formState.formData.name.trim() &&
        formState.formData.price &&
        parseFloat(formState.formData.price) > 0 &&
        formState.formData.preparationTime &&
        parseInt(formState.formData.preparationTime) > 0
    ) || Boolean(item); // Always true in edit mode
  const isStep2Completed =
    Boolean(formState.formData.category) || Boolean(item); // Always true in edit mode

  // Handle adding new category
  const handleAddNewCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error("Category name is required");
      return;
    }

    try {
      const newCategory = await onAddCategory(
        newCategoryName.trim(),
        newCategoryDescription.trim()
      );
      if (newCategory && newCategory.id) {
        setLocalCategories((prev) => [...prev, newCategory]);
        lastAddedCategoryId.current = newCategory.id;
        updateFormData({ category: newCategory.id });
      }
      setNewCategoryName("");
      setNewCategoryDescription("");
      setShowAddCategory(false);
      toast.success("Category added successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to add category");
    }
  };

  // Handle adding new allergen
  const handleAddNewAllergen = async () => {
    if (!newAllergenName.trim()) {
      toast.error("Allergen name is required");
      return;
    }

    try {
      // Call the onAddAllergen directly with the local state values
      const newAllergen = await onAddAllergen(
        newAllergenName.trim(),
        newAllergenIcon.trim() || "⚠️"
      );

      // Add the new allergen to local state immediately
      if (newAllergen && newAllergen.id) {
        setLocalAllergens((prev) => [...prev, newAllergen]);
        // Auto-select the newly created allergen
        updateFormData({
          allergens: [
            ...formState.formData.allergens,
            {
              id: newAllergen.id,
              name: newAllergen.name,
              icon: newAllergen.icon || "⚠️",
            },
          ],
        });
      }

      // Clear local state
      setNewAllergenName("");
      setNewAllergenIcon("");
      setShowAddAllergen(false);

      toast.success("Allergen added successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to add allergen");
    }
  };

  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      onDrop: async (acceptedFiles) => {
        if (acceptedFiles && acceptedFiles.length > 0) {
          const file = acceptedFiles[0];

          try {
            // Show compression progress
            toast.info(`Processing image (${bytesToSize(file.size)})...`);

            // Compress image before upload
            const compressedFile = await compressImage(file);

            // Check if compression actually reduced file size
            if (compressedFile.size >= file.size) {
              toast.info("Image is already optimized");
            } else {
              const reduction = (
                ((file.size - compressedFile.size) / file.size) *
                100
              ).toFixed(1);
              toast.success(
                `Image compressed by ${reduction}% (${bytesToSize(compressedFile.size)})`
              );
            }

            // Upload compressed file
            await handleImageUpload(compressedFile);
          } catch (error) {
            console.error("Image compression failed:", error);
            toast.error("Failed to process image. Please try again.");
          }
        }
      },
      accept: ACCEPTED_IMAGE_TYPES,
      maxFiles: 1,
      maxSize: MAX_FILE_SIZE,
    });

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen && !formState.isSubmitting && !formState.isUploading) {
          handleModalClose(false);
        }
      }}
    >
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white border border-gray-200 shadow-xl">
        <form onSubmit={handleSubmitForm}>
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900">
              {item ? "Edit Menu Item" : "Add Menu Item"}
            </DialogTitle>
          </DialogHeader>

          {/* Progress Indicator */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">
                Step{" "}
                {formState.activeTab === "basic"
                  ? "1"
                  : formState.activeTab === "details"
                    ? "2"
                    : "3"}{" "}
                of 3
              </span>
              <span className="text-sm text-gray-600">
                {formState.activeTab === "basic"
                  ? "Basic Information"
                  : formState.activeTab === "details"
                    ? "Details & Settings"
                    : "Image Upload"}
              </span>
            </div>

            {/* Step completion indicators */}
            <div className="flex items-center gap-2 mb-2">
              {/* Step 1: Basic Info */}
              <div
                className={cn(
                  "flex items-center gap-1 text-xs",
                  isStep1Completed ? "text-green-600" : "text-gray-400"
                )}
              >
                <div
                  className={cn(
                    "w-4 h-4 rounded-full flex items-center justify-center",
                    isStep1Completed
                      ? "bg-green-100 text-green-600"
                      : "bg-gray-100 text-gray-400"
                  )}
                >
                  {isStep1Completed ? <CheckCircle className="w-3 h-3" /> : "1"}
                </div>
                <span>Basic Info</span>
              </div>

              <div className="w-8 h-px bg-gray-300"></div>

              {/* Step 2: Details */}
              <div
                className={cn(
                  "flex items-center gap-1 text-xs",
                  isStep2Completed ? "text-green-600" : "text-gray-400"
                )}
              >
                <div
                  className={cn(
                    "w-4 h-4 rounded-full flex items-center justify-center",
                    isStep2Completed
                      ? "bg-green-100 text-green-600"
                      : "bg-gray-100 text-gray-400"
                  )}
                >
                  {isStep2Completed ? <CheckCircle className="w-3 h-3" /> : "2"}
                </div>
                <span>Details</span>
              </div>

              <div className="w-8 h-px bg-gray-300"></div>

              {/* Step 3: Image */}
              <div
                className={cn(
                  "flex items-center gap-1 text-xs",
                  isStep2Completed && formState.visitedSteps.has("image")
                    ? "text-green-600"
                    : "text-gray-400"
                )}
              >
                <div
                  className={cn(
                    "w-4 h-4 rounded-full flex items-center justify-center",
                    isStep2Completed && formState.visitedSteps.has("image")
                      ? "bg-green-100 text-green-600"
                      : "bg-gray-100 text-gray-400"
                  )}
                >
                  {isStep2Completed && formState.visitedSteps.has("image") ? (
                    <CheckCircle className="w-3 h-3" />
                  ) : (
                    "3"
                  )}
                </div>
                <span>Image</span>
              </div>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: isStep1Completed
                    ? formState.activeTab === "basic"
                      ? "33%"
                      : isStep2Completed
                        ? formState.activeTab === "details"
                          ? "66%"
                          : "100%"
                        : "33%"
                    : "0%",
                }}
              ></div>
            </div>
          </div>

          <Tabs
            value={formState.activeTab}
            onValueChange={(tab) =>
              handleTabChange(tab as "basic" | "details" | "image")
            }
          >
            <TabsList className="grid w-full grid-cols-3 bg-gray-100 p-1 rounded-lg">
              <TabsTrigger
                value="basic"
                className="rounded-[6px] data-[state=active]:bg-white data-[state=active]:text-green-700 data-[state=active]:shadow-sm data-[state=active]:font-medium data-[state=active]:-mt-0.5"
              >
                Basic Info
              </TabsTrigger>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <TabsTrigger
                      value="details"
                      disabled={!isStep1Completed}
                      className={cn(
                        "rounded-[6px] flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-green-700 data-[state=active]:shadow-sm data-[state=active]:font-medium data-[state=active]:-mt-0.5",
                        !isStep1Completed && "cursor-not-allowed opacity-50"
                      )}
                    >
                      Details
                      {!isStep1Completed && <Lock className="w-3 h-3" />}
                    </TabsTrigger>
                  </TooltipTrigger>
                  {!isStep1Completed && (
                    <TooltipContent>
                      <p>Complete Basic Information first</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <TabsTrigger
                      value="image"
                      disabled={!isStep2Completed}
                      className={cn(
                        "rounded-[6px] flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-green-700 data-[state=active]:shadow-sm data-[state=active]:font-medium data-[state=active]:-mt-0.5",
                        !isStep2Completed && "cursor-not-allowed opacity-50"
                      )}
                    >
                      Image
                      {!isStep2Completed && <Lock className="w-3 h-3" />}
                    </TabsTrigger>
                  </TooltipTrigger>
                  {!isStep2Completed && (
                    <TooltipContent>
                      <p>Complete Details & Settings first</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            </TabsList>

            <TabsContent value="basic" className="space-y-6 mt-6">
              <div className="space-y-6">
                <div>
                  <Label
                    htmlFor="name"
                    className="text-sm font-medium text-gray-700 mb-2 block"
                  >
                    Item Name*
                  </Label>
                  <Input
                    id="name"
                    value={formState.formData.name}
                    onChange={(e) => updateFormData({ name: e.target.value })}
                    placeholder="Enter menu item name"
                    className={cn(
                      "h-11 focus:ring-2 focus:ring-green-500 focus:border-green-500",
                      formState.formErrors.name &&
                        "border-red-500 focus:ring-red-500"
                    )}
                  />
                  {formState.formErrors.name && (
                    <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {formState.formErrors.name}
                    </p>
                  )}
                </div>

                <div>
                  <Label
                    htmlFor="description"
                    className="text-sm font-medium text-gray-700 mb-2 block"
                  >
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={formState.formData.description}
                    onChange={(e) =>
                      updateFormData({ description: e.target.value })
                    }
                    placeholder="Describe your menu item..."
                    className="h-24 focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <Label
                      htmlFor="price"
                      className="text-sm font-medium text-gray-700 mb-2 block"
                    >
                      Price ({currencySymbol})*
                    </Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formState.formData.price}
                        onChange={(e) =>
                          updateFormData({ price: e.target.value })
                        }
                        placeholder="0.00"
                        className={cn(
                          "pl-10 h-11 focus:ring-2 focus:ring-green-500 focus:border-green-500",
                          formState.formErrors.price &&
                            "border-red-500 focus:ring-red-500"
                        )}
                      />
                    </div>
                    {formState.formErrors.price && (
                      <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {formState.formErrors.price}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label
                      htmlFor="preparationTime"
                      className="text-sm font-medium text-gray-700 mb-2 block"
                    >
                      Prep Time (minutes)*
                    </Label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                      <Input
                        id="preparationTime"
                        type="number"
                        min="1"
                        value={formState.formData.preparationTime}
                        onChange={(e) =>
                          updateFormData({
                            preparationTime: e.target.value,
                          })
                        }
                        placeholder="15"
                        className={cn(
                          "pl-10 h-11 focus:ring-2 focus:ring-green-500 focus:border-green-500",
                          formState.formErrors.preparationTime &&
                            "border-red-500 focus:ring-red-500"
                        )}
                      />
                    </div>
                    {formState.formErrors.preparationTime && (
                      <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {formState.formErrors.preparationTime}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="details" className="space-y-6 mt-6">
              <div className="space-y-6">
                <div>
                  <Label
                    htmlFor="category"
                    className="text-sm font-medium text-gray-700 mb-2 block"
                  >
                    Category*
                  </Label>
                  <div className="space-y-2">
                    <Select
                      value={formState.formData.category}
                      onValueChange={(value) =>
                        updateFormData({ category: value })
                      }
                    >
                      <SelectTrigger className="h-11 focus:ring-2 focus:ring-green-500 focus:border-green-500">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {localCategories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAddCategory(true)}
                      className="text-green-600 border-green-200 hover:bg-green-50"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add New Category
                    </Button>
                  </div>
                  {formState.formErrors.category && (
                    <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {formState.formErrors.category}
                    </p>
                  )}
                </div>

                {/* Add Category Modal */}
                {showAddCategory && (
                  <div className="p-6 border border-gray-200 rounded-xl bg-white shadow-md">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-900">
                        Add New Category
                      </h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAddCategory(false)}
                        className="h-6 w-6 p-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">
                          Category Name*
                        </Label>
                        <Input
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          placeholder="Enter category name"
                          className="mt-1 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">
                          Description
                        </Label>
                        <Textarea
                          value={newCategoryDescription}
                          onChange={(e) =>
                            setNewCategoryDescription(e.target.value)
                          }
                          placeholder="Optional description"
                          className="mt-1 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          onClick={handleAddNewCategory}
                          disabled={isAddingCategoryOrAllergen}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          {isAddingCategoryOrAllergen
                            ? "Adding..."
                            : "Add Category"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowAddCategory(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-3 block">
                    Allergens
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    {localAllergens.map((allergen) => (
                      <div
                        key={allergen.id}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={allergen.id}
                          checked={formState.formData.allergens.some(
                            (a) => a.id === allergen.id
                          )}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              updateFormData({
                                allergens: [
                                  ...formState.formData.allergens,
                                  allergen,
                                ],
                              });
                            } else {
                              updateFormData({
                                allergens: formState.formData.allergens.filter(
                                  (a) => a.id !== allergen.id
                                ),
                              });
                            }
                          }}
                          className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                        />
                        <Label
                          htmlFor={allergen.id}
                          className="text-sm text-gray-700 cursor-pointer flex items-center gap-2"
                        >
                          <span className="text-lg">{allergen.icon}</span>
                          {allergen.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAddAllergen(true)}
                      className="text-green-600 border-green-200 hover:bg-green-50"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add New Allergen
                    </Button>
                  </div>
                </div>

                {/* Add Allergen Modal */}
                {showAddAllergen && (
                  <div className="p-4 border border-green-200 rounded-lg bg-green-50">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-green-900">
                        Add New Allergen
                      </h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAddAllergen(false)}
                        className="h-6 w-6 p-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium text-green-800">
                          Allergen Name*
                        </Label>
                        <Input
                          value={newAllergenName}
                          onChange={(e) => setNewAllergenName(e.target.value)}
                          placeholder="e.g., Gluten, Nuts, Dairy"
                          className="mt-1 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-green-800">
                          Icon (Emoji)*
                        </Label>
                        <Input
                          value={newAllergenIcon}
                          onChange={(e) => setNewAllergenIcon(e.target.value)}
                          placeholder="🌾 🥜 🥛"
                          className="mt-1 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          onClick={handleAddNewAllergen}
                          disabled={isAddingCategoryOrAllergen}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {isAddingCategoryOrAllergen
                            ? "Adding..."
                            : "Add Allergen"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowAddAllergen(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label
                      htmlFor="available"
                      className="text-sm font-medium text-gray-700"
                    >
                      Available for Order
                    </Label>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="available"
                        checked={formState.formData.available}
                        onCheckedChange={(checked) =>
                          updateFormData({ available: checked })
                        }
                        className="data-[state=checked]:bg-green-600"
                      />
                      <Label
                        htmlFor="available"
                        className="text-sm text-gray-600"
                      >
                        {formState.formData.available ? "Yes" : "No"}
                      </Label>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label
                      htmlFor="popular"
                      className="text-sm font-medium text-gray-700"
                    >
                      Mark as Popular
                    </Label>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="popular"
                        checked={formState.formData.popular}
                        onCheckedChange={(checked) =>
                          updateFormData({ popular: checked })
                        }
                        className="data-[state=checked]:bg-green-600"
                      />
                      <Label
                        htmlFor="popular"
                        className="text-sm text-gray-600"
                      >
                        {formState.formData.popular ? "Yes" : "No"}
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="image" className="space-y-6 mt-6">
              <div className="space-y-6">
                <div className="space-y-4">
                  <Label className="text-sm font-medium text-gray-700 block">
                    Item Image
                  </Label>
                  <p className="text-sm text-gray-500">
                    Upload a high-quality image of your menu item (max 1MB).
                    Images will be automatically optimized for better
                    performance.
                  </p>
                </div>

                {formState.isImageUploading ? (
                  <div className="space-y-4">
                    <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                      <div className="w-full h-80 flex items-center justify-center">
                        <div className="text-center space-y-4">
                          <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto" />
                          <div className="space-y-3">
                            <div>
                              <p className="text-sm font-medium text-gray-700">
                                {formState.uploadProgress < 35
                                  ? "Compressing image..."
                                  : formState.uploadProgress < 90
                                    ? "Uploading image..."
                                    : "Finalizing upload..."}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {formState.uploadProgress < 35
                                  ? "Optimizing for web..."
                                  : formState.uploadProgress < 90
                                    ? "Sending to server..."
                                    : "Processing complete"}
                              </p>
                            </div>
                            <div className="space-y-3">
                              <div className="w-80 h-4 bg-gray-200 rounded-full overflow-hidden border border-gray-300">
                                <div
                                  className="h-full bg-gradient-to-r from-green-500 via-green-600 to-green-700 transition-all duration-500 ease-out rounded-full shadow-inner relative"
                                  style={{
                                    width: `${formState.uploadProgress}%`,
                                  }}
                                >
                                  {/* Animated shine effect */}
                                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
                                </div>
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-600 font-medium">
                                  {formState.uploadProgress}% complete
                                </span>
                                <span className="text-gray-500">
                                  {formState.uploadProgress < 35
                                    ? "Compression"
                                    : formState.uploadProgress < 90
                                      ? "Upload"
                                      : "Processing"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : formState.formData.image ? (
                  <div className="space-y-4">
                    <div className="relative group">
                      <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                        <img
                          src={formState.formData.image}
                          alt="Menu item"
                          className="w-full h-80 object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => updateFormData({ image: "" })}
                        className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm border border-gray-200 text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                    <div className="flex items-center justify-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <p className="text-sm text-green-700 font-medium">
                        Image uploaded successfully
                      </p>
                    </div>
                  </div>
                ) : (
                  <div
                    {...getRootProps()}
                    className={cn(
                      "relative overflow-hidden rounded-xl border-2 border-dashed transition-all duration-300 cursor-pointer group",
                      "hover:border-green-400 hover:bg-green-50/30",
                      {
                        "border-green-500 bg-green-50/50":
                          isDragActive && !isDragReject,
                        "border-red-400 bg-red-50/50": isDragReject,
                        "border-gray-300 bg-gray-50/50":
                          !isDragActive && !isDragReject,
                      }
                    )}
                  >
                    <input {...getInputProps()} />

                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-5">
                      <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-blue-400" />
                    </div>

                    <div className="relative p-12 text-center">
                      <div className="flex flex-col items-center gap-6">
                        {/* Icon Container */}
                        <div
                          className={cn(
                            "relative p-4 rounded-2xl transition-all duration-300",
                            "bg-white/80 backdrop-blur-sm border border-gray-200/60",
                            "group-hover:bg-white group-hover:scale-110",
                            {
                              "bg-green-100/80 border-green-300":
                                isDragActive && !isDragReject,
                              "bg-red-100/80 border-red-300": isDragReject,
                            }
                          )}
                        >
                          <ImageIcon
                            className={cn(
                              "w-8 h-8 transition-colors duration-300",
                              {
                                "text-green-600": isDragActive && !isDragReject,
                                "text-red-600": isDragReject,
                                "text-gray-600": !isDragActive && !isDragReject,
                              }
                            )}
                          />
                        </div>

                        {/* Text Content */}
                        <div className="space-y-3 max-w-sm">
                          <p className="text-lg font-semibold text-gray-900">
                            {isDragActive ? (
                              isDragReject ? (
                                <span className="flex items-center justify-center gap-2 text-red-600">
                                  <AlertCircle className="w-5 h-5" />
                                  Invalid file type or size
                                </span>
                              ) : (
                                <span className="flex items-center justify-center gap-2 text-green-600">
                                  <CheckCircle className="w-5 h-5" />
                                  Drop to upload
                                </span>
                              )
                            ) : (
                              <span>
                                Drop your image here or{" "}
                                <span className="text-green-600 font-medium underline decoration-2 underline-offset-2">
                                  browse files
                                </span>
                              </span>
                            )}
                          </p>

                          <div className="space-y-1">
                            <p className="text-sm text-gray-600">
                              JPG, PNG, WebP • Max 1MB
                            </p>
                            <p className="text-xs text-gray-500">
                              Automatically optimized for web
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl border border-gray-200">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-blue-100/50 border border-blue-200/50">
                      <Info className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1 space-y-3">
                      <h4 className="font-medium text-gray-900">
                        Image Optimization Tips
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                          Auto-compressed to 800px max width
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                          Optimized for web (80% quality)
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                          Reduced file size, maintained quality
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                          Natural lighting, focused composition
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-8 pt-6 border-t border-gray-200 bg-gray-50 -mx-6 -mb-6 px-6 pb-6">
            {/* Submission Progress Indicator */}
            {formState.isSubmitting && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10">
                <div className="text-center space-y-4 p-6 bg-white rounded-xl shadow-lg border border-gray-200">
                  <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto" />
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">
                      {item ? "Updating menu item..." : "Adding menu item..."}
                    </p>
                    <p className="text-xs text-gray-500">
                      Please wait while we save your changes to the database
                    </p>
                    <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-green-600 animate-pulse rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <Button
              type="button"
              variant="outline"
              onClick={() => handleModalClose(true)}
              disabled={formState.isSubmitting || formState.isUploading}
              className="px-6"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className={cn(
                "px-6 shadow-sm transition-all duration-200",
                formState.isSubmitting
                  ? "bg-green-700 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700"
              )}
              disabled={formState.isSubmitting || formState.isUploading}
            >
              {formState.isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{item ? "Updating Item..." : "Adding Item..."}</span>
                </div>
              ) : formState.activeTab === "image" ? (
                <div className="flex items-center gap-2">
                  {item ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Update Item</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Add Item</span>
                    </>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span>Next</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
