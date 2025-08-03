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
  FileText,
  Settings,
  Ruler,
  Layers,
  ChefHat,
  Utensils,
} from "lucide-react";
import { useMenuForm } from "@/hooks/useMenuForm";
import { toast } from "sonner";
import { uploadImage } from "@/lib/actions/upload";
import { bytesToSize } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  type MenuItemAllergen,
  type MenuItemSize,
  type MenuItemModifier,
} from "@/types";
import {
  MENU_TAGS,
  TAG_CATEGORIES,
  TAG_INFO,
  getTagInfo,
  getTagsByCategory,
} from "@/lib/constants/menu-tags";

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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Advanced options state
  const [showAddSize, setShowAddSize] = useState(false);
  const [showAddModifier, setShowAddModifier] = useState(false);
  const [newSize, setNewSize] = useState({
    name: "",
    priceModifier: 0,
    isDefault: false,
  });
  const [newModifier, setNewModifier] = useState({
    name: "",
    description: "",
    type: "addon" as const,
    priceModifier: 0,
    isRequired: false,
    maxSelections: 1,
    isAvailable: true,
  });

  // Handle modal close
  const handleModalClose = () => {
    onOpenChange(false);
  };

  // Handle image upload
  const handleImageUpload = async (file: File) => {
    return await uploadImage(file, "menu-item");
  };

  // Handle form submission
  const handleFormSubmit = async (formData: any) => {
    const formDataToSubmit = new FormData();
    formDataToSubmit.append("name", formData.name);
    formDataToSubmit.append("description", formData.description);
    formDataToSubmit.append("price", formData.price.toString());
    formDataToSubmit.append(
      "preparationTime",
      formData.preparationTime.toString()
    );
    formDataToSubmit.append("available", formData.available.toString());
    formDataToSubmit.append("popular", formData.popular.toString());
    formDataToSubmit.append("category", formData.category);
    formDataToSubmit.append("tags", JSON.stringify(formData.tags || []));

    // Add allergens as individual entries
    if (formData.allergens && formData.allergens.length > 0) {
      formData.allergens.forEach((allergen: any) => {
        formDataToSubmit.append("allergens", allergen.id);
      });
    }

    // Add advanced options
    if (formData.sizes && formData.sizes.length > 0) {
      formDataToSubmit.append("sizes", JSON.stringify(formData.sizes));
    }
    if (formData.modifiers && formData.modifiers.length > 0) {
      formDataToSubmit.append("modifiers", JSON.stringify(formData.modifiers));
    }

    if (imageFile) {
      formDataToSubmit.append("image", imageFile);
    }

    if (formData.image) {
      formDataToSubmit.append("imageUrl", formData.image);
    }

    await onSubmit(formDataToSubmit);
  };

  const {
    formState,
    setFormState,
    updateFormData,
    handleTabChange,
    handleSubmit,
    handleImageUpload: hookHandleImageUpload,
    handleAddCategory,
    handleAddAllergen,
    validateForm,
  } = useMenuForm({
    item,
    onClose: handleModalClose,
    onSubmit: handleFormSubmit,
    onAddCategory,
    onAddAllergen,
    onUploadImage: handleImageUpload,
  });

  // Initialize advanced options from existing item
  useEffect(() => {
    if (item) {
      updateFormData({
        sizes: item.sizes || [],
        modifiers: item.modifiers || [],
      });
      setShowAdvanced(item.hasAdvancedOptions || false);
    } else {
      updateFormData({
        sizes: [],
        modifiers: [],
      });
      setShowAdvanced(false);
    }
  }, [item, updateFormData]);

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
      }, 10000); // 10 seconds timeout

      return () => clearTimeout(timeout);
    }
  }, [formState.isUploading, setFormState]);

  // Handle tab changes
  const handleNext = useCallback(() => {
    if (formState.activeTab === "basic") {
      handleTabChange("details");
    } else if (formState.activeTab === "details") {
      handleTabChange("advanced");
    } else if (formState.activeTab === "advanced") {
      handleTabChange("image");
    }
  }, [formState.activeTab, handleTabChange]);

  // Step completion logic
  const isStep1Completed =
    formState.formData.name.trim() !== "" &&
    formState.formData.price !== "" &&
    parseFloat(formState.formData.price) > 0 &&
    formState.formData.preparationTime !== "" &&
    parseInt(formState.formData.preparationTime) > 0;

  const isStep2Completed =
    isStep1Completed && formState.formData.category !== "";

  // In edit mode, show steps as completed if we've visited them or are on a later step
  const shouldShowStep1Completed =
    isStep1Completed &&
    (!item ||
      formState.activeTab === "details" ||
      formState.activeTab === "advanced" ||
      formState.activeTab === "image" ||
      formState.visitedSteps.has("details"));

  const shouldShowStep2Completed =
    isStep2Completed &&
    (!item ||
      formState.activeTab === "advanced" ||
      formState.activeTab === "image" ||
      formState.visitedSteps.has("advanced") ||
      formState.visitedSteps.has("image"));

  // Handle form submission with step progression
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();

    // If not on the last tab, validate current tab and move to next
    if (formState.activeTab !== "image") {
      if (!validateForm()) {
        toast.error("Please fix the errors before proceeding");
        return;
      }
      if (formState.activeTab === "basic") {
        handleTabChange("details");
      } else if (formState.activeTab === "details") {
        handleTabChange("advanced");
      } else if (formState.activeTab === "advanced") {
        handleTabChange("image");
      }
      return;
    }

    // Final validation and submission
    if (!validateForm()) {
      toast.error("Please fix the errors before submitting");
      return;
    }

    // Submit the form
    handleSubmit(e);
  };

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

  // Advanced options helper functions
  const handleAddSize = () => {
    if (!newSize.name.trim()) {
      toast.error("Size name is required");
      return;
    }

    const size: MenuItemSize = {
      id: `temp-${Date.now()}`,
      menuItemId: item?.id || "",
      name: newSize.name,
      priceModifier: newSize.priceModifier,
      isDefault: newSize.isDefault,
      sortOrder: formState.formData.sizes.length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    updateFormData({
      sizes: [...formState.formData.sizes, size],
    });
    setNewSize({ name: "", priceModifier: 0, isDefault: false });
    setShowAddSize(false);
    toast.success("Size variation added");
  };

  const handleRemoveSize = (sizeId: string) => {
    updateFormData({
      sizes: formState.formData.sizes.filter((size) => size.id !== sizeId),
    });
    toast.success("Size variation removed");
  };

  const handleAddModifier = () => {
    if (!newModifier.name.trim()) {
      toast.error("Modifier name is required");
      return;
    }

    const modifier: MenuItemModifier = {
      id: `temp-${Date.now()}`,
      menuItemId: item?.id || "",
      name: newModifier.name,
      description: newModifier.description,
      type: newModifier.type,
      priceModifier: newModifier.priceModifier,
      isRequired: newModifier.isRequired,
      maxSelections: newModifier.maxSelections,
      sortOrder: formState.formData.modifiers.length,
      isAvailable: newModifier.isAvailable,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    updateFormData({
      modifiers: [...formState.formData.modifiers, modifier],
    });
    setNewModifier({
      name: "",
      description: "",
      type: "addon",
      priceModifier: 0,
      isRequired: false,
      maxSelections: 1,
      isAvailable: true,
    });
    setShowAddModifier(false);
    toast.success("Modifier added");
  };

  const handleRemoveModifier = (modifierId: string) => {
    updateFormData({
      modifiers: formState.formData.modifiers.filter(
        (modifier) => modifier.id !== modifierId
      ),
    });
    toast.success("Modifier removed");
  };

  const getModifierTypeIcon = (type: string) => {
    switch (type) {
      case "addon":
        return <Plus className="w-4 h-4" />;
      case "substitution":
        return <ArrowRight className="w-4 h-4" />;
      case "preparation":
        return <ChefHat className="w-4 h-4" />;
      case "sauce":
        return <Utensils className="w-4 h-4" />;
      case "topping":
        return <Layers className="w-4 h-4" />;
      default:
        return <Settings className="w-4 h-4" />;
    }
  };

  const getModifierTypeColor = (type: string) => {
    switch (type) {
      case "addon":
        return "bg-blue-100 text-blue-800";
      case "substitution":
        return "bg-green-100 text-green-800";
      case "preparation":
        return "bg-orange-100 text-orange-800";
      case "sauce":
        return "bg-purple-100 text-purple-800";
      case "topping":
        return "bg-pink-100 text-pink-800";
      default:
        return "bg-gray-100 text-gray-800";
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

            // Upload compressed file using the hook's function
            await hookHandleImageUpload(compressedFile);
          } catch (error) {
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
          handleModalClose();
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

          {/* Progress Indicator - Only show when adding new items */}
          {!item && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">
                  Step{" "}
                  {formState.activeTab === "basic"
                    ? "1"
                    : formState.activeTab === "details"
                      ? "2"
                      : formState.activeTab === "advanced"
                        ? "3"
                        : "4"}{" "}
                  of 4
                </span>
                <span className="text-sm text-gray-600">
                  {formState.activeTab === "basic"
                    ? "Basic Information"
                    : formState.activeTab === "details"
                      ? "Details & Settings"
                      : formState.activeTab === "advanced"
                        ? "Advanced Options"
                        : "Image Upload"}
                </span>
              </div>

              {/* Step completion indicators */}
              <div className="flex items-center gap-2 mb-2">
                {/* Step 1: Basic Info */}
                <div
                  className={cn(
                    "flex items-center gap-1 text-xs",
                    shouldShowStep1Completed
                      ? "text-green-600"
                      : "text-gray-400"
                  )}
                >
                  <div
                    className={cn(
                      "w-4 h-4 rounded-full flex items-center justify-center",
                      shouldShowStep1Completed
                        ? "bg-green-100 text-green-600"
                        : "bg-gray-100 text-gray-400"
                    )}
                  >
                    {shouldShowStep1Completed ? (
                      <CheckCircle className="w-3 h-3" />
                    ) : (
                      "1"
                    )}
                  </div>
                  <span>Basic Info</span>
                </div>

                <div className="w-8 h-px bg-gray-300"></div>

                {/* Step 2: Details */}
                <div
                  className={cn(
                    "flex items-center gap-1 text-xs",
                    shouldShowStep2Completed
                      ? "text-green-600"
                      : "text-gray-400"
                  )}
                >
                  <div
                    className={cn(
                      "w-4 h-4 rounded-full flex items-center justify-center",
                      shouldShowStep2Completed
                        ? "bg-green-100 text-green-600"
                        : "bg-gray-100 text-gray-400"
                    )}
                  >
                    {shouldShowStep2Completed ? (
                      <CheckCircle className="w-3 h-3" />
                    ) : (
                      "2"
                    )}
                  </div>
                  <span>Details</span>
                </div>

                <div className="w-8 h-px bg-gray-300"></div>

                {/* Step 3: Advanced */}
                <div
                  className={cn(
                    "flex items-center gap-1 text-xs",
                    shouldShowStep2Completed &&
                      formState.visitedSteps.has("advanced")
                      ? "text-green-600"
                      : "text-gray-400"
                  )}
                >
                  <div
                    className={cn(
                      "w-4 h-4 rounded-full flex items-center justify-center",
                      shouldShowStep2Completed &&
                        formState.visitedSteps.has("advanced")
                        ? "bg-green-100 text-green-600"
                        : "bg-gray-100 text-gray-400"
                    )}
                  >
                    {shouldShowStep2Completed &&
                    formState.visitedSteps.has("advanced") ? (
                      <CheckCircle className="w-3 h-3" />
                    ) : (
                      "3"
                    )}
                  </div>
                  <span>Advanced</span>
                </div>

                <div className="w-8 h-px bg-gray-300"></div>

                {/* Step 4: Image */}
                <div
                  className={cn(
                    "flex items-center gap-1 text-xs",
                    shouldShowStep2Completed &&
                      formState.visitedSteps.has("image")
                      ? "text-green-600"
                      : "text-gray-400"
                  )}
                >
                  <div
                    className={cn(
                      "w-4 h-4 rounded-full flex items-center justify-center",
                      shouldShowStep2Completed &&
                        formState.visitedSteps.has("image")
                        ? "bg-green-100 text-green-600"
                        : "bg-gray-100 text-gray-400"
                    )}
                  >
                    {shouldShowStep2Completed &&
                    formState.visitedSteps.has("image") ? (
                      <CheckCircle className="w-3 h-3" />
                    ) : (
                      "4"
                    )}
                  </div>
                  <span>Image</span>
                </div>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: shouldShowStep1Completed
                      ? formState.activeTab === "basic"
                        ? "25%"
                        : shouldShowStep2Completed
                          ? formState.activeTab === "details"
                            ? "50%"
                            : formState.activeTab === "advanced"
                              ? "75%"
                              : "100%"
                          : "25%"
                      : "0%",
                  }}
                ></div>
              </div>
            </div>
          )}

          <Tabs
            value={formState.activeTab}
            onValueChange={(tab) =>
              handleTabChange(tab as "basic" | "details" | "advanced" | "image")
            }
          >
            <TabsList className="grid w-full grid-cols-4 bg-gray-100 p-1 rounded-lg">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="w-full">
                      <TabsTrigger
                        value="basic"
                        className="w-full rounded-[6px] flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-green-700 data-[state=active]:shadow-sm data-[state=active]:font-medium data-[state=active]:-mt-0.5 transition-all duration-200"
                      >
                        <FileText className="w-4 h-4" />
                        Basic Info
                      </TabsTrigger>
                    </div>
                  </TooltipTrigger>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="w-full">
                      <TabsTrigger
                        value="details"
                        disabled={!isStep1Completed && !item}
                        className={cn(
                          "w-full rounded-[6px] flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-green-700 data-[state=active]:shadow-sm data-[state=active]:font-medium data-[state=active]:-mt-0.5 transition-all duration-200",
                          !isStep1Completed &&
                            !item &&
                            "cursor-not-allowed opacity-50"
                        )}
                      >
                        <Settings className="w-4 h-4" />
                        Details
                        {!isStep1Completed && !item && (
                          <Lock className="w-3 h-3" />
                        )}
                      </TabsTrigger>
                    </div>
                  </TooltipTrigger>
                  {!isStep1Completed && !item && (
                    <TooltipContent>
                      <p>Complete Basic Information first</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="w-full">
                      <TabsTrigger
                        value="advanced"
                        disabled={!isStep2Completed && !item}
                        className={cn(
                          "w-full rounded-[6px] flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-green-700 data-[state=active]:shadow-sm data-[state=active]:font-medium data-[state=active]:-mt-0.5 transition-all duration-200",
                          !isStep2Completed &&
                            !item &&
                            "cursor-not-allowed opacity-50"
                        )}
                      >
                        <Layers className="w-4 h-4" />
                        Advanced
                        {!isStep2Completed && !item && (
                          <Lock className="w-3 h-3" />
                        )}
                      </TabsTrigger>
                    </div>
                  </TooltipTrigger>
                  {!isStep2Completed && !item && (
                    <TooltipContent>
                      <p>Complete Details & Settings first</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="w-full">
                      <TabsTrigger
                        value="image"
                        disabled={!isStep2Completed && !item}
                        className={cn(
                          "w-full rounded-[6px] flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-green-700 data-[state=active]:shadow-sm data-[state=active]:font-medium data-[state=active]:-mt-0.5 transition-all duration-200",
                          !isStep2Completed &&
                            !item &&
                            "cursor-not-allowed opacity-50"
                        )}
                      >
                        <ImageIcon className="w-4 h-4" />
                        Image
                        {!isStep2Completed && !item && (
                          <Lock className="w-3 h-3" />
                        )}
                      </TabsTrigger>
                    </div>
                  </TooltipTrigger>
                  {!isStep2Completed && !item && (
                    <TooltipContent>
                      <p>Complete Advanced Options first</p>
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
                  <div className="flex items-center justify-between mb-2">
                    <Label
                      htmlFor="description"
                      className="text-sm font-medium text-gray-700"
                    >
                      Description
                    </Label>
                    <span
                      className={cn(
                        "text-xs",
                        formState.formData.description.length > 250
                          ? "text-red-500"
                          : formState.formData.description.length > 200
                            ? "text-orange-500"
                            : "text-gray-500"
                      )}
                    >
                      {formState.formData.description.length}/250
                    </span>
                  </div>
                  <Textarea
                    id="description"
                    value={formState.formData.description}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value.length <= 250) {
                        updateFormData({ description: value });
                      }
                    }}
                    placeholder="Describe your menu item..."
                    className={cn(
                      "h-24 focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none",
                      formState.formData.description.length > 250 &&
                        "border-red-500 focus:ring-red-500"
                    )}
                    maxLength={250}
                  />
                  {formState.formData.description.length > 250 && (
                    <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      Description cannot exceed 250 characters
                    </p>
                  )}
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

                {/* Tags Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-gray-700">
                      Tags
                    </Label>
                    {(formState.formData.tags || []).length > 0 && (
                      <span className="text-xs text-green-600 font-medium">
                        {formState.formData.tags.length} selected
                      </span>
                    )}
                  </div>

                  {/* Selected Tags Summary */}
                  {(formState.formData.tags || []).length > 0 && (
                    <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-green-800">
                          Selected Tags
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            updateFormData({ tags: [] });
                          }}
                          className="text-xs text-green-600 hover:text-red-600 transition-colors"
                        >
                          Clear all
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {(formState.formData.tags || []).map((tag) => {
                          const tagInfo = getTagInfo(tag);
                          return (
                            <span
                              key={tag}
                              className="inline-flex items-center px-2.5 py-1 rounded-full text-xs bg-white text-green-700 border border-green-200 shadow-sm hover:shadow-md transition-all duration-200"
                            >
                              <span className="mr-1.5">{tagInfo.icon}</span>
                              {tagInfo.label}
                              <button
                                type="button"
                                onClick={() => {
                                  const currentTags =
                                    formState.formData.tags || [];
                                  updateFormData({
                                    tags: currentTags.filter((t) => t !== tag),
                                  });
                                }}
                                className="ml-1.5 hover:text-red-600 transition-colors p-0.5 rounded-full hover:bg-red-50"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Tag Categories */}
                  <div className="space-y-4">
                    {Object.entries(TAG_CATEGORIES).map(
                      ([categoryKey, categoryName]) => (
                        <div key={categoryKey} className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                              {categoryName}
                              {categoryKey === "VEGETARIAN_STATUS" && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Lock className="w-3 h-3 text-orange-500" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="text-xs">
                                        Only one option can be selected
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </h4>
                            <span className="text-xs text-gray-500">
                              {categoryKey === "VEGETARIAN_STATUS" ? (
                                (formState.formData.tags || []).some((tag) =>
                                  Object.values(
                                    MENU_TAGS.VEGETARIAN_STATUS
                                  ).includes(tag as any)
                                ) ? (
                                  "1 selected"
                                ) : (
                                  "0 selected"
                                )
                              ) : (
                                <>
                                  {
                                    getTagsByCategory(
                                      categoryKey as keyof typeof MENU_TAGS
                                    ).filter((tag) =>
                                      (formState.formData.tags || []).includes(
                                        tag
                                      )
                                    ).length
                                  }{" "}
                                  selected
                                </>
                              )}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            {getTagsByCategory(
                              categoryKey as keyof typeof MENU_TAGS
                            ).map((tag) => {
                              const tagInfo = getTagInfo(tag);
                              const isSelected = (
                                formState.formData.tags || []
                              ).includes(tag);

                              return (
                                <div
                                  key={tag}
                                  className="flex items-center space-x-2"
                                >
                                  <Checkbox
                                    id={tag}
                                    checked={isSelected}
                                    onCheckedChange={(checked) => {
                                      console.log(
                                        "Tag checkbox clicked:",
                                        tag,
                                        "checked:",
                                        checked
                                      );

                                      const currentTags =
                                        formState.formData.tags || [];

                                      if (checked) {
                                        // Handle vegetarian status mutual exclusivity
                                        if (
                                          Object.values(
                                            MENU_TAGS.VEGETARIAN_STATUS
                                          ).includes(tag as any)
                                        ) {
                                          // Remove any existing vegetarian status tags
                                          const filteredTags =
                                            currentTags.filter(
                                              (t) =>
                                                !Object.values(
                                                  MENU_TAGS.VEGETARIAN_STATUS
                                                ).includes(t as any)
                                            );
                                          updateFormData({
                                            tags: [...filteredTags, tag],
                                          });
                                        } else {
                                          // Regular tag - just add it
                                          updateFormData({
                                            tags: [...currentTags, tag],
                                          });
                                        }
                                      } else {
                                        // Remove tag
                                        updateFormData({
                                          tags: currentTags.filter(
                                            (t) => t !== tag
                                          ),
                                        });
                                      }
                                    }}
                                    className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                                  />
                                  <Label
                                    htmlFor={tag}
                                    className="text-sm text-gray-700 cursor-pointer flex items-center gap-2"
                                  >
                                    <span className="text-sm">
                                      {tagInfo.icon}
                                    </span>
                                    {tagInfo.label}
                                  </Label>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>

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

            <TabsContent value="advanced" className="space-y-6 mt-6">
              {/* Advanced Options Explanation */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 text-xs font-medium">i</span>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium text-blue-900">
                      Advanced Menu Options
                    </h4>
                    <p className="text-sm text-blue-700">
                      Create flexible menu items with size variations and custom
                      add-ons. Price modifiers allow you to charge extra for
                      premium options or offer free customizations.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-blue-600">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                        <strong>Size Variations:</strong> Small/Medium/Large
                        with different prices
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                        <strong>Price Modifiers:</strong> Additional cost for
                        premium options
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                        <strong>Free Add-ons:</strong> Use 0.00 for
                        complimentary options
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                        <strong>Required Options:</strong> Force customers to
                        make selections
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {/* Size Variations */}
                <div className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Ruler className="w-5 h-5 text-gray-600" />
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Size Variations
                        </h3>
                        <p className="text-sm text-gray-600">
                          Create different sizes with varying prices (e.g.,
                          Small $8, Medium $10, Large $12)
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAddSize(true)}
                      className="border-green-200 text-green-700 hover:bg-green-50"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Size
                    </Button>
                  </div>

                  {formState.formData.sizes.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {formState.formData.sizes.map((size) => (
                        <div
                          key={size.id}
                          className="relative group bg-white border border-gray-200 rounded-lg p-4 hover:border-green-300 hover:shadow-sm transition-all duration-200"
                        >
                          {/* Default Badge */}
                          {size.isDefault && (
                            <div className="absolute -top-2 -right-2">
                              <Badge className="bg-green-600 text-white text-xs px-2 py-1 shadow-sm">
                                Default
                              </Badge>
                            </div>
                          )}

                          <div className="flex items-start justify-between">
                            <div className="flex-1 space-y-2">
                              {/* Size Name */}
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant={
                                    size.isDefault ? "default" : "outline"
                                  }
                                  className={cn(
                                    "text-sm font-medium",
                                    size.isDefault
                                      ? "bg-green-600 text-white border-green-600"
                                      : "bg-gray-100 text-gray-700 border-gray-300"
                                  )}
                                >
                                  {size.name.charAt(0).toUpperCase() +
                                    size.name.slice(1).toLowerCase()}
                                </Badge>
                              </div>

                              {/* Price Information */}
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600">
                                  {size.priceModifier > 0 ? (
                                    <span className="font-medium text-green-700">
                                      +{currencySymbol}
                                      {size.priceModifier.toFixed(2)}
                                    </span>
                                  ) : (
                                    <span className="text-gray-500">
                                      No extra cost
                                    </span>
                                  )}
                                </span>
                              </div>
                            </div>

                            {/* Remove Button */}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveSize(size.id)}
                              className="opacity-0 group-hover:opacity-100 text-red-600 hover:text-red-700 hover:bg-red-50 transition-opacity duration-200"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : !showAddSize ? (
                    <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
                      <Ruler className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">
                        No size variations added yet
                      </p>
                      <p className="text-gray-400 text-xs mt-1">
                        Click &quot;Add Size&quot; to get started
                      </p>
                    </div>
                  ) : null}

                  {/* Add Size Modal */}
                  {showAddSize && (
                    <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-white">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-700">
                            Size Name
                          </Label>
                          <Input
                            value={newSize.name}
                            onChange={(e) =>
                              setNewSize({ ...newSize, name: e.target.value })
                            }
                            placeholder="e.g., Small, Medium, Large"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <Label className="text-sm font-medium text-gray-700">
                              Price Modifier
                            </Label>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="w-4 h-4 text-gray-400 cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  <div className="space-y-2">
                                    <p className="font-medium">
                                      How Price Modifier Works
                                    </p>
                                    <p className="text-sm">
                                      This amount is added to the base item
                                      price.
                                    </p>
                                    <ul className="text-xs space-y-1">
                                      <li>
                                        • 0.00 = No extra cost (same as base
                                        price)
                                      </li>
                                      <li>
                                        • 2.50 = Adds {currencySymbol}2.50 to
                                        the base price
                                      </li>
                                      <li>
                                        • Example: Base price {currencySymbol}8
                                        + Size modifier {currencySymbol}2 =
                                        Customer pays {currencySymbol}10
                                      </li>
                                    </ul>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <Input
                            type="number"
                            step="0.01"
                            value={newSize.priceModifier}
                            onChange={(e) =>
                              setNewSize({
                                ...newSize,
                                priceModifier: parseFloat(e.target.value) || 0,
                              })
                            }
                            placeholder="0.00"
                            className="mt-1"
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="isDefault"
                            checked={newSize.isDefault}
                            onCheckedChange={(checked) =>
                              setNewSize({
                                ...newSize,
                                isDefault: checked as boolean,
                              })
                            }
                            className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                          />
                          <Label htmlFor="isDefault" className="text-green-700">
                            Default Size
                          </Label>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button
                          type="button"
                          onClick={handleAddSize}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          Add Size
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setShowAddSize(false)}
                          className="border-gray-300 text-gray-700 hover:bg-gray-50"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Modifiers */}
                <div className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Layers className="w-5 h-5 text-gray-600" />
                      <div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            Modifiers & Add-ons
                          </h3>
                          <p className="text-sm text-gray-600">
                            Add customizations like extra cheese (+
                            {currencySymbol}1.50), gluten-free (+
                            {currencySymbol}2.00), or free sauce options
                          </p>
                        </div>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAddModifier(true)}
                      className="border-green-200 text-green-700 hover:bg-green-50"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Modifier
                    </Button>
                  </div>

                  {formState.formData.modifiers.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {formState.formData.modifiers.map((modifier) => (
                        <div
                          key={modifier.id}
                          className="relative group bg-white border border-gray-200 rounded-lg p-4 hover:border-green-300 hover:shadow-sm transition-all duration-200"
                        >
                          {/* Required Badge */}
                          {modifier.isRequired && (
                            <div className="absolute -top-2 -right-2">
                              <Badge className="bg-red-600 text-white text-xs px-2 py-1 shadow-sm">
                                Required
                              </Badge>
                            </div>
                          )}

                          <div className="flex items-start justify-between">
                            <div className="flex-1 space-y-3">
                              {/* Header with Type Badge and Name */}
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Badge
                                      className={getModifierTypeColor(
                                        modifier.type
                                      )}
                                    >
                                      {getModifierTypeIcon(modifier.type)}
                                      {modifier.type.charAt(0).toUpperCase() +
                                        modifier.type.slice(1).toLowerCase()}
                                    </Badge>
                                  </div>
                                  <h4 className="font-medium text-gray-900 text-sm">
                                    {modifier.name.charAt(0).toUpperCase() +
                                      modifier.name.slice(1).toLowerCase()}
                                  </h4>
                                </div>
                              </div>

                              {/* Description */}
                              {modifier.description && (
                                <p className="text-xs text-gray-600 leading-relaxed">
                                  {modifier.description}
                                </p>
                              )}

                              {/* Price Information */}
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600">
                                  {modifier.priceModifier > 0 ? (
                                    <span className="font-medium text-green-700">
                                      +{currencySymbol}
                                      {modifier.priceModifier.toFixed(2)}
                                    </span>
                                  ) : (
                                    <span className="text-green-600 font-medium">
                                      Free
                                    </span>
                                  )}
                                </span>
                              </div>
                            </div>

                            {/* Remove Button */}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveModifier(modifier.id)}
                              className="opacity-0 group-hover:opacity-100 text-red-600 hover:text-red-700 hover:bg-red-50 transition-opacity duration-200"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : !showAddModifier ? (
                    <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
                      <Layers className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">
                        No modifiers added yet
                      </p>
                      <p className="text-gray-400 text-xs mt-1">
                        Click &quot;Add Modifier&quot; to get started
                      </p>
                    </div>
                  ) : null}

                  {/* Add Modifier Modal */}
                  {showAddModifier && (
                    <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-white">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-700">
                            Modifier Name
                          </Label>
                          <Input
                            value={newModifier.name}
                            onChange={(e) =>
                              setNewModifier({
                                ...newModifier,
                                name: e.target.value,
                              })
                            }
                            placeholder="e.g., Extra Cheese, Gluten-Free"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-700">
                            Type
                          </Label>
                          <Select
                            value={newModifier.type}
                            onValueChange={(value: any) =>
                              setNewModifier({ ...newModifier, type: value })
                            }
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="addon">Add-on</SelectItem>
                              <SelectItem value="substitution">
                                Substitution
                              </SelectItem>
                              <SelectItem value="preparation">
                                Preparation
                              </SelectItem>
                              <SelectItem value="sauce">Sauce</SelectItem>
                              <SelectItem value="topping">Topping</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-700">
                            Description
                          </Label>
                          <Input
                            value={newModifier.description}
                            onChange={(e) =>
                              setNewModifier({
                                ...newModifier,
                                description: e.target.value,
                              })
                            }
                            placeholder="Optional description"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <Label className="text-sm font-medium text-gray-700">
                              Price Modifier
                            </Label>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="w-4 h-4 text-gray-400 cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  <div className="space-y-2">
                                    <p className="font-medium">
                                      How Price Modifier Works
                                    </p>
                                    <p className="text-sm">
                                      This amount is added when customers select
                                      this option.
                                    </p>
                                    <ul className="text-xs space-y-1">
                                      <li>
                                        • 0.00 = Free add-on (no extra cost)
                                      </li>
                                      <li>
                                        • 1.50 = Adds {currencySymbol}1.50 when
                                        selected
                                      </li>
                                      <li>
                                        • Example: &quot;Extra Cheese&quot; with{" "}
                                        {currencySymbol}1.50 = Customer pays{" "}
                                        {currencySymbol}1.50 extra
                                      </li>
                                    </ul>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <Input
                            type="number"
                            step="0.01"
                            value={newModifier.priceModifier}
                            onChange={(e) =>
                              setNewModifier({
                                ...newModifier,
                                priceModifier: parseFloat(e.target.value) || 0,
                              })
                            }
                            placeholder="0.00"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-700">
                            Max Selections
                          </Label>
                          <Input
                            type="number"
                            min="1"
                            value={newModifier.maxSelections}
                            onChange={(e) =>
                              setNewModifier({
                                ...newModifier,
                                maxSelections: parseInt(e.target.value) || 1,
                              })
                            }
                            placeholder="1"
                            className="mt-1"
                          />
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="isRequired"
                              checked={newModifier.isRequired}
                              onCheckedChange={(checked) =>
                                setNewModifier({
                                  ...newModifier,
                                  isRequired: checked as boolean,
                                })
                              }
                              className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                            />
                            <Label
                              htmlFor="isRequired"
                              className="text-green-700"
                            >
                              Required
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="isAvailable"
                              checked={newModifier.isAvailable}
                              onCheckedChange={(checked) =>
                                setNewModifier({
                                  ...newModifier,
                                  isAvailable: checked as boolean,
                                })
                              }
                              className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                            />
                            <Label
                              htmlFor="isAvailable"
                              className="text-green-700"
                            >
                              Available
                            </Label>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button
                          type="button"
                          onClick={handleAddModifier}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          Add Modifier
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setShowAddModifier(false)}
                          className="border-gray-300 text-gray-700 hover:bg-gray-50"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
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
              onClick={handleModalClose}
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
