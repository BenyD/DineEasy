import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { randomBytes } from "crypto";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function generateQRCode(
  tableId: string,
  restaurantSlug: string
): string {
  return `${process.env.NEXT_PUBLIC_APP_URL}/qr/${restaurantSlug}/${tableId}`;
}

export function roundToFixed(value: number, decimals: number = 3): string {
  return Number(
    Math.round(Number(value + "e" + decimals)) + "e-" + decimals
  ).toFixed(decimals);
}

export function calculateCircularPosition(
  index: number,
  total: number,
  radius: number = 40
): { top: string; left: string } {
  const angle = ((index + 1) * 2 * Math.PI) / total;
  const top = 50 + Math.cos(angle) * radius;
  const left = 50 + Math.sin(angle) * radius;

  return {
    top: `${roundToFixed(top)}%`,
    left: `${roundToFixed(left)}%`,
  };
}

export function bytesToSize(bytes: number): string {
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  if (bytes === 0) return "0 Byte";
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${Math.round(bytes / Math.pow(1024, i))} ${sizes[i]}`;
}

export function generateEmailVerificationToken(): string {
  // Generate a random 32-byte token and convert it to a hex string
  return randomBytes(32).toString("hex");
}
