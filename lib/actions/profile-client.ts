"use client";

import { updateProfile, deleteAvatar } from "@/lib/actions/profile";
import { toast } from "sonner";

// Global refresh function for sidebar
let sidebarRefreshCallback: (() => void) | null = null;

export const setSidebarRefreshCallback = (callback: () => void) => {
  sidebarRefreshCallback = callback;
};

// Client-side wrapper for updating profile with live store updates
export async function updateProfileWithLiveUpdate(formData: FormData) {
  try {
    const result = await updateProfile(formData);

    if (result.success) {
      toast.success("Profile updated successfully");

      // Trigger sidebar refresh to update user avatar/name
      console.log("🔄 Triggering sidebar refresh for profile update");
      if (sidebarRefreshCallback) {
        sidebarRefreshCallback();
      }
    } else {
      toast.error(result.error || "Failed to update profile");
    }

    return result;
  } catch (error) {
    console.error("Error updating profile:", error);
    toast.error("An unexpected error occurred");
    return { error: "An unexpected error occurred" };
  }
}

// Client-side wrapper for deleting avatar with live store updates
export async function deleteAvatarWithLiveUpdate() {
  try {
    const result = await deleteAvatar();

    if (result.success) {
      toast.success("Avatar removed successfully");

      // Trigger sidebar refresh to update user avatar
      console.log("🔄 Triggering sidebar refresh for avatar removal");
      if (sidebarRefreshCallback) {
        sidebarRefreshCallback();
      }
    } else {
      toast.error(result.error || "Failed to remove avatar");
    }

    return result;
  } catch (error) {
    console.error("Error removing avatar:", error);
    toast.error("An unexpected error occurred");
    return { error: "An unexpected error occurred" };
  }
}
