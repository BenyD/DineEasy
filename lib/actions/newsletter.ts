"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface NewsletterSubscriptionData {
  email: string;
  firstName?: string;
  lastName?: string;
  source?: string;
}

export interface NewsletterSubscriptionResult {
  success: boolean;
  message: string;
  subscriptionId?: string;
  action?: "created" | "reactivated" | "unsubscribed";
}

export async function subscribeToNewsletter(
  data: NewsletterSubscriptionData
): Promise<NewsletterSubscriptionResult> {
  try {
    const supabase = createClient();

    // Validate email
    if (!data.email || !data.email.includes("@")) {
      return {
        success: false,
        message: "Please provide a valid email address.",
      };
    }

    // Call the database function to subscribe
    const { data: result, error } = await supabase.rpc("subscribe_to_newsletter", {
      subscriber_email: data.email,
      subscriber_first_name: data.firstName || null,
      subscriber_last_name: data.lastName || null,
      subscriber_source: data.source || "website",
    });

    if (error) {
      console.error("Newsletter subscription error:", error);
      return {
        success: false,
        message: "Failed to subscribe to newsletter. Please try again.",
      };
    }

    // Parse the result
    const subscriptionResult = result as {
      success: boolean;
      message: string;
      subscription_id: string;
      action: "created" | "reactivated";
    };

    // Send welcome email for new subscriptions
    if (subscriptionResult.action === "created") {
      try {
        await sendNewsletterWelcomeEmail(data.email, data.firstName);
      } catch (emailError) {
        console.error("Failed to send welcome email:", emailError);
        // Don't fail the subscription if email fails
      }
    }

    revalidatePath("/");

    return {
      success: subscriptionResult.success,
      message: subscriptionResult.message,
      subscriptionId: subscriptionResult.subscription_id,
      action: subscriptionResult.action,
    };
  } catch (error) {
    console.error("Newsletter subscription error:", error);
    return {
      success: false,
      message: "An unexpected error occurred. Please try again.",
    };
  }
}

export async function unsubscribeFromNewsletter(
  email: string
): Promise<NewsletterSubscriptionResult> {
  try {
    const supabase = createClient();

    // Validate email
    if (!email || !email.includes("@")) {
      return {
        success: false,
        message: "Please provide a valid email address.",
      };
    }

    // Call the database function to unsubscribe
    const { data: result, error } = await supabase.rpc("unsubscribe_from_newsletter", {
      subscriber_email: email,
    });

    if (error) {
      console.error("Newsletter unsubscription error:", error);
      return {
        success: false,
        message: "Failed to unsubscribe from newsletter. Please try again.",
      };
    }

    // Parse the result
    const unsubscriptionResult = result as {
      success: boolean;
      message: string;
      subscription_id?: string;
    };

    revalidatePath("/");

    return {
      success: unsubscriptionResult.success,
      message: unsubscriptionResult.message,
      subscriptionId: unsubscriptionResult.subscription_id,
      action: "unsubscribed",
    };
  } catch (error) {
    console.error("Newsletter unsubscription error:", error);
    return {
      success: false,
      message: "An unexpected error occurred. Please try again.",
    };
  }
}

export async function getNewsletterSubscription(email: string) {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("newsletter_subscriptions")
      .select("*")
      .eq("email", email)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 is "not found" error, which is expected for new subscribers
      console.error("Error fetching newsletter subscription:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error fetching newsletter subscription:", error);
    return null;
  }
}

// Helper function to send welcome email
async function sendNewsletterWelcomeEmail(email: string, firstName?: string) {
  try {
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);

    const greeting = firstName ? `Hi ${firstName},` : "Hi there,";

    await resend.emails.send({
      from: "DineEasy <noreply@dineeasy.ch>",
      to: email,
      subject: "Welcome to DineEasy Newsletter! 🍽️",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #22c55e; margin: 0;">🍽️ DineEasy</h1>
            <p style="color: #666; margin: 5px 0;">Welcome to our newsletter!</p>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #333; margin: 0 0 15px 0;">Thank you for subscribing!</h2>
            <p style="margin: 5px 0; color: #666; line-height: 1.6;">
              ${greeting}
            </p>
            <p style="margin: 5px 0; color: #666; line-height: 1.6;">
              Welcome to the DineEasy community! We're excited to keep you updated with the latest features, 
              restaurant management tips, and industry insights.
            </p>
          </div>
          
          <div style="background-color: white; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h3 style="color: #333; margin: 0 0 15px 0;">What to expect:</h3>
            <ul style="color: #666; line-height: 1.6; padding-left: 20px;">
              <li>Latest feature updates and improvements</li>
              <li>Restaurant management tips and best practices</li>
              <li>Industry insights and trends</li>
              <li>Customer success stories</li>
              <li>Exclusive offers and promotions</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #666; font-size: 14px; margin: 5px 0;">
              You can unsubscribe at any time by clicking the link below.
            </p>
            <p style="color: #666; font-size: 14px; margin: 5px 0;">
              Questions? Contact us at <a href="mailto:contact@dineeasy.com" style="color: #22c55e;">contact@dineeasy.com</a>
            </p>
          </div>
        </div>
      `,
    });

    console.log("Newsletter welcome email sent successfully to:", email);
  } catch (error) {
    console.error("Failed to send newsletter welcome email:", error);
    throw error;
  }
} 