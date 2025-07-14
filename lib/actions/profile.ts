"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

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
  const maxSize = 2 * 1024 * 1024; // 2MB for avatars
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
        try {
          // Extract the file path from the Supabase URL
          const urlParts = currentProfile.avatar_url.split("/");
          const bucketIndex = urlParts.findIndex(
            (part: string) => part === "avatars"
          );

          if (bucketIndex !== -1 && bucketIndex + 2 < urlParts.length) {
            // Get the path after the bucket name: [userId]/[filename]
            const filePath = urlParts.slice(bucketIndex + 1).join("/");

            console.log("Attempting to delete old avatar from path:", filePath);

            const { error: deleteError } = await supabase.storage
              .from("avatars")
              .remove([filePath]);

            if (deleteError) {
              console.warn("Failed to delete old avatar:", deleteError);
              // Continue with upload even if deletion fails
            } else {
              console.log("Successfully deleted old avatar from storage");
            }
          } else {
            console.warn(
              `Could not extract file path from avatar URL: ${currentProfile.avatar_url}`
            );
          }
        } catch (error) {
          console.warn("Error deleting old avatar:", error);
          // Continue with upload even if deletion fails
        }
      }

      // Check if bucket exists
      const { data: bucketData, error: bucketError } = await supabase.storage
        .from("avatars")
        .list("", { limit: 1 });

      if (bucketError) {
        console.error("Bucket check error:", bucketError);
        if (
          bucketError.message.includes("bucket") ||
          bucketError.message.includes("not found")
        ) {
          return {
            error: "Storage bucket not configured. Please contact support.",
          };
        }
        return { error: `Storage error: ${bucketError.message}` };
      }

      // Generate unique filename
      const timestamp = Date.now();
      const fileExtension =
        avatarFile.name.split(".").pop()?.toLowerCase() || "jpg";
      const filename = `${user.id}-${timestamp}.${fileExtension}`;
      const filePath = `${user.id}/${filename}`;

      console.log("Uploading avatar:", {
        filename,
        path: filePath,
        size: avatarFile.size,
        type: avatarFile.type,
        userId: user.id,
      });

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, avatarFile, {
          cacheControl: "3600",
          upsert: false,
          contentType: avatarFile.type,
        });

      if (uploadError) {
        console.error("Avatar upload error:", uploadError);

        // Handle specific storage errors
        if (uploadError.message.includes("bucket")) {
          return {
            error: "Storage bucket not configured. Please contact support.",
          };
        }
        if (uploadError.message.includes("permission")) {
          return { error: "Permission denied. Please try again." };
        }
        if (uploadError.message.includes("duplicate")) {
          return {
            error: "File already exists. Please choose a different image.",
          };
        }
        if (
          uploadError.message.includes("network") ||
          uploadError.message.includes("timeout")
        ) {
          return {
            error: "Network error. Please check your connection and try again.",
          };
        }
        if (
          uploadError.message.includes("size") ||
          uploadError.message.includes("limit")
        ) {
          return { error: "File size exceeds the allowed limit." };
        }

        return { error: `Failed to upload avatar: ${uploadError.message}` };
      }

      if (!uploadData?.path) {
        return { error: "No path returned for avatar upload" };
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(uploadData.path);

      if (!publicUrl) {
        return { error: "Failed to get public URL for avatar" };
      }

      console.log("Successfully uploaded avatar:", {
        path: uploadData.path,
        publicUrl,
      });

      avatarUrl = publicUrl;
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
      try {
        // Extract the file path from the Supabase URL
        const urlParts = profile.avatar_url.split("/");
        const bucketIndex = urlParts.findIndex(
          (part: string) => part === "avatars"
        );

        if (bucketIndex !== -1 && bucketIndex + 2 < urlParts.length) {
          // Get the path after the bucket name: [userId]/[filename]
          const filePath = urlParts.slice(bucketIndex + 1).join("/");

          console.log("Attempting to delete avatar from path:", filePath);

          const { error: deleteError } = await supabase.storage
            .from("avatars")
            .remove([filePath]);

          if (deleteError) {
            console.warn("Failed to delete avatar:", deleteError);
            // Continue with profile update even if storage deletion fails
          } else {
            console.log("Successfully deleted avatar from storage");
          }
        } else {
          console.warn(
            `Could not extract file path from avatar URL: ${profile.avatar_url}`
          );
        }
      } catch (error) {
        console.warn("Error deleting avatar:", error);
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
