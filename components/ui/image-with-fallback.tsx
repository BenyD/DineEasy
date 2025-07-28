"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageWithFallbackProps {
  src?: string | null;
  alt: string;
  fallbackSrc?: string;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
  showLoadingState?: boolean;
  loadingClassName?: string;
  errorClassName?: string;
}

export function ImageWithFallback({
  src,
  alt,
  fallbackSrc = "/placeholder.svg",
  className,
  onLoad,
  onError,
  showLoadingState = true,
  loadingClassName,
  errorClassName,
}: ImageWithFallbackProps) {
  const [currentSrc, setCurrentSrc] = useState<string>(fallbackSrc);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    console.log("ImageWithFallback - src changed:", { src, fallbackSrc });

    if (
      !src ||
      src === "/placeholder.svg" ||
      src === "/placeholder.svg?height=100&width=100"
    ) {
      console.log("ImageWithFallback - using fallback");
      setCurrentSrc(fallbackSrc);
      setIsLoading(false);
      setHasError(false);
      setImageLoaded(false);
      return;
    }

    console.log("ImageWithFallback - loading image:", src);
    setIsLoading(true);
    setHasError(false);
    setImageLoaded(false);
    setCurrentSrc(src);
  }, [src, fallbackSrc]);

  const handleLoad = () => {
    console.log("ImageWithFallback - image loaded successfully:", currentSrc);
    setIsLoading(false);
    setHasError(false);
    setImageLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    console.log("ImageWithFallback - image failed to load:", currentSrc);
    setIsLoading(false);
    setHasError(true);
    setImageLoaded(false);
    
    // If the current src is not the fallback, try the fallback
    if (currentSrc !== fallbackSrc) {
      console.log("ImageWithFallback - trying fallback image");
      setCurrentSrc(fallbackSrc);
    } else {
      console.log("ImageWithFallback - fallback also failed");
      onError?.();
    }
  };

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Loading State */}
      <AnimatePresence>
        {isLoading && showLoadingState && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn(
              "absolute inset-0 bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 flex items-center justify-center",
              loadingClassName
            )}
          >
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-gray-300 border-t-green-600 rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-gray-500">Loading...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error State */}
      <AnimatePresence>
        {hasError && currentSrc === fallbackSrc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn(
              "absolute inset-0 bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 flex items-center justify-center",
              errorClassName
            )}
          >
            <div className="text-center text-gray-500">
              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-2">
                <ImageIcon className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium">No Image</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image */}
      <motion.img
        src={currentSrc}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          "w-full h-full object-cover transition-opacity duration-300",
          imageLoaded ? "opacity-100" : "opacity-0"
        )}
      />
    </div>
  );
}
