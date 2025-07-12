import { NextRequest, NextResponse } from "next/server";
import { createStripePortalSession } from "@/lib/actions/billing";

export async function GET(request: NextRequest) {
  try {
    const result = await createStripePortalSession();

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    if (result.portalUrl) {
      return NextResponse.redirect(result.portalUrl);
    }

    return NextResponse.json(
      { error: "Failed to create portal session" },
      { status: 500 }
    );
  } catch (error) {
    console.error("Error in Stripe portal route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
