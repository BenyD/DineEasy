"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: "default" | "outline" | "ghost";
  };
  className?: string;
  variant?: "default" | "minimal" | "illustrated";
  size?: "sm" | "md" | "lg";
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  variant = "default",
  size = "md",
}: EmptyStateProps) {
  const sizeClasses = {
    sm: "py-8",
    md: "py-12",
    lg: "py-16",
  };

  const iconSizes = {
    sm: "w-12 h-12",
    md: "w-16 h-16",
    lg: "w-20 h-20",
  };

  const titleSizes = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
  };

  const descriptionSizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  if (variant === "minimal") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn("text-center", sizeClasses[size], className)}
      >
        {Icon && (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="mx-auto mb-4"
          >
            <Icon className={cn("text-gray-400", iconSizes[size])} />
          </motion.div>
        )}
        <motion.h3
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={cn("font-semibold text-gray-900 mb-2", titleSizes[size])}
        >
          {title}
        </motion.h3>
        {description && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={cn("text-gray-600 mb-4", descriptionSizes[size])}
          >
            {description}
          </motion.p>
        )}
        {action && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Button
              variant={action.variant || "default"}
              onClick={action.onClick}
              size={size === "lg" ? "lg" : "default"}
            >
              {action.label}
            </Button>
          </motion.div>
        )}
      </motion.div>
    );
  }

  if (variant === "illustrated") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn("text-center", sizeClasses[size], className)}
      >
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="mx-auto mb-6"
        >
          <div className={cn("mx-auto bg-gradient-to-br from-gray-100 to-gray-200 rounded-full p-6", iconSizes[size])}>
            {Icon && <Icon className="w-full h-full text-gray-400" />}
          </div>
        </motion.div>
        
        <motion.h3
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={cn("font-bold text-gray-900 mb-3", titleSizes[size])}
        >
          {title}
        </motion.h3>
        
        {description && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={cn("text-gray-600 mb-6 max-w-md mx-auto", descriptionSizes[size])}
          >
            {description}
          </motion.p>
        )}
        
        {action && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Button
              variant={action.variant || "default"}
              onClick={action.onClick}
              size={size === "lg" ? "lg" : "default"}
              className="shadow-lg"
            >
              {action.label}
            </Button>
          </motion.div>
        )}
      </motion.div>
    );
  }

  // Default variant
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("text-center", sizeClasses[size], className)}
    >
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="mx-auto mb-6"
      >
        <div className={cn("mx-auto bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 shadow-lg border border-blue-100/50", iconSizes[size])}>
          {Icon && <Icon className="w-full h-full text-blue-500" />}
        </div>
      </motion.div>
      
      <motion.h3
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={cn("font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-3", titleSizes[size])}
      >
        {title}
      </motion.h3>
      
      {description && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={cn("text-gray-600 mb-6 max-w-md mx-auto leading-relaxed", descriptionSizes[size])}
        >
          {description}
        </motion.p>
      )}
      
      {action && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Button
            variant={action.variant || "default"}
            onClick={action.onClick}
            size={size === "lg" ? "lg" : "default"}
            className="shadow-lg hover:shadow-xl transition-shadow"
          >
            {action.label}
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
} 