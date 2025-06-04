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
        url: "/images/features-og.jpg",
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
    images: ["/images/features-og.jpg"],
  },
};
