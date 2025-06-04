import type { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { CookieConsent } from "../elements/CookieConsent";

interface PageWrapperProps {
  children: ReactNode;
  showFooter?: boolean;
  className?: string;
}

export function PageWrapper({
  children,
  showFooter = true,
  className = "",
}: PageWrapperProps) {
  return (
    <div className={`min-h-screen flex flex-col ${className}`}>
      <Navbar />
      <main className="flex-1">{children}</main>
      {showFooter && <Footer />}
      <CookieConsent />
    </div>
  );
}
