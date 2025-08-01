"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface FeedbackData {
  restaurantId: string;
  orderId?: string;
  orderNumber?: string;
  rating: number;
  comment?: string;
}

export interface OrderFeedbackData {
  orderId: string;
  orderNumber: string;
  restaurantId: string;
  restaurantName: string;
  totalAmount: number;
  customerName?: string;
  createdAt: string;
  hasFeedback: boolean;
}

/**
 * Submit feedback for a QR order
 * Handles sentiment analysis and stores feedback in database
 */
export async function submitFeedback(feedbackData: FeedbackData) {
  const supabase = createClient();

  try {
    console.log("Submitting feedback:", {
      restaurantId: feedbackData.restaurantId,
      orderId: feedbackData.orderId,
      orderNumber: feedbackData.orderNumber,
      rating: feedbackData.rating,
      hasComment: !!feedbackData.comment,
    });

    // Validate input
    if (!feedbackData.restaurantId) {
      return { error: "Restaurant ID is required" };
    }

    if (
      !feedbackData.rating ||
      feedbackData.rating < 1 ||
      feedbackData.rating > 5
    ) {
      return { error: "Rating must be between 1 and 5" };
    }

    // Determine sentiment based on rating
    let sentiment: "positive" | "neutral" | "negative";
    if (feedbackData.rating >= 4) {
      sentiment = "positive";
    } else if (feedbackData.rating >= 3) {
      sentiment = "neutral";
    } else {
      sentiment = "negative";
    }

    // If we have an order number but no order ID, try to find the order
    let orderId = feedbackData.orderId;
    if (feedbackData.orderNumber && !orderId) {
      const { data: order } = await supabase
        .from("orders")
        .select("id")
        .eq("order_number", feedbackData.orderNumber)
        .eq("restaurant_id", feedbackData.restaurantId)
        .single();

      if (order) {
        orderId = order.id;
      }
    }

    // Check if feedback already exists for this order
    if (orderId) {
      const { data: existingFeedback } = await supabase
        .from("feedback")
        .select("id")
        .eq("order_id", orderId)
        .single();

      if (existingFeedback) {
        return { error: "Feedback already submitted for this order" };
      }
    }

    // Insert feedback
    const { data: feedback, error } = await supabase
      .from("feedback")
      .insert({
        restaurant_id: feedbackData.restaurantId,
        order_id: orderId || null,
        rating: feedbackData.rating,
        comment: feedbackData.comment?.trim() || null,
        sentiment: sentiment,
      })
      .select("id, rating, sentiment, created_at")
      .single();

    if (error) {
      console.error("Error submitting feedback:", error);
      return { error: "Failed to submit feedback" };
    }

    console.log("Feedback submitted successfully:", {
      feedbackId: feedback.id,
      rating: feedback.rating,
      sentiment: feedback.sentiment,
    });

    // Revalidate relevant paths
    revalidatePath("/dashboard/feedback");

    return {
      success: true,
      feedbackId: feedback.id,
      sentiment: feedback.sentiment,
    };
  } catch (error) {
    console.error("Error submitting feedback:", error);
    return { error: "Failed to submit feedback" };
  }
}

/**
 * Get feedback for a specific order
 */
export async function getOrderFeedback(orderId: string) {
  const supabase = createClient();

  try {
    const { data: feedback, error } = await supabase
      .from("feedback")
      .select(
        `
        id,
        rating,
        comment,
        sentiment,
        created_at,
        orders (
          order_number,
          total_amount,
          customer_name
        )
      `
      )
      .eq("order_id", orderId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return { success: true, feedback: null }; // No feedback found
      }
      throw error;
    }

    return { success: true, feedback };
  } catch (error) {
    console.error("Error fetching order feedback:", error);
    return { error: "Failed to fetch feedback" };
  }
}

/**
 * Get restaurant feedback statistics
 */
export async function getRestaurantFeedbackStats(restaurantId: string) {
  const supabase = createClient();

  try {
    // Get overall statistics
    const { data: stats, error: statsError } = await supabase
      .from("feedback")
      .select("rating, sentiment")
      .eq("restaurant_id", restaurantId);

    if (statsError) {
      throw statsError;
    }

    if (!stats || stats.length === 0) {
      return {
        success: true,
        stats: {
          totalFeedback: 0,
          averageRating: 0,
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          sentimentDistribution: { positive: 0, neutral: 0, negative: 0 },
        },
      };
    }

    // Calculate statistics
    const totalFeedback = stats.length;
    const averageRating =
      stats.reduce((sum, item) => sum + item.rating, 0) / totalFeedback;

    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const sentimentDistribution = { positive: 0, neutral: 0, negative: 0 };

    stats.forEach((item) => {
      ratingDistribution[item.rating as keyof typeof ratingDistribution]++;
      sentimentDistribution[
        item.sentiment as keyof typeof sentimentDistribution
      ]++;
    });

    return {
      success: true,
      stats: {
        totalFeedback,
        averageRating: Math.round(averageRating * 10) / 10,
        ratingDistribution,
        sentimentDistribution,
      },
    };
  } catch (error) {
    console.error("Error fetching feedback stats:", error);
    return { error: "Failed to fetch feedback statistics" };
  }
}

