"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Database } from "@/types/supabase";
import { stripe } from "@/lib/stripe";
import Stripe from "stripe";
import { revalidatePath } from "next/cache";
import { uploadImage, deleteImage } from "@/lib/actions/upload";
import { sendWelcomeToDineEasyEmail } from "@/lib/email";

type Restaurant = Database["public"]["Tables"]["restaurants"]["Insert"];
type Currency = Database["public"]["Enums"]["currency"];

// Legacy helper function for backward compatibility
async function uploadRestaurantImage(
  supabase: ReturnType<typeof createClient>,
  file: File,
  userId: string,
  type: "logo" | "cover",
  restaurantSlug: string
): Promise<string | null> {
  try {
    // Get restaurant ID for the current user
    const { data: restaurant } = await supabase
      .from("restaurants")
      .select("id")
      .eq("owner_id", userId)
      .single();

    if (!restaurant) {
      throw new Error("Restaurant not found");
    }

    // Use the direct upload function with restaurant ID
    return await uploadRestaurantImageDirect(
      supabase,
      file,
      restaurant.id,
      type,
      restaurantSlug
    );
  } catch (error) {
    console.error("Error in uploadRestaurantImage:", error);
    throw error;
  }
}

// Direct upload function for restaurant creation (bypasses getCurrentRestaurantId)
async function uploadRestaurantImageDirect(
  supabase: ReturnType<typeof createClient>,
  file: File,
  restaurantId: string,
  type: "logo" | "cover",
  restaurantSlug: string
): Promise<string | null> {
  try {
    // Validate file
    const validationError = validateImageFile(file, type);
    if (validationError) {
      throw new Error(validationError);
    }

    // Generate file path
    const timestamp = Date.now();
    const fileExtension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const cleanSlug = restaurantSlug.replace(/[^a-z0-9-]/g, "") || restaurantId;
    const imageType = type === "logo" ? "logo" : "cover";
    const filePath = `${restaurantId}/${imageType}-${cleanSlug}-${timestamp}.${fileExtension}`;

    console.log(`Uploading ${type} image directly:`, {
      filename: file.name,
      path: filePath,
      size: file.size,
      type: file.type,
      bucket: "restaurant-images",
    });

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("restaurant-images")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      console.error(`${type} upload error:`, uploadError);
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("restaurant-images")
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  } catch (error) {
    console.error(`Error uploading ${type}:`, error);
    throw error;
  }
}

// Helper function to validate image file
function validateImageFile(file: File, type: "logo" | "cover"): string | null {
  // Check if file exists
  if (!file) {
    return "No file provided";
  }

  // Check file size
  if (file.size === 0) {
    return "File is empty";
  }

  if (file.size < 10) {
    return "File appears to be corrupted or empty";
  }

  // Check file type
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return `Invalid file type. Allowed types: ${allowedTypes.join(", ")}`;
  }

  // Check file extension
  const fileExtension = file.name.split(".").pop()?.toLowerCase();
  if (
    !fileExtension ||
    !["jpg", "jpeg", "png", "webp"].includes(fileExtension)
  ) {
    return "Invalid file extension. Allowed: jpg, jpeg, png, webp";
  }

  // Check file size limit
  const maxSize = 5 * 1024 * 1024; // 5MB for both logo and cover
  if (file.size > maxSize) {
    return `File size too large. Maximum size: ${maxSize / 1024 / 1024}MB`;
  }

  return null; // No error
}

