/**
 * Side panel summary for the Indonesia map. Marked `"use client"`
 * because it consumes the `AnimatedCounter` (which uses
 * `requestAnimationFrame` in the browser).
 */
"use client";

import { provinceData } from "@/data/indonesia-map";
import { AnimatedCounter } from "@/components/shared/AnimatedCounter";
import { cn } from "@/lib/utils";
import { Building2, Users, MapPin, TrendingUp } from "lucide-react";

const totalProvinsi = provinceData.length;
const totalKlinik = provinceData.reduce((sum, p) => sum + p.clinicCount, 0);
const totalPasien = provinceData.reduce((sum, p) => sum + p.patientCount, 0);
const highestProvince = provinceData.reduce((prev, curr) =>
  curr.patientCount > prev.patientCount ? curr : prev
);

interface StatItemProps {
  /** Lucide icon (or any node) rendered in the colored tile. */
  icon: React.ReactNode;
  /** Indonesian label rendered above the value. */
  label: string;
  /** Numeric value (rendered through `AnimatedCounter`). */
  value?: number;
  /** Static string value (used when `value` is omitted). */
  text?: string;
}

/**
 * One row of the map stats card.
 *
 * @param props - See `StatItemProps`.
 */
function StatItem({ icon, label, value, text }: StatItemProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-shrink-0 p-2 rounded-lg bg-blue-500/10 dark:bg-blue-500/15 text-blue-500">
        {icon}
      </div>
      <div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          {label}
        </p>
        {value !== undefined ? (
          <AnimatedCounter
            value={value}
            className="text-sm font-bold font-mono text-slate-900 dark:text-white"
          />
        ) : (
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            {text}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Render the four-row stats card next to the map.
 */
export function MapStats() {
  return (
    <div
      className={cn(
        "bg-white/70 dark:bg-white/[0.05]",
        "backdrop-blur-xl",
        "border border-black/[0.06] dark:border-white/[0.08]",
        "rounded-2xl",
        "shadow-lg dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.36)]",
        "p-4 space-y-3.5"
      )}
    >
      <StatItem
        icon={<MapPin className="w-4 h-4" />}
        label="Total Provinsi"
        value={totalProvinsi}
      />
      <StatItem
        icon={<Building2 className="w-4 h-4" />}
        label="Total Klinik"
        value={totalKlinik}
      />
      <StatItem
        icon={<Users className="w-4 h-4" />}
        label="Total Pasien"
        value={totalPasien}
      />
      <StatItem
        icon={<TrendingUp className="w-4 h-4" />}
        label="Kepadatan Tertinggi"
        text={highestProvince.name}
      />
    </div>
  );
}
