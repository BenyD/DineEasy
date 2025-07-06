"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { AnimatePresence } from "framer-motion";
import { initializeCookies } from "@/lib/cookies";
import { CookieConsent } from "@/components/elements/CookieConsent";

interface RootLayoutClientProps {
  children: ReactNode;
  className: string;
}

export function RootLayoutClient({
  children,
  className,
}: RootLayoutClientProps) {
  useEffect(() => {
    initializeCookies();
  }, []);

  return (
    <div className={className}>
      <AnimatePresence mode="wait">{children}</AnimatePresence>
      <CookieConsent />
    </div>
  );
}