export async function createRestaurant(formData: FormData) {
  console.log("🏪 Starting createRestaurant function...");

  const supabase = createClient();

  console.log("🔐 Getting user authentication...");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    console.error("❌ User not authenticated");
    return { error: "Not authenticated" };
  }
  console.log("✅ User authenticated:", user.id);

  try {
    console.log("📋 Extracting form data...");
    // Validate required fields
    const name = formData.get("name") as string;
    const type = formData.get("type") as Restaurant["type"];
    const email = formData.get("email") as string;
    const currency = (formData.get("currency") as Currency) || "CHF";

    console.log("📝 Extracted data:", { name, type, email, currency });

    if (!name || !type || !email) {
      console.error("❌ Missing required fields:", { name, type, email });
      return { error: "Missing required fields" };
    }

    // Generate slug
    const slug = name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
    console.log("🏷️ Generated slug:", slug);

    console.log("💳 Creating Stripe customer...");
    // Create Stripe customer first
    const customer = await stripe.customers.create({
      email: user.email,
      name: name,
    });
    console.log("✅ Stripe customer created:", customer.id);

    // Validate images before creating restaurant
    const logo = formData.get("logo") as File;
    const coverPhoto = formData.get("coverPhoto") as File;

    console.log("🖼️ Image validation:", {
      logo: logo ? { name: logo.name, size: logo.size, type: logo.type } : null,
      coverPhoto: coverPhoto
        ? {
            name: coverPhoto.name,
            size: coverPhoto.size,
            type: coverPhoto.type,
          }
        : null,
    });

    if (logo?.size) {
      const logoError = validateImageFile(logo, "logo");
      if (logoError) {
        console.error("❌ Logo validation failed:", logoError);
        return { error: logoError };
      }
    }

    if (coverPhoto?.size) {
      const coverError = validateImageFile(coverPhoto, "cover");
      if (coverError) {
        console.error("❌ Cover photo validation failed:", coverError);
        return { error: coverError };
      }
    }

    console.log("🏗️ Creating restaurant object...");
    // Create restaurant FIRST without images
    const restaurant: Restaurant = {
      owner_id: user.id,
      name,
      slug,
      type,
      email,
      currency,
      tax_rate: parseFloat(formData.get("tax_rate") as string) || 7.7,
      description: (formData.get("description") as string) || null,
      cuisine: (formData.get("cuisine") as string) || null,
      phone: (formData.get("phone") as string) || null,
      website: (formData.get("website") as string) || null,
      address: (formData.get("address") as string) || null,
      city: (formData.get("city") as string) || null,
      postal_code: (formData.get("postal_code") as string) || null,
      country: (formData.get("country") as string) || null,
      seating_capacity:
        parseInt(formData.get("seating_capacity") as string) || null,
      accepts_reservations: formData.get("accepts_reservations") === "true",
      delivery_available: formData.get("delivery_available") === "true",
      takeout_available: formData.get("takeout_available") === "true",
      stripe_customer_id: customer.id,
      subscription_status: "incomplete",
      logo_url: null, // Will be updated after upload
      cover_url: null, // Will be updated after upload
    };

    console.log("📊 Restaurant object created:", {
      owner_id: restaurant.owner_id,
      name: restaurant.name,
      slug: restaurant.slug,
      type: restaurant.type,
      email: restaurant.email,
      stripe_customer_id: restaurant.stripe_customer_id,
    });

    console.log("💾 Inserting restaurant into database...");
    // Insert restaurant first
    const { data: createdRestaurant, error: insertError } = await supabase
      .from("restaurants")
      .insert(restaurant)
      .select()
      .single();

    if (insertError) {
      console.error("❌ Restaurant insertion failed:", insertError);
      console.error("🔍 Insert error details:", {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code,
      });
      return { error: insertError.message };
    }

    console.log("✅ Restaurant inserted successfully:", createdRestaurant.id);

    console.log("📤 Starting image upload process...");
    // Now upload images using the created restaurant
    let logo_url = null;
    let cover_url = null;
    let uploadedFiles: string[] = []; // Track uploaded files for cleanup

    try {
      // Upload logo if provided
      if (logo?.size) {
        console.log("🖼️ Uploading logo...");
        try {
          logo_url = await uploadRestaurantImageDirect(
            supabase,
            logo,
            createdRestaurant.id,
            "logo",
            slug
          );
          console.log("✅ Logo uploaded successfully:", logo_url);

          // Track the uploaded file path for cleanup
          const cleanSlug = slug.replace(/[^a-z0-9-]/g, "");
          const fileExtension =
            logo.name.split(".").pop()?.toLowerCase() || "jpg";
          const timestamp = Date.now();
          uploadedFiles.push(
            `${createdRestaurant.id}/logo-${cleanSlug}-${timestamp}.${fileExtension}`
          );
          console.log("📁 Logo file tracked for cleanup:", uploadedFiles[0]);
        } catch (uploadError: any) {
          console.error("❌ Logo upload failed:", uploadError);
          console.error("🔍 Logo upload error details:", {
            message: uploadError.message,
            stack: uploadError.stack,
            cause: uploadError.cause,
          });

          // Clean up created restaurant if logo upload fails
          try {
            console.log(
              "🧹 Cleaning up restaurant after logo upload failure..."
            );
            await supabase
              .from("restaurants")
              .delete()
              .eq("id", createdRestaurant.id);
            console.log("✅ Restaurant cleanup completed");
          } catch (cleanupError) {
            console.error(
              "❌ Failed to cleanup restaurant after logo upload failure:",
              cleanupError
            );
          }
          return { error: `Logo upload failed: ${uploadError.message}` };
        }
      } else {
        console.log("ℹ️ No logo to upload");
      }

      // Upload cover photo if provided
      if (coverPhoto?.size) {
        console.log("🖼️ Uploading cover photo...");
        try {
          cover_url = await uploadRestaurantImageDirect(
            supabase,
            coverPhoto,
            createdRestaurant.id,
            "cover",
            slug
          );
          console.log("✅ Cover photo uploaded successfully:", cover_url);

          // Track the uploaded file path for cleanup
          const cleanSlug = slug.replace(/[^a-z0-9-]/g, "");
          const fileExtension =
            coverPhoto.name.split(".").pop()?.toLowerCase() || "jpg";
          const timestamp = Date.now();
          uploadedFiles.push(
            `${createdRestaurant.id}/cover-${cleanSlug}-${timestamp}.${fileExtension}`
          );
          console.log(
            "📁 Cover photo file tracked for cleanup:",
            uploadedFiles[uploadedFiles.length - 1]
          );
        } catch (uploadError: any) {
          console.error("❌ Cover photo upload failed:", uploadError);
          console.error("🔍 Cover photo upload error details:", {
            message: uploadError.message,
            stack: uploadError.stack,
            cause: uploadError.cause,
          });

          // Clean up logo if cover upload fails
          if (logo_url && uploadedFiles.length > 0) {
            try {
              console.log("🧹 Cleaning up logo after cover upload failure...");
              await supabase.storage
                .from("restaurant-images")
                .remove([uploadedFiles[0]]);
              console.log("✅ Logo cleanup completed");
            } catch (cleanupError) {
              console.error(
                "❌ Failed to cleanup logo after cover upload failure:",
                cleanupError
              );
            }
          }
          // Clean up created restaurant
          try {
            console.log(
              "🧹 Cleaning up restaurant after cover upload failure..."
            );
            await supabase
              .from("restaurants")
              .delete()
              .eq("id", createdRestaurant.id);
            console.log("✅ Restaurant cleanup completed");
          } catch (cleanupError) {
            console.error(
              "❌ Failed to cleanup restaurant after cover upload failure:",
              cleanupError
            );
          }
          return { error: `Cover photo upload failed: ${uploadError.message}` };
        }
      } else {
        console.log("ℹ️ No cover photo to upload");
      }

      console.log("🔄 Updating restaurant with image URLs...");
      // Update restaurant with image URLs if any were uploaded
      if (logo_url || cover_url) {
        const updateData: Partial<Restaurant> = {};
        if (logo_url) updateData.logo_url = logo_url;
        if (cover_url) updateData.cover_url = cover_url;

        console.log("📝 Update data:", updateData);

        const { error: updateError } = await supabase
          .from("restaurants")
          .update(updateData)
          .eq("id", createdRestaurant.id);

        if (updateError) {
          console.error(
            "❌ Failed to update restaurant with image URLs:",
            updateError
          );
          console.error("🔍 Update error details:", {
            message: updateError.message,
            details: updateError.details,
            hint: updateError.hint,
            code: updateError.code,
          });
          // Don't fail the entire operation, just log the error
        } else {
          console.log("✅ Restaurant updated with image URLs successfully");
        }
      } else {
        console.log("ℹ️ No image URLs to update");
      }
    } catch (uploadError: any) {
      console.error("❌ Upload process failed:", uploadError);
      console.error("🔍 Upload error details:", {
        message: uploadError.message,
        stack: uploadError.stack,
        cause: uploadError.cause,
      });

      // Clean up created restaurant if any upload fails
      try {
        console.log("🧹 Cleaning up restaurant after upload failure...");
        await supabase
          .from("restaurants")
          .delete()
          .eq("id", createdRestaurant.id);
        console.log("✅ Restaurant cleanup completed");
      } catch (cleanupError) {
        console.error(
          "❌ Failed to cleanup restaurant after upload failure:",
          cleanupError
        );
      }
      return { error: uploadError.message || "Error uploading images" };
    }

    console.log("🎉 Restaurant creation completed successfully!");
    return { success: true };
  } catch (error) {
    console.error("💥 Critical error in createRestaurant:", error);
    console.error("🔍 Error details:", {
      name: (error as Error)?.name,
      message: (error as Error)?.message,
      stack: (error as Error)?.stack,
      cause: (error as Error)?.cause,
    });

    // Check if it's a database error
    if (error instanceof Error) {
      if (error.message.includes("restaurant_id")) {
        console.error("🚨 AMBIGUOUS COLUMN REFERENCE DETECTED!");
        return {
          error:
            "Database error: Ambiguous column reference. Please contact support.",
        };
      }
    }

    return { error: "Failed to create restaurant" };
  }
}

