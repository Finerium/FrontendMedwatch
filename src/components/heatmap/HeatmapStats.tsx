/**
 * Three-tile summary card row that derives "most common side effect",
 * "safest drug", and "highest risk combo" from the underlying heatmap
 * matrix. Marked `"use client"` because it uses `useMemo` to compute
 * aggregates without re-running every render.
 */
"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { HeatmapData } from "@/data/heatmap";
import { AnimatedCounter } from "@/components/shared/AnimatedCounter";
import { TrendingUp, Shield, AlertTriangle } from "lucide-react";

interface HeatmapStatsProps {
  /** Heatmap matrix bundle (drugs + side effects + values). */
  data: HeatmapData;
}

/**
 * Render the three summary tiles for the heatmap page.
 *
 * @param props - See `HeatmapStatsProps`.
 */
export function HeatmapStats({ data }: HeatmapStatsProps) {
  const stats = useMemo(() => {
    // Most common side effect (highest average across all drugs)
    const seAverages = data.sideEffects.map((_, seIdx) => {
      const sum = data.drugs.reduce((acc, _, drugIdx) => acc + data.matrix[drugIdx][seIdx], 0);
      return sum / data.drugs.length;
    });
    const maxSeIdx = seAverages.indexOf(Math.max(...seAverages));

    // Safest drug (lowest average frequency)
    const drugAverages = data.drugs.map((_, drugIdx) => {
      const sum = data.sideEffects.reduce((acc, _, seIdx) => acc + data.matrix[drugIdx][seIdx], 0);
      return sum / data.sideEffects.length;
    });
    const minDrugIdx = drugAverages.indexOf(Math.min(...drugAverages));

    // Highest risk combo
    let maxFreq = 0;
    let maxDrugIdx = 0;
    let maxSeIdxCombo = 0;
    data.matrix.forEach((row, drugIdx) => {
      row.forEach((freq, seIdx) => {
        if (freq > maxFreq) {
          maxFreq = freq;
          maxDrugIdx = drugIdx;
          maxSeIdxCombo = seIdx;
        }
      });
    });

    return {
      mostCommonSE: { name: data.sideEffects[maxSeIdx], avg: Math.round(seAverages[maxSeIdx]) },
      safestDrug: { name: data.drugs[minDrugIdx], avg: Math.round(drugAverages[minDrugIdx]) },
      highestRisk: {
        drug: data.drugs[maxDrugIdx],
        sideEffect: data.sideEffects[maxSeIdxCombo],
        frequency: maxFreq,
      },
    };
  }, [data]);

  const cards = [
    {
      title: "Efek Samping Tersering",
      value: stats.mostCommonSE.name,
      metric: stats.mostCommonSE.avg,
      metricLabel: "% rata-rata",
      icon: TrendingUp,
      iconBg: "bg-purple-500/10",
      iconColor: "text-purple-500",
    },
    {
      title: "Obat Paling Aman",
      value: stats.safestDrug.name,
      metric: stats.safestDrug.avg,
      metricLabel: "% rata-rata",
      icon: Shield,
      iconBg: "bg-green-500/10",
      iconColor: "text-green-500",
    },
    {
      title: "Risiko Tertinggi",
      value: `${stats.highestRisk.drug} + ${stats.highestRisk.sideEffect}`,
      metric: stats.highestRisk.frequency,
      metricLabel: "% frekuensi",
      icon: AlertTriangle,
      iconBg: "bg-red-500/10",
      iconColor: "text-red-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {cards.map((card) => (
        <div
          key={card.title}
          className="bg-white/70 dark:bg-white/[0.05] backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.08] rounded-2xl shadow-lg dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] p-4"
        >
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <h3 className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-medium">
                {card.title}
              </h3>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-50 mt-1 truncate">
                {card.value}
              </p>
            </div>
            <div className={cn("p-2 rounded-lg flex-shrink-0", card.iconBg)}>
              <card.icon className={cn("w-4 h-4", card.iconColor)} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <AnimatedCounter value={card.metric} className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-50" />
            <span className="text-xs text-slate-400">{card.metricLabel}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
