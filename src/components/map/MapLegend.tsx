"use client";

import { cn } from "@/lib/utils";

export function MapLegend() {
  return (
    <div
      className={cn(
        "bg-white/70 dark:bg-white/[0.05]",
        "backdrop-blur-xl",
        "border border-black/[0.06] dark:border-white/[0.08]",
        "rounded-xl",
        "shadow-lg dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.36)]",
        "px-4 py-3"
      )}
    >
      <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-2">
        Kepadatan Pasien
      </p>
      <div
        className="h-2.5 w-40 rounded-full"
        style={{ background: "linear-gradient(to right, #22c55e, #84cc16, #eab308, #f97316, #ef4444)" }}
      />
      <div className="flex justify-between mt-1.5">
        <span className="text-[10px] text-slate-500 dark:text-slate-400">
          Rendah
        </span>
        <span className="text-[10px] text-slate-500 dark:text-slate-400">
          Tinggi
        </span>
      </div>
    </div>
  );
}
