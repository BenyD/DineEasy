import type { Metadata } from "next";

const defaultMetadata: Metadata = {
  title: {
    default: "DineEasy - Modern Restaurant Management Made Simple",
    template: "%s | DineEasy",
  },
  description:
    "Transform your restaurant with QR-based ordering, real-time dashboards, and seamless payments. Accept Stripe, TWINT, and cash payments with automatic thermal printing.",
  keywords: [
    "restaurant management",
    "QR code menu",
    "digital menu",
    "restaurant POS",
    "restaurant ordering system",
    "restaurant payment system",
    "thermal printing",
    "Stripe payments",
    "TWINT payments",
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
    url: "https://dineeasy.com",
    siteName: "DineEasy",
    title: "DineEasy - Modern Restaurant Management Made Simple",
    description:
      "Transform your restaurant with QR-based ordering, real-time dashboards, and seamless payments. Accept Stripe, TWINT, and cash payments with automatic thermal printing.",
    images: [
      {
        url: "/images/android-chrome-512x512.png",
        width: 512,
        height: 512,
        alt: "DineEasy - Restaurant Management System",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "DineEasy - Modern Restaurant Management Made Simple",
    description:
      "Transform your restaurant with QR-based ordering, real-time dashboards, and seamless payments.",
    images: ["/images/android-chrome-512x512.png"],
    creator: "@dineeasy",
    site: "@dineeasy",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
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
    canonical: "https://dineeasy.com",
    languages: {
      "en-US": "https://dineeasy.com",
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
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
};

export default defaultMetadata;
