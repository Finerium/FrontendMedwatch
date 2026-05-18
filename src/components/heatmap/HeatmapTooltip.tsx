/**
 * Floating tooltip rendered above the hovered heatmap cell. Marked
 * `"use client"` because it positions itself in viewport coordinates
 * relative to `window.innerWidth` at render time.
 */
"use client";

import { cn } from "@/lib/utils";

interface HeatmapTooltipProps {
  /**
   * Pointer payload from the hovered cell, or null when no cell is
   * focused (in which case the component renders nothing).
   */
  info: {
    /** Row label (drug name). */
    drug: string;
    /** Column label (side-effect name). */
    sideEffect: string;
    /** Cell frequency 0..100. */
    frequency: number;
    /** Severity bucket: mild/moderate/severe. */
    severity: string;
    /** Viewport X coordinate of the cell center. */
    x: number;
    /** Viewport Y coordinate of the cell top. */
    y: number;
  } | null;
}

/**
 * Render the contextual tooltip with drug, side effect, frequency, and
 * severity chip. Returns null when `info` is null.
 *
 * @param props - See `HeatmapTooltipProps`.
 */
export function HeatmapTooltip({ info }: HeatmapTooltipProps) {
  if (!info) return null;

  const severityColor = {
    mild: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
    moderate: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    severe: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  }[info.severity] || "";

  const severityLabel = {
    mild: "Ringan",
    moderate: "Sedang",
    severe: "Berat",
  }[info.severity] || info.severity;

  return (
    <div
      className="fixed z-50 pointer-events-none transition-all duration-150"
      style={{
        left: Math.min(info.x, window.innerWidth - 200),
        top: info.y - 8,
        transform: "translate(-50%, -100%)",
      }}
    >
      <div className="bg-white/80 dark:bg-slate-900/90 backdrop-blur-xl border border-black/[0.08] dark:border-white/[0.08] rounded-xl shadow-xl px-4 py-3 min-w-[180px]">
        <p className="text-sm font-semibold text-slate-900 dark:text-white">{info.drug}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{info.sideEffect}</p>
        <div className="flex items-center justify-between mt-2">
          <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">{info.frequency}%</span>
          <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full border", severityColor)}>
            {severityLabel}
          </span>
        </div>
      </div>
    </div>
  );
}
