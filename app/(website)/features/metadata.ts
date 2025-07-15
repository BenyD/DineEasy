import type { Metadata } from "next";
import { viewport } from "../metadata";

export { viewport };

export const metadata: Metadata = {
  title: "Features",
  description:
    "Explore DineEasy's powerful features: QR ordering, real-time analytics, payment processing, thermal printing, and more. Everything you need to modernize your restaurant.",
  openGraph: {
    title: "DineEasy Features - Complete Restaurant Management Solution",
    description:
      "Explore DineEasy's powerful features: QR ordering, real-time analytics, payment processing, thermal printing, and more. Everything you need to modernize your restaurant.",
    images: [
      {
        url: `/api/og?title=${encodeURIComponent("Complete Restaurant Management Solution")}&description=${encodeURIComponent("QR ordering, real-time analytics, payment processing, thermal printing, and more")}&type=features`,
        width: 1200,
        height: 630,
        alt: "DineEasy Platform Features",
      },
    ],
  },
  twitter: {
    title: "DineEasy Features - Complete Restaurant Management Solution",
    description:
      "Explore DineEasy's powerful features: QR ordering, real-time analytics, payment processing, thermal printing, and more. Everything you need to modernize your restaurant.",
    images: [
      `/api/og?title=${encodeURIComponent("Complete Restaurant Management Solution")}&description=${encodeURIComponent("QR ordering, real-time analytics, payment processing, thermal printing, and more")}&type=features`,
    ],
  },
};
