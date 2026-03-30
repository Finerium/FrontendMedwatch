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
  value: number;
  duration?: number;
  format?: "number" | "percent";
  className?: string;
}

function formatValue(num: number, format: "number" | "percent") {
  const formatted = num.toLocaleString("id-ID");
  return format === "percent" ? `${formatted}%` : formatted;
}

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
