import type { Metadata } from "next";
import { viewport } from "../metadata";

export { viewport };

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about DineEasy's mission to revolutionize restaurant management. Meet our team and discover how we're helping restaurants thrive in the digital age.",
  openGraph: {
    title: "About DineEasy - Our Mission and Team",
    description:
      "Learn about DineEasy's mission to revolutionize restaurant management. Meet our team and discover how we're helping restaurants thrive in the digital age.",
    images: [
      {
        url: "/images/about-og.jpg",
        width: 1200,
        height: 630,
        alt: "DineEasy Team and Mission",
      },
    ],
  },
  twitter: {
    title: "About DineEasy - Our Mission and Team",
    description:
      "Learn about DineEasy's mission to revolutionize restaurant management. Meet our team and discover how we're helping restaurants thrive in the digital age.",
    images: ["/images/about-og.jpg"],
  },
};
