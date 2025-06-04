import type { ReactNode } from "react"
import { Navbar } from "./Navbar"
import { Footer } from "./Footer"

interface PageWrapperProps {
  children: ReactNode
  showFooter?: boolean
}

export function PageWrapper({ children, showFooter = true }: PageWrapperProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      {showFooter && <Footer />}
    </div>
  )
}
