"use client";

import Link from "next/link";
import Image from "next/image";
import { Logo } from "./Logo";
import {
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";
import { Button } from "../ui/button";
import { CookieConsent } from "@/components/elements/CookieConsent";

const navigation = {
  product: [
    { name: "Features", href: "/features" },
    { name: "Pricing", href: "/pricing" },
    { name: "Security", href: "/security" },
  ],
  company: [
    { name: "About", href: "/about" },
    { name: "Contact", href: "/contact" },
  ],
  social: [
    {
      name: "Twitter",
      href: "https://twitter.com/DineEasyApp",
      icon: (props: any) => (
        <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
    {
      name: "Instagram",
      href: "https://instagram.com/DineEasyApp",
      icon: (props: any) => (
        <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
        </svg>
      ),
    },
    {
      name: "LinkedIn",
      href: "https://linkedin.com/company/DineEasy",
      icon: (props: any) => (
        <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
          <path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19a.66.66 0 000 .14V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z" />
        </svg>
      ),
    },
  ],
};

export function Footer() {
  const currentYear = new Date().getFullYear();

  const contactInfo = [
    { icon: MapPin, text: "Zurich, Switzerland" },
    { icon: Mail, text: "contact@dineeasy.com" },
    { icon: Phone, text: "+41 123 456 789" },
  ];

  const handleCookieClick = (e: React.MouseEvent) => {
    e.preventDefault();
    // Check if we're on the privacy page
    if (window.location.pathname === "/privacy") {
      // If on privacy page, scroll to cookie section
      document
        .getElementById("cookie-policy")
        ?.scrollIntoView({ behavior: "smooth" });
    } else {
      // If not on privacy page, show cookie banner by clearing consent
      localStorage.removeItem("cookie-consent");
      // Trigger a custom event that CookieConsent component will listen to
      window.dispatchEvent(new Event("cookieConsentChange"));
    }
  };

  return (
    <footer className="relative border-t bg-white">
      {/* Background Pattern */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(#e5f5ed_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_40%,transparent_100%)]" />
      </div>

      {/* Newsletter Section */}
      <div className="border-b">
        <div className="container mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:justify-between sm:text-left">
            <div className="sm:max-w-md">
              <h3 className="text-lg font-semibold text-gray-900">
                Subscribe to our newsletter
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Stay updated with the latest features and releases.
              </p>
            </div>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <input
                type="email"
                placeholder="Enter your email"
                className="rounded-lg border border-gray-200 px-4 py-2 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
              <Button className="bg-green-600 hover:bg-green-700">
                Subscribe
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="container mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Logo />
            <p className="mt-4 max-w-md text-sm leading-relaxed text-gray-500">
              Streamlining restaurant operations with modern technology. Making
              dining experiences seamless for both restaurants and customers.
            </p>
            {/* Social Links */}
            <div className="mt-6 flex gap-4">
              {navigation.social.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-gray-100 p-2 text-gray-500 transition-colors hover:bg-green-100 hover:text-green-600"
                  aria-label={social.name}
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-gray-900">
              Product
            </h3>
            <ul className="space-y-3 text-sm text-gray-500">
              {navigation.product.map((product) => (
                <li key={product.name}>
                  <Link
                    href={product.href}
                    className="transition-colors hover:text-green-600"
                  >
                    {product.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-gray-900">
              Company
            </h3>
            <ul className="space-y-3 text-sm text-gray-500">
              {navigation.company.map((company) => (
                <li key={company.name}>
                  <Link
                    href={company.href}
                    className="transition-colors hover:text-green-600"
                  >
                    {company.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-gray-900">
              Contact
            </h3>
            <ul className="space-y-3 text-sm text-gray-500">
              {contactInfo.map((info, index) => (
                <li key={index} className="flex items-center gap-2">
                  <info.icon className="h-4 w-4 text-gray-400" />
                  <span>{info.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t pt-8 text-sm text-gray-500 sm:flex-row">
          <div className="flex flex-wrap justify-center gap-4 sm:justify-start">
            <span>© {currentYear} DineEasy. All rights reserved.</span>
            <span className="hidden sm:inline">|</span>
            <Link
              href="/terms"
              className="transition-colors hover:text-green-600"
            >
              Terms
            </Link>
            <Link
              href="/privacy"
              className="transition-colors hover:text-green-600"
            >
              Privacy
            </Link>
            <button
              onClick={handleCookieClick}
              className="transition-colors hover:text-green-600"
            >
              Cookies
            </button>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500"></span>
              All systems operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
