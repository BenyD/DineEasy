import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Security | DineEasy",
  description:
    "Enterprise-grade security for your restaurant operations. Learn about DineEasy's Swiss-quality security standards, data protection, and compliance certifications.",
  openGraph: {
    title: "Security | DineEasy",
    description:
      "Enterprise-grade security for your restaurant operations. Learn about DineEasy's Swiss-quality security standards, data protection, and compliance certifications.",
    images: [
      {
        url: `/api/og?title=${encodeURIComponent("Enterprise-Grade Security")}&description=${encodeURIComponent("Swiss-quality security standards and compliance certifications")}&type=default`,
        width: 1200,
        height: 630,
        alt: "DineEasy Security Standards",
      },
    ],
  },
  twitter: {
    title: "Security | DineEasy",
    description:
      "Enterprise-grade security for your restaurant operations. Learn about DineEasy's Swiss-quality security standards, data protection, and compliance certifications.",
    images: [
      `/api/og?title=${encodeURIComponent("Enterprise-Grade Security")}&description=${encodeURIComponent("Swiss-quality security standards and compliance certifications")}&type=default`,
    ],
  },
};
