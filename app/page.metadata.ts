import type { Metadata } from "next";
import { viewport } from "./metadata";

export { viewport };

export const metadata: Metadata = {
  title: "Modern Restaurant Management Made Simple",
  description:
    "Transform your restaurant operations with DineEasy. QR-based ordering, real-time analytics, and seamless payments. Start your free trial today.",
  openGraph: {
    title: "DineEasy - Modern Restaurant Management Made Simple",
    description:
      "Transform your restaurant operations with DineEasy. QR-based ordering, real-time analytics, and seamless payments. Start your free trial today.",
    images: [
      {
        url: `/api/og?title=${encodeURIComponent("Modern Restaurant Management Made Simple")}&description=${encodeURIComponent("Transform your restaurant operations with DineEasy. QR-based ordering, real-time analytics, and seamless payments.")}&type=default`,
        width: 1200,
        height: 630,
        alt: "DineEasy Restaurant Management Platform",
      },
    ],
  },
  twitter: {
    title: "DineEasy - Modern Restaurant Management Made Simple",
    description:
      "Transform your restaurant operations with DineEasy. QR-based ordering, real-time analytics, and seamless payments. Start your free trial today.",
    images: [
      `/api/og?title=${encodeURIComponent("Modern Restaurant Management Made Simple")}&description=${encodeURIComponent("Transform your restaurant operations with DineEasy. QR-based ordering, real-time analytics, and seamless payments.")}&type=default`,
    ],
  },
};
