"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface StorageCleanupResult {
  success: boolean;
  message: string;
  deletedCount?: number;
  error?: string;
}

export interface StorageObjectInfo {
  bucket_id: string;
  object_name: string;
  file_size: number;
  created_at: string;
}

/**
 * Manually clean up storage objects for a specific user
 * This is useful for testing or manual cleanup
 */
export async function manualCleanupUserStorage(
  userId: string
): Promise<StorageCleanupResult> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase.rpc("manual_cleanup_user_storage", {
      target_user_id: userId,
    });

    if (error) {
      console.error("Error cleaning up user storage:", error);
      return {
        success: false,
        message: error.message,
        error: error.message,
      };
    }

    return {
      success: true,
      message: data || "Storage cleanup completed",
    };
  } catch (error) {
    console.error("Exception during storage cleanup:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error occurred",
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * List all storage objects for a specific user
 * This is useful for debugging and verification
 */
export async function listUserStorageObjects(userId: string): Promise<{
  success: boolean;
  data?: StorageObjectInfo[];
  error?: string;
}> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase.rpc("list_user_storage_objects", {
      target_user_id: userId,
    });

    if (error) {
      console.error("Error listing user storage objects:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data: data || [],
    };
  } catch (error) {
    console.error("Exception listing user storage objects:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Get storage usage statistics for a user
 */
export async function getUserStorageStats(userId: string): Promise<{
  success: boolean;
  data?: {
    totalFiles: number;
    totalSize: number;
    buckets: {
      avatars: { count: number; size: number };
      restaurant_images: { count: number; size: number };
      menu_images: { count: number; size: number };
    };
  };
  error?: string;
}> {
  const supabase = createClient();

  try {
    const { data: objects, error } = await supabase.rpc(
      "list_user_storage_objects",
      {
        target_user_id: userId,
      }
    );

    if (error) {
      console.error("Error getting user storage stats:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    const stats = {
      totalFiles: 0,
      totalSize: 0,
      buckets: {
        avatars: { count: 0, size: 0 },
        restaurant_images: { count: 0, size: 0 },
        menu_images: { count: 0, size: 0 },
      },
    };

    if (objects) {
      objects.forEach((obj: StorageObjectInfo) => {
        stats.totalFiles++;
        stats.totalSize += obj.file_size || 0;

        switch (obj.bucket_id) {
          case "avatars":
            stats.buckets.avatars.count++;
            stats.buckets.avatars.size += obj.file_size || 0;
            break;
          case "restaurant-images":
            stats.buckets.restaurant_images.count++;
            stats.buckets.restaurant_images.size += obj.file_size || 0;
            break;
          case "menu-images":
            stats.buckets.menu_images.count++;
            stats.buckets.menu_images.size += obj.file_size || 0;
            break;
        }
      });
    }

    return {
      success: true,
      data: stats,
    };
  } catch (error) {
    console.error("Exception getting user storage stats:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
