"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Database } from "@/types/supabase";
import { stripe } from "@/lib/stripe";
import Stripe from "stripe";
import { revalidatePath } from "next/cache";

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
    // Validate file exists and has content
    if (!file || file.size === 0) {
      throw new Error("File is empty or corrupted");
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      throw new Error(
        `Invalid file type. Allowed types: ${allowedTypes.join(", ")}`
      );
    }

    // Validate file size
    const maxSize = 5 * 1024 * 1024; // 5MB for both logo and cover
    if (file.size > maxSize) {
      throw new Error(
        `File size too large. Maximum size: ${maxSize / 1024 / 1024}MB`
      );
    }

    // Validate file extension
    const fileExtension = file.name.split(".").pop()?.toLowerCase();
    if (
      !fileExtension ||
      !["jpg", "jpeg", "png", "webp"].includes(fileExtension)
    ) {
      throw new Error("Invalid file extension. Allowed: jpg, jpeg, png, webp");
    }

    // Generate a clean filename with proper extension
    const timestamp = Date.now();
    const cleanSlug = restaurantSlug.replace(/[^a-z0-9-]/g, "");
    const filename = `${type}-${cleanSlug}-${timestamp}.${fileExtension}`;
    const path = `${userId}/${filename}`;

    console.log(`Uploading ${type} image:`, {
      filename,
      path,
      size: file.size,
      type: file.type,
      userId,
    });

    // Check if bucket exists (this will throw an error if bucket doesn't exist)
    const { data: bucketData, error: bucketError } = await supabase.storage
      .from("restaurant-images")
      .list("", { limit: 1 });

    if (bucketError) {
      console.error("Bucket check error:", bucketError);
      if (
        bucketError.message.includes("bucket") ||
        bucketError.message.includes("not found")
      ) {
        throw new Error(
          "Storage bucket not configured. Please contact support."
        );
      }
      throw new Error(`Storage error: ${bucketError.message}`);
    }

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
      if (
        error.message.includes("network") ||
        error.message.includes("timeout")
      ) {
        throw new Error(
          "Network error. Please check your connection and try again."
        );
      }
      if (error.message.includes("size") || error.message.includes("limit")) {
        throw new Error("File size exceeds the allowed limit.");
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
    let uploadedFiles: string[] = []; // Track uploaded files for cleanup

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
          // Track the uploaded file path for cleanup
          const cleanSlug = slug.replace(/[^a-z0-9-]/g, "");
          const fileExtension =
            logo.name.split(".").pop()?.toLowerCase() || "jpg";
          const timestamp = Date.now();
          uploadedFiles.push(
            `${user.id}/logo-${cleanSlug}-${timestamp}.${fileExtension}`
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
          // Track the uploaded file path for cleanup
          const cleanSlug = slug.replace(/[^a-z0-9-]/g, "");
          const fileExtension =
            coverPhoto.name.split(".").pop()?.toLowerCase() || "jpg";
          const timestamp = Date.now();
          uploadedFiles.push(
            `${user.id}/cover-${cleanSlug}-${timestamp}.${fileExtension}`
          );
        } catch (uploadError: any) {
          // Clean up logo if cover upload fails
          if (logo_url && uploadedFiles.length > 0) {
            try {
              await supabase.storage
                .from("restaurant-images")
                .remove([uploadedFiles[0]]);
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
      if (uploadedFiles.length > 0) {
        try {
          await supabase.storage
            .from("restaurant-images")
            .remove(uploadedFiles);
          console.log(
            "Cleaned up uploaded images after restaurant creation failure"
          );
        } catch (cleanupError) {
          console.error("Failed to cleanup uploaded images:", cleanupError);
        }
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
        try {
          // Extract the file path from the Supabase URL
          const urlParts = logo_url.split("/");
          const bucketIndex = urlParts.findIndex(
            (part: string) => part === "restaurant-images"
          );

          if (bucketIndex !== -1 && bucketIndex + 2 < urlParts.length) {
            // Get the path after the bucket name: [userId]/[filename]
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
      .select("logo_url, cover_url, slug")
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
            // Get the path after the bucket name: [userId]/[filename]
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

      // Generate unique filename using the same pattern as uploadRestaurantImage
      const timestamp = Date.now();
      const cleanSlug = restaurant.slug?.replace(/[^a-z0-9-]/g, "") || user.id;
      const fileExtension =
        logoFile.name.split(".").pop()?.toLowerCase() || "jpg";
      const filename = `logo-${cleanSlug}-${timestamp}.${fileExtension}`;
      const filePath = `${user.id}/${filename}`;

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
            // Get the path after the bucket name: [userId]/[filename]
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

      // Generate unique filename using the same pattern as uploadRestaurantImage
      const timestamp = Date.now();
      const cleanSlug = restaurant.slug?.replace(/[^a-z0-9-]/g, "") || user.id;
      const fileExtension =
        coverFile.name.split(".").pop()?.toLowerCase() || "jpg";
      const filename = `cover-${cleanSlug}-${timestamp}.${fileExtension}`;
      const filePath = `${user.id}/${filename}`;

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
      try {
        // Extract the file path from the Supabase URL
        // URL format: https://[project].supabase.co/storage/v1/object/public/restaurant-images/[userId]/[filename]
        const urlParts = imageUrl.split("/");
        const bucketIndex = urlParts.findIndex(
          (part: string) => part === "restaurant-images"
        );

        if (bucketIndex !== -1 && bucketIndex + 2 < urlParts.length) {
          // Get the path after the bucket name: [userId]/[filename]
          const filePath = urlParts.slice(bucketIndex + 1).join("/");

          console.log(`Attempting to delete ${imageType} from path:`, filePath);

          const { error: deleteError } = await supabase.storage
            .from("restaurant-images")
            .remove([filePath]);

          if (deleteError) {
            console.warn(`Failed to delete ${imageType}:`, deleteError);
            // Continue with database update even if storage deletion fails
          } else {
            console.log(`Successfully deleted ${imageType} from storage`);
          }
        } else {
          console.warn(`Could not extract file path from URL: ${imageUrl}`);
        }
      } catch (error) {
        console.warn(`Error deleting ${imageType}:`, error);
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
