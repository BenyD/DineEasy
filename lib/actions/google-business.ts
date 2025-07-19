"use server";

import { createClient } from "@/lib/supabase/server";
import { googleBusiness } from "@/lib/google-business";
import { revalidatePath } from "next/cache";

// Get Google Business authorization URL
export async function getGoogleBusinessAuthUrl() {
  try {
    const authUrl = googleBusiness.getAuthUrl();
    return { success: true, authUrl };
  } catch (error) {
    console.error("Error generating auth URL:", error);
    return { success: false, error: "Failed to generate authorization URL" };
  }
}

// Handle Google Business OAuth callback
export async function handleGoogleBusinessCallback(code: string) {
  const supabase = createClient();

  try {
    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: "User not authenticated" };
    }

    // Exchange code for tokens
    const tokens = await googleBusiness.getTokens(code);

    // Get user's business accounts
    const accounts = await googleBusiness.getBusinessAccounts();
    if (!accounts || accounts.length === 0) {
      return { success: false, error: "No Google Business accounts found" };
    }

    // Get user's restaurant
    const { data: restaurant, error: restaurantError } = await supabase
      .from("restaurants")
      .select("id")
      .eq("owner_id", user.id)
      .single();

    if (restaurantError || !restaurant) {
      return { success: false, error: "Restaurant not found" };
    }

    // Update restaurant with Google Business tokens
    const { error: updateError } = await supabase
      .from("restaurants")
      .update({
        google_business_access_token: tokens.access_token,
        google_business_refresh_token: tokens.refresh_token,
        google_business_token_expiry: new Date(
          tokens.expiry_date
        ).toISOString(),
        google_business_id: accounts[0].name,
        google_business_sync_enabled: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", restaurant.id);

    if (updateError) {
      return { success: false, error: "Failed to save Google Business tokens" };
    }

    revalidatePath("/dashboard/settings");
    return { success: true, message: "Google Business connected successfully" };
  } catch (error) {
    console.error("Error handling Google Business callback:", error);
    return { success: false, error: "Failed to connect Google Business" };
  }
}

// Sync restaurant data to Google Business
export async function syncToGoogleBusiness() {
  const supabase = createClient();

  try {
    // Get current user and restaurant
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: "User not authenticated" };
    }

    const { data: restaurant, error: restaurantError } = await supabase
      .from("restaurants")
      .select("*")
      .eq("owner_id", user.id)
      .single();

    if (restaurantError || !restaurant) {
      return { success: false, error: "Restaurant not found" };
    }

    if (!restaurant.google_business_access_token) {
      return { success: false, error: "Google Business not connected" };
    }

    // Initialize Google Business API with access token
    const googleAPI = new (
      await import("@/lib/google-business")
    ).GoogleBusinessAPI(restaurant.google_business_access_token);

    // Sync business hours
    if (restaurant.opening_hours) {
      await googleAPI.updateHours(
        restaurant.google_business_location_id,
        restaurant.opening_hours
      );
    }

    // Sync contact information
    await googleAPI.updateContact(restaurant.google_business_location_id, {
      phone: restaurant.phone,
      website: restaurant.website,
    });

    // Sync description
    if (restaurant.description) {
      await googleAPI.updateDescription(
        restaurant.google_business_location_id,
        restaurant.description
      );
    }

    // Update last sync timestamp
    await supabase
      .from("restaurants")
      .update({
        google_business_last_sync: new Date().toISOString(),
      })
      .eq("id", restaurant.id);

    revalidatePath("/dashboard/settings");
    return {
      success: true,
      message: "Data synced to Google Business successfully",
    };
  } catch (error) {
    console.error("Error syncing to Google Business:", error);
    return { success: false, error: "Failed to sync data to Google Business" };
  }
}

// Fetch and store Google Business reviews
export async function fetchGoogleBusinessReviews() {
  const supabase = createClient();

  try {
    // Get current user and restaurant
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: "User not authenticated" };
    }

    const { data: restaurant, error: restaurantError } = await supabase
      .from("restaurants")
      .select("id, google_business_access_token, google_business_location_id")
      .eq("owner_id", user.id)
      .single();

    if (restaurantError || !restaurant) {
      return { success: false, error: "Restaurant not found" };
    }

    if (
      !restaurant.google_business_access_token ||
      !restaurant.google_business_location_id
    ) {
      return {
        success: false,
        error: "Google Business not properly connected",
      };
    }

    // Initialize Google Business API
    const googleAPI = new (
      await import("@/lib/google-business")
    ).GoogleBusinessAPI(restaurant.google_business_access_token);

    // Fetch reviews
    const reviews = await googleAPI.getReviews(
      restaurant.google_business_location_id
    );

    // Store reviews in database
    for (const review of reviews) {
      const { error: insertError } = await supabase
        .from("google_business_reviews")
        .upsert(
          {
            restaurant_id: restaurant.id,
            google_review_id: review.name,
            reviewer_name: review.reviewer?.displayName,
            reviewer_photo_url: review.reviewer?.profilePhotoUri,
            rating: review.starRating,
            comment: review.comment,
            review_time: review.createTime,
            reply_text: review.reviewReply?.comment,
            reply_time: review.reviewReply?.updateTime,
          },
          {
            onConflict: "restaurant_id,google_review_id",
          }
        );

      if (insertError) {
        console.error("Error inserting review:", insertError);
      }
    }

    revalidatePath("/dashboard/feedback");
    return { success: true, message: `Fetched ${reviews.length} reviews` };
  } catch (error) {
    console.error("Error fetching Google Business reviews:", error);
    return { success: false, error: "Failed to fetch reviews" };
  }
}

