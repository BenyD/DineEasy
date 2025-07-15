import type { Metadata } from "next";
import { viewport } from "../metadata";

export { viewport };

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Read DineEasy's terms of service to understand your rights and responsibilities when using our restaurant management platform.",
  openGraph: {
    title: "Terms of Service | DineEasy",
    description:
      "Read DineEasy's terms of service to understand your rights and responsibilities when using our restaurant management platform.",
    images: [
      {
        url: `/api/og?title=${encodeURIComponent("Terms of Service")}&description=${encodeURIComponent("Your rights and responsibilities when using our platform")}&type=default`,
        width: 1200,
        height: 630,
        alt: "DineEasy Terms of Service",
      },
    ],
  },
  twitter: {
    title: "Terms of Service | DineEasy",
    description:
      "Read DineEasy's terms of service to understand your rights and responsibilities when using our restaurant management platform.",
    images: [
      `/api/og?title=${encodeURIComponent("Terms of Service")}&description=${encodeURIComponent("Your rights and responsibilities when using our platform")}&type=default`,
    ],
  },
};
