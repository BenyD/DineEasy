import type { Metadata } from "next";
import { viewport } from "../../metadata";

export { viewport };

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Simple, transparent pricing for restaurants of all sizes. Choose from Starter, Pro, or Elite plans. Start your 14-day free trial today.",
  openGraph: {
    title: "DineEasy Pricing - Simple, Transparent Plans",
    description:
      "Simple, transparent pricing for restaurants of all sizes. Choose from Starter, Pro, or Elite plans. Start your 14-day free trial today.",
    images: [
      {
        url: `/api/og?title=${encodeURIComponent("Simple, Transparent Pricing")}&description=${encodeURIComponent("Starter, Pro, and Elite plans for restaurants of all sizes")}&type=pricing`,
        width: 1200,
        height: 630,
        alt: "DineEasy Pricing Plans",
        type: "image/jpeg",
      },
    ],
  },
  twitter: {
    title: "DineEasy Pricing - Simple, Transparent Plans",
    description:
      "Simple, transparent pricing for restaurants of all sizes. Choose from Starter, Pro, or Elite plans. Start your 14-day free trial today.",
    images: [
      `/api/og?title=${encodeURIComponent("Simple, Transparent Pricing")}&description=${encodeURIComponent("Starter, Pro, and Elite plans for restaurants of all sizes")}&type=pricing`,
    ],
  },
};
