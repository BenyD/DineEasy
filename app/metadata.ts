import type { Metadata, Viewport } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://dineeasy.com";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
};

const defaultMetadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "DineEasy - Modern Restaurant Management Made Simple",
    template: "%s | DineEasy",
  },
  description:
    "Transform your restaurant with QR-based ordering, real-time dashboards, and seamless payments. Accept Stripe and cash payments with automatic thermal printing.",
  keywords: [
    "restaurant management",
    "QR code menu",
    "digital menu",
    "restaurant POS",
    "restaurant ordering system",
    "restaurant payment system",
    "thermal printing",
    "Stripe payments",
    "restaurant analytics",
  ],
  authors: [{ name: "DineEasy" }],
  creator: "DineEasy",
  publisher: "DineEasy",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/images/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/images/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/images/apple-touch-icon.png", type: "image/png" }],
    other: [
      {
        rel: "mask-icon",
        url: "/images/safari-pinned-tab.svg",
      },
    ],
  },
  manifest: "/site.webmanifest",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: BASE_URL,
    siteName: "DineEasy",
    title: "DineEasy - Modern Restaurant Management Made Simple",
    description:
      "Transform your restaurant with QR-based ordering, real-time dashboards, and seamless payments. Accept Stripe and cash payments with automatic thermal printing.",
    images: [
      {
        url: `/api/og?title=${encodeURIComponent("Modern Restaurant Management Made Simple")}&description=${encodeURIComponent("QR-based ordering, real-time dashboards, and seamless payments")}&type=default`,
        width: 1200,
        height: 630,
        alt: "DineEasy - Restaurant Management System",
        type: "image/jpeg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "DineEasy - Modern Restaurant Management Made Simple",
    description:
      "Transform your restaurant with QR-based ordering, real-time dashboards, and seamless payments.",
    images: [
      `/api/og?title=${encodeURIComponent("Modern Restaurant Management Made Simple")}&description=${encodeURIComponent("QR-based ordering, real-time dashboards, and seamless payments")}&type=default`,
    ],
    creator: "@dineeasy",
    site: "@dineeasy",
  },
  verification: {
    google: "your-google-site-verification",
    other: {
      yandex: "your-yandex-verification",
      yahoo: "your-yahoo-verification",
      bing: "your-bing-verification",
    },
  },
  alternates: {
    canonical: BASE_URL,
    languages: {
      "en-US": BASE_URL,
    },
  },
  category: "technology",
  appleWebApp: {
    capable: true,
    title: "DineEasy",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: true,
  },
};

export default defaultMetadata;
