"use server";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/supabase";

type Table = Database["public"]["Tables"]["tables"]["Row"];
type Restaurant = Database["public"]["Tables"]["restaurants"]["Row"];
type MenuItem = Database["public"]["Tables"]["menu_items"]["Row"];

// Get table information by table ID
export async function getTableInfo(tableId: string) {
  const supabase = createClient();

  try {
    const { data: table, error: tableError } = await supabase
      .from("tables")
      .select(
        `
        *,
        restaurants (
          id,
          name,
          logo_url,
          address,
          cuisine,
          opening_hours,
          currency,
          phone,
          email,
          description
        )
      `
      )
      .eq("id", tableId)
      .eq("is_active", true)
      .single();

    console.log("QR Client - Table found:", !!table);
    console.log("QR Client - Table status:", table?.status);
    console.log("QR Client - Restaurant ID from table:", table?.restaurant_id);

    if (tableError) {
      console.error("Error fetching table:", tableError);
      return { error: "Table not found" };
    }

    if (!table) {
      return { error: "Table not found" };
    }

    return { success: true, data: table };
  } catch (error: any) {
    console.error("Error in getTableInfo:", error);
    return { error: error.message || "Failed to fetch table information" };
  }
}

// Get restaurant menu items
export async function getRestaurantMenu(restaurantId: string) {
  const supabase = createClient();

  try {
    const { data: menuItems, error } = await supabase
      .from("menu_items")
      .select(
        `
        *,
        menu_categories (
          id,
          name
        ),
        menu_items_allergens (
          allergens (
            id,
            name
          )
        )
      `
      )
      .eq("restaurant_id", restaurantId)
      .eq("is_available", true)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching menu items:", error);
      return { error: "Failed to fetch menu" };
    }

    console.log("QR Client - Menu items found:", menuItems?.length || 0);
    console.log("QR Client - Restaurant ID:", restaurantId);

    // Group items by category
    const menuByCategory =
      menuItems?.reduce(
        (acc, item) => {
          const categoryName = item.menu_categories?.name || "Other";
          if (!acc[categoryName]) {
            acc[categoryName] = [];
          }

          // Transform allergens
          const allergens =
            item.menu_items_allergens
              ?.map((allergen) => allergen.allergens?.name)
              .filter(Boolean) || [];

          acc[categoryName].push({
            id: item.id,
            restaurantId: item.restaurant_id,
            name: item.name,
            description: item.description,
            price: parseFloat(item.price),
            image: item.image_url || "/placeholder.svg?height=100&width=100",
            category: categoryName.toLowerCase(),
            available: item.is_available,
            tags: item.tags || [],
            allergens,
            preparationTime: item.preparation_time
              ? (() => {
                  const timeStr = item.preparation_time.toString();
                  const match = timeStr.match(/(\d+) minutes?/);
                  return match ? parseInt(match[1]) : 15;
                })()
              : 15,
          });

          return acc;
        },
        {} as Record<string, any[]>
      ) || {};

    console.log("QR Client - Menu by category:", Object.keys(menuByCategory));
    return { success: true, data: menuByCategory };
  } catch (error: any) {
    console.error("Error in getRestaurantMenu:", error);
    return { error: error.message || "Failed to fetch menu" };
  }
}

// Get restaurant information
export async function getRestaurantInfo(restaurantId: string) {
  const supabase = createClient();

  try {
    const { data: restaurant, error } = await supabase
      .from("restaurants")
      .select("*")
      .eq("id", restaurantId)
      .single();

    if (error) {
      console.error("Error fetching restaurant:", error);
      return { error: "Restaurant not found" };
    }

    return { success: true, data: restaurant };
  } catch (error: any) {
    console.error("Error in getRestaurantInfo:", error);
    return { error: error.message || "Failed to fetch restaurant information" };
  }
}

// Validate table access
export async function validateTableAccess(tableId: string) {
  const supabase = createClient();

  try {
    const { data: table, error } = await supabase
      .from("tables")
      .select("id, number, restaurant_id, status")
      .eq("id", tableId)
      .eq("is_active", true)
      .single();

    if (error || !table) {
      return { error: "Invalid table" };
    }

    return { success: true, data: table };
  } catch (error: any) {
    console.error("Error in validateTableAccess:", error);
    return { error: "Invalid table access" };
  }
}
