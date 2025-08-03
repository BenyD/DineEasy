import { NextRequest, NextResponse } from "next/server";
import { getDashboardStats } from "@/lib/actions/dashboard";

export async function GET(request: NextRequest) {
  try {
    const result = await getDashboardStats();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}
