"use client";

import type { ReactNode } from "react";
import { AnimatePresence } from "framer-motion";

interface RootLayoutClientProps {
  children: ReactNode;
  className: string;
}

export function RootLayoutClient({
  children,
  className,
}: RootLayoutClientProps) {
  return (
    <html lang="en">
      <body className={className}>
        <AnimatePresence mode="wait">{children}</AnimatePresence>
      </body>
    </html>
  );
}
