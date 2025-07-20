"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Database } from "@/types/supabase";

type MenuItem = Database["public"]["Tables"]["menu_items"]["Insert"];
type MenuCategory = Database["public"]["Tables"]["menu_categories"]["Insert"];
type Allergen = Database["public"]["Tables"]["allergens"]["Insert"];

// Helper function to get current restaurant ID (supports both owners and staff)
async function getCurrentRestaurantId(): Promise<string> {
  const supabase = createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Not authenticated");
  }

  // First, try to find restaurant where user is the owner
  const { data: ownedRestaurant, error: ownedError } = await supabase
    .from("restaurants")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  if (ownedRestaurant) {
    return ownedRestaurant.id;
  }

  // If not an owner, check if user is staff with menu.manage permissions
  const { data: staffRestaurant, error: staffError } = await supabase
    .from("staff")
    .select("restaurant_id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .contains("permissions", ["menu.manage"])
    .single();

  if (staffRestaurant) {
    return staffRestaurant.restaurant_id;
  }

  // If neither owner nor staff with permissions, throw error
  throw new Error("Restaurant not found or insufficient permissions");
}

// Menu Items CRUD
export async function createMenuItem(formData: FormData) {
  const supabase = createClient();

  try {
    const restaurantId = await getCurrentRestaurantId();

    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const price = parseFloat(formData.get("price") as string);
    const categoryId = formData.get("category") as string;
    const preparationTime = parseInt(formData.get("preparationTime") as string);
    const available = formData.get("available") === "true";
    const popular = formData.get("popular") === "true";
    const allergens = formData.getAll("allergens") as string[];
    const imageUrl = formData.get("imageUrl") as string;

    // Validate required fields
    if (!name || !price || !categoryId) {
      throw new Error("Name, price, and category are required");
    }

    // Create menu item
    const { data: menuItem, error: menuError } = await supabase
      .from("menu_items")
      .insert({
        restaurant_id: restaurantId,
        category_id: categoryId,
        name,
        description,
        price,
        image_url: imageUrl || null,
        preparation_time: `${preparationTime} minutes`,
        is_available: available,
        is_popular: popular,
      })
      .select()
      .single();

    if (menuError) {
      throw menuError;
    }

    // Add allergens if any
    if (allergens.length > 0) {
      const allergenRelations = allergens.map((allergenId) => ({
        menu_item_id: menuItem.id,
        allergen_id: allergenId,
      }));

      const { error: allergenError } = await supabase
        .from("menu_items_allergens")
        .insert(allergenRelations);

      if (allergenError) {
        console.error("Error adding allergens:", allergenError);
      }
    }

    // WebSocket will handle real-time updates, no need for page revalidation
    return { success: true, data: menuItem };
  } catch (error: any) {
    console.error("Error creating menu item:", error);
    return { error: error.message || "Failed to create menu item" };
  }
}

