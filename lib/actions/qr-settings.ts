"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { QRCodeSettings } from "@/lib/store/qr-settings";

// Get current restaurant ID
async function getCurrentRestaurantId(): Promise<string> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { data: restaurant, error } = await supabase
    .from("restaurants")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  if (error || !restaurant) {
    throw new Error("Restaurant not found");
  }

  return restaurant.id;
}

// Get QR settings for the current restaurant
export async function getQRSettings(): Promise<QRCodeSettings> {
  const supabase = createClient();

  try {
    const restaurantId = await getCurrentRestaurantId();

    const { data, error } = await supabase.rpc("get_restaurant_qr_settings", {
      restaurant_id: restaurantId,
    });

    if (error) {
      console.error("Error fetching QR settings:", error);
      throw error;
    }

    // Return default settings if none found
    if (!data) {
      return {
        width: 256,
        margin: 2,
        errorCorrectionLevel: "M",
        colorDark: "#1F2937",
        colorLight: "#FFFFFF",
        includeLogo: false,
        logoSize: 50,
        logoOpacity: 0.8,
        defaultExportFormat: "png",
        defaultExportSize: 512,
        defaultPreviewMode: "mobile",
        autoRegenerateOnChange: true,
        showQRCodeInfo: true,
      };
    }

    return data as QRCodeSettings;
  } catch (error: any) {
    console.error("Error in getQRSettings:", error);
    throw new Error(error.message || "Failed to fetch QR settings");
  }
}

// Update QR settings for the current restaurant
export async function updateQRSettings(
  settings: Partial<QRCodeSettings>
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  try {
    const restaurantId = await getCurrentRestaurantId();

    // Get current settings first
    const currentSettings = await getQRSettings();

    // Merge with new settings
    const updatedSettings = { ...currentSettings, ...settings };

    const { error } = await supabase.rpc("update_restaurant_qr_settings", {
      restaurant_id: restaurantId,
      qr_settings: updatedSettings,
    });

    if (error) {
      console.error("Error updating QR settings:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/tables");
    return { success: true };
  } catch (error: any) {
    console.error("Error in updateQRSettings:", error);
    return {
      success: false,
      error: error.message || "Failed to update QR settings",
    };
  }
}

// Reset QR settings to defaults
export async function resetQRSettings(): Promise<{
  success: boolean;
  error?: string;
}> {
  const supabase = createClient();

  try {
    const restaurantId = await getCurrentRestaurantId();

    const defaultSettings = {
      width: 256,
      margin: 2,
      errorCorrectionLevel: "M" as const,
      colorDark: "#1F2937",
      colorLight: "#FFFFFF",
      includeLogo: false,
      logoSize: 50,
      logoOpacity: 0.8,
      defaultExportFormat: "png" as const,
      defaultExportSize: 512,
      defaultPreviewMode: "mobile" as const,
      autoRegenerateOnChange: true,
      showQRCodeInfo: true,
    };

    const { error } = await supabase.rpc("update_restaurant_qr_settings", {
      restaurant_id: restaurantId,
      qr_settings: defaultSettings,
    });

    if (error) {
      console.error("Error resetting QR settings:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/tables");
    return { success: true };
  } catch (error: any) {
    console.error("Error in resetQRSettings:", error);
    return {
      success: false,
      error: error.message || "Failed to reset QR settings",
    };
  }
}
