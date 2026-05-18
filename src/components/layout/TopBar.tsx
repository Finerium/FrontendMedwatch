/**
 * Legacy top bar used by `ClientShell`. Marked `"use client"` because it
 * reads the live pathname to pick a page title and detects the platform
 * to render the correct keyboard shortcut hint.
 */
"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, Command } from "lucide-react";
import { cn } from "@/lib/utils";

interface TopBarProps {
  /** Open the mobile sidebar drawer. */
  onMenuClick: () => void;
}

// ─── Page title mapping ─────────────────────────────────────────────────────
const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/drug-search": "Drug Search",
  "/drug-comparison": "Drug Comparison",
  "/patients": "Patients",
  "/patients/new": "Add Patient",
  "/visualization": "Visualization",
  "/safety-checker": "Safety Checker",
  "/indonesia-map": "Indonesia Map",
  "/drug-network": "Drug Network",
  "/molecule-viewer": "Molecule Viewer",
  "/heatmap": "Side Effect Heatmap",
  "/export": "Export PDF",
};

/**
 * Render the top bar with the current page title and a command-palette
 * shortcut chip.
 *
 * @param props - See `TopBarProps`.
 */
export function TopBar({ onMenuClick }: TopBarProps) {
  const pathname = usePathname();
  const [isMac] = useState(() => {
    if (typeof window !== "undefined") {
      return navigator.platform.toUpperCase().includes("MAC");
    }
    return true;
  });

  // Find the best matching title for the current pathname
  const pageTitle =
    pageTitles[pathname] ??
    // Try matching by longest prefix for nested routes
    Object.entries(pageTitles)
      .filter(([path]) => path !== "/" && pathname.startsWith(path))
      .sort(([a], [b]) => b.length - a.length)[0]?.[1] ??
    "MedWatch";

  const handleCommandPalette = () => {
    // Dispatch a keyboard event to open the command palette
    const event = new KeyboardEvent("keydown", {
      key: "k",
      metaKey: isMac,
      ctrlKey: !isMac,
      bubbles: true,
    });
    document.dispatchEvent(event);
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-30",
        "bg-white/50 dark:bg-white/[0.03] backdrop-blur-lg",
        "border-b border-black/[0.04] dark:border-white/[0.05]",
        "h-16 flex items-center justify-between px-6"
      )}
    >
      {/* Left side */}
      <div className="flex items-center gap-4">
        {/* Hamburger (mobile only) */}
        <button
          onClick={onMenuClick}
          className={cn(
            "lg:hidden p-2 -ml-2 rounded-xl",
            "text-slate-600 dark:text-slate-400",
            "hover:bg-white/60 dark:hover:bg-white/[0.06]",
            "hover:text-slate-900 dark:hover:text-slate-200",
            "transition-colors duration-200"
          )}
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Page title */}
        <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
          {pageTitle}
        </h1>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Command palette trigger */}
        <button
          onClick={handleCommandPalette}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm",
            "bg-white/50 dark:bg-white/[0.04]",
            "border border-black/[0.06] dark:border-white/[0.08]",
            "text-slate-500 dark:text-slate-400",
            "hover:bg-white/70 dark:hover:bg-white/[0.08]",
            "hover:text-slate-700 dark:hover:text-slate-300",
            "transition-all duration-200",
            "backdrop-blur-sm"
          )}
        >
          <Command className="w-3.5 h-3.5" />
          <span className="text-xs font-medium">
            {isMac ? "Cmd" : "Ctrl"}+K
          </span>
        </button>
      </div>
    </header>
  );
}
