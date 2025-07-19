"use client";

import { create } from "zustand";
import { toast } from "sonner";
import {
  getMenuItems,
  getCategories,
  getAllergens,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  createCategory,
  updateCategory,
  deleteCategory,
  createAllergen,
  updateAllergen,
  deleteAllergen,
} from "@/lib/actions/menu";

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  categoryId?: string;
  preparationTime: number;
  available: boolean;
  allergens: string[];
  allergenIds: string[];
  popular: boolean;
  image: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MenuCategory {
  id: string;
  name: string;
  description?: string;
  sortOrder?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Allergen {
  id: string;
  name: string;
  icon?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface MenuSettings {
  // State
  menuItems: MenuItem[];
  categories: MenuCategory[];
  allergens: Allergen[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchMenuItems: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  fetchAllergens: () => Promise<void>;

  // Menu Items
  addMenuItem: (formData: FormData) => Promise<void>;
  updateMenuItem: (id: string, formData: FormData) => Promise<void>;
  removeMenuItem: (id: string) => Promise<void>;

  // Categories
  addCategory: (formData: FormData) => Promise<void>;
  updateCategory: (id: string, formData: FormData) => Promise<void>;
  removeCategory: (id: string) => Promise<void>;

  // Allergens
  addAllergen: (formData: FormData) => Promise<void>;
  updateAllergen: (id: string, formData: FormData) => Promise<void>;
  removeAllergen: (id: string) => Promise<void>;

  // Utility
  clearError: () => void;
}

export const useMenuSettings = create<MenuSettings>((set, get) => ({
  // Initial state
  menuItems: [],
  categories: [],
  allergens: [],
  isLoading: false,
  error: null,

  // Fetch menu items
  fetchMenuItems: async () => {
    set({ isLoading: true, error: null });

    try {
      const result = await getMenuItems();

      if (result.error) {
        throw new Error(result.error);
      }

      set({ menuItems: result.data || [], isLoading: false });
    } catch (error: any) {
      console.error("Error fetching menu items:", error);
      set({
        error: error.message || "Failed to fetch menu items",
        isLoading: false,
      });
    }
  },

  // Fetch categories
  fetchCategories: async () => {
    set({ isLoading: true, error: null });

    try {
      const result = await getCategories();

      if (result.error) {
        throw new Error(result.error);
      }

      set({ categories: result.data || [], isLoading: false });
    } catch (error: any) {
      console.error("Error fetching categories:", error);
      set({
        error: error.message || "Failed to fetch categories",
        isLoading: false,
      });
    }
  },

  // Fetch allergens
  fetchAllergens: async () => {
    set({ isLoading: true, error: null });

    try {
      const result = await getAllergens();

      if (result.error) {
        throw new Error(result.error);
      }

      set({ allergens: result.data || [], isLoading: false });
    } catch (error: any) {
      console.error("Error fetching allergens:", error);
      set({
        error: error.message || "Failed to fetch allergens",
        isLoading: false,
      });
    }
  },

  // Add menu item
  addMenuItem: async (formData: FormData) => {
    set({ isLoading: true, error: null });

    try {
      const result = await createMenuItem(formData);

      if (result.error) {
        throw new Error(result.error);
      }

      // Refresh menu items
      await get().fetchMenuItems();

      toast.success("Menu item added successfully!");
      set({ isLoading: false });
    } catch (error: any) {
      console.error("Error adding menu item:", error);
      set({
        error: error.message || "Failed to add menu item",
        isLoading: false,
      });
      toast.error(error.message || "Failed to add menu item");
    }
  },

  // Update menu item
  updateMenuItem: async (id: string, formData: FormData) => {
    set({ isLoading: true, error: null });

    try {
      const result = await updateMenuItem(id, formData);

      if (result.error) {
        throw new Error(result.error);
      }

      // Refresh menu items
      await get().fetchMenuItems();

      toast.success("Menu item updated successfully!");
      set({ isLoading: false });
    } catch (error: any) {
      console.error("Error updating menu item:", error);
      set({
        error: error.message || "Failed to update menu item",
        isLoading: false,
      });
      toast.error(error.message || "Failed to update menu item");
    }
  },

  // Remove menu item
  removeMenuItem: async (id: string) => {
    set({ isLoading: true, error: null });

    try {
      const result = await deleteMenuItem(id);

      if (result.error) {
        throw new Error(result.error);
      }

      // Remove from local state
      set((state) => ({
        menuItems: state.menuItems.filter((item) => item.id !== id),
        isLoading: false,
      }));

      toast.success("Menu item deleted successfully!");
    } catch (error: any) {
      console.error("Error deleting menu item:", error);
      set({
        error: error.message || "Failed to delete menu item",
        isLoading: false,
      });
      toast.error(error.message || "Failed to delete menu item");
    }
  },

  // Add category
  addCategory: async (formData: FormData) => {
    set({ isLoading: true, error: null });

    try {
      const result = await createCategory(formData);

      if (result.error) {
        throw new Error(result.error);
      }

      // Optimistically add to local state instead of full refresh
      if (result.data) {
        set((state) => ({
          categories: [...state.categories, result.data],
          isLoading: false,
        }));
      } else {
        // Fallback to refresh if no data returned
        await get().fetchCategories();
        set({ isLoading: false });
      }

      toast.success("Category added successfully!");
    } catch (error: any) {
      console.error("Error adding category:", error);
      set({
        error: error.message || "Failed to add category",
        isLoading: false,
      });
      toast.error(error.message || "Failed to add category");
    }
  },

  // Update category
  updateCategory: async (id: string, formData: FormData) => {
    set({ isLoading: true, error: null });

    try {
      const result = await updateCategory(id, formData);

      if (result.error) {
        throw new Error(result.error);
      }

      // Refresh categories
      await get().fetchCategories();

      toast.success("Category updated successfully!");
      set({ isLoading: false });
    } catch (error: any) {
      console.error("Error updating category:", error);
      set({
        error: error.message || "Failed to update category",
        isLoading: false,
      });
      toast.error(error.message || "Failed to update category");
    }
  },

  // Remove category
  removeCategory: async (id: string) => {
    set({ isLoading: true, error: null });

    try {
      const result = await deleteCategory(id);

      if (result.error) {
        throw new Error(result.error);
      }

      // Remove from local state
      set((state) => ({
        categories: state.categories.filter((category) => category.id !== id),
        isLoading: false,
      }));

      toast.success("Category deleted successfully!");
    } catch (error: any) {
      console.error("Error deleting category:", error);
      set({
        error: error.message || "Failed to delete category",
        isLoading: false,
      });
      toast.error(error.message || "Failed to delete category");
    }
  },

  // Add allergen
  addAllergen: async (formData: FormData) => {
    set({ isLoading: true, error: null });

    try {
      const result = await createAllergen(formData);

      if (result.error) {
        throw new Error(result.error);
      }

      // Optimistically add to local state instead of full refresh
      if (result.data) {
        set((state) => ({
          allergens: [...state.allergens, result.data],
          isLoading: false,
        }));
      } else {
        // Fallback to refresh if no data returned
        await get().fetchAllergens();
        set({ isLoading: false });
      }

      toast.success("Allergen added successfully!");
    } catch (error: any) {
      console.error("Error adding allergen:", error);
      set({
        error: error.message || "Failed to add allergen",
        isLoading: false,
      });
      toast.error(error.message || "Failed to add allergen");
    }
  },

  // Update allergen
  updateAllergen: async (id: string, formData: FormData) => {
    set({ isLoading: true, error: null });

    try {
      const result = await updateAllergen(id, formData);

      if (result.error) {
        throw new Error(result.error);
      }

      // Refresh allergens
      await get().fetchAllergens();

      toast.success("Allergen updated successfully!");
      set({ isLoading: false });
    } catch (error: any) {
      console.error("Error updating allergen:", error);
      set({
        error: error.message || "Failed to update allergen",
        isLoading: false,
      });
      toast.error(error.message || "Failed to update allergen");
    }
  },

  // Remove allergen
  removeAllergen: async (id: string) => {
    set({ isLoading: true, error: null });

    try {
      const result = await deleteAllergen(id);

      if (result.error) {
        throw new Error(result.error);
      }

      // Remove from local state
      set((state) => ({
        allergens: state.allergens.filter((allergen) => allergen.id !== id),
        isLoading: false,
      }));

      toast.success("Allergen deleted successfully!");
    } catch (error: any) {
      console.error("Error deleting allergen:", error);
      set({
        error: error.message || "Failed to delete allergen",
        isLoading: false,
      });
      toast.error(error.message || "Failed to delete allergen");
    }
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },
}));
