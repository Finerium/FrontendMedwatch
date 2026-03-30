"use client";

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

const severityLevels = [
  { label: "Minor", color: "#22c55e", width: 1 },
  { label: "Moderate", color: "#eab308", width: 2 },
  { label: "Major", color: "#ef4444", width: 3 },
];

export function NetworkLegend() {
  return (
    <div
      className={cn(
        "bg-white/70 dark:bg-white/[0.05]",
        "backdrop-blur-xl",
        "border border-black/[0.06] dark:border-white/[0.08]",
        "rounded-2xl",
        "shadow-lg dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.36)]",
        "p-4"
      )}
    >
      {/* Category Legend */}
      <h2 className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
        Kategori Obat
      </h2>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        {allCategories.map((cat) => (
          <div key={cat} className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: categoryColorMap[cat] }}
            />
            <span className="text-[10px] text-slate-600 dark:text-slate-400 truncate">
              {cat}
            </span>
          </div>
        ))}
      </div>

      {/* Severity Legend */}
      <div className="mt-3 pt-3 border-t border-black/[0.06] dark:border-white/[0.08]">
        <h2 className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
          Tingkat Interaksi
        </h2>
        <div className="flex flex-col gap-1.5">
          {severityLevels.map((sev) => (
            <div key={sev.label} className="flex items-center gap-2">
              <div className="w-6 flex items-center">
                <div
                  className="w-full rounded-full"
                  style={{
                    backgroundColor: sev.color,
                    height: `${sev.width + 1}px`,
                    opacity: 0.7,
                  }}
                />
              </div>
              <span className="text-[10px] text-slate-600 dark:text-slate-400">
                {sev.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
