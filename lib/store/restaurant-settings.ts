import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Currency = {
  value: string;
  label: string;
  symbol: string;
};

export const CURRENCIES: Currency[] = [
  { value: "USD", label: "USD - US Dollar", symbol: "$" },
  { value: "CHF", label: "CHF - Swiss Franc", symbol: "CHF" },
  { value: "EUR", label: "EUR - Euro", symbol: "€" },
];

interface RestaurantSettingsState {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
}

export const useRestaurantSettings = create<RestaurantSettingsState>()(
  persist(
    (set) => ({
      currency: CURRENCIES[1], // Default to CHF
      setCurrency: (currency) => set({ currency }),
    }),
    {
      name: "restaurant-settings",
    }
  )
);
