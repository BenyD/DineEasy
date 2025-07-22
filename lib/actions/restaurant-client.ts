"use client";

import {
  updateRestaurantImages,
  removeRestaurantImage,
} from "@/lib/actions/restaurant";
import { useRestaurantSettings } from "@/lib/store/restaurant-settings";
import { toast } from "sonner";

// Client-side wrapper for updating restaurant images with live store updates
export async function updateRestaurantImagesWithLiveUpdate(formData: FormData) {
  try {
    const result = await updateRestaurantImages(formData);

    if (result.success) {
      // Update the store for live UI updates
      const { updateLogo, updateCover } = useRestaurantSettings.getState();

      if (result.logoUrl) {
        console.log("🔄 Updating logo in store:", result.logoUrl);
        updateLogo(result.logoUrl);
      }

      if (result.coverUrl) {
        console.log("🔄 Updating cover in store:", result.coverUrl);
        updateCover(result.coverUrl);
      }

      toast.success("Images updated successfully");
    } else {
      toast.error(result.error || "Failed to update images");
    }

    return result;
  } catch (error) {
    console.error("Error updating restaurant images:", error);
    toast.error("An unexpected error occurred");
    return { error: "An unexpected error occurred" };
  }
}

// Client-side wrapper for removing restaurant images with live store updates
export async function removeRestaurantImageWithLiveUpdate(
  imageType: "logo" | "cover"
) {
  try {
    const result = await removeRestaurantImage(imageType);

    if (result.success) {
      // Update the store for live UI updates
      const { removeLogo, removeCover } = useRestaurantSettings.getState();

      if (imageType === "logo") {
        console.log("🗑️ Removing logo from store");
        removeLogo();
      } else {
        console.log("🗑️ Removing cover from store");
        removeCover();
      }

      toast.success(
        `${imageType === "logo" ? "Logo" : "Cover photo"} removed successfully`
      );
    } else {
      toast.error(result.error || `Failed to remove ${imageType}`);
    }

    return result;
  } catch (error) {
    console.error(`Error removing ${imageType}:`, error);
    toast.error("An unexpected error occurred");
    return { error: "An unexpected error occurred" };
  }
}
