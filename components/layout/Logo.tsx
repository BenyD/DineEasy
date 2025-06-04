import { ChefHat } from "lucide-react"
import Link from "next/link"

interface LogoProps {
  className?: string
  showText?: boolean
}

export function Logo({ className = "", showText = true }: LogoProps) {
  return (
    <Link href="/" className={`flex items-center gap-2 ${className}`}>
      <ChefHat className="h-8 w-8 text-green-600" />
      {showText && <span className="text-2xl font-bold">DineEasy</span>}
    </Link>
  )
}
