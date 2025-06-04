import Link from "next/link"
import { Logo } from "./Logo"

export function Footer() {
  return (
    <footer className="border-t bg-white">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <Logo />
            <p className="mt-4 text-sm text-gray-500">Streamlining restaurant operations with modern technology.</p>
          </div>
          <div>
            <h3 className="mb-4 text-sm font-medium">Product</h3>
            <ul className="space-y-2 text-sm text-gray-500">
              <li>
                <Link href="/features" className="hover:text-green-600">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-green-600">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 text-sm font-medium">Company</h3>
            <ul className="space-y-2 text-sm text-gray-500">
              <li>
                <Link href="/about" className="hover:text-green-600">
                  About
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-green-600">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 text-sm font-medium">Legal</h3>
            <ul className="space-y-2 text-sm text-gray-500">
              <li>
                <Link href="/terms" className="hover:text-green-600">
                  Terms
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-green-600">
                  Privacy
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t pt-6 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} DineEasy. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
