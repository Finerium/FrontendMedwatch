/**
 * Loading placeholder shown while the SVG topology is fetched. Marked
 * `"use client"` to keep the dark-mode utility branches alive.
 */
"use client";

import { cn } from "@/lib/utils";

/**
 * Render a 16:9 shimmer card with a centered spinner and Indonesian
 * loading copy.
 */
export function MapSkeleton() {
  return (
    <div
      className={cn(
        "relative w-full flex items-center justify-center",
        "bg-white/70 dark:bg-white/[0.03]",
        "backdrop-blur-xl",
        "border border-black/[0.06] dark:border-white/[0.08]",
        "rounded-2xl",
        "overflow-hidden"
      )}
      style={{ aspectRatio: "16 / 9" }}
    >
      {/* Shimmer animation */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 dark:via-white/[0.04] to-transparent animate-pulse" />
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-blue-500/10 animate-pulse" />
        <p className="text-sm text-slate-400 dark:text-slate-500 animate-pulse">
          Memuat peta...
        </p>
      </div>
    </div>
  );
}