// Reply to a Google Business review
export async function replyToGoogleBusinessReview(
  reviewId: string,
  reply: string
) {
  const supabase = createClient();

  try {
    // Get current user and restaurant
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: "User not authenticated" };
    }

    const { data: restaurant, error: restaurantError } = await supabase
      .from("restaurants")
      .select("google_business_access_token")
      .eq("owner_id", user.id)
      .single();

    if (restaurantError || !restaurant) {
      return { success: false, error: "Restaurant not found" };
    }

    if (!restaurant.google_business_access_token) {
      return { success: false, error: "Google Business not connected" };
    }

    // Initialize Google Business API
    const googleAPI = new (
      await import("@/lib/google-business")
    ).GoogleBusinessAPI(restaurant.google_business_access_token);

    // Reply to review
    await googleAPI.replyToReview(reviewId, reply);

    // Update local database
    await supabase
      .from("google_business_reviews")
      .update({
        reply_text: reply,
        reply_time: new Date().toISOString(),
      })
      .eq("google_review_id", reviewId);

    revalidatePath("/dashboard/feedback");
    return { success: true, message: "Reply posted successfully" };
  } catch (error) {
    console.error("Error replying to review:", error);
    return { success: false, error: "Failed to post reply" };
  }
}

// Fetch Google Business insights
export async function fetchGoogleBusinessInsights() {
  const supabase = createClient();

  try {
    // Get current user and restaurant
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: "User not authenticated" };
    }

    const { data: restaurant, error: restaurantError } = await supabase
      .from("restaurants")
      .select("id, google_business_access_token, google_business_location_id")
      .eq("owner_id", user.id)
      .single();

    if (restaurantError || !restaurant) {
      return { success: false, error: "Restaurant not found" };
    }

    if (
      !restaurant.google_business_access_token ||
      !restaurant.google_business_location_id
    ) {
      return {
        success: false,
        error: "Google Business not properly connected",
      };
    }

    // Initialize Google Business API
    const googleAPI = new (
      await import("@/lib/google-business")
    ).GoogleBusinessAPI(restaurant.google_business_access_token);

    // Fetch insights
    const insights = await googleAPI.getInsights(
      restaurant.google_business_location_id,
      [
        "QUERIES_DIRECT",
        "QUERIES_INDIRECT",
        "VIEWS_MAPS",
        "VIEWS_SEARCH",
        "ACTIONS_WEBSITE",
        "ACTIONS_PHONE",
        "ACTIONS_DRIVING_DIRECTIONS",
      ]
    );

    // Store insights in database
    const today = new Date().toISOString().split("T")[0];

    for (const metric of insights.locationMetrics?.[0]?.metricValues || []) {
      await supabase.from("google_business_insights").upsert(
        {
          restaurant_id: restaurant.id,
          date: today,
          metric_name: metric.metric,
          metric_value: metric.totalValue?.value || 0,
        },
        {
          onConflict: "restaurant_id,date,metric_name",
        }
      );
    }

    revalidatePath("/dashboard/analytics");
    return { success: true, message: "Insights fetched successfully" };
  } catch (error) {
    console.error("Error fetching Google Business insights:", error);
    return { success: false, error: "Failed to fetch insights" };
  }
}

// Disconnect Google Business
export async function disconnectGoogleBusiness() {
  const supabase = createClient();

  try {
    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: "User not authenticated" };
    }

    // Remove Google Business tokens
    const { error: updateError } = await supabase
      .from("restaurants")
      .update({
        google_business_access_token: null,
        google_business_refresh_token: null,
        google_business_token_expiry: null,
        google_business_id: null,
        google_business_sync_enabled: false,
        google_business_location_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq("owner_id", user.id);

    if (updateError) {
      return { success: false, error: "Failed to disconnect Google Business" };
    }

    revalidatePath("/dashboard/settings");
    return {
      success: true,
      message: "Google Business disconnected successfully",
    };
  } catch (error) {
    console.error("Error disconnecting Google Business:", error);
    return { success: false, error: "Failed to disconnect Google Business" };
  }
}
