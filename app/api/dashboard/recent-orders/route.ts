import { NextRequest, NextResponse } from "next/server";
import { getRecentOrders } from "@/lib/actions/dashboard";

export async function GET(request: NextRequest) {
  try {
    const result = await getRecentOrders();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching recent orders:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch recent orders" },
      { status: 500 }
    );
  }
}