export async function updateMenuItem(id: string, formData: FormData) {
  const supabase = createClient();

  try {
    const restaurantId = await getCurrentRestaurantId();

    // Get all possible fields from formData
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const priceStr = formData.get("price") as string;
    const categoryId = formData.get("category") as string;
    const preparationTimeStr = formData.get("preparationTime") as string;
    const availableStr = formData.get("available") as string;
    const popularStr = formData.get("popular") as string;
    const allergens = formData.getAll("allergens") as string[];
    const imageUrl = formData.get("imageUrl") as string;

    // Handle image update - delete old image if new one is provided
    if (imageUrl !== null && imageUrl !== undefined) {
      // Get current menu item to check if it has an existing image
      const { data: currentMenuItem, error: fetchError } = await supabase
        .from("menu_items")
        .select("image_url")
        .eq("id", id)
        .eq("restaurant_id", restaurantId)
        .single();

      if (fetchError) {
        console.warn(
          "Failed to fetch current menu item for image cleanup:",
          fetchError
        );
      } else if (currentMenuItem?.image_url) {
        // Delete old image if it exists and is not the placeholder
        if (
          currentMenuItem.image_url !==
            "/placeholder.svg?height=100&width=100" &&
          currentMenuItem.image_url !== imageUrl // Don't delete if it's the same image
        ) {
          try {
            // Extract the file path from the Supabase URL
            const urlParts = currentMenuItem.image_url.split("/");
            const bucketIndex = urlParts.findIndex(
              (part: string) => part === "menu-images"
            );

            if (bucketIndex !== -1 && bucketIndex + 1 < urlParts.length) {
              // Get the path after the bucket name
              const filePath = urlParts.slice(bucketIndex + 1).join("/");

              console.log(
                `Deleting old menu item image from storage:`,
                filePath
              );

              const { error: deleteError } = await supabase.storage
                .from("menu-images")
                .remove([filePath]);

              if (deleteError) {
                console.warn(
                  "Failed to delete old menu item image from storage:",
                  deleteError
                );
                // Continue with update even if deletion fails
              } else {
                console.log(
                  "Successfully deleted old menu item image from storage"
                );
              }
            }
          } catch (storageError) {
            console.warn(
              "Error deleting old menu item image from storage:",
              storageError
            );
            // Continue with update even if deletion fails
          }
        }
      }
    }

    // Build update object with only provided fields
    const updateData: any = {};

    // Only include fields that are actually provided
    if (name !== null && name !== undefined) {
      updateData.name = name;
    }
    if (description !== null && description !== undefined) {
      updateData.description = description;
    }
    if (priceStr !== null && priceStr !== undefined) {
      updateData.price = parseFloat(priceStr);
    }
    if (categoryId !== null && categoryId !== undefined) {
      updateData.category_id = categoryId;
    }
    if (preparationTimeStr !== null && preparationTimeStr !== undefined) {
      updateData.preparation_time = `${parseInt(preparationTimeStr)} minutes`;
    }
    if (availableStr !== null && availableStr !== undefined) {
      updateData.is_available = availableStr === "true";
    }
    if (popularStr !== null && popularStr !== undefined) {
      updateData.is_popular = popularStr === "true";
    }
    if (imageUrl !== null && imageUrl !== undefined) {
      updateData.image_url = imageUrl || null;
    }

    // Validate that we have at least one field to update
    if (Object.keys(updateData).length === 0) {
      throw new Error("No fields provided for update");
    }

    // For full updates (name, price, category), validate required fields
    if (name !== null || priceStr !== null || categoryId !== null) {
      if (!name || !priceStr || !categoryId) {
        throw new Error(
          "Name, price, and category are required for full updates"
        );
      }
    }

    // Update menu item
    const { data: menuItem, error: menuError } = await supabase
      .from("menu_items")
      .update(updateData)
      .eq("id", id)
      .eq("restaurant_id", restaurantId)
      .select()
      .single();

    if (menuError) {
      throw menuError;
    }

    // Update allergens only if allergens are provided
    if (allergens.length > 0) {
      // First, remove all existing allergen relations
      await supabase
        .from("menu_items_allergens")
        .delete()
        .eq("menu_item_id", id);

      // Then add new allergen relations
      const allergenRelations = allergens.map((allergenId) => ({
        menu_item_id: id,
        allergen_id: allergenId,
      }));

      const { error: allergenError } = await supabase
        .from("menu_items_allergens")
        .insert(allergenRelations);

      if (allergenError) {
        console.error("Error updating allergens:", allergenError);
      }
    }

    // WebSocket will handle real-time updates, no need for page revalidation
    return { success: true, data: menuItem };
  } catch (error: any) {
    console.error("Error updating menu item:", error);
    return { error: error.message || "Failed to update menu item" };
  }
}

export async function deleteMenuItem(id: string) {
  const supabase = createClient();

  try {
    const restaurantId = await getCurrentRestaurantId();

    // First, get the menu item to check if it has an image
    const { data: menuItem, error: fetchError } = await supabase
      .from("menu_items")
      .select("image_url")
      .eq("id", id)
      .eq("restaurant_id", restaurantId)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    // Delete the menu item from the database
    const { error } = await supabase
      .from("menu_items")
      .delete()
      .eq("id", id)
      .eq("restaurant_id", restaurantId);

    if (error) {
      throw error;
    }

    // If the menu item had an image, delete it from storage
    if (
      menuItem?.image_url &&
      menuItem.image_url !== "/placeholder.svg?height=100&width=100"
    ) {
      try {
        // Extract the file path from the Supabase URL
        const urlParts = menuItem.image_url.split("/");
        const bucketIndex = urlParts.findIndex(
          (part: string) => part === "menu-images"
        );

        if (bucketIndex !== -1 && bucketIndex + 1 < urlParts.length) {
          // Get the path after the bucket name
          const filePath = urlParts.slice(bucketIndex + 1).join("/");

          console.log(`Deleting menu item image from storage:`, filePath);

          const { error: deleteError } = await supabase.storage
            .from("menu-images")
            .remove([filePath]);

          if (deleteError) {
            console.warn(
              "Failed to delete menu item image from storage:",
              deleteError
            );
            // Don't throw error here - the menu item was deleted successfully
          } else {
            console.log("Successfully deleted menu item image from storage");
          }
        }
      } catch (storageError) {
        console.warn(
          "Error deleting menu item image from storage:",
          storageError
        );
        // Don't throw error here - the menu item was deleted successfully
      }
    }

    // WebSocket will handle real-time updates, no need for page revalidation
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting menu item:", error);
    return { error: error.message || "Failed to delete menu item" };
  }
}