/**
 * Get recent feedback for a restaurant
 */
export async function getRecentFeedback(
  restaurantId: string,
  limit: number = 10
) {
  const supabase = createClient();

  try {
    const { data: feedback, error } = await supabase
      .from("feedback")
      .select(
        `
        id,
        rating,
        comment,
        sentiment,
        created_at,
        orders (
          order_number,
          customer_name
        )
      `
      )
      .eq("restaurant_id", restaurantId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    return { success: true, feedback: feedback || [] };
  } catch (error) {
    console.error("Error fetching recent feedback:", error);
    return { error: "Failed to fetch recent feedback" };
  }
}

/**
 * Get order information for feedback by order number
 */
export async function getOrderForFeedback(
  orderNumber: string,
  restaurantId: string
): Promise<{ success: boolean; order?: OrderFeedbackData; error?: string }> {
  const supabase = createClient();

  try {
    console.log("Looking up order for feedback:", {
      orderNumber,
      restaurantId,
    });

    const { data: order, error } = await supabase
      .from("orders")
      .select(
        `
        id,
        order_number,
        restaurant_id,
        total_amount,
        customer_name,
        created_at,
        restaurants (
          name
        )
      `
      )
      .eq("order_number", orderNumber)
      .eq("restaurant_id", restaurantId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return { success: true, error: "Order not found" };
      }
      throw error;
    }

    if (!order) {
      return { success: true, error: "Order not found" };
    }

    // Check if feedback already exists for this order
    const { data: existingFeedback } = await supabase
      .from("feedback")
      .select("id")
      .eq("order_id", order.id)
      .single();

    const orderData: OrderFeedbackData = {
      orderId: order.id,
      orderNumber: order.order_number,
      restaurantId: order.restaurant_id,
      restaurantName: (order.restaurants as any)?.name || "Unknown Restaurant",
      totalAmount: order.total_amount,
      customerName: order.customer_name,
      createdAt: order.created_at,
      hasFeedback: !!existingFeedback,
    };

    return { success: true, order: orderData };
  } catch (error) {
    console.error("Error fetching order for feedback:", error);
    return { success: false, error: "Failed to fetch order information" };
  }
}

/**
 * Get feedback by order number
 */
export async function getFeedbackByOrderNumber(
  orderNumber: string,
  restaurantId: string
) {
  const supabase = createClient();

  try {
    const { data: feedback, error } = await supabase
      .from("feedback")
      .select(
        `
        id,
        rating,
        comment,
        sentiment,
        created_at,
        orders (
          order_number,
          total_amount,
          customer_name
        )
      `
      )
      .eq("orders.order_number", orderNumber)
      .eq("restaurant_id", restaurantId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return { success: true, feedback: null }; // No feedback found
      }
      throw error;
    }

    return { success: true, feedback };
  } catch (error) {
    console.error("Error fetching feedback by order number:", error);
    return { error: "Failed to fetch feedback" };
  }
}

/**
 * Get feedback analytics for dashboard
 */
export async function getFeedbackAnalytics(
  restaurantId: string,
  days: number = 30
) {
  const supabase = createClient();

  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get feedback with order details
    const { data: feedback, error } = await supabase
      .from("feedback")
      .select(
        `
        id,
        rating,
        comment,
        sentiment,
        created_at,
        orders (
          order_number,
          total_amount,
          customer_name,
          created_at
        )
      `
      )
      .eq("restaurant_id", restaurantId)
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    if (!feedback || feedback.length === 0) {
      return {
        success: true,
        analytics: {
          totalFeedback: 0,
          averageRating: 0,
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          sentimentDistribution: { positive: 0, neutral: 0, negative: 0 },
          recentFeedback: [],
          feedbackTrend: [],
        },
      };
    }

    // Calculate statistics
    const totalFeedback = feedback.length;
    const averageRating =
      feedback.reduce((sum, item) => sum + item.rating, 0) / totalFeedback;

    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const sentimentDistribution = { positive: 0, neutral: 0, negative: 0 };

    feedback.forEach((item) => {
      ratingDistribution[item.rating as keyof typeof ratingDistribution]++;
      sentimentDistribution[
        item.sentiment as keyof typeof sentimentDistribution
      ]++;
    });

    // Get recent feedback (last 10)
    const recentFeedback = feedback.slice(0, 10);

    // Calculate daily feedback trend
    const feedbackTrend = feedback
      .reduce((acc: any[], item) => {
        const date = new Date(item.created_at).toISOString().split("T")[0];
        const existing = acc.find((d) => d.date === date);
        if (existing) {
          existing.count++;
          existing.avgRating = (existing.avgRating + item.rating) / 2;
        } else {
          acc.push({ date, count: 1, avgRating: item.rating });
        }
        return acc;
      }, [])
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return {
      success: true,
      analytics: {
        totalFeedback,
        averageRating: Math.round(averageRating * 10) / 10,
        ratingDistribution,
        sentimentDistribution,
        recentFeedback,
        feedbackTrend,
      },
    };
  } catch (error) {
    console.error("Error fetching feedback analytics:", error);
    return { error: "Failed to fetch feedback analytics" };
  }
}
