/**
 * Animated heatmap grid (drug rows × side-effect columns). Marked
 * `"use client"` because cells are draggable through Framer Motion,
 * row order animates with layout, and an observer watches the html
 * `class` list to keep cell colors in sync with the theme toggle.
 */
"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { HeatmapData } from "@/data/heatmap";

interface HeatmapGridProps {
  /** Underlying matrix bundle (drugs, side effects, frequencies, severities). */
  data: HeatmapData;
  /** Column label to sort rows by, or null for default order. */
  sortBy: string | null;
  /** Whether to render the numeric frequency inside each cell. */
  showValues: boolean;
  /** Whether to ring-highlight cells with frequency >50. */
  highlightHigh: boolean;
  /** Search filter restricted to drug names. */
  searchQuery: string;
  /** Callback fired when the hovered cell changes (null = no cell). */
  onCellHover: (info: { drug: string; sideEffect: string; frequency: number; severity: string; x: number; y: number } | null) => void;
}

/**
 * Pick a per-cell background color based on frequency and the active
 * theme. Higher frequencies fade towards saturated purple/blue.
 *
 * @param frequency - Cell value 0..100.
 * @param isDark - True when the page is in dark mode.
 * @returns CSS `rgba(...)` color string.
 */
function getCellColor(frequency: number, isDark: boolean): string {
  if (frequency === 0) return isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)";
  const t = frequency / 100;
  if (isDark) {
    // Purple scale for dark mode
    const r = Math.round(88 + t * 80);
    const g = Math.round(28 + t * 57);
    const b = Math.round(135 + t * 112);
    const a = 0.15 + t * 0.75;
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  } else {
    // Blue scale for light mode
    const r = Math.round(59 + t * 0);
    const g = Math.round(130 - t * 50);
    const b = Math.round(246 - t * 50);
    const a = 0.1 + t * 0.7;
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }
}

/**
 * Render the row-major heatmap grid plus the rotated column headers.
 *
 * @param props - See `HeatmapGridProps`.
 */
export function HeatmapGrid({ data, sortBy, showValues, highlightHigh, searchQuery, onCellHover }: HeatmapGridProps) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains("dark"));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const sortedIndices = useMemo(() => {
    const indices = data.drugs.map((_, i) => i);

    // Filter by search
    const filtered = searchQuery
      ? indices.filter((i) => data.drugs[i].toLowerCase().includes(searchQuery.toLowerCase()))
      : indices;

    // Sort
    if (sortBy) {
      const colIdx = data.sideEffects.indexOf(sortBy);
      if (colIdx >= 0) {
        filtered.sort((a, b) => data.matrix[b][colIdx] - data.matrix[a][colIdx]);
      }
    }

    return filtered;
  }, [data, sortBy, searchQuery]);

  return (
    <div className="overflow-x-auto">
      <div
        role="grid"
        aria-label="Side effect frequency heatmap"
        className="inline-grid gap-[1px]"
        style={{
          gridTemplateColumns: `160px repeat(${data.sideEffects.length}, minmax(50px, 1fr))`,
          minWidth: `${160 + data.sideEffects.length * 50}px`,
        }}
      >
        {/* Column headers (side effects) */}
        <div role="row" className="contents">
          <div role="columnheader" className="h-[160px]" />
          {data.sideEffects.map((se) => (
            <div key={se} role="columnheader" className="h-[160px] relative">
              <span
                className="text-[11px] font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap absolute bottom-6 left-1/2"
                style={{ transform: "translateX(-50%) rotate(-45deg)", transformOrigin: "center bottom" }}
              >
                {se}
              </span>
            </div>
          ))}
        </div>

        {/* Data rows */}
        <AnimatePresence mode="popLayout">
          {sortedIndices.map((drugIdx) => (
            <motion.div
              key={data.drugs[drugIdx]}
              role="row"
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="contents"
            >
              {/* Row header */}
              <div role="rowheader" className="sticky left-0 z-10 flex items-center px-3 h-[50px] bg-white/70 dark:bg-slate-950/80 backdrop-blur-sm border-r border-black/[0.04] dark:border-white/[0.04]">
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                  {data.drugs[drugIdx]}
                </span>
              </div>

              {/* Data cells */}
              {data.sideEffects.map((se, seIdx) => {
                const freq = data.matrix[drugIdx][seIdx];
                const severity = data.severities[drugIdx][seIdx];
                const isHighRisk = freq > 50;

                return (
                  <motion.div
                    key={`${drugIdx}-${seIdx}`}
                    role="gridcell"
                    aria-label={`${data.drugs[drugIdx]} - ${se}: ${freq}%`}
                    layout
                    className={cn(
                      "h-[50px] flex items-center justify-center cursor-pointer transition-all duration-150 border border-white/[0.03] dark:border-white/[0.03]",
                      highlightHigh && isHighRisk && "ring-1 ring-pink-500/60 shadow-[0_0_12px_rgba(236,72,153,0.3)]"
                    )}
                    style={{ backgroundColor: getCellColor(freq, isDark) }}
                    whileHover={{ scale: 1.05, zIndex: 20 }}
                    onMouseEnter={(e) => {
                      const rect = (e.target as HTMLElement).getBoundingClientRect();
                      onCellHover({
                        drug: data.drugs[drugIdx],
                        sideEffect: se,
                        frequency: freq,
                        severity,
                        x: rect.left + rect.width / 2,
                        y: rect.top,
                      });
                    }}
                    onMouseLeave={() => onCellHover(null)}
                  >
                    {showValues && freq > 0 && (
                      <span className={cn(
                        "text-[10px] font-mono font-bold",
                        freq > 60 ? "text-white" : freq > 30 ? "text-white/80 dark:text-white/80" : "text-slate-600 dark:text-slate-300"
                      )}>
                        {freq}
                      </span>
                    )}
                  </motion.div>
                );
              })}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
