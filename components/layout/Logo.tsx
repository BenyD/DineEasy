import React from "react";
import Image from "next/image";
import Link from "next/link";

interface LogoProps {
  className?: string;
  showText?: boolean;
}

export function Logo({ className = "", showText = true }: LogoProps) {
  return (
    <Link href="/" className={`flex items-center gap-2 ${className}`}>
      <div className="relative w-8 h-8">
        <Image
          src="/images/logo.png"
          alt="DineEasy Logo"
          fill
          className="object-contain"
          priority
        />
      </div>
      {showText && <span className="text-2xl font-bold">DineEasy</span>}
    </Link>
  );
}
