"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// Upload types
export type UploadType =
  | "avatar"
  | "restaurant-logo"
  | "restaurant-cover"
  | "menu-item";

// Upload configurations
const UPLOAD_CONFIGS = {
  avatar: {
    bucket: "avatars",
    maxSize: 2 * 1024 * 1024, // 2MB
    allowedTypes: ["image/jpeg", "image/png", "image/webp"],
    allowedExtensions: ["jpg", "jpeg", "png", "webp"],
    folder: "avatars",
  },
  "restaurant-logo": {
    bucket: "restaurant-images",
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ["image/jpeg", "image/png", "image/webp"],
    allowedExtensions: ["jpg", "jpeg", "png", "webp"],
    folder: "restaurant-images",
  },
  "restaurant-cover": {
    bucket: "restaurant-images",
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ["image/jpeg", "image/png", "image/webp"],
    allowedExtensions: ["jpg", "jpeg", "png", "webp"],
    folder: "restaurant-images",
  },
  "menu-item": {
    bucket: "menu-images",
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ["image/jpeg", "image/png", "image/webp"],
    allowedExtensions: ["jpg", "jpeg", "png", "webp"],
    folder: "menu-images",
  },
} as const;

// Validation function
function validateImageFile(file: File, type: UploadType): string | null {
  const config = UPLOAD_CONFIGS[type];

  // Check if file exists
  if (!file) {
    return "No file provided";
  }

  // Check if file is empty
  if (file.size === 0) {
    return "File is empty";
  }

  // Check if file is too small (corrupted)
  if (file.size < 10) {
    return "File appears to be corrupted or empty";
  }

  // Validate file type
  if (!config.allowedTypes.includes(file.type as any)) {
    return `Invalid file type. Allowed types: ${config.allowedTypes.join(", ")}`;
  }

  // Validate file extension
  const fileExtension = file.name.split(".").pop()?.toLowerCase();
  if (
    !fileExtension ||
    !config.allowedExtensions.includes(fileExtension as any)
  ) {
    return `Invalid file extension. Allowed: ${config.allowedExtensions.join(", ")}`;
  }

  // Validate file size
  if (file.size > config.maxSize) {
    return `File size too large. Maximum size: ${config.maxSize / 1024 / 1024}MB`;
  }

  return null; // No error
}

// Helper function to get current restaurant ID
async function getCurrentRestaurantId(
  supabase: ReturnType<typeof createClient>
): Promise<string> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Not authenticated");
  }

  const { data: restaurant, error: restaurantError } = await supabase
    .from("restaurants")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  if (restaurantError || !restaurant) {
    throw new Error("Restaurant not found");
  }

  return restaurant.id;
}