export async function deleteMultipleMenuItems(ids: string[]) {
  const supabase = createClient();

  try {
    const restaurantId = await getCurrentRestaurantId();

    // First, get all menu items to check for images
    const { data: menuItems, error: fetchError } = await supabase
      .from("menu_items")
      .select("id, image_url")
      .eq("restaurant_id", restaurantId)
      .in("id", ids);

    if (fetchError) {
      throw fetchError;
    }

    // Delete the menu items from the database
    const { error } = await supabase
      .from("menu_items")
      .delete()
      .eq("restaurant_id", restaurantId)
      .in("id", ids);

    if (error) {
      throw error;
    }

    // Delete images from storage for items that had images
    const imageUrlsToDelete =
      menuItems
        ?.filter(
          (item) =>
            item.image_url &&
            item.image_url !== "/placeholder.svg?height=100&width=100"
        )
        .map((item) => item.image_url) || [];

    if (imageUrlsToDelete.length > 0) {
      const filePathsToDelete: string[] = [];

      // Extract file paths from URLs
      for (const imageUrl of imageUrlsToDelete) {
        const urlParts = imageUrl.split("/");
        const bucketIndex = urlParts.findIndex(
          (part: string) => part === "menu-images"
        );

        if (bucketIndex !== -1 && bucketIndex + 1 < urlParts.length) {
          const filePath = urlParts.slice(bucketIndex + 1).join("/");
          filePathsToDelete.push(filePath);
        }
      }

      // Delete all images in one batch operation
      if (filePathsToDelete.length > 0) {
        try {
          console.log(
            `Deleting ${filePathsToDelete.length} menu item images from storage`
          );

          const { error: deleteError } = await supabase.storage
            .from("menu-images")
            .remove(filePathsToDelete);

          if (deleteError) {
            console.warn(
              "Failed to delete some menu item images from storage:",
              deleteError
            );
            // Don't throw error here - the menu items were deleted successfully
          } else {
            console.log("Successfully deleted menu item images from storage");
          }
        } catch (storageError) {
          console.warn(
            "Error deleting menu item images from storage:",
            storageError
          );
          // Don't throw error here - the menu items were deleted successfully
        }
      }
    }

    // WebSocket will handle real-time updates, no need for page revalidation
    return { success: true, deletedCount: ids.length };
  } catch (error: any) {
    console.error("Error deleting multiple menu items:", error);
    return { error: error.message || "Failed to delete menu items" };
  }
}

export async function getMenuItems() {
  const supabase = createClient();

  try {
    const restaurantId = await getCurrentRestaurantId();

    const { data: menuItems, error } = await supabase
      .from("menu_items")
      .select(
        `
        *,
        category:menu_categories (
          id,
          name,
          description
        ),
        allergens:menu_items_allergens (
          allergen:allergens (
            id,
            name,
            icon
          )
        )
      `
      )
      .eq("restaurant_id", restaurantId)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    // Transform the data to match the expected format
    const transformedItems =
      menuItems?.map((item) => {
        // Parse preparation time from interval
        let preparationTime = 0;
        if (item.preparation_time) {
          const timeStr = item.preparation_time.toString();
          const match = timeStr.match(/(\d+) minutes?/);
          if (match) {
            preparationTime = parseInt(match[1]);
          }
        }

        return {
          id: item.id,
          name: item.name,
          description: item.description,
          price: item.price,
          category: item.category?.name || "Uncategorized",
          categoryId: item.category?.id,
          image: item.image_url || "/placeholder.svg?height=100&width=100",
          available: item.is_available,
          preparationTime,
          allergens: item.allergens?.map((a: any) => a.allergen?.name) || [],
          allergenIds: item.allergens?.map((a: any) => a.allergen?.id) || [],
          popular: item.is_popular || false,
          createdAt: item.created_at,
          updatedAt: item.updated_at,
        };
      }) || [];

    return { success: true, data: transformedItems };
  } catch (error: any) {
    console.error("Error fetching menu items:", error);
    return { error: error.message || "Failed to fetch menu items" };
  }
}

