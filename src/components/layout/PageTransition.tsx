/**
 * Route-aware enter animation. Marked `"use client"` because it reads
 * the live pathname (the `key` change triggers a fresh enter cycle on
 * every navigation) and honours the `prefers-reduced-motion` user
 * setting by falling back to a static wrapper.
 */
"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface PageTransitionProps {
  /** Page content to fade in. */
  children: React.ReactNode;
}

/**
 * Fade-and-rise wrapper that re-mounts on every route change.
 *
 * @param props - See `PageTransitionProps`.
 */
export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return <div>{children}</div>;
  }

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      {children}
    </motion.div>
  );
}
