"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { uploadImage, deleteImage } from "@/lib/actions/upload";

// Helper function to validate avatar file
function validateAvatarFile(file: File): string | null {
  // Check if file exists
  if (!file) {
    return "No file provided";
  }

  // Check file size
  if (file.size === 0) {
    return "File is empty";
  }

  if (file.size < 10) {
    return "File appears to be corrupted or empty";
  }

  // Check file type
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return `Invalid file type. Allowed types: ${allowedTypes.join(", ")}`;
  }

  // Check file extension
  const fileExtension = file.name.split(".").pop()?.toLowerCase();
  if (
    !fileExtension ||
    !["jpg", "jpeg", "png", "webp"].includes(fileExtension)
  ) {
    return "Invalid file extension. Allowed: jpg, jpeg, png, webp";
  }

  // Check file size limit
  const maxSize = 1 * 1024 * 1024; // 1MB for avatars
  if (file.size > maxSize) {
    return `File size too large. Maximum size: ${maxSize / 1024 / 1024}MB`;
  }

  return null; // No error
}

export async function updateProfile(formData: FormData) {
  const supabase = createClient();

  try {
    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { error: "Not authenticated" };
    }

    const fullName = formData.get("full_name") as string;
    const avatarFile = formData.get("avatar") as File | null;

    // Validate full name
    if (!fullName || fullName.trim().length === 0) {
      return { error: "Full name is required" };
    }

    if (fullName.trim().length > 100) {
      return { error: "Full name must be less than 100 characters" };
    }

    let avatarUrl = null;

    // Handle avatar upload if provided
    if (avatarFile && avatarFile.size > 0) {
      const validationError = validateAvatarFile(avatarFile);
      if (validationError) {
        return { error: validationError };
      }

      // Get current profile to find existing avatar for cleanup
      const { data: currentProfile, error: profileError } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", user.id)
        .single();

      if (profileError && profileError.code !== "PGRST116") {
        console.error("Error fetching current profile:", profileError);
        return { error: "Failed to fetch current profile" };
      }

      // Delete old avatar if it exists
      if (currentProfile?.avatar_url) {
        const deleteResult = await deleteImage(
          currentProfile.avatar_url,
          "avatar"
        );
        if (deleteResult.error) {
          console.warn("Failed to delete old avatar:", deleteResult.error);
          // Continue with upload even if deletion fails
        }
      }

      // Upload new avatar using unified upload function
      const uploadResult = await uploadImage(avatarFile, "avatar");
      if (uploadResult.error) {
        return { error: uploadResult.error };
      }

      avatarUrl = uploadResult.url;
    }

    // Update profile in database
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim(),
        ...(avatarUrl && { avatar_url: avatarUrl }),
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("Profile update error:", updateError);
      return { error: "Failed to update profile" };
    }

    // Revalidate relevant pages
    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Profile update error:", error);
    return { error: "An unexpected error occurred" };
  }
}

export async function deleteAvatar() {
  const supabase = createClient();

  try {
    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { error: "Not authenticated" };
    }

    // Get current profile to find existing avatar
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("avatar_url")
      .eq("id", user.id)
      .single();

    if (profileError) {
      return { error: "Failed to fetch profile" };
    }

    // Delete existing avatar from storage if it exists
    if (profile.avatar_url) {
      const deleteResult = await deleteImage(profile.avatar_url, "avatar");
      if (deleteResult.error) {
        console.warn("Failed to delete avatar:", deleteResult.error);
        // Continue with profile update even if storage deletion fails
      }
    }

    // Update profile to remove avatar URL
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        avatar_url: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("Profile update error:", updateError);
      return { error: "Failed to update profile" };
    }

    // Revalidate relevant pages
    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Avatar deletion error:", error);
    return { error: "An unexpected error occurred" };
  }
}
