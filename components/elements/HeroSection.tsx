import type { ReactNode } from "react";
import { GradientBlob } from "./GradientBlob";
import { motion } from "framer-motion";

interface HeroSectionProps {
  title?: string;
  subtitle?: string;
  children?: ReactNode;
  layout?: "default" | "centered";
  className?: string;
  size?: "full" | "regular";
}

export function HeroSection({
  title,
  subtitle,
  children,
  layout = "default",
  className = "",
  size = "regular",
}: HeroSectionProps) {
  const heightClass =
    size === "full" ? "h-screen" : "min-h-[400px] py-16 lg:py-20";

  if (layout === "centered") {
    return (
      <section
        className={`relative ${heightClass} flex items-center justify-center overflow-hidden`}
      >
        {/* Enhanced Background Pattern */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[radial-gradient(#e5f5ed_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
          <div className="absolute inset-0 bg-gradient-to-b from-white via-green-50/30 to-white" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#f0f9f4_1px,transparent_1px),linear-gradient(to_bottom,#f0f9f4_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_40%,transparent_100%)]" />
        </div>

        {/* Animated Gradient Blobs */}
        <motion.div
          className="absolute left-0 top-0 -z-10 h-[400px] w-[400px] rounded-full bg-gradient-to-r from-green-200/30 to-transparent opacity-60 blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, 30, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute right-0 bottom-0 -z-10 h-[400px] w-[400px] rounded-full bg-gradient-to-l from-green-200/30 to-transparent opacity-60 blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            x: [0, -50, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {children}
      </section>
    );
  }

  return (
    <section
      className={`relative ${heightClass} flex items-center justify-center overflow-hidden ${className}`}
    >
      {/* Enhanced Background Pattern */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(#e5f5ed_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-white via-green-50/30 to-white" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f0f9f4_1px,transparent_1px),linear-gradient(to_bottom,#f0f9f4_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_40%,transparent_100%)]" />
      </div>

      {/* Animated Gradient Blobs */}
      <motion.div
        className="absolute right-0 top-0 -z-10 h-[400px] w-[400px] rounded-full bg-gradient-to-l from-green-200/30 to-transparent opacity-60 blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          x: [0, -50, 0],
          y: [0, 30, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute left-0 bottom-0 -z-10 h-[400px] w-[400px] rounded-full bg-gradient-to-r from-green-200/30 to-transparent opacity-60 blur-3xl"
        animate={{
          scale: [1.2, 1, 1.2],
          x: [0, 50, 0],
          y: [0, -30, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Additional Background Elements */}
      <motion.div
        className="absolute right-1/4 top-1/4 -z-10 h-64 w-64 rounded-full bg-green-100/20 blur-3xl"
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.2, 0.3, 0.2],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute left-1/4 bottom-1/4 -z-10 h-64 w-64 rounded-full bg-green-100/20 blur-3xl"
        animate={{
          scale: [1.1, 1, 1.1],
          opacity: [0.3, 0.2, 0.3],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {children}
    </section>
  );
}
