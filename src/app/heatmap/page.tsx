"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { PageTransition } from "@/components/layout/PageTransition";
import { GlassCard } from "@/components/shared/GlassCard";
import { HeatmapGrid } from "@/components/heatmap/HeatmapGrid";
import { HeatmapTooltip } from "@/components/heatmap/HeatmapTooltip";
import { HeatmapLegend } from "@/components/heatmap/HeatmapLegend";
import { HeatmapControls } from "@/components/heatmap/HeatmapControls";
import { HeatmapStats } from "@/components/heatmap/HeatmapStats";
import { heatmapData } from "@/data/heatmap";

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

export default function HeatmapPage() {
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [showValues, setShowValues] = useState(false);
  const [highlightHigh, setHighlightHigh] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredCell, setHoveredCell] = useState<{
    drug: string;
    sideEffect: string;
    frequency: number;
    severity: string;
    x: number;
    y: number;
  } | null>(null);

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            Side Effect Heatmap
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Matriks frekuensi efek samping obat
          </p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {/* Stats */}
          <motion.div variants={itemVariants}>
            <HeatmapStats data={heatmapData} />
          </motion.div>

          {/* Controls */}
          <motion.div variants={itemVariants}>
            <GlassCard>
              <HeatmapControls
                sortBy={sortBy}
                showValues={showValues}
                highlightHigh={highlightHigh}
                searchQuery={searchQuery}
                sideEffects={heatmapData.sideEffects}
                onSortChange={setSortBy}
                onToggleValues={() => setShowValues((p) => !p)}
                onToggleHighlight={() => setHighlightHigh((p) => !p)}
                onSearchChange={setSearchQuery}
              />
            </GlassCard>
          </motion.div>

          {/* Heatmap Grid */}
          <motion.div variants={itemVariants}>
            <GlassCard className="p-0 overflow-hidden">
              <div className="p-4 overflow-x-auto">
                <HeatmapGrid
                  data={heatmapData}
                  sortBy={sortBy}
                  showValues={showValues}
                  highlightHigh={highlightHigh}
                  searchQuery={searchQuery}
                  onCellHover={setHoveredCell}
                />
              </div>
            </GlassCard>
          </motion.div>

          {/* Legend */}
          <motion.div variants={itemVariants}>
            <HeatmapLegend />
          </motion.div>

          {/* Mobile hint */}
          <motion.div variants={itemVariants} className="block md:hidden text-center">
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Putar perangkat ke mode landscape untuk tampilan terbaik
            </p>
          </motion.div>
        </motion.div>

        {/* Tooltip */}
        <HeatmapTooltip info={hoveredCell} />
      </div>
    </PageTransition>
  );
}
