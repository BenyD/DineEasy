"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Database } from "@/types/supabase";

type MenuItem = Database["public"]["Tables"]["menu_items"]["Insert"];
type MenuCategory = Database["public"]["Tables"]["menu_categories"]["Insert"];
type Allergen = Database["public"]["Tables"]["allergens"]["Insert"];

// Helper function to get current restaurant ID
async function getCurrentRestaurantId(): Promise<string> {
  const supabase = createClient();

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

    revalidatePath("/dashboard/menu");
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

    // Update menu item
    const { data: menuItem, error: menuError } = await supabase
      .from("menu_items")
      .update({
        category_id: categoryId,
        name,
        description,
        price,
        image_url: imageUrl || null,
        preparation_time: `${preparationTime} minutes`,
        is_available: available,
        is_popular: popular,
      })
      .eq("id", id)
      .eq("restaurant_id", restaurantId)
      .select()
      .single();

    if (menuError) {
      throw menuError;
    }

    // Update allergens
    // First, remove all existing allergen relations
    await supabase.from("menu_items_allergens").delete().eq("menu_item_id", id);

    // Then add new allergen relations
    if (allergens.length > 0) {
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

    revalidatePath("/dashboard/menu");
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

    const { error } = await supabase
      .from("menu_items")
      .delete()
      .eq("id", id)
      .eq("restaurant_id", restaurantId);

    if (error) {
      throw error;
    }

    revalidatePath("/dashboard/menu");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting menu item:", error);
    return { error: error.message || "Failed to delete menu item" };
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

    revalidatePath("/dashboard/menu");
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

    revalidatePath("/dashboard/menu");
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

    revalidatePath("/dashboard/menu");
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

    revalidatePath("/dashboard/menu");
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

    revalidatePath("/dashboard/menu");
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

    revalidatePath("/dashboard/menu");
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
