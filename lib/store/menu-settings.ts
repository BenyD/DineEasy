import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface MenuCategory {
  id: string;
  name: string;
  description?: string;
}

export interface Allergen {
  id: string;
  name: string;
  icon?: string;
}

interface MenuSettingsState {
  categories: MenuCategory[];
  allergens: Allergen[];
  addCategory: (category: Omit<MenuCategory, "id">) => void;
  removeCategory: (id: string) => void;
  addAllergen: (allergen: Omit<Allergen, "id">) => void;
  removeAllergen: (id: string) => void;
}

// Default categories and allergens
const DEFAULT_CATEGORIES: MenuCategory[] = [
  {
    id: "starters",
    name: "Starters",
    description: "Appetizers and small plates",
  },
  { id: "mains", name: "Mains", description: "Main course dishes" },
  {
    id: "desserts",
    name: "Desserts",
    description: "Sweet treats and desserts",
  },
  { id: "drinks", name: "Drinks", description: "Beverages and cocktails" },
  { id: "sides", name: "Sides", description: "Side dishes and accompaniments" },
];

const DEFAULT_ALLERGENS: Allergen[] = [
  { id: "gluten", name: "Gluten" },
  { id: "dairy", name: "Dairy" },
  { id: "eggs", name: "Eggs" },
  { id: "nuts", name: "Nuts" },
  { id: "soy", name: "Soy" },
  { id: "shellfish", name: "Shellfish" },
  { id: "fish", name: "Fish" },
  { id: "sulfites", name: "Sulfites" },
];

export const useMenuSettings = create<MenuSettingsState>()(
  persist(
    (set) => ({
      categories: DEFAULT_CATEGORIES,
      allergens: DEFAULT_ALLERGENS,
      addCategory: (category) =>
        set((state) => ({
          categories: [
            ...state.categories,
            { ...category, id: Date.now().toString() },
          ],
        })),
      removeCategory: (id) =>
        set((state) => ({
          categories: state.categories.filter((c) => c.id !== id),
        })),
      addAllergen: (allergen) =>
        set((state) => ({
          allergens: [
            ...state.allergens,
            { ...allergen, id: Date.now().toString() },
          ],
        })),
      removeAllergen: (id) =>
        set((state) => ({
          allergens: state.allergens.filter((a) => a.id !== id),
        })),
    }),
    {
      name: "menu-settings",
    }
  )
);
