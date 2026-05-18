/**
 * Wrapper that renders a `Skeleton` for a fixed duration before
 * crossfading to its children. Marked `"use client"` because the
 * countdown timer and framer-motion swap both need the browser.
 */
"use client";

import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";

interface SkeletonLoaderProps {
  /** Content revealed after the skeleton expires. */
  children: React.ReactNode;
  /** Extra class names forwarded to the placeholder skeleton. */
  className?: string;
  /** Skeleton lifetime in milliseconds. */
  duration?: number;
}

/**
 * Show a skeleton for `duration` ms, then crossfade to the children.
 *
 * @param props - See `SkeletonLoaderProps`.
 */
export function SkeletonLoader({
  children,
  className,
  duration = 800,
}: SkeletonLoaderProps) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <motion.div
          key="skeleton"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <Skeleton className={className} />
        </motion.div>
      ) : (
        <motion.div
          key="content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
