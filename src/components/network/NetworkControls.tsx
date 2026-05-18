/**
 * Control panel rendered alongside the drug network graph. Marked
 * `"use client"` because filters and zoom buttons all dispatch parent
 * state updates and the panel collapses with a Framer Motion animation.
 */
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DrugCategory } from "@/data/drugs";

const categoryColorMap: Record<DrugCategory, string> = {
  Analgesic: "#3b82f6",
  Antibiotic: "#22c55e",
  Antihypertensive: "#8b5cf6",
  Antihistamine: "#f59e0b",
  NSAID: "#ef4444",
  Gastrointestinal: "#06b6d4",
  Antidiabetic: "#ec4899",
  Antidepressant: "#f97316",
  Bronchodilator: "#14b8a6",
  Corticosteroid: "#a855f7",
};

const allCategories: DrugCategory[] = [
  "Analgesic",
  "Antibiotic",
  "Antihypertensive",
  "Antihistamine",
  "NSAID",
  "Gastrointestinal",
  "Antidiabetic",
  "Antidepressant",
  "Bronchodilator",
  "Corticosteroid",
];

interface NetworkControlsProps {
  /** Categories that are currently visible. */
  activeCategories: Set<string>;
  /** Toggle one category in the active set. */
  onToggleCategory: (category: string) => void;
  /** Zoom the graph in by one step. */
  onZoomIn: () => void;
  /** Zoom the graph out by one step. */
  onZoomOut: () => void;
  /** Reset the zoom to the default fit. */
  onZoomReset: () => void;
}

/**
 * Render the network filter and zoom controls.
 *
 * @param props - See `NetworkControlsProps`.
 */
export function NetworkControls({
  activeCategories,
  onToggleCategory,
  onZoomIn,
  onZoomOut,
  onZoomReset,
}: NetworkControlsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className={cn(
        "bg-white/70 dark:bg-white/[0.05]",
        "backdrop-blur-xl",
        "border border-black/[0.06] dark:border-white/[0.08]",
        "rounded-2xl",
        "shadow-lg dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.36)]",
        "p-4 w-56"
      )}
    >
      {/* Filter Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full text-sm font-semibold text-slate-900 dark:text-slate-100"
        aria-label={isExpanded ? "Collapse category filter" : "Expand category filter"}
        aria-expanded={isExpanded}
      >
        <span>Filter Kategori</span>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        )}
      </button>

      {/* Category List */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="mt-3 space-y-1.5">
              {allCategories.map((cat) => {
                const isActive = activeCategories.has(cat);
                return (
                  <button
                    key={cat}
                    onClick={() => onToggleCategory(cat)}
                    aria-label={`${isActive ? "Disable" : "Enable"} ${cat} category filter`}
                    aria-pressed={isActive}
                    className={cn(
                      "flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-xs font-medium transition-all duration-150",
                      isActive
                        ? "text-slate-900 dark:text-slate-100 bg-white/50 dark:bg-white/[0.06]"
                        : "text-slate-400 dark:text-slate-500 opacity-60"
                    )}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 transition-opacity"
                      style={{
                        backgroundColor: categoryColorMap[cat],
                        opacity: isActive ? 1 : 0.3,
                      }}
                    />
                    <span>{cat}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Zoom Controls */}
      <div className="mt-4 pt-3 border-t border-black/[0.06] dark:border-white/[0.08]">
        <div className="flex items-center gap-1">
          <button
            onClick={onZoomIn}
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/50 dark:bg-white/[0.06] hover:bg-white/80 dark:hover:bg-white/[0.1] transition-colors text-slate-700 dark:text-slate-300"
            title="Zoom In"
            aria-label="Zoom in on network graph"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={onZoomOut}
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/50 dark:bg-white/[0.06] hover:bg-white/80 dark:hover:bg-white/[0.1] transition-colors text-slate-700 dark:text-slate-300"
            title="Zoom Out"
            aria-label="Zoom out on network graph"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={onZoomReset}
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/50 dark:bg-white/[0.06] hover:bg-white/80 dark:hover:bg-white/[0.1] transition-colors text-slate-700 dark:text-slate-300"
            title="Fit to View"
            aria-label="Reset zoom to fit network graph"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
