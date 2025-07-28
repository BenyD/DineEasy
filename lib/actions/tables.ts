"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Database } from "@/types/supabase";
import { generateTableQRUrl, generateTableQRData } from "@/lib/utils/qr-code";

type Table = Database["public"]["Tables"]["tables"]["Insert"];
type TableStatus = Database["public"]["Enums"]["table_status"];

// Helper function to get current restaurant ID
async function getCurrentRestaurantId(): Promise<string> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { data: restaurant, error } = await supabase
    .from("restaurants")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  if (error || !restaurant) {
    throw new Error("Restaurant not found");
  }

  return restaurant.id;
}

// Get all tables for the current restaurant
export async function getTables() {
  const supabase = createClient();

  try {
    const restaurantId = await getCurrentRestaurantId();

    const { data: tables, error } = await supabase
      .from("tables")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .eq("is_active", true)
      .order("number", { ascending: true });

    if (error) {
      console.error("Error fetching tables:", error);
      throw error;
    }

    return { success: true, data: tables || [] };
  } catch (error: any) {
    console.error("Error in getTables:", error);
    return { error: error.message || "Failed to fetch tables" };
  }
}

// Create a new table
export async function createTable(formData: FormData) {
  const supabase = createClient();

  try {
    const restaurantId = await getCurrentRestaurantId();

    const number = formData.get("number") as string;
    const capacity = parseInt(formData.get("capacity") as string);

    // Validation
    if (!number || !capacity) {
      return { error: "Table number and capacity are required" };
    }

    if (capacity < 1 || capacity > 20) {
      return { error: "Capacity must be between 1 and 20" };
    }

    // Check if table number already exists
    const { data: existingTable } = await supabase
      .from("tables")
      .select("id")
      .eq("restaurant_id", restaurantId)
      .eq("number", number)
      .eq("is_active", true)
      .single();

    if (existingTable) {
      return { error: `Table ${number} already exists` };
    }

    // Create table first to get the ID
    const { data: table, error } = await supabase
      .from("tables")
      .insert({
        restaurant_id: restaurantId,
        number,
        capacity,
        status: "available" as TableStatus,
        is_active: true,
        // Don't set QR code here - we'll set it after getting the ID
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating table:", error);
      return { error: error.message };
    }

    // Generate QR code URL with the correct environment URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://dineeasy.ch";
    const qrCodeUrl = `${baseUrl}/qr/${table.id}`;

    // Update table with QR code URL
    const { data: updatedTable, error: updateError } = await supabase
      .from("tables")
      .update({
        qr_code: qrCodeUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", table.id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating table with QR code:", updateError);
      // Don't fail the entire operation if QR code update fails
      // The table was created successfully
    }

    // Log activity
    await supabase.from("activity_logs").insert({
      restaurant_id: restaurantId,
      user_id: (await supabase.auth.getUser()).data.user?.id,
      type: "table",
      action: "created",
      description: `Created table ${number} with capacity ${capacity}`,
      metadata: {
        table_id: table.id,
        table_number: number,
        capacity: capacity,
        qr_code: qrCodeUrl,
      },
    });

    revalidatePath("/dashboard/tables");
    return {
      success: true,
      data: updatedTable || table,
      message: "Table created successfully",
    };
  } catch (error: any) {
    console.error("Error in createTable:", error);
    return { error: error.message || "Failed to create table" };
  }
}

// Update an existing table
export async function updateTable(id: string, formData: FormData) {
  const supabase = createClient();

  try {
    const restaurantId = await getCurrentRestaurantId();

    const number = formData.get("number") as string;
    const capacity = parseInt(formData.get("capacity") as string);

    // Validation
    if (!number || !capacity) {
      return { error: "Table number and capacity are required" };
    }

    if (capacity < 1 || capacity > 20) {
      return { error: "Capacity must be between 1 and 20" };
    }

    // Check if table exists and belongs to restaurant
    const { data: existingTable, error: fetchError } = await supabase
      .from("tables")
      .select("*")
      .eq("id", id)
      .eq("restaurant_id", restaurantId)
      .eq("is_active", true)
      .single();

    if (fetchError || !existingTable) {
      return { error: "Table not found" };
    }

    // Check if new table number conflicts with existing table (excluding current table)
    if (number !== existingTable.number) {
      const { data: conflictingTable } = await supabase
        .from("tables")
        .select("id")
        .eq("restaurant_id", restaurantId)
        .eq("number", number)
        .eq("is_active", true)
        .neq("id", id)
        .single();

      if (conflictingTable) {
        return { error: `Table ${number} already exists` };
      }
    }

    // Update table
    const { data: table, error } = await supabase
      .from("tables")
      .update({
        number,
        capacity,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("restaurant_id", restaurantId)
      .select()
      .single();

    if (error) {
      console.error("Error updating table:", error);
      return { error: error.message };
    }

    // Log activity
    await supabase.from("activity_logs").insert({
      restaurant_id: restaurantId,
      user_id: (await supabase.auth.getUser()).data.user?.id,
      type: "table",
      action: "updated",
      description: `Updated table ${number} capacity to ${capacity}`,
      metadata: { table_id: id, table_number: number, capacity },
    });

    revalidatePath("/dashboard/tables");
    return { success: true, data: table };
  } catch (error: any) {
    console.error("Error in updateTable:", error);
    return { error: error.message || "Failed to update table" };
  }
}

// Delete a table (soft delete by setting is_active to false)
export async function deleteTable(id: string) {
  const supabase = createClient();

  try {
    const restaurantId = await getCurrentRestaurantId();

    // Check if table exists and belongs to restaurant
    const { data: table, error: fetchError } = await supabase
      .from("tables")
      .select("*")
      .eq("id", id)
      .eq("restaurant_id", restaurantId)
      .eq("is_active", true)
      .single();

    if (fetchError || !table) {
      return { error: "Table not found" };
    }

    // Check if table has active orders
    const { data: activeOrders } = await supabase
      .from("orders")
      .select("id")
      .eq("table_id", id)
      .in("status", ["pending", "preparing", "ready"]);

    if (activeOrders && activeOrders.length > 0) {
      return { error: "Cannot delete table with active orders" };
    }

    // Clean up related data first
    await cleanupTableData(id, restaurantId);

    // Soft delete table
    const { error } = await supabase
      .from("tables")
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("restaurant_id", restaurantId);

    if (error) {
      console.error("Error deleting table:", error);
      return { error: error.message };
    }

    // Log activity
    await supabase.from("activity_logs").insert({
      restaurant_id: restaurantId,
      user_id: (await supabase.auth.getUser()).data.user?.id,
      type: "table",
      action: "deleted",
      description: `Deleted table ${table.number}`,
      metadata: { table_id: id, table_number: table.number },
    });

    revalidatePath("/dashboard/tables");
    return { success: true };
  } catch (error: any) {
    console.error("Error in deleteTable:", error);
    return { error: error.message || "Failed to delete table" };
  }
}

// Bulk delete tables
export async function bulkDeleteTables(tableIds: string[]) {
  const supabase = createClient();

  try {
    const restaurantId = await getCurrentRestaurantId();
    const errors: Array<{ id: string; error: string }> = [];
    let deleted = 0;

    for (const tableId of tableIds) {
      try {
        // Check if table exists and belongs to restaurant
        const { data: table, error: fetchError } = await supabase
          .from("tables")
          .select("*")
          .eq("id", tableId)
          .eq("restaurant_id", restaurantId)
          .eq("is_active", true)
          .single();

        if (fetchError || !table) {
          errors.push({ id: tableId, error: "Table not found" });
          continue;
        }

        // Check if table has active orders
        const { data: activeOrders } = await supabase
          .from("orders")
          .select("id")
          .eq("table_id", tableId)
          .in("status", ["pending", "preparing", "ready"]);

        if (activeOrders && activeOrders.length > 0) {
          errors.push({
            id: tableId,
            error: "Cannot delete table with active orders",
          });
          continue;
        }

        // Clean up related data first
        await cleanupTableData(tableId, restaurantId);

        // Soft delete table
        const { error } = await supabase
          .from("tables")
          .update({
            is_active: false,
            updated_at: new Date().toISOString(),
          })
          .eq("id", tableId)
          .eq("restaurant_id", restaurantId);

        if (error) {
          errors.push({ id: tableId, error: error.message });
          continue;
        }

        // Log activity
        await supabase.from("activity_logs").insert({
          restaurant_id: restaurantId,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          type: "table",
          action: "deleted",
          description: `Deleted table ${table.number}`,
          metadata: { table_id: tableId, table_number: table.number },
        });

        deleted++;
      } catch (error: any) {
        errors.push({ id: tableId, error: error.message || "Unknown error" });
      }
    }

    revalidatePath("/dashboard/tables");
    return { success: true, deleted, errors };
  } catch (error: any) {
    console.error("Error in bulkDeleteTables:", error);
    return { error: error.message || "Failed to delete tables" };
  }
}

// Helper function to clean up table-related data
async function cleanupTableData(tableId: string, restaurantId: string) {
  const supabase = createClient();

  try {
    // 1. Get all orders for this table
    const { data: orders } = await supabase
      .from("orders")
      .select("id")
      .eq("table_id", tableId)
      .eq("restaurant_id", restaurantId);

    if (orders && orders.length > 0) {
      const orderIds = orders.map((order) => order.id);

      // 2. Delete related payments
      await supabase
        .from("payments")
        .delete()
        .in("order_id", orderIds)
        .eq("restaurant_id", restaurantId);

      // 3. Delete related order items
      await supabase.from("order_items").delete().in("order_id", orderIds);

      // 4. Update feedback to remove order references
      await supabase
        .from("feedback")
        .update({ order_id: null })
        .in("order_id", orderIds)
        .eq("restaurant_id", restaurantId);

      // 5. Delete the orders
      await supabase
        .from("orders")
        .delete()
        .in("id", orderIds)
        .eq("restaurant_id", restaurantId);
    }

    // 6. Clean up any orphaned feedback (feedback without orders)
    await supabase
      .from("feedback")
      .delete()
      .eq("restaurant_id", restaurantId)
      .is("order_id", null);
  } catch (error) {
    console.error("Error cleaning up table data:", error);
    throw error;
  }
}

// Update table status
export async function updateTableStatus(id: string, status: TableStatus) {
  const supabase = createClient();

  try {
    const restaurantId = await getCurrentRestaurantId();

    // Check if table exists and belongs to restaurant
    const { data: table, error: fetchError } = await supabase
      .from("tables")
      .select("*")
      .eq("id", id)
      .eq("restaurant_id", restaurantId)
      .eq("is_active", true)
      .single();

    if (fetchError || !table) {
      return { error: "Table not found" };
    }

    // Update table status
    const { data: updatedTable, error } = await supabase
      .from("tables")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("restaurant_id", restaurantId)
      .select()
      .single();

    if (error) {
      console.error("Error updating table status:", error);
      return { error: error.message };
    }

    // Log activity
    await supabase.from("activity_logs").insert({
      restaurant_id: restaurantId,
      user_id: (await supabase.auth.getUser()).data.user?.id,
      type: "table",
      action: "status_updated",
      description: `Updated table ${table.number} status to ${status}`,
      metadata: { table_id: id, table_number: table.number, status },
    });

    revalidatePath("/dashboard/tables");
    return { success: true, data: updatedTable };
  } catch (error: any) {
    console.error("Error in updateTableStatus:", error);
    return { error: error.message || "Failed to update table status" };
  }
}

// Generate a new QR code for a specific table (manual regeneration)
export async function generateTableQRCode(id: string) {
  const supabase = createClient();

  try {
    const restaurantId = await getCurrentRestaurantId();

    // Get table details
    const { data: table, error: fetchError } = await supabase
      .from("tables")
      .select("*")
      .eq("id", id)
      .eq("restaurant_id", restaurantId)
      .eq("is_active", true)
      .single();

    if (fetchError || !table) {
      return { error: "Table not found" };
    }

    // Generate new QR code URL with the correct environment URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://dineeasy.ch";
    const qrCodeUrl = `${baseUrl}/qr/${table.id}`;

    // Check if QR code is already correct
    if (table.qr_code === qrCodeUrl) {
      return {
        success: true,
        data: table,
        message: "QR code is already up to date",
        unchanged: true,
      };
    }

    // Update table with new QR code
    const { data: updatedTable, error } = await supabase
      .from("tables")
      .update({
        qr_code: qrCodeUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("restaurant_id", restaurantId)
      .select()
      .single();

    if (error) {
      console.error("Error updating QR code:", error);
      return { error: error.message };
    }

    // Log activity for manual QR code regeneration
    await supabase.from("activity_logs").insert({
      restaurant_id: restaurantId,
      user_id: (await supabase.auth.getUser()).data.user?.id,
      type: "table",
      action: "qr_regenerated",
      description: `Manually regenerated QR code for table ${table.number}`,
      metadata: {
        table_id: id,
        table_number: table.number,
        old_qr_code: table.qr_code,
        new_qr_code: qrCodeUrl,
      },
    });

    revalidatePath("/dashboard/tables");
    return {
      success: true,
      data: updatedTable,
      message: "QR code regenerated successfully",
    };
  } catch (error: any) {
    console.error("Error in generateTableQRCode:", error);
    return { error: error.message || "Failed to generate QR code" };
  }
}

// Get table statistics
export async function getTableStats() {
  const supabase = createClient();

  try {
    const restaurantId = await getCurrentRestaurantId();

    const { data: tables, error } = await supabase
      .from("tables")
      .select("status, capacity")
      .eq("restaurant_id", restaurantId)
      .eq("is_active", true);

    if (error) {
      console.error("Error fetching table stats:", error);
      throw error;
    }

    const stats = {
      total: tables?.length || 0,
      available: tables?.filter((t) => t.status === "available").length || 0,
      occupied: tables?.filter((t) => t.status === "occupied").length || 0,
      reserved: tables?.filter((t) => t.status === "reserved").length || 0,
      unavailable:
        tables?.filter((t) => t.status === "unavailable").length || 0,
      totalCapacity: tables?.reduce((sum, t) => sum + t.capacity, 0) || 0,
    };

    return { success: true, data: stats };
  } catch (error: any) {
    console.error("Error in getTableStats:", error);
    return { error: error.message || "Failed to fetch table statistics" };
  }
}

// Bulk update table statuses
export async function bulkUpdateTableStatus(
  tableIds: string[],
  status: TableStatus
) {
  const supabase = createClient();

  try {
    const restaurantId = await getCurrentRestaurantId();

    // Update all tables
    const { error } = await supabase
      .from("tables")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("restaurant_id", restaurantId)
      .in("id", tableIds);

    if (error) {
      console.error("Error bulk updating table status:", error);
      return { error: error.message };
    }

    // Log activity
    await supabase.from("activity_logs").insert({
      restaurant_id: restaurantId,
      user_id: (await supabase.auth.getUser()).data.user?.id,
      type: "table",
      action: "bulk_status_updated",
      description: `Updated ${tableIds.length} tables to ${status}`,
      metadata: { table_ids: tableIds, status },
    });

    revalidatePath("/dashboard/tables");
    return { success: true };
  } catch (error: any) {
    console.error("Error in bulkUpdateTableStatus:", error);
    return { error: error.message || "Failed to bulk update table status" };
  }
}

// Get table analytics and usage metrics
export async function getTableAnalytics() {
  const supabase = createClient();

  try {
    const restaurantId = await getCurrentRestaurantId();

    // Get tables with order counts
    const { data: tablesWithOrders, error: tablesError } = await supabase
      .from("tables")
      .select(
        `
        id,
        number,
        capacity,
        status,
        created_at,
        orders!inner(
          id,
          created_at,
          total_amount,
          status
        )
      `
      )
      .eq("restaurant_id", restaurantId)
      .eq("is_active", true);

    if (tablesError) {
      console.error("Error fetching table analytics:", tablesError);
      throw tablesError;
    }

    // Calculate analytics
    const analytics = {
      totalTables: tablesWithOrders?.length || 0,
      averageOrdersPerTable: 0,
      mostPopularTable: null as any,
      leastPopularTable: null as any,
      averageOrderValue: 0,
      totalRevenue: 0,
      utilizationRate: 0,
      peakHours: [] as any[],
    };

    if (tablesWithOrders && tablesWithOrders.length > 0) {
      // Calculate metrics
      const totalOrders = tablesWithOrders.reduce(
        (sum, table) => sum + (table.orders?.length || 0),
        0
      );
      analytics.averageOrdersPerTable = totalOrders / analytics.totalTables;

      // Find most/least popular tables
      const tableStats = tablesWithOrders.map((table) => ({
        number: table.number,
        orderCount: table.orders?.length || 0,
        totalRevenue:
          table.orders?.reduce(
            (sum, order) => sum + (order.total_amount || 0),
            0
          ) || 0,
      }));

      analytics.mostPopularTable = tableStats.reduce((max, table) =>
        table.orderCount > max.orderCount ? table : max
      );
      analytics.leastPopularTable = tableStats.reduce((min, table) =>
        table.orderCount < min.orderCount ? table : min
      );

      // Calculate revenue metrics
      const totalRevenue = tableStats.reduce(
        (sum, table) => sum + table.totalRevenue,
        0
      );
      analytics.totalRevenue = totalRevenue;
      analytics.averageOrderValue =
        totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Calculate utilization rate (tables with orders / total tables)
      const tablesWithOrdersCount = tablesWithOrders.filter(
        (table) => (table.orders?.length || 0) > 0
      ).length;
      analytics.utilizationRate =
        (tablesWithOrdersCount / analytics.totalTables) * 100;
    }

    return { success: true, data: analytics };
  } catch (error: any) {
    console.error("Error in getTableAnalytics:", error);
    return { error: error.message || "Failed to fetch table analytics" };
  }
}

// Export tables data as CSV
export async function exportTablesData() {
  const supabase = createClient();

  try {
    const restaurantId = await getCurrentRestaurantId();

    const { data: tables, error } = await supabase
      .from("tables")
      .select(
        `
        number,
        capacity,
        status,
        created_at,
        updated_at
      `
      )
      .eq("restaurant_id", restaurantId)
      .eq("is_active", true)
      .order("number", { ascending: true });

    if (error) {
      console.error("Error fetching tables for export:", error);
      throw error;
    }

    // Generate CSV content
    const headers = [
      "Table Number",
      "Capacity",
      "Status",
      "Created At",
      "Updated At",
    ];
    const csvContent = [
      headers.join(","),
      ...(tables || []).map((table) =>
        [
          table.number,
          table.capacity,
          table.status,
          new Date(table.created_at).toLocaleDateString(),
          new Date(table.updated_at).toLocaleDateString(),
        ].join(",")
      ),
    ].join("\n");

    return { success: true, data: csvContent };
  } catch (error: any) {
    console.error("Error in exportTablesData:", error);
    return { error: error.message || "Failed to export tables data" };
  }
}

// Get table activity history
export async function getTableHistory(tableId?: string) {
  const supabase = createClient();

  try {
    const restaurantId = await getCurrentRestaurantId();

    let query = supabase
      .from("activity_logs")
      .select(
        `
        id,
        type,
        action,
        description,
        metadata,
        created_at,
        user_id,
        profiles!inner(full_name)
      `
      )
      .eq("restaurant_id", restaurantId)
      .eq("type", "table")
      .order("created_at", { ascending: false })
      .limit(50);

    if (tableId) {
      query = query.eq("metadata->table_id", tableId);
    }

    const { data: activities, error } = await query;

    if (error) {
      console.error("Error fetching table history:", error);
      throw error;
    }

    return { success: true, data: activities || [] };
  } catch (error: any) {
    console.error("Error in getTableHistory:", error);
    return { error: error.message || "Failed to fetch table history" };
  }
}

// Get tables with layout data
export async function getTablesWithLayout() {
  const supabase = createClient();

  try {
    const restaurantId = await getCurrentRestaurantId();

    const { data: tables, error } = await supabase
      .from("tables")
      .select(
        `
        id,
        restaurant_id,
        number,
        capacity,
        status,
        qr_code,
        is_active,
        layout_x,
        layout_y,
        layout_rotation,
        layout_width,
        layout_height,
        created_at,
        updated_at
      `
      )
      .eq("restaurant_id", restaurantId)
      .eq("is_active", true)
      .order("number");

    if (error) {
      console.error("Error fetching tables with layout:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data: tables || [] };
  } catch (error: any) {
    console.error("Error in getTablesWithLayout:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch tables with layout",
    };
  }
}

// Update table layout positions
export async function updateTableLayout(
  tableId: string,
  x: number,
  y: number,
  rotation: number = 0,
  width: number = 120,
  height: number = 80
) {
  const supabase = createClient();

  try {
    const { data, error } = await supabase.rpc("update_table_layout", {
      table_id: tableId,
      x_pos: x,
      y_pos: y,
      rotation: rotation,
      width: width,
      height: height,
    });

    if (error) {
      console.error("Error updating table layout:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error: any) {
    console.error("Error updating table layout:", error);
    return {
      success: false,
      error: error.message || "Failed to update table layout",
    };
  }
}

// Bulk update table layouts
export async function bulkUpdateTableLayouts(layoutData: any[]) {
  const supabase = createClient();

  try {
    const { data, error } = await supabase.rpc("bulk_update_table_layouts", {
      layout_data: layoutData,
    });

    if (error) {
      console.error("Error bulk updating table layouts:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error: any) {
    console.error("Error bulk updating table layouts:", error);
    return {
      success: false,
      error: error.message || "Failed to bulk update table layouts",
    };
  }
}

// Update all QR codes for the current environment (only if they need updating)
export async function updateAllQRCodesForEnvironment() {
  const supabase = createClient();

  try {
    const restaurantId = await getCurrentRestaurantId();

    // Get all tables for the restaurant
    const { data: tables, error: fetchError } = await supabase
      .from("tables")
      .select("id, number, qr_code")
      .eq("restaurant_id", restaurantId)
      .eq("is_active", true);

    if (fetchError) {
      console.error("Error fetching tables:", fetchError);
      return { error: "Failed to fetch tables" };
    }

    if (!tables || tables.length === 0) {
      return { success: true, message: "No tables found to update" };
    }

    // Generate the correct base URL for this environment
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://dineeasy.ch";

    // Check which tables need QR code updates
    const tablesNeedingUpdate = tables.filter((table) => {
      const expectedQrCode = `${baseUrl}/qr/${table.id}`;
      return !table.qr_code || table.qr_code !== expectedQrCode;
    });

    if (tablesNeedingUpdate.length === 0) {
      return {
        success: true,
        message: "All QR codes are already up to date",
        details: { updated: 0, skipped: tables.length, total: tables.length },
      };
    }

    // Update only tables that need QR code updates
    const updatePromises = tablesNeedingUpdate.map(async (table) => {
      const qrCodeUrl = `${baseUrl}/qr/${table.id}`;

      const { error: updateError } = await supabase
        .from("tables")
        .update({
          qr_code: qrCodeUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", table.id)
        .eq("restaurant_id", restaurantId);

      if (updateError) {
        console.error(
          `Error updating QR code for table ${table.number}:`,
          updateError
        );
        return {
          success: false,
          tableId: table.id,
          tableNumber: table.number,
          error: updateError.message,
        };
      }

      return {
        success: true,
        tableId: table.id,
        tableNumber: table.number,
      };
    });

    const results = await Promise.all(updatePromises);
    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;
    const skipped = tables.length - tablesNeedingUpdate.length;

    // Log activity only if there were actual updates
    if (successful > 0 || failed > 0) {
      await supabase.from("activity_logs").insert({
        restaurant_id: restaurantId,
        user_id: (await supabase.auth.getUser()).data.user?.id,
        type: "table",
        action: "qr_codes_updated",
        description: `Updated QR codes for ${successful} tables (${failed} failed, ${skipped} skipped)`,
        metadata: {
          total_tables: tables.length,
          updated_tables: successful,
          failed_updates: failed,
          skipped_tables: skipped,
          environment: process.env.NODE_ENV || "development",
          base_url: baseUrl,
        },
      });
    }

    revalidatePath("/dashboard/tables");
    return {
      success: true,
      message: `Updated ${successful} QR codes (${failed} failed, ${skipped} skipped)`,
      details: {
        updated: successful,
        failed: failed,
        skipped: skipped,
        total: tables.length,
      },
    };
  } catch (error: any) {
    console.error("Error in updateAllQRCodesForEnvironment:", error);
    return { error: error.message || "Failed to update QR codes" };
  }
}

// Check QR code status for a table (without updating)
export async function checkTableQRCodeStatus(tableId: string) {
  const supabase = createClient();

  try {
    const restaurantId = await getCurrentRestaurantId();

    // Get table details
    const { data: table, error: fetchError } = await supabase
      .from("tables")
      .select("id, number, qr_code")
      .eq("id", tableId)
      .eq("restaurant_id", restaurantId)
      .eq("is_active", true)
      .single();

    if (fetchError || !table) {
      return { error: "Table not found" };
    }

    // Generate expected QR code URL with correct environment URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://dineeasy.ch";
    const expectedQrCode = `${baseUrl}/qr/${table.id}`;
    const needsUpdate = !table.qr_code || table.qr_code !== expectedQrCode;

    return {
      success: true,
      data: {
        tableId: table.id,
        tableNumber: table.number,
        currentQrCode: table.qr_code,
        expectedQrCode: expectedQrCode,
        needsUpdate: needsUpdate,
        isCorrect: !needsUpdate,
      },
    };
  } catch (error: any) {
    console.error("Error in checkTableQRCodeStatus:", error);
    return { error: error.message || "Failed to check QR code status" };
  }
}

// Check QR code status for all tables (without updating)
export async function checkAllTableQRCodes() {
  const supabase = createClient();

  try {
    const restaurantId = await getCurrentRestaurantId();

    // Get all tables for the restaurant
    const { data: tables, error: fetchError } = await supabase
      .from("tables")
      .select("id, number, qr_code")
      .eq("restaurant_id", restaurantId)
      .eq("is_active", true);

    if (fetchError) {
      console.error("Error fetching tables:", fetchError);
      return { error: "Failed to fetch tables" };
    }

    if (!tables || tables.length === 0) {
      return { success: true, data: [], message: "No tables found" };
    }

    // Generate the correct base URL for this environment
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://dineeasy.ch";

    // Check each table's QR code status
    const qrCodeStatuses = tables.map((table) => {
      const expectedQrCode = `${baseUrl}/qr/${table.id}`;
      const needsUpdate = !table.qr_code || table.qr_code !== expectedQrCode;

      return {
        tableId: table.id,
        tableNumber: table.number,
        currentQrCode: table.qr_code,
        expectedQrCode: expectedQrCode,
        needsUpdate: needsUpdate,
        isCorrect: !needsUpdate,
      };
    });

    const correctQrCodes = qrCodeStatuses.filter(
      (status) => status.isCorrect
    ).length;
    const incorrectQrCodes = qrCodeStatuses.filter(
      (status) => !status.isCorrect
    ).length;

    return {
      success: true,
      data: qrCodeStatuses,
      summary: {
        total: tables.length,
        correct: correctQrCodes,
        incorrect: incorrectQrCodes,
        allCorrect: incorrectQrCodes === 0,
      },
    };
  } catch (error: any) {
    console.error("Error in checkAllTableQRCodes:", error);
    return { error: error.message || "Failed to check QR codes" };
  }
}

// Clean up orphaned data (for maintenance)
export async function cleanupOrphanedData() {
  const supabase = createClient();

  try {
    const restaurantId = await getCurrentRestaurantId();
    let cleaned = 0;

    // 1. Clean up orphaned feedback (feedback without orders)
    const { data: orphanedFeedback } = await supabase
      .from("feedback")
      .select("id")
      .eq("restaurant_id", restaurantId)
      .is("order_id", null);

    if (orphanedFeedback && orphanedFeedback.length > 0) {
      await supabase
        .from("feedback")
        .delete()
        .eq("restaurant_id", restaurantId)
        .is("order_id", null);
      cleaned += orphanedFeedback.length;
    }

    // 2. Clean up orphaned payments (payments without orders)
    const { data: orphanedPayments } = await supabase
      .from("payments")
      .select("id")
      .eq("restaurant_id", restaurantId)
      .not(
        "order_id",
        "in",
        `(select id from orders where restaurant_id = '${restaurantId}')`
      );

    if (orphanedPayments && orphanedPayments.length > 0) {
      await supabase
        .from("payments")
        .delete()
        .eq("restaurant_id", restaurantId)
        .not(
          "order_id",
          "in",
          `(select id from orders where restaurant_id = '${restaurantId}')`
        );
      cleaned += orphanedPayments.length;
    }

    // 3. Clean up orphaned order items (order items without orders)
    const { data: orphanedOrderItems } = await supabase
      .from("order_items")
      .select("id")
      .not(
        "order_id",
        "in",
        `(select id from orders where restaurant_id = '${restaurantId}')`
      );

    if (orphanedOrderItems && orphanedOrderItems.length > 0) {
      await supabase
        .from("order_items")
        .delete()
        .not(
          "order_id",
          "in",
          `(select id from orders where restaurant_id = '${restaurantId}')`
        );
      cleaned += orphanedOrderItems.length;
    }

    // 4. Clean up orders for deleted tables
    const { data: orphanedOrders } = await supabase
      .from("orders")
      .select("id")
      .eq("restaurant_id", restaurantId)
      .not(
        "table_id",
        "in",
        `(select id from tables where restaurant_id = '${restaurantId}' and is_active = true)`
      );

    if (orphanedOrders && orphanedOrders.length > 0) {
      // Delete related payments first
      await supabase
        .from("payments")
        .delete()
        .in(
          "order_id",
          orphanedOrders.map((o) => o.id)
        )
        .eq("restaurant_id", restaurantId);

      // Delete related order items
      await supabase
        .from("order_items")
        .delete()
        .in(
          "order_id",
          orphanedOrders.map((o) => o.id)
        );

      // Update feedback to remove order references
      await supabase
        .from("feedback")
        .update({ order_id: null })
        .in(
          "order_id",
          orphanedOrders.map((o) => o.id)
        )
        .eq("restaurant_id", restaurantId);

      // Delete the orders
      await supabase
        .from("orders")
        .delete()
        .in(
          "id",
          orphanedOrders.map((o) => o.id)
        )
        .eq("restaurant_id", restaurantId);

      cleaned += orphanedOrders.length;
    }

    return { success: true, cleaned };
  } catch (error: any) {
    console.error("Error in cleanupOrphanedData:", error);
    return { error: error.message || "Failed to cleanup orphaned data" };
  }
}

// Get current restaurant type
export async function getCurrentRestaurantType(): Promise<string | null> {
  const supabase = createClient();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("Not authenticated");
    }

    const { data: restaurant, error } = await supabase
      .from("restaurants")
      .select("type")
      .eq("owner_id", user.id)
      .single();

    if (error || !restaurant) {
      console.error("Error fetching restaurant type:", error);
      return null;
    }

    return restaurant.type;
  } catch (error: any) {
    console.error("Error in getCurrentRestaurantType:", error);
    return null;
  }
}

// Get restaurant elements for layout
export async function getRestaurantElements() {
  const supabase = createClient();

  try {
    const restaurantId = await getCurrentRestaurantId();

    const { data: elements, error } = await supabase.rpc(
      "get_restaurant_elements",
      {
        p_restaurant_id: restaurantId,
      }
    );

    if (error) {
      console.error("Error fetching restaurant elements:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data: elements || [] };
  } catch (error: any) {
    console.error("Error in getRestaurantElements:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch restaurant elements",
    };
  }
}

// Save restaurant elements for layout
export async function saveRestaurantElements(elements: any[]) {
  const supabase = createClient();

  try {
    const restaurantId = await getCurrentRestaurantId();

    // Convert elements to the format expected by the database function
    const elementsData = elements.map((element) => ({
      type: element.type,
      name: element.name,
      x: element.x,
      y: element.y,
      width: element.width,
      height: element.height,
      rotation: element.rotation,
      color: element.color,
      icon: element.icon,
      locked: element.locked,
      visible: element.visible,
    }));

    const { data, error } = await supabase.rpc("upsert_restaurant_elements", {
      p_restaurant_id: restaurantId,
      p_elements: elementsData,
    });

    if (error) {
      console.error("Error saving restaurant elements:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error: any) {
    console.error("Error in saveRestaurantElements:", error);
    return {
      success: false,
      error: error.message || "Failed to save restaurant elements",
    };
  }
}
