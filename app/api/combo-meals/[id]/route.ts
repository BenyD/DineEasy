import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// PUT - Update a combo meal
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const body = await request.json();
    const comboId = params.id;

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

    // Update the combo meal
    const { data: comboMeal, error: comboError } = await supabase
      .from("combo_meals")
      .update({
        name,
        description,
        base_price: basePrice,
        discount_percentage: discountPercentage,
        is_available: isAvailable,
        updated_at: new Date().toISOString(),
      })
      .eq("id", comboId)
      .eq("restaurant_id", restaurantId)
      .select()
      .single();

    if (comboError) {
      console.error("Error updating combo meal:", comboError);
      return NextResponse.json(
        { error: "Failed to update combo meal" },
        { status: 500 }
      );
    }

    // Delete existing combo meal items
    const { error: deleteItemsError } = await supabase
      .from("combo_meal_items")
      .delete()
      .eq("combo_meal_id", comboId);

    if (deleteItemsError) {
      console.error(
        "Error deleting existing combo meal items:",
        deleteItemsError
      );
      // Don't fail the entire request, but log the error
    }

    // Add new combo meal items if provided
    if (items.length > 0) {
      const comboItems = items.map((item: any) => ({
        combo_meal_id: comboId,
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
      message: "Combo meal updated successfully",
    });
  } catch (error) {
    console.error("Error in combo meals PUT:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a combo meal
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const comboId = params.id;

    // Delete combo meal items first (due to foreign key constraints)
    const { error: deleteItemsError } = await supabase
      .from("combo_meal_items")
      .delete()
      .eq("combo_meal_id", comboId);

    if (deleteItemsError) {
      console.error("Error deleting combo meal items:", deleteItemsError);
      return NextResponse.json(
        { error: "Failed to delete combo meal items" },
        { status: 500 }
      );
    }

    // Note: combo_meal_options are automatically deleted via CASCADE when combo_meal_items are deleted
    // No need to manually delete them

    // Delete the combo meal
    const { error: deleteComboError } = await supabase
      .from("combo_meals")
      .delete()
      .eq("id", comboId);

    if (deleteComboError) {
      console.error("Error deleting combo meal:", deleteComboError);
      return NextResponse.json(
        { error: "Failed to delete combo meal" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Combo meal deleted successfully",
    });
  } catch (error) {
    console.error("Error in combo meals DELETE:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
