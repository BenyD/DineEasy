import type { ReactNode } from "react"
import { GradientBlob } from "./GradientBlob"

interface HeroSectionProps {
  title?: string
  subtitle?: string
  children?: ReactNode
  layout?: "default" | "centered"
  className?: string
}

export function HeroSection({ title, subtitle, children, layout = "default", className = "" }: HeroSectionProps) {
  if (layout === "centered") {
    return (
      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(#e0f2e9_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
        <GradientBlob size="lg" position="top-right" />
        <div className="container relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">{title}</h1>
            {subtitle && <p className="mt-4 text-lg text-gray-500 sm:mt-6 sm:text-xl">{subtitle}</p>}
            {children}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className={`relative overflow-hidden py-12 sm:py-20 md:py-32 ${className}`}>
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(#e0f2e9_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
      <GradientBlob size="lg" position="top-right" />
      <div className="container relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">{children}</div>
    </section>
  )
}
