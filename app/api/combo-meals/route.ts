import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET - Fetch combo meals for a restaurant
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get("restaurantId");

    if (!restaurantId) {
      return NextResponse.json(
        { error: "Restaurant ID is required" },
        { status: 400 }
      );
    }

    const { data: comboMeals, error } = await supabase
      .from("combo_meals")
      .select(
        `
        *,
        items:combo_meal_items (
          *,
          menu_item:menu_items (
            id,
            name,
            description,
            price,
            image_url
          ),
          combo_meal_options (
            *,
            menu_item:menu_items (
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
      console.error("Error fetching combo meals:", error);
      return NextResponse.json(
        { error: "Failed to fetch combo meals" },
        { status: 500 }
      );
    }

    return NextResponse.json({ comboMeals: comboMeals || [] });
  } catch (error) {
    console.error("Error in combo meals GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create a new combo meal
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();

    const {
      restaurantId,
      name,
      description,
      basePrice,
      discountPercentage = 0,
      isAvailable = true,
      items = [],
    } = body;

    if (!restaurantId || !name || !basePrice) {
      return NextResponse.json(
        { error: "Restaurant ID, name, and base price are required" },
        { status: 400 }
      );
    }

    // Create the combo meal
    const { data: comboMeal, error: comboError } = await supabase
      .from("combo_meals")
      .insert({
        restaurant_id: restaurantId,
        name,
        description,
        base_price: basePrice,
        discount_percentage: discountPercentage,
        is_available: isAvailable,
      })
      .select()
      .single();

    if (comboError) {
      console.error("Error creating combo meal:", comboError);
      return NextResponse.json(
        { error: "Failed to create combo meal" },
        { status: 500 }
      );
    }

    // Add combo meal items if provided
    if (items.length > 0) {
      const comboItems = items.map((item: any) => ({
        combo_meal_id: comboMeal.id,
        menu_item_id: item.menuItemId,
        item_type: item.itemType,
        is_required: item.isRequired ?? true,
        is_customizable: item.isCustomizable ?? false,
        sort_order: item.sortOrder ?? 0,
      }));

      const { error: itemsError } = await supabase
        .from("combo_meal_items")
        .insert(comboItems);

      if (itemsError) {
        console.error("Error creating combo meal items:", itemsError);
        // Don't fail the entire request, but log the error
      }
    }

    return NextResponse.json({
      success: true,
      comboMeal,
      message: "Combo meal created successfully",
    });
  } catch (error) {
    console.error("Error in combo meals POST:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
