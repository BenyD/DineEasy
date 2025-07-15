import type { Metadata } from "next";
import { viewport } from "../../metadata";

export { viewport };

export const metadata: Metadata = {
  title: "Contact DineEasy | Swiss Restaurant Technology Support",
  description:
    "Get in touch with DineEasy's Zürich-based support team. We provide Swiss quality support to help transform your restaurant operations. Available in German, French, Italian, and English.",
  openGraph: {
    title: "Contact DineEasy | Swiss Restaurant Technology Support",
    description:
      "Get in touch with DineEasy's Zürich-based support team. We provide Swiss quality support to help transform your restaurant operations. Available in German, French, Italian, and English.",
    images: [
      {
        url: `/api/og?title=${encodeURIComponent("Swiss Restaurant Technology Support")}&description=${encodeURIComponent("Zürich-based support team available in German, French, Italian, and English")}&type=default`,
        width: 1200,
        height: 630,
        alt: "Contact DineEasy Swiss Support Team",
      },
    ],
  },
  twitter: {
    title: "Contact DineEasy | Swiss Restaurant Technology Support",
    description:
      "Get in touch with DineEasy's Zürich-based support team. We provide Swiss quality support to help transform your restaurant operations. Available in German, French, Italian, and English.",
    images: [
      `/api/og?title=${encodeURIComponent("Swiss Restaurant Technology Support")}&description=${encodeURIComponent("Zürich-based support team available in German, French, Italian, and English")}&type=default`,
    ],
  },
  keywords: [
    "restaurant technology support",
    "Swiss restaurant software",
    "DineEasy support",
    "restaurant management system",
    "Zürich restaurant technology",
    "Swiss hospitality software",
    "restaurant POS support",
    "multilingual restaurant support",
  ],
  alternates: {
    languages: {
      "de-CH": "/de/contact",
      "fr-CH": "/fr/contact",
      "it-CH": "/it/contact",
      en: "/contact",
    },
  },
};
