"use server";

import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/server";
import { generateQRCode as generateQRUrl } from "@/lib/utils";

// Generate QR code image and store it
export async function generateQRCodeImage(
  tableId: string,
  tableNumber: string,
  restaurantId: string
) {
  const supabase = createClient();

  try {
    // Generate the QR code URL
    const qrUrl = generateQRUrl(tableNumber, restaurantId);

    // Generate QR code as data URL
    const qrDataUrl = await QRCode.toDataURL(qrUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
      errorCorrectionLevel: "M",
    });

    // Convert data URL to buffer
    const base64Data = qrDataUrl.split(",")[1];
    const buffer = Buffer.from(base64Data, "base64");

    // Generate filename
    const filename = `qr-table-${tableNumber}-${Date.now()}.png`;
    const filePath = `${restaurantId}/qr-codes/${filename}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("restaurant-images")
      .upload(filePath, buffer, {
        contentType: "image/png",
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      console.error("Error uploading QR code:", uploadError);
      throw uploadError;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("restaurant-images")
      .getPublicUrl(filePath);

    return { success: true, url: urlData.publicUrl, dataUrl: qrDataUrl };
  } catch (error: any) {
    console.error("Error generating QR code image:", error);
    return { error: error.message || "Failed to generate QR code image" };
  }
}

// Download QR code as PNG
export async function downloadQRCode(
  tableId: string,
  tableNumber: string,
  restaurantId: string
) {
  try {
    // Generate the QR code URL
    const qrUrl = generateQRUrl(tableNumber, restaurantId);

    // Generate QR code as buffer
    const qrBuffer = await QRCode.toBuffer(qrUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
      errorCorrectionLevel: "M",
    });

    return {
      success: true,
      buffer: qrBuffer,
      filename: `qr-table-${tableNumber}.png`,
    };
  } catch (error: any) {
    console.error("Error generating QR code for download:", error);
    return {
      error: error.message || "Failed to generate QR code for download",
    };
  }
}

// Generate QR code with custom styling
export async function generateCustomQRCode(
  tableId: string,
  tableNumber: string,
  restaurantId: string,
  options?: {
    width?: number;
    color?: string;
    backgroundColor?: string;
    logo?: string;
  }
) {
  try {
    // Generate the QR code URL
    const qrUrl = generateQRUrl(tableNumber, restaurantId);

    // Default options
    const defaultOptions = {
      width: 300,
      margin: 2,
      color: {
        dark: options?.color || "#000000",
        light: options?.backgroundColor || "#FFFFFF",
      },
      errorCorrectionLevel: "M",
    };

    // Generate QR code as data URL
    const qrDataUrl = await QRCode.toDataURL(qrUrl, defaultOptions);

    return { success: true, dataUrl: qrDataUrl, url: qrUrl };
  } catch (error: any) {
    console.error("Error generating custom QR code:", error);
    return { error: error.message || "Failed to generate custom QR code" };
  }
}

// Generate QR code for restaurant
export async function generateRestaurantQRCode(
  restaurantId: string,
  restaurantSlug: string
) {
  try {
    // Generate restaurant URL
    const restaurantUrl = `${process.env.NEXT_PUBLIC_APP_URL}/qr/${restaurantSlug}`;

    // Generate QR code as data URL
    const qrDataUrl = await QRCode.toDataURL(restaurantUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
      errorCorrectionLevel: "M",
    });

    return { success: true, dataUrl: qrDataUrl, url: restaurantUrl };
  } catch (error: any) {
    console.error("Error generating restaurant QR code:", error);
    return { error: error.message || "Failed to generate restaurant QR code" };
  }
}
