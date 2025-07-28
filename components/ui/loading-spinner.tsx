"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "default" | "primary" | "success" | "warning" | "error";
  className?: string;
  text?: string;
  showText?: boolean;
}

export function LoadingSpinner({
  size = "md",
  variant = "default",
  className,
  text = "Loading...",
  showText = false,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
    xl: "w-16 h-16",
  };

  const variantClasses = {
    default: "border-gray-200 border-t-gray-600",
    primary: "border-blue-200 border-t-blue-600",
    success: "border-green-200 border-t-green-600",
    warning: "border-yellow-200 border-t-yellow-600",
    error: "border-red-200 border-t-red-600",
  };

  return (
    <div className={cn("flex flex-col items-center justify-center", className)}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "linear",
        }}
        className={cn(
          "border-2 rounded-full",
          sizeClasses[size],
          variantClasses[variant]
        )}
      />
      {showText && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-3 text-sm text-gray-600 font-medium"
        >
          {text}
        </motion.p>
      )}
    </div>
  );
}

export function LoadingDots({
  size = "md",
  variant = "default",
  className,
}: Omit<LoadingSpinnerProps, "text" | "showText">) {
  const sizeClasses = {
    sm: "w-1 h-1",
    md: "w-2 h-2",
    lg: "w-3 h-3",
    xl: "w-4 h-4",
  };

  const variantClasses = {
    default: "bg-gray-600",
    primary: "bg-blue-600",
    success: "bg-green-600",
    warning: "bg-yellow-600",
    error: "bg-red-600",
  };

  return (
    <div className={cn("flex items-center space-x-1", className)}>
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: index * 0.2,
            ease: "easeInOut",
          }}
          className={cn(
            "rounded-full",
            sizeClasses[size],
            variantClasses[variant]
          )}
        />
      ))}
    </div>
  );
}

export function LoadingPulse({
  size = "md",
  variant = "default",
  className,
}: Omit<LoadingSpinnerProps, "text" | "showText">) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
    xl: "w-16 h-16",
  };

  const variantClasses = {
    default: "bg-gray-600",
    primary: "bg-blue-600",
    success: "bg-green-600",
    warning: "bg-yellow-600",
    error: "bg-red-600",
  };

  return (
    <motion.div
      animate={{
        scale: [1, 1.1, 1],
        opacity: [0.5, 1, 0.5],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      className={cn(
        "rounded-full",
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
    />
  );
}

export function LoadingWave({
  size = "md",
  variant = "default",
  className,
}: Omit<LoadingSpinnerProps, "text" | "showText">) {
  const sizeClasses = {
    sm: "w-1 h-3",
    md: "w-1.5 h-6",
    lg: "w-2 h-8",
    xl: "w-3 h-12",
  };

  const variantClasses = {
    default: "bg-gray-600",
    primary: "bg-blue-600",
    success: "bg-green-600",
    warning: "bg-yellow-600",
    error: "bg-red-600",
  };

  return (
    <div className={cn("flex items-end space-x-1", className)}>
      {[0, 1, 2, 3, 4].map((index) => (
        <motion.div
          key={index}
          animate={{
            height: ["25%", "100%", "25%"],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: index * 0.1,
            ease: "easeInOut",
          }}
          className={cn(
            "rounded-full",
            sizeClasses[size],
            variantClasses[variant]
          )}
        />
      ))}
    </div>
  );
}
