import type { Metadata } from "next";
import { viewport } from "../../metadata";

export { viewport };

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Learn how DineEasy collects, uses, and protects your information. Our privacy policy outlines our commitment to data security and user privacy.",
  openGraph: {
    title: "Privacy Policy | DineEasy",
    description:
      "Learn how DineEasy collects, uses, and protects your information. Our privacy policy outlines our commitment to data security and user privacy.",
    images: [
      {
        url: `/api/og?title=${encodeURIComponent("Privacy Policy")}&description=${encodeURIComponent("Our commitment to data security and user privacy")}&type=default`,
        width: 1200,
        height: 630,
        alt: "DineEasy Privacy Policy",
      },
    ],
  },
  twitter: {
    title: "Privacy Policy | DineEasy",
    description:
      "Learn how DineEasy collects, uses, and protects your information. Our privacy policy outlines our commitment to data security and user privacy.",
    images: [
      `/api/og?title=${encodeURIComponent("Privacy Policy")}&description=${encodeURIComponent("Our commitment to data security and user privacy")}&type=default`,
    ],
  },
};
