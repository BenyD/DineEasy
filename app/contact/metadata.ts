import type { Metadata } from "next";
import { viewport } from "../metadata";

export { viewport };

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with DineEasy's support team. We're here to help you transform your restaurant operations and answer any questions about our platform.",
  openGraph: {
    title: "Contact DineEasy - We're Here to Help",
    description:
      "Get in touch with DineEasy's support team. We're here to help you transform your restaurant operations and answer any questions about our platform.",
    images: [
      {
        url: "/images/contact-og.jpg",
        width: 1200,
        height: 630,
        alt: "Contact DineEasy Support",
      },
    ],
  },
  twitter: {
    title: "Contact DineEasy - We're Here to Help",
    description:
      "Get in touch with DineEasy's support team. We're here to help you transform your restaurant operations and answer any questions about our platform.",
    images: ["/images/contact-og.jpg"],
  },
};
