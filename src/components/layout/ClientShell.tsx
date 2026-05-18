/**
 * Legacy sidebar-style layout shell. Marked `"use client"` because it
 * owns the mobile-drawer open state and provides the theme/tooltip
 * contexts to every descendant. Kept alongside `AppShell` for older
 * routes that have not yet been migrated to the simpler shell.
 */
"use client";

import { useState } from "react";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AmbientBackground } from "@/components/layout/AmbientBackground";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { CommandPalette } from "@/components/shared/CommandPalette";
import { Toaster } from "@/components/ui/sonner";

interface ClientShellProps {
  /** Page content rendered inside the shell. */
  children: React.ReactNode;
}

/**
 * Wrap the sidebar layout, command palette, toaster, and ambient
 * background with the theme and tooltip providers.
 *
 * @param props - See `ClientShellProps`.
 */
export function ClientShell({ children }: ClientShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <TooltipProvider>
        <AmbientBackground />
        <div className="flex h-screen relative">
          <Sidebar
            mobileOpen={mobileOpen}
            onMobileClose={() => setMobileOpen(false)}
          />
          <main className="flex-1 overflow-auto relative z-10">
            <TopBar onMenuClick={() => setMobileOpen(true)} />
            <div className="p-6 md:p-8 max-w-7xl">
              {children}
            </div>
          </main>
        </div>
        <CommandPalette />
        <Toaster />
      </TooltipProvider>
    </ThemeProvider>
  );
}
