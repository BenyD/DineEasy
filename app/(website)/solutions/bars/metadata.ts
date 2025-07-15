import type { Metadata } from "next";
import { viewport } from "../../../metadata";

export { viewport };

export const metadata: Metadata = {
  title: "Bar Solutions",
  description:
    "Enhance your bar experience with DineEasy. Quick drink ordering, table management, and payment processing for bars and pubs.",
  openGraph: {
    title: "DineEasy for Bars - Enhanced Experience",
    description:
      "Enhance your bar experience with DineEasy. Quick drink ordering, table management, and payment processing for bars and pubs.",
    images: [
      {
        url: `/api/og?title=${encodeURIComponent("Enhanced Bar Experience")}&description=${encodeURIComponent("Quick drink ordering, table management, and payment processing")}&type=solutions`,
        width: 1200,
        height: 630,
        alt: "DineEasy Bar Solutions",
        type: "image/jpeg",
      },
    ],
  },
  twitter: {
    title: "DineEasy for Bars - Enhanced Experience",
    description:
      "Enhance your bar experience with DineEasy. Quick drink ordering, table management, and payment processing for bars and pubs.",
    images: [
      `/api/og?title=${encodeURIComponent("Enhanced Bar Experience")}&description=${encodeURIComponent("Quick drink ordering, table management, and payment processing")}&type=solutions`,
    ],
  },
};
