import type { Metadata } from "next";
import { viewport } from "../../../metadata";

export { viewport };

export const metadata: Metadata = {
  title: "Cafe Solutions",
  description:
    "Streamline your cafe operations with DineEasy. Fast QR ordering, inventory management, and customer insights for coffee shops and cafes.",
  openGraph: {
    title: "DineEasy for Cafes - Streamlined Operations",
    description:
      "Streamline your cafe operations with DineEasy. Fast QR ordering, inventory management, and customer insights for coffee shops and cafes.",
    images: [
      {
        url: `/api/og?title=${encodeURIComponent("Streamlined Cafe Operations")}&description=${encodeURIComponent("Fast QR ordering, inventory management, and customer insights")}&type=solutions`,
        width: 1200,
        height: 630,
        alt: "DineEasy Cafe Solutions",
        type: "image/jpeg",
      },
    ],
  },
  twitter: {
    title: "DineEasy for Cafes - Streamlined Operations",
    description:
      "Streamline your cafe operations with DineEasy. Fast QR ordering, inventory management, and customer insights for coffee shops and cafes.",
    images: [
      `/api/og?title=${encodeURIComponent("Streamlined Cafe Operations")}&description=${encodeURIComponent("Fast QR ordering, inventory management, and customer insights")}&type=solutions`,
    ],
  },
};
