import type { Metadata } from "next";
import { viewport } from "../../../metadata";

export { viewport };

export const metadata: Metadata = {
  title: "Restaurant Solutions",
  description:
    "Complete restaurant management solution with QR ordering, real-time analytics, and seamless payments. Perfect for full-service restaurants.",
  openGraph: {
    title: "DineEasy for Restaurants - Complete Management Solution",
    description:
      "Complete restaurant management solution with QR ordering, real-time analytics, and seamless payments. Perfect for full-service restaurants.",
    images: [
      {
        url: `/api/og?title=${encodeURIComponent("Complete Restaurant Management")}&description=${encodeURIComponent("QR ordering, real-time analytics, and seamless payments")}&type=solutions`,
        width: 1200,
        height: 630,
        alt: "DineEasy Restaurant Solutions",
        type: "image/jpeg",
      },
    ],
  },
  twitter: {
    title: "DineEasy for Restaurants - Complete Management Solution",
    description:
      "Complete restaurant management solution with QR ordering, real-time analytics, and seamless payments. Perfect for full-service restaurants.",
    images: [
      `/api/og?title=${encodeURIComponent("Complete Restaurant Management")}&description=${encodeURIComponent("QR ordering, real-time analytics, and seamless payments")}&type=solutions`,
    ],
  },
};
