import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  getQRSettings,
  updateQRSettings,
  resetQRSettings,
} from "@/lib/actions/qr-settings";

export interface QRCodeOptions {
  width: number;
  margin: number;
  color: {
    dark: string;
    light: string;
  };
  errorCorrectionLevel: "L" | "M" | "Q" | "H";
  includeLogo?: boolean;
  logoSize?: number;
  logoOpacity?: number;
}

export interface QRCodeSettings {
  // Basic Settings
  width: number;
  margin: number;
  errorCorrectionLevel: "L" | "M" | "Q" | "H";

  // Color Settings
  colorDark: string;
  colorLight: string;

  // Logo Settings
  includeLogo: boolean;
  logoSize: number;
  logoOpacity: number;

  // Export Settings
  defaultExportFormat: "png" | "svg" | "pdf";
  defaultExportSize: number;

  // Preview Settings
  defaultPreviewMode: "mobile" | "tablet" | "desktop" | "print";

  // Advanced Settings
  autoRegenerateOnChange: boolean;
  showQRCodeInfo: boolean;
}

interface QRSettingsStore {
  settings: QRCodeSettings;
  isSettingsModalOpen: boolean;
  isLoading: boolean;

  // Actions
  updateSettings: (updates: Partial<QRCodeSettings>) => Promise<void>;
  resetToDefaults: () => Promise<void>;
  openSettingsModal: () => void;
  closeSettingsModal: () => void;
  loadSettings: () => Promise<void>;

  // Utility methods
  getQRCodeOptions: () => QRCodeOptions;
  applyColorPreset: (preset: ColorPreset) => void;
}

export interface ColorPreset {
  name: string;
  dark: string;
  light: string;
  description: string;
}

export const colorPresets: ColorPreset[] = [
  {
    name: "Classic",
    dark: "#000000",
    light: "#FFFFFF",
    description: "Black and white",
  },
  {
    name: "Modern",
    dark: "#1F2937",
    light: "#F9FAFB",
    description: "Dark gray and light gray",
  },
  {
    name: "Brand",
    dark: "#3B82F6",
    light: "#FFFFFF",
    description: "Blue and white",
  },
  {
    name: "Elegant",
    dark: "#374151",
    light: "#FEFEFE",
    description: "Charcoal and white",
  },
  {
    name: "Warm",
    dark: "#7C2D12",
    light: "#FEF7ED",
    description: "Brown and cream",
  },
  {
    name: "Cool",
    dark: "#1E40AF",
    light: "#EFF6FF",
    description: "Navy and light blue",
  },
  {
    name: "Green",
    dark: "#166534",
    light: "#F0FDF4",
    description: "Forest green and mint",
  },
  {
    name: "Purple",
    dark: "#7C3AED",
    light: "#FAF5FF",
    description: "Purple and lavender",
  },
];

const defaultSettings: QRCodeSettings = {
  // Basic Settings
  width: 256,
  margin: 2,
  errorCorrectionLevel: "M",

  // Color Settings
  colorDark: "#1F2937",
  colorLight: "#FFFFFF",

  // Logo Settings
  includeLogo: false,
  logoSize: 50,
  logoOpacity: 0.8,

  // Export Settings
  defaultExportFormat: "png",
  defaultExportSize: 512,

  // Preview Settings
  defaultPreviewMode: "mobile",

  // Advanced Settings
  autoRegenerateOnChange: true,
  showQRCodeInfo: true,
};

export const useQRSettings = create<QRSettingsStore>()(
  persist(
    (set, get) => ({
      settings: defaultSettings,
      isSettingsModalOpen: false,
      isLoading: false,

      loadSettings: async () => {
        set({ isLoading: true });
        try {
          const settings = await getQRSettings();
          set({ settings });
        } catch (error) {
          console.error("Failed to load QR settings:", error);
          // Keep default settings if loading fails
        } finally {
          set({ isLoading: false });
        }
      },

      updateSettings: async (updates) => {
        set({ isLoading: true });
        try {
          const result = await updateQRSettings(updates);
          if (result.success) {
            set((state) => ({
              settings: { ...state.settings, ...updates },
            }));
          } else {
            throw new Error(result.error || "Failed to update settings");
          }
        } catch (error) {
          console.error("Failed to update QR settings:", error);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      resetToDefaults: async () => {
        set({ isLoading: true });
        try {
          const result = await resetQRSettings();
          if (result.success) {
            set({ settings: defaultSettings });
          } else {
            throw new Error(result.error || "Failed to reset settings");
          }
        } catch (error) {
          console.error("Failed to reset QR settings:", error);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      openSettingsModal: () => {
        set({ isSettingsModalOpen: true });
      },

      closeSettingsModal: () => {
        set({ isSettingsModalOpen: false });
      },

      getQRCodeOptions: () => {
        const { settings } = get();
        return {
          width: settings.width,
          margin: settings.margin,
          color: {
            dark: settings.colorDark,
            light: settings.colorLight,
          },
          errorCorrectionLevel: settings.errorCorrectionLevel,
          includeLogo: settings.includeLogo,
          logoSize: settings.logoSize,
          logoOpacity: settings.logoOpacity,
        };
      },

      applyColorPreset: (preset) => {
        set((state) => ({
          settings: {
            ...state.settings,
            colorDark: preset.dark,
            colorLight: preset.light,
          },
        }));
      },
    }),
    {
      name: "qr-settings",
      version: 1,
    }
  )
);
