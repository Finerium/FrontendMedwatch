"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from "react-simple-maps";
import { useTheme } from "next-themes";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  provinceData,
  getProvinceByGeoName,
  type ProvinceData,
} from "@/data/indonesia-map";
import { MapTooltip } from "./MapTooltip";

const GEO_URL = "/indonesia-provinces.json";

const maxPatientCount = Math.max(...provinceData.map((p) => p.patientCount));

// Green-to-red terrain color scale based on patient density
const densityColors = [
  { threshold: 0.0, color: "#22c55e" }, // green-500 (Very Low)
  { threshold: 0.25, color: "#84cc16" }, // lime-500 (Low)
  { threshold: 0.5, color: "#eab308" },  // yellow-500 (Medium)
  { threshold: 0.75, color: "#f97316" }, // orange-500 (High)
  { threshold: 1.0, color: "#ef4444" },  // red-500 (Very High)
];

function interpolateColor(ratio: number): string {
  const clamped = Math.min(Math.max(ratio, 0), 1);
  for (let i = 0; i < densityColors.length - 1; i++) {
    const curr = densityColors[i];
    const next = densityColors[i + 1];
    if (clamped >= curr.threshold && clamped <= next.threshold) {
      const t = (clamped - curr.threshold) / (next.threshold - curr.threshold);
      const c1 = hexToRgb(curr.color);
      const c2 = hexToRgb(next.color);
      const r = Math.round(c1.r + (c2.r - c1.r) * t);
      const g = Math.round(c1.g + (c2.g - c1.g) * t);
      const b = Math.round(c1.b + (c2.b - c1.b) * t);
      return `rgb(${r},${g},${b})`;
    }
  }
  return densityColors[densityColors.length - 1].color;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const n = parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function getProvinceFill(
  patientCount: number,
  isHovered: boolean
): string {
  if (isHovered) return "#ef4444"; // red-500 on hover
  const ratio = patientCount / maxPatientCount;
  return interpolateColor(ratio);
}

function getDefaultFill(): string {
  return "#6b7280"; // gray-500 for unmatched provinces
}

export function IndonesiaMap() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState<[number, number]>([118, -2.5]);
  const [hoveredProvince, setHoveredProvince] = useState<ProvinceData | null>(
    null
  );
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [containerDims, setContainerDims] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setContainerDims({ width, height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const handleZoomIn = useCallback(() => {
    setZoom((z) => Math.min(z * 1.5, 8));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((z) => Math.max(z / 1.5, 1));
  }, []);

  const handleReset = useCallback(() => {
    setZoom(1);
    setCenter([118, -2.5]);
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      setTooltipPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    },
    []
  );

  const strokeColor = isDark
    ? "rgba(255,255,255,0.4)"
    : "rgba(0,0,0,0.2)";

  const oceanBg = isDark ? "#0f172a" : "#bfdbfe";

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      style={{ aspectRatio: "16 / 9" }}
      role="img"
      aria-label="Interactive map of Indonesia showing patient distribution by province"
      onMouseMove={handleMouseMove}
    >
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          center: [118, -2.5],
          scale: 1200,
        }}
        className="w-full h-full"
        style={{ width: "100%", height: "100%", background: oceanBg, borderRadius: "0.75rem" }}
      >
        <ZoomableGroup
          zoom={zoom}
          center={center}
          onMoveEnd={({ coordinates, zoom: newZoom }) => {
            setCenter(coordinates as [number, number]);
            setZoom(newZoom);
          }}
          minZoom={1}
          maxZoom={8}
          filterZoomEvent={(evt: unknown) => {
            const e = evt as Event;
            // For wheel events: only allow zoom on pinch (ctrlKey=true on Mac trackpad pinch)
            // Regular two-finger scroll (ctrlKey=false) passes through to page scroll
            if ("deltaY" in e) {
              return (e as WheelEvent).ctrlKey;
            }
            // For drag/pan events: allow unless right-click
            return !(e as MouseEvent).button;
          }}
        >
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const geoName = geo.properties.Propinsi as string;
                const province = getProvinceByGeoName(geoName);
                const isHovered =
                  hoveredProvince?.name === province?.name && province != null;
                const fill = province
                  ? getProvinceFill(province.patientCount, isHovered)
                  : getDefaultFill();

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={fill}
                    stroke={isHovered ? "#ef4444" : strokeColor}
                    strokeWidth={isHovered ? 2 : 0.75}
                    onMouseEnter={() => {
                      setHoveredProvince(province ?? null);
                    }}
                    onMouseLeave={() => {
                      setHoveredProvince(null);
                    }}
                    style={{
                      default: { outline: "none", transition: "all 200ms ease" },
                      hover: { outline: "none", transition: "all 200ms ease", filter: "drop-shadow(0 0 8px rgba(239,68,68,0.6))" },
                      pressed: { outline: "none" },
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>

      {/* Zoom Controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-1.5">
        {[
          { icon: ZoomIn, onClick: handleZoomIn, label: "Zoom in" },
          { icon: ZoomOut, onClick: handleZoomOut, label: "Zoom out" },
          { icon: RotateCcw, onClick: handleReset, label: "Reset" },
        ].map(({ icon: Icon, onClick, label }) => (
          <button
            key={label}
            onClick={onClick}
            aria-label={label}
            className={cn(
              "p-2 rounded-lg",
              "bg-white/70 dark:bg-white/[0.08]",
              "backdrop-blur-xl",
              "border border-black/[0.06] dark:border-white/[0.1]",
              "shadow-lg dark:shadow-[0_4px_16px_0_rgba(0,0,0,0.3)]",
              "text-slate-600 dark:text-slate-300",
              "hover:bg-white/90 dark:hover:bg-white/[0.15]",
              "transition-all duration-200",
              "cursor-pointer"
            )}
          >
            <Icon className="w-4 h-4" />
          </button>
        ))}
      </div>

      {/* Tooltip */}
      <MapTooltip
        province={hoveredProvince}
        position={tooltipPos}
        containerWidth={containerDims.width}
        containerHeight={containerDims.height}
      />
    </div>
  );
}
