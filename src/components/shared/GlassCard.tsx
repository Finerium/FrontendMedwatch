"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface GlassCardProps {
  children: React.ReactNode;
  variant?: "default" | "elevated" | "subtle";
  hover?: boolean;
  className?: string;
  role?: React.AriaRole;
  "aria-label"?: string;
}

const variantClasses: Record<NonNullable<GlassCardProps["variant"]>, string> = {
  default: cn(
    "bg-white/70 dark:bg-white/[0.05]",
    "backdrop-blur-xl",
    "border border-black/[0.06] dark:border-white/[0.08]",
    "rounded-2xl",
    "shadow-lg dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.36)]",
    "p-6"
  ),
  elevated: cn(
    "bg-white/80 dark:bg-white/[0.08]",
    "backdrop-blur-2xl",
    "border border-black/[0.08] dark:border-white/[0.12]",
    "rounded-2xl",
    "shadow-2xl dark:shadow-[0_16px_48px_0_rgba(0,0,0,0.5)]",
    "p-6"
  ),
  subtle: cn(
    "bg-white/50 dark:bg-white/[0.03]",
    "backdrop-blur-lg",
    "border border-black/[0.04] dark:border-white/[0.05]",
    "rounded-xl",
    "p-4"
  ),
};

const hoverClasses = cn(
  "transition-all duration-300",
  "hover:bg-white/80 dark:hover:bg-white/[0.08]",
  "hover:border-black/[0.1] dark:hover:border-white/[0.12]",
  "hover:shadow-xl"
);

export function GlassCard({
  children,
  variant = "default",
  hover = false,
  className,
  ...rest
}: GlassCardProps) {
  if (hover) {
    return (
      <motion.div
        whileHover={{ y: -4 }}
        className={cn(variantClasses[variant], hoverClasses, className)}
        {...rest}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div className={cn(variantClasses[variant], className)} {...rest}>
      {children}
    </div>
  );
}