// Main upload function
export async function uploadImage(
  file: File,
  type: UploadType,
  customPath?: string
) {
  const supabase = createClient();

  try {
    const config = UPLOAD_CONFIGS[type];

    // Validate file
    const validationError = validateImageFile(file, type);
    if (validationError) {
      return { error: validationError };
    }

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { error: "Not authenticated" };
    }

    // Generate file path based on type
    let filePath: string;
    const timestamp = Date.now();
    const fileExtension = file.name.split(".").pop()?.toLowerCase() || "jpg";

    switch (type) {
      case "avatar":
        filePath = `${user.id}/${user.id}-${timestamp}.${fileExtension}`;
        break;

      case "restaurant-logo":
      case "restaurant-cover":
        const restaurantId = await getCurrentRestaurantId(supabase);
        const { data: restaurant } = await supabase
          .from("restaurants")
          .select("slug")
          .eq("id", restaurantId)
          .single();

        const cleanSlug =
          restaurant?.slug?.replace(/[^a-z0-9-]/g, "") || restaurantId;
        const imageType = type === "restaurant-logo" ? "logo" : "cover";
        filePath = `${restaurantId}/${imageType}-${cleanSlug}-${timestamp}.${fileExtension}`;
        break;

      case "menu-item":
        const menuRestaurantId = await getCurrentRestaurantId(supabase);
        filePath = `${menuRestaurantId}/menu-items/${timestamp}.${fileExtension}`;
        break;

      default:
        return { error: "Invalid upload type" };
    }

    // Use custom path if provided
    if (customPath) {
      filePath = customPath;
    }

    console.log(`Uploading ${type} image:`, {
      filename: file.name,
      path: filePath,
      size: file.size,
      type: file.type,
      bucket: config.bucket,
    });

    // Check if bucket exists
    const { data: bucketData, error: bucketError } = await supabase.storage
      .from(config.bucket)
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

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(config.bucket)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      console.error(`${type} upload error:`, uploadError);

      // Handle specific storage errors
      if (uploadError.message.includes("bucket")) {
        return {
          error: "Storage bucket not configured. Please contact support.",
        };
      }
      if (
        uploadError.message.includes("permission") ||
        uploadError.message.includes("row-level security")
      ) {
        console.error("RLS Policy Error Details:", {
          type,
          filePath,
          bucket: config.bucket,
          error: uploadError.message,
        });
        return {
          error:
            "Permission denied. This might be a security policy issue. Please try again or contact support if the problem persists.",
        };
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

      return { error: `Failed to upload ${type}: ${uploadError.message}` };
    }

    if (!uploadData?.path) {
      return { error: `No path returned for ${type} upload` };
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(config.bucket).getPublicUrl(uploadData.path);

    if (!publicUrl) {
      return { error: `Failed to get public URL for ${type}` };
    }

    console.log(`Successfully uploaded ${type}:`, {
      path: uploadData.path,
      publicUrl,
    });

    // Revalidate relevant paths
    switch (type) {
      case "avatar":
        revalidatePath("/dashboard/settings");
        revalidatePath("/dashboard");
        break;
      case "restaurant-logo":
      case "restaurant-cover":
        revalidatePath("/dashboard/settings");
        revalidatePath("/dashboard");
        break;
      case "menu-item":
        revalidatePath("/dashboard/menu");
        break;
    }

    return { success: true, url: publicUrl };
  } catch (error: any) {
    console.error(`Error uploading ${type}:`, error);
    return { error: error.message || `Failed to upload ${type}` };
  }
}

// Delete image function
export async function deleteImage(imageUrl: string, type: UploadType) {
  const supabase = createClient();

  try {
    const config = UPLOAD_CONFIGS[type];

    // Extract the file path from the Supabase URL
    const urlParts = imageUrl.split("/");
    const bucketIndex = urlParts.findIndex(
      (part: string) => part === config.bucket
    );

    if (bucketIndex === -1 || bucketIndex + 1 >= urlParts.length) {
      return { error: "Invalid image URL format" };
    }

    // Get the path after the bucket name
    const filePath = urlParts.slice(bucketIndex + 1).join("/");

    console.log(`Attempting to delete ${type} from path:`, filePath);

    const { error: deleteError } = await supabase.storage
      .from(config.bucket)
      .remove([filePath]);

    if (deleteError) {
      console.warn(`Failed to delete ${type}:`, deleteError);
      return { error: `Failed to delete ${type}: ${deleteError.message}` };
    }

    console.log(`Successfully deleted ${type} from storage`);

    // Revalidate relevant paths
    switch (type) {
      case "avatar":
        revalidatePath("/dashboard/settings");
        revalidatePath("/dashboard");
        break;
      case "restaurant-logo":
      case "restaurant-cover":
        revalidatePath("/dashboard/settings");
        revalidatePath("/dashboard");
        break;
      case "menu-item":
        revalidatePath("/dashboard/menu");
        break;
    }

    return { success: true };
  } catch (error: any) {
    console.error(`Error deleting ${type}:`, error);
    return { error: error.message || `Failed to delete ${type}` };
  }
}

// Legacy function for backward compatibility
export async function uploadMenuItemImage(file: File) {
  return uploadImage(file, "menu-item");
}
