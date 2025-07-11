import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import RootLayoutClient from "@/components/layout/RootLayoutClient";
import { CookieConsent } from "@/components/elements/CookieConsent";
import { initializeCookies } from "@/lib/cookies";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DineEasy - Digital Menu & Restaurant Management",
  description:
    "Transform your restaurant operations with QR-based digital menus, real-time order management, and powerful analytics.",
  keywords: [
    "restaurant management",
    "digital menu",
    "qr menu",
    "restaurant pos",
    "restaurant software",
  ],
  authors: [{ name: "DineEasy" }],
  creator: "DineEasy",
  publisher: "DineEasy",
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://dineeasy.app",
    siteName: "DineEasy",
    title: "DineEasy - Digital Menu & Restaurant Management",
    description:
      "Transform your restaurant operations with QR-based digital menus, real-time order management, and powerful analytics.",
    images: [
      {
        url: "https://dineeasy.app/og-image.png",
        width: 1200,
        height: 630,
        alt: "DineEasy",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "DineEasy - Digital Menu & Restaurant Management",
    description:
      "Transform your restaurant operations with QR-based digital menus, real-time order management, and powerful analytics.",
    images: ["https://dineeasy.app/og-image.png"],
    creator: "@dineeasy",
  },
};

// Initialize cookies
initializeCookies();

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <RootLayoutClient />
        {children}
        <Toaster position="top-right" expand={false} richColors closeButton />
        <CookieConsent />
      </body>
    </html>
  );
}
