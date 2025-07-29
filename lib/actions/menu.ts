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
    const tagsJson = formData.get("tags") as string;
    const tags = tagsJson ? JSON.parse(tagsJson) : [];

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
        tags: tags.length > 0 ? tags : null,
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
    const tagsJson = formData.get("tags") as string;
    const tags = tagsJson ? JSON.parse(tagsJson) : [];

    // Get current menu item to check existing values and image
    const { data: currentMenuItem, error: fetchError } = await supabase
      .from("menu_items")
      .select("name, price, category_id, image_url")
      .eq("id", id)
      .eq("restaurant_id", restaurantId)
      .single();

    if (fetchError) {
      console.warn(
        "Failed to fetch current menu item for validation:",
        fetchError
      );
    }

    // Handle image update - delete old image if new one is provided and different
    if (
      imageUrl !== null &&
      imageUrl !== undefined &&
      currentMenuItem?.image_url
    ) {
      const oldImageUrl = currentMenuItem.image_url;
      const newImageUrl = imageUrl;

      // Check if we're actually changing the image (not just updating other fields)
      if (
        oldImageUrl !== newImageUrl &&
        oldImageUrl !== "/placeholder.svg" &&
        oldImageUrl !== "/placeholder.svg?height=100&width=100" &&
        newImageUrl !== "/placeholder.svg" &&
        newImageUrl !== "/placeholder.svg?height=100&width=100"
      ) {
        try {
          // Extract the file path from the Supabase URL
          const urlParts = oldImageUrl.split("/");
          const bucketIndex = urlParts.findIndex(
            (part: string) => part === "menu-images"
          );

          if (bucketIndex !== -1 && bucketIndex + 1 < urlParts.length) {
            // Get the path after the bucket name
            const filePath = urlParts.slice(bucketIndex + 1).join("/");

            console.log(`Deleting old menu item image from storage:`, filePath);

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
      // Only update image_url if it's not empty or placeholder
      if (
        imageUrl &&
        imageUrl !== "/placeholder.svg" &&
        imageUrl !== "/placeholder.svg?height=100&width=100"
      ) {
        updateData.image_url = imageUrl;
      } else {
        updateData.image_url = null; // Clear image if placeholder is provided
      }
    }
    // Add tags to update data
    if (tagsJson !== null && tagsJson !== undefined) {
      updateData.tags = tags.length > 0 ? tags : null;
    }

    // Validate that we have at least one field to update
    if (Object.keys(updateData).length === 0) {
      throw new Error("No fields provided for update");
    }

    // For full updates (name, price, category), validate required fields
    // Only require all three if we're actually changing any of them
    const isChangingName =
      name !== null && name !== undefined && name !== currentMenuItem?.name;
    const isChangingPrice =
      priceStr !== null &&
      priceStr !== undefined &&
      parseFloat(priceStr) !== currentMenuItem?.price;
    const isChangingCategory =
      categoryId !== null &&
      categoryId !== undefined &&
      categoryId !== currentMenuItem?.category_id;

    if (isChangingName || isChangingPrice || isChangingCategory) {
      if (!name || !priceStr || !categoryId) {
        throw new Error(
          "Name, price, and category are required when updating any of these fields"
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

// Paginated menu items with server-side filtering
export async function getMenuItemsPaginated({
  page = 1,
  pageSize = 20,
  searchTerm = "",
  categoryId = "",
  available,
  popular,
  minPrice,
  maxPrice,
  sortBy = "created_at",
  sortOrder = "desc" as "asc" | "desc",
}: {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
  categoryId?: string;
  available?: boolean;
  popular?: boolean;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}) {
  const supabase = createClient();

  try {
    const restaurantId = await getCurrentRestaurantId();
    const offset = (page - 1) * pageSize;

    // Build the query
    let query = supabase
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
      `,
        { count: "exact" }
      )
      .eq("restaurant_id", restaurantId);

    // Apply filters
    if (searchTerm) {
      query = query.or(
        `name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`
      );
    }
    if (categoryId) {
      query = query.eq("category_id", categoryId);
    }
    if (available !== undefined) {
      query = query.eq("is_available", available);
    }
    if (popular !== undefined) {
      query = query.eq("is_popular", popular);
    }
    if (minPrice !== undefined) {
      query = query.gte("price", minPrice);
    }
    if (maxPrice !== undefined) {
      query = query.lte("price", maxPrice);
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === "asc" });

    // Apply pagination
    query = query.range(offset, offset + pageSize - 1);

    const { data: menuItems, error, count } = await query;

    if (error) {
      throw error;
    }

    // Transform the data to match the expected format
    const transformedItems =
      menuItems?.map((item) => {
        // Parse preparation time from interval
        let preparationTime = 0;
        if (item.preparation_time) {
          // If it's a string like '00:15:00'
          if (typeof item.preparation_time === "string") {
            const parts = item.preparation_time.split(":");
            if (parts.length === 3) {
              preparationTime =
                parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
            }
          }
          // If it's an object (e.g., { minutes: 15 })
          else if (
            typeof item.preparation_time === "object" &&
            item.preparation_time !== null &&
            "minutes" in item.preparation_time
          ) {
            preparationTime = item.preparation_time.minutes;
          }
        }

        // Validate and process image URL
        let imageUrl = "/placeholder.svg";
        if (item.image_url && item.image_url.trim() !== "") {
          // Check if it's a valid URL or Supabase storage URL
          if (
            item.image_url.startsWith("http") ||
            item.image_url.startsWith("/storage")
          ) {
            imageUrl = item.image_url;
          } else if (item.image_url.startsWith("/placeholder")) {
            imageUrl = item.image_url;
          } else {
            // If it's just a path, assume it's a Supabase storage URL
            imageUrl = item.image_url;
          }
        }

        return {
          id: item.id,
          name: item.name,
          description: item.description,
          price: item.price,
          category: item.category?.name || "Uncategorized",
          categoryId: item.category?.id,
          image: imageUrl,
          available: item.is_available,
          preparationTime,
          allergens:
            item.allergens?.map((a: any) => ({
              id: a.allergen?.id,
              name: a.allergen?.name,
              icon: a.allergen?.icon || "⚠️",
            })) || [],
          allergenIds: item.allergens?.map((a: any) => a.allergen?.id) || [],
          popular: item.is_popular || false,
          tags: item.tags || [],
          restaurantId: item.restaurant_id,
          createdAt: item.created_at,
          updatedAt: item.updated_at,
        };
      }) || [];

    return {
      success: true,
      data: transformedItems,
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
        hasNextPage: page * pageSize < (count || 0),
        hasPrevPage: page > 1,
      },
    };
  } catch (error: any) {
    console.error("Error fetching paginated menu items:", error);
    return { error: error.message || "Failed to fetch menu items" };
  }
}

export async function getMenuItems() {
  // Use the paginated version to get all items
  const result = await getMenuItemsPaginated({
    page: 1,
    pageSize: 1000, // Large page size to get all items
  });

  return result;
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

// Bulk import menu items from CSV data
export async function bulkImportMenuItems(
  importData: Array<{
    name: string;
    description: string;
    price: number;
    categoryName: string;
    available: boolean;
    popular: boolean;
    allergens: string;
    preparationTime: number;
    imageUrl: string;
  }>
) {
  const supabase = createClient();

  try {
    const restaurantId = await getCurrentRestaurantId();

    // Get existing categories and allergens for mapping
    const { data: categories } = await supabase
      .from("menu_categories")
      .select("id, name")
      .eq("restaurant_id", restaurantId);

    const { data: allergens } = await supabase
      .from("allergens")
      .select("id, name")
      .eq("restaurant_id", restaurantId);

    const createdItems = [];
    const errors = [];

    for (let i = 0; i < importData.length; i++) {
      const item = importData[i];

      try {
        // Find or create category
        let categoryId = categories?.find(
          (c) => c.name.toLowerCase() === item.categoryName.toLowerCase()
        )?.id;

        if (!categoryId && item.categoryName) {
          // Create new category
          const { data: newCategory, error: categoryError } = await supabase
            .from("menu_categories")
            .insert({
              restaurant_id: restaurantId,
              name: item.categoryName,
              description: `Imported category: ${item.categoryName}`,
            })
            .select()
            .single();

          if (categoryError) {
            throw new Error(`Failed to create category: ${item.categoryName}`);
          }

          categoryId = newCategory.id;
          // Add to local categories array for subsequent items
          categories?.push(newCategory);
        }

        // Create menu item
        const { data: menuItem, error: menuError } = await supabase
          .from("menu_items")
          .insert({
            restaurant_id: restaurantId,
            category_id: categoryId || null,
            name: item.name,
            description: item.description,
            price: item.price,
            image_url: item.imageUrl || null,
            preparation_time: `${item.preparationTime} minutes`,
            is_available: item.available,
            is_popular: item.popular,
          })
          .select()
          .single();

        if (menuError) {
          throw menuError;
        }

        // Add allergens if specified
        if (item.allergens) {
          const allergenNames = item.allergens.split(",").map((a) => a.trim());
          const allergenIds = [];

          for (const allergenName of allergenNames) {
            if (!allergenName) continue;

            let allergenId = allergens?.find(
              (a) => a.name.toLowerCase() === allergenName.toLowerCase()
            )?.id;

            if (!allergenId) {
              // Create new allergen
              const { data: newAllergen, error: allergenError } = await supabase
                .from("allergens")
                .insert({
                  restaurant_id: restaurantId,
                  name: allergenName,
                  icon: "⚠️",
                })
                .select()
                .single();

              if (allergenError) {
                console.warn(`Failed to create allergen: ${allergenName}`);
                continue;
              }

              allergenId = newAllergen.id;
              allergens?.push(newAllergen);
            }

            allergenIds.push(allergenId);
          }

          // Create allergen relationships
          if (allergenIds.length > 0) {
            const allergenRelations = allergenIds.map((id) => ({
              menu_item_id: menuItem.id,
              allergen_id: id,
            }));

            const { error: relationError } = await supabase
              .from("menu_item_allergens")
              .insert(allergenRelations);

            if (relationError) {
              console.warn(`Failed to add allergens to item: ${item.name}`);
            }
          }
        }

        createdItems.push(menuItem);
      } catch (error: any) {
        errors.push({
          row: i + 1,
          item: item.name,
          error: error.message,
        });
      }
    }

    return {
      success: true,
      data: {
        created: createdItems.length,
        errors,
        total: importData.length,
      },
    };
  } catch (error: any) {
    console.error("Error in bulk import:", error);
    return { error: error.message || "Failed to import menu items" };
  }
}

// Bulk delete menu items
export async function bulkDeleteMenuItems(ids: string[]) {
  const supabase = createClient();
  const errors: Array<{ id: string; error: string }> = [];
  let deleted = 0;

  try {
    for (const id of ids) {
      const { error } = await supabase.from("menu_items").delete().eq("id", id);
      if (error) {
        errors.push({ id, error: error.message });
      } else {
        deleted++;
      }
    }
    return { success: true, deleted, errors };
  } catch (error: any) {
    return { error: error.message || "Failed to delete menu items" };
  }
}

// Bulk toggle availability
export async function bulkToggleAvailability(
  ids: string[],
  available: boolean
) {
  const supabase = createClient();
  const errors: Array<{ id: string; error: string }> = [];
  let updated = 0;

  try {
    for (const id of ids) {
      const { error } = await supabase
        .from("menu_items")
        .update({ is_available: available })
        .eq("id", id);
      if (error) {
        errors.push({ id, error: error.message });
      } else {
        updated++;
      }
    }
    return { success: true, updated, errors };
  } catch (error: any) {
    return { error: error.message || "Failed to update availability" };
  }
}

// Get all menu item IDs matching filters
export async function getAllMenuItemIds({
  searchTerm = "",
  categoryId = "",
  available,
  popular,
  minPrice,
  maxPrice,
}: {
  searchTerm?: string;
  categoryId?: string;
  available?: boolean;
  popular?: boolean;
  minPrice?: number;
  maxPrice?: number;
}) {
  const supabase = createClient();
  try {
    const restaurantId = await getCurrentRestaurantId();
    let query = supabase
      .from("menu_items")
      .select("id")
      .eq("restaurant_id", restaurantId);

    if (searchTerm) {
      query = query.ilike("name", `%${searchTerm}%`);
    }
    if (categoryId) {
      query = query.eq("category_id", categoryId);
    }
    if (available !== undefined) {
      query = query.eq("is_available", available);
    }
    if (popular !== undefined) {
      query = query.eq("is_popular", popular);
    }
    if (minPrice !== undefined) {
      query = query.gte("price", minPrice);
    }
    if (maxPrice !== undefined) {
      query = query.lte("price", maxPrice);
    }

    const { data, error } = await query;
    if (error) throw error;
    return { success: true, ids: (data || []).map((row: any) => row.id) };
  } catch (error: any) {
    return { error: error.message || "Failed to fetch menu item IDs" };
  }
}
