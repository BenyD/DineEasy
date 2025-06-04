interface GradientBlobProps {
  className?: string
  size?: "sm" | "md" | "lg"
  position?: "top-right" | "bottom-left" | "center"
}

export function GradientBlob({ className = "", size = "md", position = "top-right" }: GradientBlobProps) {
  const sizeClasses = {
    sm: "h-[200px] w-[200px]",
    md: "h-[300px] w-[300px]",
    lg: "h-[500px] w-[500px]",
  }

  const positionClasses = {
    "top-right": "-top-40 right-0",
    "bottom-left": "-bottom-6 -left-6",
    center: "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
  }

  return (
    <div
      className={`absolute -z-10 ${sizeClasses[size]} ${positionClasses[position]} rounded-full bg-green-200/20 blur-3xl ${className}`}
    />
  )
}
