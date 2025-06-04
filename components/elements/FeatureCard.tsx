"use client"

import type { ReactNode } from "react"
import { motion } from "framer-motion"

interface FeatureCardProps {
  icon: ReactNode
  title: string
  description: string
  className?: string
  index?: number
}

export function FeatureCard({ icon, title, description, className = "", index = 0 }: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{
        duration: 0.5,
        delay: index * 0.1,
        ease: [0.21, 0.47, 0.32, 0.98],
      }}
      whileHover={{
        y: -8,
        transition: { duration: 0.2 },
      }}
      className={`group rounded-lg border bg-white p-4 shadow-xs transition-all hover:shadow-lg hover:border-green-200 sm:p-6 ${className}`}
    >
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-50 transition-colors group-hover:bg-green-100 sm:mb-4 sm:h-16 sm:w-16">
        {icon}
      </div>
      <h3 className="mb-2 text-lg font-bold sm:text-xl">{title}</h3>
      <p className="text-sm text-gray-500 sm:text-base">{description}</p>
    </motion.div>
  )
}
