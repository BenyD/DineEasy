"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { toast } from "sonner";
import { type MenuItem, type MenuItemAllergen } from "@/types";

interface FormData {
  name: string;
  description: string;
  price: string;
  category: string;
  preparationTime: string;
  available: boolean;
  allergens: MenuItemAllergen[];
  popular: boolean;
  image: string;
}

interface FormState {
  formData: FormData;
  activeTab: "basic" | "details" | "image";
  isSubmitting: boolean;
  isUploading: boolean;
  isImageUploading: boolean;
  uploadProgress: number;
  imagePreview: string | null;
  formErrors: Record<string, string>;
  hasUnsavedChanges: boolean;
  isAddingCategory: boolean;
  isAddingAllergen: boolean;
  newCategory: { name: string; description: string };
  newAllergen: { name: string; icon: string };
  isFormInitialized: boolean;
  visitedSteps: Set<string>;
}

interface UseMenuFormProps {
  item?: MenuItem;
  onClose: () => void;
  onSubmit: (formData: FormData) => Promise<void>;
  onAddCategory: (name: string, description: string) => Promise<any>;
  onAddAllergen: (name: string, icon: string) => Promise<any>;
  onUploadImage: (file: File) => Promise<{ url: string } | { error: string }>;
}

// Local storage helpers
const FORM_STORAGE_KEY = "menu-item-form-progress";

