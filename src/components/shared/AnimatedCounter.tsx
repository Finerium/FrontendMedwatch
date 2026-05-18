/**
 * Inline span that counts up to a numeric target the first time it
 * scrolls into view. Marked `"use client"` because the animation is
 * driven by Framer Motion values and an in-view sentinel ref.
 */
"use client";

import { useEffect, useRef, useState } from "react";
import {
  useMotionValue,
  useTransform,
  animate,
  useInView,
} from "framer-motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface AnimatedCounterProps {
  /** Final numeric value displayed when the animation completes. */
  value: number;
  /** Animation length in milliseconds. */
  duration?: number;
  /** Display mode: plain number or percent suffix. */
  format?: "number" | "percent";
  /** Extra class names forwarded to the span. */
  className?: string;
}

/**
 * Format an integer with the Indonesian locale and an optional percent
 * suffix.
 *
 * @param num - Integer value to format.
 * @param format - "number" or "percent".
 */
function formatValue(num: number, format: "number" | "percent") {
  const formatted = num.toLocaleString("id-ID");
  return format === "percent" ? `${formatted}%` : formatted;
}

/**
 * Render the count-up span. Falls back to a static value when
 * `prefers-reduced-motion` is set.
 *
 * @param props - See `AnimatedCounterProps`.
 */
export function AnimatedCounter({
  value,
  duration = 1500,
  format = "number",
  className,
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const reducedMotion = useReducedMotion();
  const motionValue = useMotionValue(0);
  const [displayValue, setDisplayValue] = useState("0");

  const rounded = useTransform(motionValue, (latest) =>
    formatValue(Math.round(latest), format)
  );

  useEffect(() => {
    const unsubscribe = rounded.on("change", (latest) => {
      setDisplayValue(latest);
    });
    return unsubscribe;
  }, [rounded]);

  useEffect(() => {
    if (reducedMotion) {
      motionValue.set(value);
      return;
    }

    if (!isInView) return;

    const controls = animate(motionValue, value, {
      duration: duration / 1000,
      ease: "easeOut",
    });

    return () => controls.stop();
  }, [isInView, value, duration, motionValue, reducedMotion]);

  return (
    <span ref={ref} className={className}>
      {displayValue}
    </span>
  );
}
