import { NextRequest, NextResponse } from "next/server";
import { handleGoogleBusinessCallback } from "@/lib/actions/google-business";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=google_business_auth_failed&message=${encodeURIComponent(error)}`
    );
  }

  if (!code) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=google_business_no_code`
    );
  }

  try {
    const result = await handleGoogleBusinessCallback(code);

    if (result.success) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?success=google_business_connected`
      );
    } else {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=google_business_connection_failed&message=${encodeURIComponent(result.error || "Unknown error")}`
      );
    }
  } catch (error) {
    console.error("Error in Google Business callback:", error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=google_business_callback_error`
    );
  }
}
