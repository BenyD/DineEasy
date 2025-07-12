"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Database } from "@/types/supabase";
import { stripe } from "@/lib/stripe";
import Stripe from "stripe";

type Restaurant = Database["public"]["Tables"]["restaurants"]["Insert"];
type Currency = Database["public"]["Enums"]["currency"];

// Add these helper functions at the top of the file
async function uploadRestaurantImage(
  supabase: ReturnType<typeof createClient>,
  file: File,
  userId: string,
  type: "logo" | "cover",
  restaurantSlug: string
): Promise<string | null> {
  try {
    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      throw new Error(
        `Invalid file type. Allowed types: ${allowedTypes.join(", ")}`
      );
    }

    // Validate file size
    const maxSize = type === "logo" ? 2 * 1024 * 1024 : 5 * 1024 * 1024; // 2MB for logo, 5MB for cover
    if (file.size > maxSize) {
      throw new Error(
        `File size too large. Maximum size: ${maxSize / 1024 / 1024}MB`
      );
    }

    // Generate a clean filename with proper extension
    const timestamp = Date.now();
    const cleanSlug = restaurantSlug.replace(/[^a-z0-9-]/g, "");
    const fileExtension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const filename = `${type}-${cleanSlug}-${timestamp}.${fileExtension}`;
    const path = `${userId}/${filename}`;

    console.log(`Uploading ${type} image:`, {
      filename,
      path,
      size: file.size,
      type: file.type,
      userId,
    });

    // Upload file to Supabase storage
    const { data, error } = await supabase.storage
      .from("restaurant-images")
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (error) {
      console.error(`Error uploading ${type}:`, error);

      // Handle specific storage errors
      if (error.message.includes("bucket")) {
        throw new Error(
          "Storage bucket not configured. Please contact support."
        );
      }
      if (error.message.includes("permission")) {
        throw new Error("Permission denied. Please try again.");
      }
      if (error.message.includes("duplicate")) {
        throw new Error(
          "File already exists. Please choose a different image."
        );
      }

      throw new Error(`Failed to upload ${type}: ${error.message}`);
    }

    if (!data?.path) {
      throw new Error(`No path returned for ${type} upload`);
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("restaurant-images").getPublicUrl(data.path);

    if (!publicUrl) {
      throw new Error(`Failed to get public URL for ${type}`);
    }

    console.log(`Successfully uploaded ${type}:`, {
      path: data.path,
      publicUrl,
    });

    return publicUrl;
  } catch (error) {
    console.error(`Error in uploadRestaurantImage for ${type}:`, error);
    throw error;
  }
}

// Helper function to validate image file
function validateImageFile(file: File, type: "logo" | "cover"): string | null {
  // Check file type
  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return `Invalid file type. Allowed types: ${allowedTypes.join(", ")}`;
  }

  // Check file size
  const maxSize = type === "logo" ? 2 * 1024 * 1024 : 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return `File size too large. Maximum size: ${maxSize / 1024 / 1024}MB`;
  }

  // Check if file is actually an image by reading first few bytes
  if (file.size < 10) {
    return "File appears to be corrupted or empty";
  }

  return null; // No error
}

export async function createRestaurant(formData: FormData) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  try {
    // Validate required fields
    const name = formData.get("name") as string;
    const type = formData.get("type") as Restaurant["type"];
    const email = formData.get("email") as string;
    const currency = (formData.get("currency") as Currency) || "CHF";

    if (!name || !type || !email) {
      return { error: "Missing required fields" };
    }

    // Generate slug
    const slug = name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

    // Create Stripe customer first
    const customer = await stripe.customers.create({
      email: user.email,
      name: name,
    });

    // Handle file uploads if present
    let logo_url = null;
    let cover_url = null;

    try {
      const logo = formData.get("logo") as File;
      const coverPhoto = formData.get("coverPhoto") as File;

      // Validate images before upload
      if (logo?.size) {
        const logoError = validateImageFile(logo, "logo");
        if (logoError) {
          return { error: logoError };
        }
      }

      if (coverPhoto?.size) {
        const coverError = validateImageFile(coverPhoto, "cover");
        if (coverError) {
          return { error: coverError };
        }
      }

      // Upload images
      if (logo?.size) {
        try {
          logo_url = await uploadRestaurantImage(
            supabase,
            logo,
            user.id,
            "logo",
            slug
          );
        } catch (uploadError: any) {
          return { error: `Logo upload failed: ${uploadError.message}` };
        }
      }

      if (coverPhoto?.size) {
        try {
          cover_url = await uploadRestaurantImage(
            supabase,
            coverPhoto,
            user.id,
            "cover",
            slug
          );
        } catch (uploadError: any) {
          // Clean up logo if cover upload fails
          if (logo_url) {
            try {
              await supabase.storage
                .from("restaurant-images")
                .remove([`${user.id}/logo-${slug}-${Date.now()}.jpg`]);
            } catch (cleanupError) {
              console.error(
                "Failed to cleanup logo after cover upload failure:",
                cleanupError
              );
            }
          }
          return { error: `Cover photo upload failed: ${uploadError.message}` };
        }
      }
    } catch (uploadError: any) {
      return { error: uploadError.message || "Error uploading images" };
    }

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
      logo_url,
      cover_url,
    };

    const { error } = await supabase
      .from("restaurants")
      .insert(restaurant)
      .select()
      .single();

    if (error) {
      // Clean up uploaded images if restaurant creation fails
      if (logo_url) {
        await supabase.storage
          .from("restaurant-images")
          .remove([`${user.id}/logo-${slug}-${Date.now()}`]);
      }
      if (cover_url) {
        await supabase.storage
          .from("restaurant-images")
          .remove([`${user.id}/cover-${slug}-${Date.now()}`]);
      }
      return { error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Error creating restaurant:", error);
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
        const oldPath = logo_url.split("/").pop();
        if (oldPath) {
          await supabase.storage
            .from("restaurant-images")
            .remove([`${user.id}/${oldPath}`]);
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
        const oldPath = cover_url.split("/").pop();
        if (oldPath) {
          await supabase.storage
            .from("restaurant-images")
            .remove([`${user.id}/${oldPath}`]);
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
