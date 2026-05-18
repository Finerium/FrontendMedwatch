/**
 * Floating tooltip rendered over the Indonesia map. Marked
 * `"use client"` because the tooltip auto-flips to avoid the map's
 * right/bottom edges based on its current pointer position.
 */
"use client";

import { ProvinceData } from "@/data/indonesia-map";
import { cn } from "@/lib/utils";

interface MapTooltipProps {
  /** Hovered province record, or null when no province is focused. */
  province: ProvinceData | null;
  /** Pointer position inside the map container. */
  position: { x: number; y: number };
  /** Map container width in pixels (used to decide left/right anchoring). */
  containerWidth?: number;
  /** Map container height in pixels (used to decide top/bottom anchoring). */
  containerHeight?: number;
}

const TOOLTIP_WIDTH = 180;
const TOOLTIP_HEIGHT = 130;
const OFFSET = 15;

const densityColors: Record<ProvinceData["density"], string> = {
  "Very Low": "bg-slate-500/20 text-slate-300 dark:bg-slate-500/20 dark:text-slate-300",
  Low: "bg-blue-500/20 text-blue-400 dark:bg-blue-500/20 dark:text-blue-300",
  Medium: "bg-amber-500/20 text-amber-400 dark:bg-amber-500/20 dark:text-amber-300",
  High: "bg-orange-500/20 text-orange-400 dark:bg-orange-500/20 dark:text-orange-300",
  "Very High": "bg-red-500/20 text-red-400 dark:bg-red-500/20 dark:text-red-300",
};

/**
 * Render the province tooltip with clinic and patient counts plus a
 * density chip. Returns null when no province is supplied.
 *
 * @param props - See `MapTooltipProps`.
 */
export function MapTooltip({ province, position, containerWidth = 9999, containerHeight = 9999 }: MapTooltipProps) {
  if (!province) return null;

  const fitsRight = position.x + OFFSET + TOOLTIP_WIDTH < containerWidth;
  const fitsBelow = position.y + OFFSET + TOOLTIP_HEIGHT < containerHeight;

  const left = fitsRight ? position.x + OFFSET : position.x - OFFSET - TOOLTIP_WIDTH;
  const top = fitsBelow ? position.y + OFFSET : position.y - OFFSET - TOOLTIP_HEIGHT;

  return (
    <div
      className={cn(
        "pointer-events-none absolute z-50",
        "bg-white/80 dark:bg-white/[0.08]",
        "backdrop-blur-xl",
        "border border-black/[0.08] dark:border-white/[0.12]",
        "rounded-xl",
        "shadow-xl dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.5)]",
        "px-4 py-3",
        "transition-opacity duration-150",
        province ? "opacity-100" : "opacity-0"
      )}
      style={{
        left,
        top,
      }}
    >
      <p className="text-sm font-semibold text-slate-900 dark:text-white mb-1.5">
        {province.name}
      </p>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-6 text-xs">
          <span className="text-slate-500 dark:text-slate-400">Klinik</span>
          <span className="font-mono font-medium text-slate-700 dark:text-slate-200">
            {province.clinicCount}
          </span>
        </div>
        <div className="flex items-center justify-between gap-6 text-xs">
          <span className="text-slate-500 dark:text-slate-400">Pasien</span>
          <span className="font-mono font-medium text-slate-700 dark:text-slate-200">
            {province.patientCount}
          </span>
        </div>
      </div>
      <div className="mt-2">
        <span
          className={cn(
            "inline-block text-[10px] font-medium px-2 py-0.5 rounded-full",
            densityColors[province.density]
          )}
        >
          {province.density}
        </span>
      </div>
    </div>
  );
}
