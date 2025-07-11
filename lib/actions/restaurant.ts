"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Database } from "@/types/supabase";
import { stripe } from "@/lib/stripe";

type Restaurant = Database["public"]["Tables"]["restaurants"]["Insert"];
type Currency = Database["public"]["Enums"]["currency"];

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

    // Create Stripe customer first
    const customer = await stripe.customers.create({
      email: user.email,
      name: name,
    });

    // Handle file uploads if present
    let logo_url = null;
    let cover_url = null;

    const logo = formData.get("logo") as File;
    const coverPhoto = formData.get("coverPhoto") as File;

    if (logo?.size) {
      const logoPath = `restaurants/${user.id}/logo-${Date.now()}`;
      const { data: logoData, error: logoError } = await supabase.storage
        .from("restaurant-images")
        .upload(logoPath, logo);

      if (logoError) {
        console.error("Error uploading logo:", logoError);
      } else {
        const {
          data: { publicUrl },
        } = supabase.storage.from("restaurant-images").getPublicUrl(logoPath);
        logo_url = publicUrl;
      }
    }

    if (coverPhoto?.size) {
      const coverPath = `restaurants/${user.id}/cover-${Date.now()}`;
      const { data: coverData, error: coverError } = await supabase.storage
        .from("restaurant-images")
        .upload(coverPath, coverPhoto);

      if (coverError) {
        console.error("Error uploading cover photo:", coverError);
      } else {
        const {
          data: { publicUrl },
        } = supabase.storage.from("restaurant-images").getPublicUrl(coverPath);
        cover_url = publicUrl;
      }
    }

    const restaurant: Restaurant = {
      owner_id: user.id,
      name,
      slug: name.toLowerCase().replace(/\s+/g, "-"),
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