export async function getUserRestaurants() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  const { data: restaurants, error } = await supabase
    .from("restaurants")
    .select()
    .eq("owner_id", user.id);

  if (error) {
    return { error: error.message };
  }

  return { restaurants };
}

// Update the updateRestaurant function to handle image updates
export async function updateRestaurant(formData: FormData) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  // Get user's restaurant
  const { data: restaurant, error: restaurantError } = await supabase
    .from("restaurants")
    .select()
    .eq("owner_id", user.id)
    .single();

  if (restaurantError || !restaurant) {
    return { error: "Restaurant not found" };
  }

  try {
    let logo_url = restaurant.logo_url;
    let cover_url = restaurant.cover_url;

    // Handle image updates
    const logo = formData.get("logo") as File;
    const coverPhoto = formData.get("coverPhoto") as File;

    if (logo?.size) {
      // Delete old logo if exists
      if (logo_url) {
        try {
          // Extract the file path from the Supabase URL
          const urlParts = logo_url.split("/");
          const bucketIndex = urlParts.findIndex(
            (part: string) => part === "restaurant-images"
          );

          if (bucketIndex !== -1 && bucketIndex + 2 < urlParts.length) {
            // Get the path after the bucket name: [restaurantId]/[filename]
            const filePath = urlParts.slice(bucketIndex + 1).join("/");

            console.log("Attempting to delete old logo from path:", filePath);

            await supabase.storage.from("restaurant-images").remove([filePath]);
          } else {
            console.warn(
              `Could not extract file path from logo URL: ${logo_url}`
            );
          }
        } catch (error) {
          console.warn("Error deleting old logo:", error);
          // Continue with upload even if deletion fails
        }
      }
      logo_url = await uploadRestaurantImage(
        supabase,
        logo,
        user.id,
        "logo",
        restaurant.slug
      );
    }

    if (coverPhoto?.size) {
      // Delete old cover if exists
      if (cover_url) {
        try {
          // Extract the file path from the Supabase URL
          const urlParts = cover_url.split("/");
          const bucketIndex = urlParts.findIndex(
            (part: string) => part === "restaurant-images"
          );

          if (bucketIndex !== -1 && bucketIndex + 2 < urlParts.length) {
            // Get the path after the bucket name: [userId]/[filename]
            const filePath = urlParts.slice(bucketIndex + 1).join("/");

            console.log(
              "Attempting to delete old cover photo from path:",
              filePath
            );

            await supabase.storage.from("restaurant-images").remove([filePath]);
          } else {
            console.warn(
              `Could not extract file path from cover URL: ${cover_url}`
            );
          }
        } catch (error) {
          console.warn("Error deleting old cover photo:", error);
          // Continue with upload even if deletion fails
        }
      }
      cover_url = await uploadRestaurantImage(
        supabase,
        coverPhoto,
        user.id,
        "cover",
        restaurant.slug
      );
    }

    const updates = {
      description: (formData.get("description") as string) || null,
      cuisine: (formData.get("cuisine") as string) || null,
      phone: (formData.get("phone") as string) || null,
      website: (formData.get("website") as string) || null,
      address: (formData.get("address") as string) || null,
      city: (formData.get("city") as string) || null,
      postal_code: (formData.get("postal_code") as string) || null,
      seating_capacity:
        parseInt(formData.get("seating_capacity") as string) || null,
      accepts_reservations: formData.get("accepts_reservations") === "on",
      delivery_available: formData.get("delivery_available") === "on",
      takeout_available: formData.get("takeout_available") === "on",
      logo_url,
      cover_url,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("restaurants")
      .update(updates)
      .eq("id", restaurant.id);

    if (error) {
      return { error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error updating restaurant:", error);
    return { error: error.message || "Failed to update restaurant" };
  }
}

export async function getRestaurant(restaurantId: string) {
  const supabase = createClient();

  const { data: restaurant, error } = await supabase
    .from("restaurants")
    .select()
    .eq("id", restaurantId)
    .single();

  if (error) {
    return { error: error.message };
  }

  return { restaurant };
}

export async function getRestaurantBySlug(slug: string) {
  const supabase = createClient();

  const { data: restaurant, error } = await supabase
    .from("restaurants")
    .select()
    .eq("slug", slug)
    .single();

  if (error) {
    return { error: error.message };
  }

  return { restaurant };
}

export async function completeOnboarding(restaurantId: string) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  try {
    // Get the restaurant to verify ownership and current status
    const { data: restaurant, error: restaurantError } = await supabase
      .from("restaurants")
      .select("*")
      .eq("id", restaurantId)
      .eq("owner_id", user.id)
      .single();

    if (restaurantError || !restaurant) {
      return { error: "Restaurant not found or not authorized" };
    }

    console.log("Completing onboarding for restaurant:", {
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      stripeCustomerId: restaurant.stripe_customer_id,
      stripeAccountId: restaurant.stripe_account_id,
      subscriptionStatus: restaurant.subscription_status,
    });

    // Ensure Stripe customer exists and is properly linked
    let stripeCustomerId = restaurant.stripe_customer_id;
    if (!stripeCustomerId) {
      console.log("Creating Stripe customer for restaurant:", restaurant.id);
      const customer = await stripe.customers.create({
        email: user.email,
        name: restaurant.name,
        metadata: {
          restaurantId: restaurant.id,
          restaurantName: restaurant.name,
        },
      });
      stripeCustomerId = customer.id;

      // Update restaurant with new Stripe customer ID
      await supabase
        .from("restaurants")
        .update({
          stripe_customer_id: stripeCustomerId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", restaurantId);

      console.log("Created and linked Stripe customer:", stripeCustomerId);
    } else {
      // Verify the existing customer exists in Stripe
      try {
        const customer = (await stripe.customers.retrieve(
          stripeCustomerId
        )) as Stripe.Customer;
        console.log("Verified existing Stripe customer:", customer.id);

        // Update customer metadata if needed
        if (
          !customer.metadata.restaurantId ||
          customer.metadata.restaurantId !== restaurantId
        ) {
          await stripe.customers.update(stripeCustomerId, {
            metadata: {
              restaurantId: restaurant.id,
              restaurantName: restaurant.name,
            },
          });
          console.log("Updated Stripe customer metadata");
        }
      } catch (error: any) {
        if (error?.code === "resource_missing") {
          // Customer doesn't exist, create a new one
          console.log("Stripe customer not found, creating new one");
          const customer = await stripe.customers.create({
            email: user.email,
            name: restaurant.name,
            metadata: {
              restaurantId: restaurant.id,
              restaurantName: restaurant.name,
            },
          });
          stripeCustomerId = customer.id;

          await supabase
            .from("restaurants")
            .update({
              stripe_customer_id: stripeCustomerId,
              updated_at: new Date().toISOString(),
            })
            .eq("id", restaurantId);

          console.log("Created new Stripe customer:", stripeCustomerId);
        } else {
          throw error;
        }
      }
    }

    // If restaurant has Stripe Connect account, verify it's properly linked
    if (restaurant.stripe_account_id) {
      try {
        const account = await stripe.accounts.retrieve(
          restaurant.stripe_account_id
        );
        console.log("Verified Stripe Connect account:", account.id);

        // Update restaurant with current account status
        await supabase
          .from("restaurants")
          .update({
            stripe_account_enabled: account.charges_enabled,
            stripe_account_requirements: account.requirements,
            updated_at: new Date().toISOString(),
          })
          .eq("id", restaurantId);

        console.log("Updated Stripe Connect account status");
      } catch (error: any) {
        console.error("Error verifying Stripe Connect account:", error);
        // Don't fail onboarding if Stripe Connect verification fails
      }
    }

    // Mark onboarding as completed
    await supabase
      .from("restaurants")
      .update({
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", restaurantId);

    console.log(
      "Successfully completed onboarding for restaurant:",
      restaurantId
    );

    // Send welcome email after onboarding completion
    try {
      console.log("📧 Starting welcome email process...");
      console.log("👤 User email:", user.email);
      console.log("🏪 Restaurant name:", restaurant.name);
      console.log("📊 Restaurant data:", {
        subscription_status: restaurant.subscription_status,
        stripe_account_id: restaurant.stripe_account_id,
        stripe_account_enabled: restaurant.stripe_account_enabled,
      });

      // Validate user email
      if (!user.email) {
        console.error("❌ User email is missing, cannot send welcome email");
        throw new Error("User email is required for welcome email");
      }

      // Get plan features based on subscription status
      const getPlanFeatures = (planType: string) => {
        console.log("📋 Getting plan features for:", planType);
        switch (planType.toLowerCase()) {
          case "starter":
            return [
              "Up to 100 orders per month",
              "Basic menu management",
              "QR code ordering",
              "Email support",
            ];
          case "pro":
            return [
              "Up to 500 orders per month",
              "Advanced menu management",
              "QR code ordering",
              "Kitchen display system",
              "Analytics dashboard",
              "Priority support",
            ];
          case "elite":
            return [
              "Unlimited orders",
              "Advanced menu management",
              "QR code ordering",
              "Kitchen display system",
              "Advanced analytics",
              "Staff management",
              "Multi-location support",
              "Dedicated support",
            ];
          default:
            return [
              "Basic menu management",
              "QR code ordering",
              "Email support",
              "Order tracking",
            ];
        }
      };

      // Get next steps based on setup status
      const getNextSteps = (
        hasStripeConnect: boolean,
        stripeConnectEnabled: boolean
      ) => {
        console.log("🎯 Getting next steps:", {
          hasStripeConnect,
          stripeConnectEnabled,
        });
        const steps = [
          "Set up your menu items with descriptions and photos",
          "Configure your business hours and service types",
          "Test your QR code ordering system",
        ];

        if (!hasStripeConnect || !stripeConnectEnabled) {
          steps.push("Complete your Stripe Connect setup to accept payments");
        } else {
          steps.push("Start accepting orders and payments from customers");
        }

        steps.push("Review your analytics and optimize operations");

        return steps;
      };

      // Determine plan and trial information
      const plan =
        restaurant.subscription_status === "trialing"
          ? "starter"
          : restaurant.subscription_status === "active"
            ? "starter"
            : "starter";
      const interval = "monthly"; // Default, could be enhanced to get from subscription
      const trialEndDate =
        restaurant.subscription_status === "trialing"
          ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString()
          : undefined;

      console.log("📊 Email data prepared:", {
        plan,
        interval,
        trialEndDate,
        hasStripeConnect: !!restaurant.stripe_account_id,
        stripeConnectEnabled: restaurant.stripe_account_enabled || false,
      });

      // Get Stripe Connect details if available
      let stripeConnectData = {};
      if (restaurant.stripe_account_id && restaurant.stripe_account_enabled) {
        try {
          console.log("🔍 Fetching Stripe Connect account details...");
          const account = await stripe.accounts.retrieve(
            restaurant.stripe_account_id
          );

          stripeConnectData = {
            stripeAccountId: account.id,
            stripeCountry: restaurant.country || account.country,
            stripeBusinessType: account.business_type,
            stripeChargesEnabled: account.charges_enabled,
            stripePayoutsEnabled: account.payouts_enabled,
            stripeSetupDate: new Date().toLocaleDateString(),
          };

          console.log("✅ Stripe Connect data retrieved:", stripeConnectData);
        } catch (stripeError) {
          console.error(
            "❌ Error fetching Stripe Connect details:",
            stripeError
          );
          // Continue without Stripe Connect data if there's an error
        }
      }

      const emailData = {
        restaurantName: restaurant.name,
        customerName: user.user_metadata?.full_name || restaurant.name,
        plan: plan,
        interval: interval,
        trialEndDate: trialEndDate,
        hasStripeConnect: !!restaurant.stripe_account_id,
        stripeConnectEnabled: restaurant.stripe_account_enabled || false,
        features: getPlanFeatures(plan),
        nextSteps: getNextSteps(
          !!restaurant.stripe_account_id,
          restaurant.stripe_account_enabled || false
        ),
        ...stripeConnectData,
      };

      console.log(
        "📧 Calling sendWelcomeToDineEasyEmail with data:",
        emailData
      );

      const emailResult = await sendWelcomeToDineEasyEmail(
        user.email!,
        emailData
      );

      console.log("✅ Welcome email sent successfully to:", user.email);
      console.log("📧 Email result:", emailResult);
    } catch (emailError) {
      console.error("❌ Error sending welcome email:", emailError);
      console.error("🔍 Error details:", {
        name: (emailError as Error)?.name,
        message: (emailError as Error)?.message,
        stack: (emailError as Error)?.stack,
        cause: (emailError as Error)?.cause,
      });

      // Log additional debugging info
      console.error("🔍 Onboarding completion context:", {
        restaurantId,
        restaurantName: restaurant.name,
        userEmail: user.email,
        hasStripeConnect: !!restaurant.stripe_account_id,
        stripeConnectEnabled: restaurant.stripe_account_enabled,
      });

      // Don't fail onboarding if email fails, but log it for debugging
      console.warn(
        "⚠️ Onboarding completed but welcome email failed - this should be investigated"
      );
    }

    return {
      success: true,
      stripeCustomerId,
      stripeAccountId: restaurant.stripe_account_id,
      subscriptionStatus: restaurant.subscription_status,
    };
  } catch (error) {
    console.error("Error completing onboarding:", error);
    return { error: "Failed to complete onboarding" };
  }
}

export async function updateRestaurantImages(formData: FormData) {
  const supabase = createClient();

  try {
    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { error: "Not authenticated" };
    }

    // Get current restaurant data to find existing images
    const { data: restaurant, error: restaurantError } = await supabase
      .from("restaurants")
      .select("id, logo_url, cover_url, slug")
      .eq("owner_id", user.id)
      .single();

    if (restaurantError) {
      return { error: "Failed to fetch restaurant data" };
    }

    const logoFile = formData.get("logo") as File | null;
    const coverFile = formData.get("cover") as File | null;

    let logoUrl = null;
    let coverUrl = null;
    const filesToDelete: string[] = [];

    // Handle logo upload if provided
    if (logoFile && logoFile.size > 0) {
      // Validate file size (5MB limit)
      if (logoFile.size > 5 * 1024 * 1024) {
        return { error: "Logo file size must be less than 5MB" };
      }

      // Validate file type
      const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
      if (!allowedTypes.includes(logoFile.type)) {
        return { error: "Logo must be a JPEG, PNG, or WebP image" };
      }

      // Delete old logo if it exists
      if (restaurant.logo_url) {
        try {
          // Extract the file path from the Supabase URL
          const urlParts = restaurant.logo_url.split("/");
          const bucketIndex = urlParts.findIndex(
            (part: string) => part === "restaurant-images"
          );

          if (bucketIndex !== -1 && bucketIndex + 2 < urlParts.length) {
            // Get the path after the bucket name: [restaurantId]/[filename]
            const filePath = urlParts.slice(bucketIndex + 1).join("/");

            console.log("Attempting to delete old logo from path:", filePath);

            const { error: deleteError } = await supabase.storage
              .from("restaurant-images")
              .remove([filePath]);

            if (deleteError) {
              console.warn("Failed to delete old logo:", deleteError);
              // Continue with upload even if deletion fails
            } else {
              console.log("Successfully deleted old logo from storage");
            }
          } else {
            console.warn(
              `Could not extract file path from logo URL: ${restaurant.logo_url}`
            );
          }
        } catch (error) {
          console.warn("Error deleting old logo:", error);
          // Continue with upload even if deletion fails
        }
      }

      // Generate unique filename using restaurant ID (consistent with setup page)
      const timestamp = Date.now();
      const cleanSlug =
        restaurant.slug?.replace(/[^a-z0-9-]/g, "") || restaurant.id;
      const fileExtension =
        logoFile.name.split(".").pop()?.toLowerCase() || "jpg";
      const filename = `logo-${cleanSlug}-${timestamp}.${fileExtension}`;
      const filePath = `${restaurant.id}/${filename}`;

      console.log("Uploading logo with path:", filePath);

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("restaurant-images")
        .upload(filePath, logoFile, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) {
        console.error("Logo upload error:", uploadError);
        return { error: "Failed to upload logo" };
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("restaurant-images")
        .getPublicUrl(filePath);

      logoUrl = urlData.publicUrl;
    }

    // Handle cover photo upload if provided
    if (coverFile && coverFile.size > 0) {
      // Validate file size (5MB limit)
      if (coverFile.size > 5 * 1024 * 1024) {
        return { error: "Cover photo file size must be less than 5MB" };
      }

      // Validate file type
      const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
      if (!allowedTypes.includes(coverFile.type)) {
        return { error: "Cover photo must be a JPEG, PNG, or WebP image" };
      }

      // Delete old cover if it exists
      if (restaurant.cover_url) {
        try {
          // Extract the file path from the Supabase URL
          const urlParts = restaurant.cover_url.split("/");
          const bucketIndex = urlParts.findIndex(
            (part: string) => part === "restaurant-images"
          );

          if (bucketIndex !== -1 && bucketIndex + 2 < urlParts.length) {
            // Get the path after the bucket name: [restaurantId]/[filename]
            const filePath = urlParts.slice(bucketIndex + 1).join("/");

            console.log(
              "Attempting to delete old cover photo from path:",
              filePath
            );

            const { error: deleteError } = await supabase.storage
              .from("restaurant-images")
              .remove([filePath]);

            if (deleteError) {
              console.warn("Failed to delete old cover photo:", deleteError);
              // Continue with upload even if deletion fails
            } else {
              console.log("Successfully deleted old cover photo from storage");
            }
          } else {
            console.warn(
              `Could not extract file path from cover URL: ${restaurant.cover_url}`
            );
          }
        } catch (error) {
          console.warn("Error deleting old cover photo:", error);
          // Continue with upload even if deletion fails
        }
      }

      // Generate unique filename using restaurant ID (consistent with setup page)
      const timestamp = Date.now();
      const cleanSlug =
        restaurant.slug?.replace(/[^a-z0-9-]/g, "") || restaurant.id;
      const fileExtension =
        coverFile.name.split(".").pop()?.toLowerCase() || "jpg";
      const filename = `cover-${cleanSlug}-${timestamp}.${fileExtension}`;
      const filePath = `${restaurant.id}/${filename}`;

      console.log("Uploading cover with path:", filePath);

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("restaurant-images")
        .upload(filePath, coverFile, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) {
        console.error("Cover photo upload error:", uploadError);
        return { error: "Failed to upload cover photo" };
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("restaurant-images")
        .getPublicUrl(filePath);

      coverUrl = urlData.publicUrl;
    }

    // Update restaurant data
    const updateData: any = {};
    if (logoUrl) updateData.logo_url = logoUrl;
    if (coverUrl) updateData.cover_url = coverUrl;

    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await supabase
        .from("restaurants")
        .update(updateData)
        .eq("owner_id", user.id);

      if (updateError) {
        console.error("Restaurant update error:", updateError);
        return { error: "Failed to update restaurant" };
      }
    }

    // Revalidate relevant pages
    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard");

    return {
      success: true,
      logoUrl,
      coverUrl,
    };
  } catch (error) {
    console.error("Restaurant image update error:", error);
    return { error: "An unexpected error occurred" };
  }
}

export async function removeRestaurantImage(imageType: "logo" | "cover") {
  const supabase = createClient();

  try {
    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { error: "Not authenticated" };
    }

    // Get current restaurant data
    const { data: restaurant, error: restaurantError } = await supabase
      .from("restaurants")
      .select("logo_url, cover_url")
      .eq("owner_id", user.id)
      .single();

    if (restaurantError) {
      return { error: "Failed to fetch restaurant data" };
    }

    const imageUrl =
      imageType === "logo" ? restaurant.logo_url : restaurant.cover_url;

    // Delete image from storage if it exists
    if (imageUrl) {
      const uploadType =
        imageType === "logo" ? "restaurant-logo" : "restaurant-cover";
      const deleteResult = await deleteImage(imageUrl, uploadType);
      if (deleteResult.error) {
        console.warn(`Failed to delete ${imageType}:`, deleteResult.error);
        // Continue with database update even if storage deletion fails
      }
    }

    // Update restaurant data to remove the image URL
    const updateData =
      imageType === "logo" ? { logo_url: null } : { cover_url: null };

    const { error: updateError } = await supabase
      .from("restaurants")
      .update(updateData)
      .eq("owner_id", user.id);

    if (updateError) {
      console.error("Restaurant update error:", updateError);
      return { error: "Failed to update restaurant" };
    }

    // Revalidate relevant pages
    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Restaurant image removal error:", error);
    return { error: "An unexpected error occurred" };
  }
}

// Function to check and send welcome email for users who completed onboarding
export async function checkAndSendWelcomeEmail(restaurantId: string) {
  const supabase = createClient();

  try {
    console.log(
      "🔍 Checking if welcome email needs to be sent for restaurant:",
      restaurantId
    );

    // Get the restaurant data
    const { data: restaurant, error: restaurantError } = await supabase
      .from("restaurants")
      .select("*")
      .eq("id", restaurantId)
      .single();

    if (restaurantError || !restaurant) {
      console.error("❌ Restaurant not found:", restaurantId);
      return { error: "Restaurant not found" };
    }

    // Get the user data
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.error("❌ User not authenticated");
      return { error: "User not authenticated" };
    }

    // Check if onboarding is complete but welcome email might not have been sent
    if (restaurant.onboarding_completed && user.email) {
      console.log(
        "📧 Onboarding is complete, checking if welcome email was sent..."
      );

      // Check if we have a record of the welcome email being sent
      // For now, we'll send it again if onboarding is complete
      // In a production system, you might want to track this in a separate table

      try {
        console.log("📧 Sending welcome email for completed onboarding...");

        // Get plan features based on subscription status
        const getPlanFeatures = (planType: string) => {
          switch (planType.toLowerCase()) {
            case "starter":
              return [
                "Up to 100 orders per month",
                "Basic menu management",
                "QR code ordering",
                "Email support",
              ];
            case "pro":
              return [
                "Up to 500 orders per month",
                "Advanced menu management",
                "QR code ordering",
                "Kitchen display system",
                "Analytics dashboard",
                "Priority support",
              ];
            case "elite":
              return [
                "Unlimited orders",
                "Advanced menu management",
                "QR code ordering",
                "Kitchen display system",
                "Advanced analytics",
                "Staff management",
                "Multi-location support",
                "Dedicated support",
              ];
            default:
              return [
                "Basic menu management",
                "QR code ordering",
                "Email support",
                "Order tracking",
              ];
          }
        };

        // Get next steps based on setup status
        const getNextSteps = (
          hasStripeConnect: boolean,
          stripeConnectEnabled: boolean
        ) => {
          const steps = [
            "Set up your menu items with descriptions and photos",
            "Configure your business hours and service types",
            "Test your QR code ordering system",
          ];

          if (!hasStripeConnect || !stripeConnectEnabled) {
            steps.push("Complete your Stripe Connect setup to accept payments");
          } else {
            steps.push("Start accepting orders and payments from customers");
          }

          steps.push("Review your analytics and optimize operations");

          return steps;
        };

        // Determine plan and trial information
        const plan =
          restaurant.subscription_status === "trialing"
            ? "starter"
            : restaurant.subscription_status === "active"
              ? "starter"
              : "starter";
        const interval = "monthly";
        const trialEndDate =
          restaurant.subscription_status === "trialing"
            ? new Date(
                Date.now() + 14 * 24 * 60 * 60 * 1000
              ).toLocaleDateString()
            : undefined;

        // Get Stripe Connect details if available
        let stripeConnectData = {};
        if (restaurant.stripe_account_id && restaurant.stripe_account_enabled) {
          try {
            const account = await stripe.accounts.retrieve(
              restaurant.stripe_account_id
            );

            stripeConnectData = {
              stripeAccountId: account.id,
              stripeCountry: restaurant.country || account.country,
              stripeBusinessType: account.business_type,
              stripeChargesEnabled: account.charges_enabled,
              stripePayoutsEnabled: account.payouts_enabled,
              stripeSetupDate: new Date().toLocaleDateString(),
            };
          } catch (stripeError) {
            console.error(
              "Error fetching Stripe Connect details:",
              stripeError
            );
          }
        }

        const emailData = {
          restaurantName: restaurant.name,
          customerName: user.user_metadata?.full_name || restaurant.name,
          plan: plan,
          interval: interval,
          trialEndDate: trialEndDate,
          hasStripeConnect: !!restaurant.stripe_account_id,
          stripeConnectEnabled: restaurant.stripe_account_enabled || false,
          features: getPlanFeatures(plan),
          nextSteps: getNextSteps(
            !!restaurant.stripe_account_id,
            restaurant.stripe_account_enabled || false
          ),
          ...stripeConnectData,
        };

        const emailResult = await sendWelcomeToDineEasyEmail(
          user.email,
          emailData
        );

        console.log(
          "✅ Welcome email sent for completed onboarding:",
          emailResult
        );
        return { success: true, emailSent: true };
      } catch (emailError) {
        console.error(
          "❌ Error sending welcome email for completed onboarding:",
          emailError
        );
        return { error: "Failed to send welcome email", details: emailError };
      }
    } else {
      console.log(
        "ℹ️ Onboarding not complete or user email missing, skipping welcome email"
      );
      return {
        success: true,
        emailSent: false,
        reason: "Onboarding not complete or email missing",
      };
    }
  } catch (error) {
    console.error("❌ Error checking and sending welcome email:", error);
    return { error: "Failed to check and send welcome email" };
  }
}
