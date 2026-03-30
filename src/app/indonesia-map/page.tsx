"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { PageTransition } from "@/components/layout/PageTransition";
import { GlassCard } from "@/components/shared/GlassCard";
import { AnimatedCounter } from "@/components/shared/AnimatedCounter";
import { MapStats } from "@/components/map/MapStats";
import { MapLegend } from "@/components/map/MapLegend";
import { MapSkeleton } from "@/components/map/MapSkeleton";
import { provinceData } from "@/data/indonesia-map";
import { cn } from "@/lib/utils";
import { Medal } from "lucide-react";

const IndonesiaMap = dynamic(
  () =>
    import("@/components/map/IndonesiaMap").then((mod) => ({
      default: mod.IndonesiaMap,
    })),
  {
    ssr: false,
    loading: () => <MapSkeleton />,
  }
);

const top5Provinces = [...provinceData]
  .sort((a, b) => b.patientCount - a.patientCount)
  .slice(0, 5);

const densityBadgeColors: Record<string, string> = {
  "Very Low": "bg-slate-500/15 text-slate-400",
  Low: "bg-blue-500/15 text-blue-400",
  Medium: "bg-amber-500/15 text-amber-400",
  High: "bg-orange-500/15 text-orange-400",
  "Very High": "bg-red-500/15 text-red-400",
};

const rankColors = [
  "text-yellow-500",
  "text-slate-400",
  "text-amber-600",
  "text-slate-500",
  "text-slate-500",
];

export default function IndonesiaMapPage() {
  return (
    <PageTransition>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            Peta Distribusi Indonesia
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Distribusi klinik dan pasien per provinsi
          </p>
        </div>

        {/* Map Area */}
        <div className="relative">
          {/* Map container with glass border */}
          <GlassCard className="p-0 overflow-hidden">
            <IndonesiaMap />
          </GlassCard>

          {/* Stats overlay - top right */}
          <div className="absolute top-4 right-4 z-10 hidden lg:block">
            <MapStats />
          </div>

          {/* Legend overlay - bottom left */}
          <div className="absolute bottom-4 left-4 z-10">
            <MapLegend />
          </div>
        </div>

        {/* Stats for mobile - shown below map */}
        <div className="lg:hidden">
          <MapStats />
        </div>

        {/* Top 5 Provinces */}
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-50 mb-4">
            Top 5 Provinsi berdasarkan Jumlah Pasien
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {top5Provinces.map((province, index) => (
              <motion.div
                key={province.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{
                  duration: 0.4,
                  delay: index * 0.1,
                  ease: "easeOut",
                }}
              >
                <GlassCard
                  variant="subtle"
                  className="relative overflow-hidden"
                >
                  {/* Rank badge */}
                  <div className="flex items-center gap-2 mb-2">
                    <Medal className={cn("w-4 h-4", rankColors[index])} />
                    <span
                      className={cn(
                        "text-xs font-semibold",
                        rankColors[index]
                      )}
                    >
                      #{index + 1}
                    </span>
                  </div>

                  {/* Province name */}
                  <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                    {province.name}
                  </p>

                  {/* Patient count */}
                  <div className="mt-2 flex items-baseline gap-1">
                    <AnimatedCounter
                      value={province.patientCount}
                      className="text-xl font-bold font-mono text-slate-900 dark:text-white"
                      duration={1200}
                    />
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      pasien
                    </span>
                  </div>

                  {/* Clinic count */}
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {province.clinicCount} klinik
                  </p>

                  {/* Density badge */}
                  <div className="mt-2">
                    <span
                      className={cn(
                        "inline-block text-[10px] font-medium px-2 py-0.5 rounded-full",
                        densityBadgeColors[province.density]
                      )}
                    >
                      {province.density}
                    </span>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
