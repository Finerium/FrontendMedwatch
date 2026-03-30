"use client";

import { cn } from "@/lib/utils";
import { Search, AlertTriangle, Eye, ArrowUpDown } from "lucide-react";

interface HeatmapControlsProps {
  sortBy: string | null;
  showValues: boolean;
  highlightHigh: boolean;
  searchQuery: string;
  sideEffects: string[];
  onSortChange: (value: string | null) => void;
  onToggleValues: () => void;
  onToggleHighlight: () => void;
  onSearchChange: (value: string) => void;
}

export function HeatmapControls({
  sortBy,
  showValues,
  highlightHigh,
  searchQuery,
  sideEffects,
  onSortChange,
  onToggleValues,
  onToggleHighlight,
  onSearchChange,
}: HeatmapControlsProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px] max-w-[300px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Cari obat..."
          aria-label="Cari obat pada heatmap"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-9 pr-3 py-2 rounded-xl text-sm bg-white/50 dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/[0.08] focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-900 dark:text-slate-50 transition-all"
        />
      </div>

      {/* Sort */}
      <div className="relative min-w-[180px]">
        <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <select
          value={sortBy || ""}
          onChange={(e) => onSortChange(e.target.value || null)}
          aria-label="Urutkan berdasarkan efek samping"
          className="w-full pl-9 pr-3 py-2 rounded-xl text-sm bg-white/50 dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/[0.08] focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 outline-none text-slate-900 dark:text-slate-50 transition-all appearance-none cursor-pointer"
        >
          <option value="">Urutkan: Default</option>
          {sideEffects.map((se) => (
            <option key={se} value={se}>
              Urutkan: {se}
            </option>
          ))}
        </select>
      </div>

      {/* Toggle buttons */}
      <button
        onClick={onToggleHighlight}
        aria-label={highlightHigh ? "Nonaktifkan sorotan risiko tinggi" : "Aktifkan sorotan risiko tinggi"}
        aria-pressed={highlightHigh}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all duration-200 border",
          highlightHigh
            ? "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
            : "bg-white/50 dark:bg-white/[0.05] text-slate-600 dark:text-slate-400 border-black/[0.08] dark:border-white/[0.08] hover:bg-white/70 dark:hover:bg-white/[0.08]"
        )}
      >
        <AlertTriangle className="w-4 h-4" />
        <span className="hidden sm:inline">Risiko Tinggi</span>
      </button>

      <button
        onClick={onToggleValues}
        aria-label={showValues ? "Sembunyikan nilai frekuensi" : "Tampilkan nilai frekuensi"}
        aria-pressed={showValues}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all duration-200 border",
          showValues
            ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
            : "bg-white/50 dark:bg-white/[0.05] text-slate-600 dark:text-slate-400 border-black/[0.08] dark:border-white/[0.08] hover:bg-white/70 dark:hover:bg-white/[0.08]"
        )}
      >
        <Eye className="w-4 h-4" />
        <span className="hidden sm:inline">Tampilkan Nilai</span>
      </button>
    </div>
  );
}
