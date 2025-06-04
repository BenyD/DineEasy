import type React from "react";
import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0a09" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL("https://dineeasy.com"),
  title: "DineEasy - Modern Restaurant Management Made Simple",
  description:
    "Transform your restaurant with QR-based ordering, real-time dashboards, and seamless payments. Accept Stripe, TWINT, and cash payments with automatic thermal printing.",
  keywords:
    "restaurant management, QR menu, digital ordering, payment processing, restaurant POS, thermal printing, TWINT payments",
  authors: [{ name: "DineEasy" }],
  creator: "DineEasy",
  publisher: "DineEasy",
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://dineeasy.com",
    title: "DineEasy - Modern Restaurant Management Made Simple",
    description:
      "Transform your restaurant with QR-based ordering, real-time dashboards, and seamless payments.",
    siteName: "DineEasy",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "DineEasy - Restaurant Management Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "DineEasy - Modern Restaurant Management Made Simple",
    description:
      "Transform your restaurant with QR-based ordering, real-time dashboards, and seamless payments.",
    images: ["/twitter-image.jpg"],
    creator: "@dineeasy",
  },
  verification: {
    google: "your-google-verification-code", // Add your Google Search Console verification code
  },
  alternates: {
    canonical: "https://dineeasy.com",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="msapplication-TileColor" content="#16a34a" />
      </head>
      <body>{children}</body>
    </html>
  );
}
