import { NextRequest, NextResponse } from "next/server";
import { getRecentPayments } from "@/lib/actions/dashboard";

export async function GET(request: NextRequest) {
  try {
    const result = await getRecentPayments();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching recent payments:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch recent payments" },
      { status: 500 }
    );
  }
}
