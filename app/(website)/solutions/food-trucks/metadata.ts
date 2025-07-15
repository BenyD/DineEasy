import type { Metadata } from "next";
import { viewport } from "../../../metadata";

export { viewport };

export const metadata: Metadata = {
  title: "Food Truck Solutions",
  description:
    "Optimize your food truck business with DineEasy. Mobile ordering, queue management, and efficient payment processing for food trucks and mobile vendors.",
  openGraph: {
    title: "DineEasy for Food Trucks - Mobile Optimization",
    description:
      "Optimize your food truck business with DineEasy. Mobile ordering, queue management, and efficient payment processing for food trucks and mobile vendors.",
    images: [
      {
        url: `/api/og?title=${encodeURIComponent("Mobile Food Truck Optimization")}&description=${encodeURIComponent("Mobile ordering, queue management, and efficient payments")}&type=solutions`,
        width: 1200,
        height: 630,
        alt: "DineEasy Food Truck Solutions",
        type: "image/jpeg",
      },
    ],
  },
  twitter: {
    title: "DineEasy for Food Trucks - Mobile Optimization",
    description:
      "Optimize your food truck business with DineEasy. Mobile ordering, queue management, and efficient payment processing for food trucks and mobile vendors.",
    images: [
      `/api/og?title=${encodeURIComponent("Mobile Food Truck Optimization")}&description=${encodeURIComponent("Mobile ordering, queue management, and efficient payments")}&type=solutions`,
    ],
  },
};
