/**
 * Right-rail controls for the molecule viewer. Marked `"use client"`
 * because every button toggles parent state.
 */
"use client";

import { cn } from "@/lib/utils";
import { Play, Pause, RotateCcw, Box, Eye } from "lucide-react";

interface ViewerControlsProps {
  /** Whether the scene is auto-rotating. */
  autoRotate: boolean;
  /** Whether bonds are wireframed. */
  wireframe: boolean;
  /** Flip the auto-rotation state. */
  onToggleRotate: () => void;
  /** Flip the wireframe state. */
  onToggleWireframe: () => void;
  /** Reset camera position to the default. */
  onResetView: () => void;
}

/**
 * Render the three control buttons (play/pause, reset, wireframe).
 *
 * @param props - See `ViewerControlsProps`.
 */
export function ViewerControls({
  autoRotate,
  wireframe,
  onToggleRotate,
  onToggleWireframe,
  onResetView,
}: ViewerControlsProps) {
  const buttons = [
    {
      label: autoRotate ? "Pause" : "Putar",
      icon: autoRotate ? Pause : Play,
      onClick: onToggleRotate,
      active: autoRotate,
    },
    {
      label: "Reset",
      icon: RotateCcw,
      onClick: onResetView,
      active: false,
    },
    {
      label: wireframe ? "Solid" : "Wireframe",
      icon: wireframe ? Eye : Box,
      onClick: onToggleWireframe,
      active: wireframe,
    },
  ];

  return (
    <div className="space-y-2">
      <h2 className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1">
        Kontrol
      </h2>
      <div className="space-y-1">
        {buttons.map((btn) => (
          <button
            key={btn.label}
            onClick={btn.onClick}
            aria-label={btn.label}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all duration-200",
              btn.active
                ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                : "text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-white/[0.06] border border-transparent"
            )}
          >
            <btn.icon className="w-4 h-4" />
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  );
}
