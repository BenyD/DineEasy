"use server";

import { createClient } from "@/lib/supabase/server";
// Define interfaces for the tables we need
interface Table {
  id: string;
  restaurant_id: string;
  number: string;
  status: string;
  is_active: boolean;
  restaurants?: Restaurant;
}

interface Restaurant {
  id: string;
  name: string;
  logo_url?: string;
  address?: string;
  cuisine?: string;
  opening_hours?: any;
  currency?: string;
  phone?: string;
  email?: string;
  description?: string;
  stripe_account_enabled?: boolean;
  stripe_account_id?: string;
  payment_methods?: any;
  tax_rate?: number;
}

interface MenuItem {
  id: string;
  restaurant_id: string;
  name: string;
  description?: string;
  price: string;
  image_url?: string;
  is_available: boolean;
  tags?: string[];
  is_popular?: boolean;
  preparation_time?: string;
  menu_categories?: { id: string; name: string };
  menu_items_allergens?: Array<{ allergens?: { id: string; name: string } }>;
}

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
          description,
          stripe_account_enabled,
          stripe_account_id,
          payment_methods,
          tax_rate
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

    // Debug: Log table structure
    console.log("QR Client - Table structure:", {
      id: table.id,
      restaurant_id: table.restaurant_id,
      hasRestaurants: !!table.restaurants,
      restaurantsType: typeof table.restaurants,
      restaurantsKeys: table.restaurants
        ? Object.keys(table.restaurants)
        : null,
    });

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
    console.log("QR Client - Fetching menu for restaurant:", restaurantId);

    // Validate restaurantId
    if (
      !restaurantId ||
      restaurantId === "undefined" ||
      restaurantId === "null"
    ) {
      console.error("Invalid restaurant ID:", restaurantId);
      return { error: "Invalid restaurant ID" };
    }

    // Fetch menu items with advanced options
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
        ),
        menu_item_sizes (
          id,
          name,
          price_modifier,
          is_default,
          sort_order
        ),
        menu_item_modifiers (
          id,
          name,
          description,
          type,
          price_modifier,
          is_required,
          max_selections,
          sort_order,
          is_available
        )
      `
      )
      .eq("restaurant_id", restaurantId)
      .eq("is_available", true)
      .order("created_at", { ascending: true });

    // Fetch combo meals
    const { data: comboMeals, error: comboError } = await supabase
      .from("combo_meals")
      .select(
        `
        *,
        combo_meal_items (
          id,
          menu_item_id,
          item_type,
          is_required,
          is_customizable,
          sort_order,
          menu_items (
            id,
            name,
            description,
            price,
            image_url,
            preparation_time
          ),
          combo_meal_options (
            id,
            menu_item_id,
            price_modifier,
            is_default,
            sort_order,
            menu_items (
              id,
              name,
              description,
              price,
              image_url
            )
          )
        )
      `
      )
      .eq("restaurant_id", restaurantId)
      .eq("is_available", true)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("Error fetching menu items:", error);
      return { error: "Failed to fetch menu" };
    }

    if (comboError) {
      console.error("Error fetching combo meals:", comboError);
      // Don't fail completely if combo meals fail to load
    }

    console.log("QR Client - Menu items found:", menuItems?.length || 0);
    console.log("QR Client - Restaurant ID:", restaurantId);

    // Debug: Log first few menu items to see their structure
    if (menuItems && menuItems.length > 0) {
      console.log("QR Client - First menu item sample:", {
        id: menuItems[0].id,
        name: menuItems[0].name,
        restaurant_id: menuItems[0].restaurant_id,
        category: menuItems[0].menu_categories?.name,
      });
    }

    // Group items by category
    const menuByCategory =
      menuItems?.reduce(
        (acc, item) => {
          // Validate that the item has a valid ID
          if (!item.id) {
            console.warn("Menu item missing ID:", item);
            return acc;
          }

          const categoryName = item.menu_categories?.name || "Other";
          if (!acc[categoryName]) {
            acc[categoryName] = [];
          }

          // Transform allergens
          const allergens =
            item.menu_items_allergens
              ?.map(
                (allergen: { allergens?: { id: string; name: string } }) =>
                  allergen.allergens?.name
              )
              .filter(Boolean) || [];

          // Transform sizes
          const sizes =
            item.menu_item_sizes?.map((size: any) => ({
              id: size.id,
              name: size.name,
              priceModifier: parseFloat(size.price_modifier || 0),
              isDefault: size.is_default,
              sortOrder: size.sort_order,
            })) || [];

          // Transform modifiers
          const modifiers =
            item.menu_item_modifiers?.map((modifier: any) => ({
              id: modifier.id,
              name: modifier.name,
              description: modifier.description,
              type: modifier.type,
              priceModifier: parseFloat(modifier.price_modifier || 0),
              isRequired: modifier.is_required,
              maxSelections: modifier.max_selections,
              sortOrder: modifier.sort_order,
              isAvailable: modifier.is_available,
            })) || [];

          acc[categoryName].push({
            id: item.id,
            restaurantId: item.restaurant_id,
            name: item.name,
            description: item.description,
            price: parseFloat(item.price),
            image: item.image_url || "/placeholder.svg",
            category: categoryName.toLowerCase(),
            available: item.is_available,
            tags: [
              ...(item.tags || []),
              ...(item.is_popular ? ["popular"] : []),
            ],
            allergens,
            preparationTime: item.preparation_time
              ? (() => {
                  const timeStr = item.preparation_time.toString();
                  const match = timeStr.match(/(\d+) minutes?/);
                  return match ? parseInt(match[1]) : 15;
                })()
              : 15,
            // Advanced options
            sizes,
            modifiers,
            hasAdvancedOptions: sizes.length > 0 || modifiers.length > 0,
          });

          return acc;
        },
        {} as Record<string, any[]>
      ) || {};

    // Transform combo meals
    const transformedComboMeals =
      comboMeals?.map((combo: any) => ({
        id: combo.id,
        restaurantId: combo.restaurant_id,
        name: combo.name,
        description: combo.description,
        basePrice: parseFloat(combo.base_price),
        discountPercentage: parseFloat(combo.discount_percentage),
        isAvailable: combo.is_available,
        imageUrl: combo.image_url,
        sortOrder: combo.sort_order,
        items:
          combo.combo_meal_items?.map((item: any) => ({
            id: item.id,
            menuItemId: item.menu_item_id,
            itemType: item.item_type,
            isRequired: item.is_required,
            isCustomizable: item.is_customizable,
            sortOrder: item.sort_order,
            menuItem: item.menu_items
              ? {
                  id: item.menu_items.id,
                  name: item.menu_items.name,
                  description: item.menu_items.description,
                  price: parseFloat(item.menu_items.price),
                  imageUrl: item.menu_items.image_url,
                  preparationTime: item.menu_items.preparation_time
                    ? (() => {
                        const timeStr =
                          item.menu_items.preparation_time.toString();
                        const match = timeStr.match(/(\d+) minutes?/);
                        return match ? parseInt(match[1]) : 15;
                      })()
                    : 15,
                }
              : null,
          })) || [],
        options:
          item.combo_meal_options?.map((option: any) => ({
            id: option.id,
            menuItemId: option.menu_item_id,
            priceModifier: parseFloat(option.price_modifier),
            isDefault: option.is_default,
            sortOrder: option.sort_order,
            menuItem: option.menu_items
              ? {
                  id: option.menu_items.id,
                  name: option.menu_items.name,
                  description: option.menu_items.description,
                  price: parseFloat(option.menu_items.price),
                  imageUrl: option.menu_items.image_url,
                }
              : null,
          })) || [],
      })) || [];

    console.log("QR Client - Menu by category:", Object.keys(menuByCategory));
    console.log("QR Client - Combo meals found:", transformedComboMeals.length);

    return {
      success: true,
      data: {
        menuByCategory,
        comboMeals: transformedComboMeals,
      },
    };
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
