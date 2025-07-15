import type { Metadata } from "next";
import { viewport } from "../../metadata";

export { viewport };

export const metadata: Metadata = {
  title: "Setup Guide",
  description:
    "Get started with DineEasy in under an hour. Follow our step-by-step guide to set up your restaurant's complete digital ordering system.",
  openGraph: {
    title: "DineEasy Setup Guide - Get Started in Under an Hour",
    description:
      "Get started with DineEasy in under an hour. Follow our step-by-step guide to set up your restaurant's complete digital ordering system.",
    images: [
      {
        url: `/api/og?title=${encodeURIComponent("Get Started in Under an Hour")}&description=${encodeURIComponent("Step-by-step guide to set up your restaurant's digital ordering system")}&type=setup`,
        width: 1200,
        height: 630,
        alt: "DineEasy Setup Guide",
        type: "image/jpeg",
      },
    ],
  },
  twitter: {
    title: "DineEasy Setup Guide - Get Started in Under an Hour",
    description:
      "Get started with DineEasy in under an hour. Follow our step-by-step guide to set up your restaurant's complete digital ordering system.",
    images: [
      `/api/og?title=${encodeURIComponent("Get Started in Under an Hour")}&description=${encodeURIComponent("Step-by-step guide to set up your restaurant's digital ordering system")}&type=setup`,
    ],
  },
};
