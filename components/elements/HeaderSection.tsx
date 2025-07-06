import type { ReactNode } from "react";
import { motion } from "framer-motion";

interface HeaderSectionProps {
  title: ReactNode;
  subtitle?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export function HeaderSection({
  title,
  subtitle,
  children,
  className = "",
}: HeaderSectionProps) {
  return (
    <section
      className={`relative min-h-[300px] py-12 lg:py-16 flex items-center overflow-hidden ${className}`}
    >
      {/* Enhanced Background Pattern */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(#e5f5ed_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-white via-green-50/30 to-white" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f0f9f4_1px,transparent_1px),linear-gradient(to_bottom,#f0f9f4_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_40%,transparent_100%)]" />
      </div>

      {/* Animated Gradient Blobs */}
      <motion.div
        className="absolute right-0 top-0 -z-10 h-[300px] w-[300px] rounded-full bg-gradient-to-l from-green-200/30 to-transparent opacity-60 blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          x: [0, -30, 0],
          y: [0, 20, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Additional Background Elements */}
      <motion.div
        className="absolute right-1/4 top-1/4 -z-10 h-48 w-48 rounded-full bg-green-100/20 blur-3xl"
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
        className="absolute left-1/4 bottom-1/4 -z-10 h-48 w-48 rounded-full bg-green-100/20 blur-3xl"
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

      <div className="container relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.21, 0.47, 0.32, 0.98] }}
          >
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-3 text-lg text-gray-600 sm:text-xl">
                {subtitle}
              </p>
            )}
            {children}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
