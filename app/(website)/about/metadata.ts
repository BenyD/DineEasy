import type { Metadata } from "next";
import { viewport } from "../../metadata";

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
        url: `/api/og?title=${encodeURIComponent("Our Mission and Team")}&description=${encodeURIComponent("Revolutionizing restaurant management in the digital age")}&type=default`,
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
    images: [
      `/api/og?title=${encodeURIComponent("Our Mission and Team")}&description=${encodeURIComponent("Revolutionizing restaurant management in the digital age")}&type=default`,
    ],
  },
};
