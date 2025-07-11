"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Database } from "@/types/supabase";
import { stripe } from "@/lib/stripe";

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

  // Generate a clean filename
  const timestamp = Date.now();
  const cleanSlug = restaurantSlug.replace(/[^a-z0-9-]/g, "");
  const filename = `${type}-${cleanSlug}-${timestamp}`;
  const path = `${userId}/${filename}`;

  // Upload file
  const { data, error } = await supabase.storage
    .from("restaurant-images")
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    console.error(`Error uploading ${type}:`, error);
    throw error;
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from("restaurant-images").getPublicUrl(path);

  return publicUrl;
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

      if (logo?.size) {
        logo_url = await uploadRestaurantImage(
          supabase,
          logo,
          user.id,
          "logo",
          slug
        );
      }

      if (coverPhoto?.size) {
        cover_url = await uploadRestaurantImage(
          supabase,
          coverPhoto,
          user.id,
          "cover",
          slug
        );
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