// Categories CRUD
export async function createCategory(formData: FormData) {
  const supabase = createClient();

  try {
    const restaurantId = await getCurrentRestaurantId();

    const name = formData.get("name") as string;
    const description = formData.get("description") as string;

    if (!name) {
      throw new Error("Category name is required");
    }

    const { data: category, error } = await supabase
      .from("menu_categories")
      .insert({
        restaurant_id: restaurantId,
        name,
        description,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // WebSocket will handle real-time updates, no need for page revalidation
    return { success: true, data: category };
  } catch (error: any) {
    console.error("Error creating category:", error);
    return { error: error.message || "Failed to create category" };
  }
}

export async function updateCategory(id: string, formData: FormData) {
  const supabase = createClient();

  try {
    const restaurantId = await getCurrentRestaurantId();

    const name = formData.get("name") as string;
    const description = formData.get("description") as string;

    if (!name) {
      throw new Error("Category name is required");
    }

    const { data: category, error } = await supabase
      .from("menu_categories")
      .update({
        name,
        description,
      })
      .eq("id", id)
      .eq("restaurant_id", restaurantId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // WebSocket will handle real-time updates, no need for page revalidation
    return { success: true, data: category };
  } catch (error: any) {
    console.error("Error updating category:", error);
    return { error: error.message || "Failed to update category" };
  }
}

export async function deleteCategory(id: string) {
  const supabase = createClient();

  try {
    const restaurantId = await getCurrentRestaurantId();

    const { error } = await supabase
      .from("menu_categories")
      .delete()
      .eq("id", id)
      .eq("restaurant_id", restaurantId);

    if (error) {
      throw error;
    }

    // WebSocket will handle real-time updates, no need for page revalidation
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting category:", error);
    return { error: error.message || "Failed to delete category" };
  }
}

export async function getCategories() {
  const supabase = createClient();

  try {
    const restaurantId = await getCurrentRestaurantId();

    // Ensure default data exists
    await supabase.rpc("ensure_default_menu_data", {
      restaurant_id: restaurantId,
    });

    const { data: categories, error } = await supabase
      .from("menu_categories")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      throw error;
    }

    return { success: true, data: categories || [] };
  } catch (error: any) {
    console.error("Error fetching categories:", error);
    return { error: error.message || "Failed to fetch categories" };
  }
}

// Allergens CRUD
export async function createAllergen(formData: FormData) {
  const supabase = createClient();

  try {
    const restaurantId = await getCurrentRestaurantId();

    const name = formData.get("name") as string;
    const icon = formData.get("icon") as string;

    if (!name) {
      throw new Error("Allergen name is required");
    }

    const { data: allergen, error } = await supabase
      .from("allergens")
      .insert({
        restaurant_id: restaurantId,
        name,
        icon,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // WebSocket will handle real-time updates, no need for page revalidation
    return { success: true, data: allergen };
  } catch (error: any) {
    console.error("Error creating allergen:", error);
    return { error: error.message || "Failed to create allergen" };
  }
}

export async function updateAllergen(id: string, formData: FormData) {
  const supabase = createClient();

  try {
    const restaurantId = await getCurrentRestaurantId();

    const name = formData.get("name") as string;
    const icon = formData.get("icon") as string;

    if (!name) {
      throw new Error("Allergen name is required");
    }

    const { data: allergen, error } = await supabase
      .from("allergens")
      .update({
        name,
        icon,
      })
      .eq("id", id)
      .eq("restaurant_id", restaurantId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // WebSocket will handle real-time updates, no need for page revalidation
    return { success: true, data: allergen };
  } catch (error: any) {
    console.error("Error updating allergen:", error);
    return { error: error.message || "Failed to update allergen" };
  }
}

export async function deleteAllergen(id: string) {
  const supabase = createClient();

  try {
    const restaurantId = await getCurrentRestaurantId();

    const { error } = await supabase
      .from("allergens")
      .delete()
      .eq("id", id)
      .eq("restaurant_id", restaurantId);

    if (error) {
      throw error;
    }

    // WebSocket will handle real-time updates, no need for page revalidation
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting allergen:", error);
    return { error: error.message || "Failed to delete allergen" };
  }
}

export async function getAllergens() {
  const supabase = createClient();

  try {
    const restaurantId = await getCurrentRestaurantId();

    // Ensure default data exists
    await supabase.rpc("ensure_default_menu_data", {
      restaurant_id: restaurantId,
    });

    const { data: allergens, error } = await supabase
      .from("allergens")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .order("name", { ascending: true });

    if (error) {
      throw error;
    }

    return { success: true, data: allergens || [] };
  } catch (error: any) {
    console.error("Error fetching allergens:", error);
    return { error: error.message || "Failed to fetch allergens" };
  }
}