function loadMenuItemFormProgress() {
  try {
    const saved = localStorage.getItem(FORM_STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

function saveMenuItemFormProgress(
  formData: FormData,
  activeTab: string,
  clear: boolean = false
) {
  try {
    if (clear) {
      localStorage.removeItem(FORM_STORAGE_KEY);
    } else {
      localStorage.setItem(
        FORM_STORAGE_KEY,
        JSON.stringify({ formData, activeTab })
      );
    }
  } catch {
    // Ignore storage errors
  }
}

export function useMenuForm({
  item,
  onClose,
  onSubmit,
  onAddCategory,
  onAddAllergen,
  onUploadImage,
}: UseMenuFormProps) {
  // Refs for stable references
  const isInitializedRef = useRef(false);
  const activeTabRef = useRef("basic");
  const formDataRef = useRef<FormData | null>(null);
  const isAutoSelectingRef = useRef(false);

  // Initialize form state with localStorage persistence
  const [formState, setFormState] = useState<FormState>(() => {
    // Default state structure
    const defaultState: FormState = {
      formData: {
        name: "",
        description: "",
        price: "",
        category: "",
        preparationTime: "",
        available: true,
        allergens: [],
        popular: false,
        image: "",
      },
      activeTab: "basic",
      isSubmitting: false,
      isUploading: false,
      isImageUploading: false,
      uploadProgress: 0,
      imagePreview: null,
      formErrors: {},
      hasUnsavedChanges: false,
      isAddingCategory: false,
      isAddingAllergen: false,
      newCategory: { name: "", description: "" },
      newAllergen: { name: "", icon: "" },
      isFormInitialized: false,
      visitedSteps: new Set(["basic"]),
    };

    // If editing an existing item, return default state (will be populated in useEffect)
    if (item) {
      return defaultState;
    }

    // For new items, check localStorage
    const savedProgress = loadMenuItemFormProgress();
    if (
      savedProgress.formData &&
      Object.keys(savedProgress.formData).length > 0
    ) {
      return {
        ...defaultState,
        formData: {
          name: savedProgress.formData.name || "",
          description: savedProgress.formData.description || "",
          price: savedProgress.formData.price || "",
          category: savedProgress.formData.category || "",
          preparationTime: savedProgress.formData.preparationTime || "",
          available: savedProgress.formData.available ?? true,
          allergens: savedProgress.formData.allergens || [],
          popular: savedProgress.formData.popular || false,
          image: "",
        },
        activeTab: savedProgress.activeTab || "basic",
        hasUnsavedChanges: true,
        isFormInitialized: true,
        visitedSteps: new Set([savedProgress.activeTab || "basic"]),
      };
    }

    return defaultState;
  });

  // State to track if we've resumed from localStorage
  const [hasResumed, setHasResumed] = useState(false);

  // Update refs when state changes
  useEffect(() => {
    activeTabRef.current = formState.activeTab;
    formDataRef.current = formState.formData;
  }, [formState.activeTab, formState.formData]);

  // Save form progress to localStorage with debounce
  useEffect(() => {
    if (!item && formState.isFormInitialized && !isAutoSelectingRef.current) {
      const timeoutId = setTimeout(() => {
        // Only save if we have actual data to save
        if (
          Object.values(formState.formData).some(
            (value) => value !== "" && value !== false
          )
        ) {
          saveMenuItemFormProgress(formState.formData, formState.activeTab);
        }
      }, 500); // Debounce for 500ms

      return () => clearTimeout(timeoutId);
    }
  }, [
    formState.formData,
    formState.activeTab,
    formState.isFormInitialized,
    item,
  ]);

  // Show resume notification only if we actually restored data
  useEffect(() => {
    if (!isInitializedRef.current && !item) {
      isInitializedRef.current = true;
      const savedProgress = loadMenuItemFormProgress();
      if (
        savedProgress.formData &&
        Object.keys(savedProgress.formData).length > 0
      ) {
        const hasShownToast = sessionStorage.getItem(
          "menu-form-resume-toast-shown"
        );
        if (!hasShownToast) {
          sessionStorage.setItem("menu-form-resume-toast-shown", "true");
          setHasResumed(true);
          toast.info(
            "Welcome back! Your previous progress has been restored.",
            {
              duration: 4000,
            }
          );
        }
      }
    }
  }, [item]);

  // Form initialization effect
  useEffect(() => {
    if (isAutoSelectingRef.current) return;

    if (item) {
      // Ensure allergens are properly formatted
      const formattedAllergens =
        item.allergens
          ?.map((allergen: string | MenuItemAllergen) => {
            // If allergen is already an object with id, name, and icon, use it
            if (
              typeof allergen === "object" &&
              allergen !== null &&
              "id" in allergen
            ) {
              return allergen as MenuItemAllergen;
            }
            // If it's just a name string, we need to find the corresponding allergen object
            // This should be handled by the parent component providing the full allergen data
            // For now, return null and filter out
            return null;
          })
          .filter(Boolean) || [];

      setFormState((prev) => ({
        ...prev,
        formData: {
          name: item.name || "",
          description: item.description || "",
          price: item.price?.toString() || "",
          category: item.categoryId || "",
          preparationTime: item.preparationTime?.toString() || "",
          available: item.available ?? true,
          allergens: formattedAllergens,
          popular: item.popular || false,
          image: item.image || "",
        },
        activeTab: activeTabRef.current,
        isFormInitialized: true,
      }));
    }
  }, [item]);

  // Form validation
  const validateForm = useCallback(() => {
    const errors: Record<string, string> = {};

    // Only validate fields that are relevant to the current tab
    if (formState.activeTab === "basic") {
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
    }

    if (formState.activeTab === "details") {
      if (!formState.formData.category) {
        errors.category = "Category is required";
      }
    }

    setFormState((prev) => ({
      ...prev,
      formErrors: errors,
    }));

    return Object.keys(errors).length === 0;
  }, [formState.activeTab, formState.formData]);

  // Form data management
  const updateFormData = useCallback((updates: Partial<FormData>) => {
    setFormState((prev) => {
      const newFormData = { ...prev.formData, ...updates };
      const newFormErrors = { ...prev.formErrors };

      // Clear errors when user starts typing
      if (updates.name && newFormErrors.name) delete newFormErrors.name;
      if (updates.price && newFormErrors.price) delete newFormErrors.price;
      if (updates.preparationTime && newFormErrors.preparationTime)
        delete newFormErrors.preparationTime;
      if (updates.category && newFormErrors.category)
        delete newFormErrors.category;

      return {
        ...prev,
        formData: newFormData,
        formErrors: newFormErrors,
        hasUnsavedChanges: true,
      };
    });
  }, []);

  // Handle tab change
  const handleTabChange = useCallback(
    (tab: "basic" | "details" | "image") => {
      if (tab === formState.activeTab) return;

      // Only validate when adding new items, not when editing
      if (!item && tab === "details" && !validateForm()) {
        toast.error("Please fix the errors before proceeding");
        return;
      }

      setFormState((prev) => ({
        ...prev,
        activeTab: tab,
        visitedSteps: new Set([...prev.visitedSteps, tab]),
      }));
    },
    [formState.activeTab, validateForm, item]
  );

  // Handle form submission
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!validateForm()) {
        toast.error("Please fix the errors before submitting");
        return;
      }

      try {
        setFormState((prev) => ({ ...prev, isSubmitting: true }));

        // Show initial processing toast
        const processingToast = toast.loading(
          item ? "Updating menu item..." : "Adding menu item...",
          {
            description: "Please wait while we save your changes",
          }
        );

        await onSubmit(formState.formData);

        // Clear the loading toast and show success
        toast.dismiss(processingToast);
        toast.success(
          item
            ? "Menu item updated successfully!"
            : "Menu item added successfully!",
          {
            description: "Your changes have been saved",
          }
        );

        saveMenuItemFormProgress({} as FormData, "", true); // Clear saved progress
        onClose();
      } catch (error) {
        console.error("Form submission error:", error);

        // Show more specific error messages
        let errorMessage = "Failed to save menu item";
        if (error instanceof Error) {
          if (
            error.message.includes("network") ||
            error.message.includes("fetch")
          ) {
            errorMessage =
              "Network error. Please check your connection and try again.";
          } else if (error.message.includes("timeout")) {
            errorMessage = "Request timed out. Please try again.";
          } else if (error.message.includes("validation")) {
            errorMessage = "Please check your input and try again.";
          }
        }

        toast.error(errorMessage, {
          description:
            "Please try again or contact support if the problem persists",
        });
      } finally {
        setFormState((prev) => ({ ...prev, isSubmitting: false }));
      }
    },
    [formState.formData, validateForm, onSubmit, onClose, item]
  );

  // Handle image upload
  const handleImageUpload = useCallback(
    async (file: File) => {
      if (file.size === 0) {
        toast.error("File is empty");
        return;
      }

      if (file.size < 10) {
        toast.error("File appears to be corrupted or empty");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size exceeds 5MB limit");
        return;
      }

      const acceptedTypes = ["image/jpeg", "image/png", "image/webp"];
      if (!acceptedTypes.includes(file.type)) {
        toast.error("Image must be a JPEG, PNG, or WebP image");
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormState((prev) => ({
          ...prev,
          imagePreview: e.target?.result as string,
        }));
      };
      reader.onerror = () => {
        toast.error("Failed to read file. Please try a different image.");
        return;
      };
      reader.readAsDataURL(file);

      setFormState((prev) => ({
        ...prev,
        isUploading: true,
        isImageUploading: true,
        uploadProgress: 0,
      }));

      try {
        // Start with compression progress
        setFormState((prev) => ({ ...prev, uploadProgress: 5 }));

        // Simulate compression progress (5% to 35%)
        for (let i = 5; i <= 35; i += 3) {
          await new Promise((resolve) => setTimeout(resolve, 80));
          setFormState((prev) => ({ ...prev, uploadProgress: i }));
        }

        // Simulate upload progress (35% to 90%)
        for (let i = 35; i <= 90; i += 2) {
          await new Promise((resolve) => setTimeout(resolve, 120));
          setFormState((prev) => ({ ...prev, uploadProgress: i }));
        }

        const result = await onUploadImage(file);

        // Complete the progress
        setFormState((prev) => ({ ...prev, uploadProgress: 100 }));

        // Keep 100% for a moment before resetting
        setTimeout(() => {
          setFormState((prev) => ({ ...prev, uploadProgress: 0 }));
        }, 500);

        if ("error" in result) {
          toast.error(result.error);
          setFormState((prev) => ({ ...prev, imagePreview: null }));
        } else {
          // Update form data with new image URL
          updateFormData({ image: result.url });

          // Show success message with context
          if (item) {
            toast.success(
              "Image updated successfully - old image will be deleted on save"
            );
          } else {
            toast.success("Image uploaded successfully");
          }

          setTimeout(
            () => setFormState((prev) => ({ ...prev, imagePreview: null })),
            2000
          );
        }
      } catch (error) {
        console.error("Upload error:", error);
        toast.error("Failed to upload image. Please try again.");
        setFormState((prev) => ({ ...prev, imagePreview: null }));
      } finally {
        setFormState((prev) => ({
          ...prev,
          isUploading: false,
          isImageUploading: false,
          uploadProgress: 0,
        }));
      }
    },
    [updateFormData, onUploadImage, item]
  );

  // Handle category addition
  const handleAddCategory = useCallback(async () => {
    if (!formState.newCategory.name.trim()) {
      toast.error("Category name is required");
      return;
    }

    try {
      isAutoSelectingRef.current = true;
      const newCategory = await onAddCategory(
        formState.newCategory.name.trim(),
        formState.newCategory.description.trim()
      );

      setFormState((prev) => ({
        ...prev,
        isAddingCategory: false,
        newCategory: { name: "", description: "" },
      }));

      toast.success("Category added successfully");

      // Auto-select the newly created category
      if (newCategory && newCategory.id) {
        updateFormData({ category: newCategory.id });
      }
    } catch (error) {
      console.error("Error adding category:", error);
      toast.error("Failed to add category");
    } finally {
      isAutoSelectingRef.current = false;
    }
  }, [formState.newCategory, onAddCategory, updateFormData]);

  // Handle allergen addition
  const handleAddAllergen = useCallback(async () => {
    if (!formState.newAllergen.name.trim()) {
      toast.error("Allergen name is required");
      return;
    }

    try {
      isAutoSelectingRef.current = true;
      const newAllergen = await onAddAllergen(
        formState.newAllergen.name.trim(),
        formState.newAllergen.icon || "⚠️"
      );

      setFormState((prev) => ({
        ...prev,
        isAddingAllergen: false,
        newAllergen: { name: "", icon: "" },
      }));

      toast.success("Allergen added successfully");

      // Auto-select the newly created allergen
      if (newAllergen && newAllergen.id) {
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
    } catch (error) {
      console.error("Error adding allergen:", error);
      toast.error("Failed to add allergen");
    } finally {
      isAutoSelectingRef.current = false;
    }
  }, [
    formState.newAllergen,
    onAddAllergen,
    updateFormData,
    formState.formData.allergens,
  ]);

  return {
    formState,
    setFormState,
    hasResumed,
    updateFormData,
    handleTabChange,
    handleSubmit,
    handleImageUpload,
    handleAddCategory,
    handleAddAllergen,
    validateForm,
  };
}
