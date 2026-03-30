"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  LayoutDashboard,
  Search,
  GitCompare,
  Users,
  BarChart3,
  ShieldCheck,
  Map,
  Network,
  Atom,
  Grid3x3,
  FileDown,
  Sun,
  UserPlus,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const pages: NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Drug Search", href: "/drug-search", icon: Search },
  { label: "Drug Comparison", href: "/drug-comparison", icon: GitCompare },
  { label: "Patients", href: "/patients", icon: Users },
  { label: "Visualization", href: "/visualization", icon: BarChart3 },
  { label: "Safety Checker", href: "/safety-checker", icon: ShieldCheck },
  { label: "Indonesia Map", href: "/indonesia-map", icon: Map },
  { label: "Drug Network", href: "/drug-network", icon: Network },
  { label: "Molecule Viewer", href: "/molecule-viewer", icon: Atom },
  { label: "Heatmap", href: "/heatmap", icon: Grid3x3 },
  { label: "Export PDF", href: "/export", icon: FileDown },
];

interface QuickAction {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  action: "toggle-theme" | "search-drug" | "add-patient";
}

const quickActions: QuickAction[] = [
  { label: "Toggle Theme", icon: Sun, action: "toggle-theme" },
  { label: "Search Drug", icon: Search, action: "search-drug" },
  { label: "Add Patient", icon: UserPlus, action: "add-patient" },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { setTheme, resolvedTheme } = useTheme();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handlePageSelect = useCallback(
    (href: string) => {
      router.push(href);
      setOpen(false);
    },
    [router]
  );

  const handleQuickAction = useCallback(
    (action: QuickAction["action"]) => {
      switch (action) {
        case "toggle-theme":
          setTheme(resolvedTheme === "dark" ? "light" : "dark");
          break;
        case "search-drug":
          router.push("/drug-search");
          break;
        case "add-patient":
          router.push("/patients/new");
          break;
      }
      setOpen(false);
    },
    [router, setTheme, resolvedTheme]
  );

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Command Palette"
      description="Search for a page or action..."
      className="sm:max-w-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-black/[0.08] dark:border-white/[0.12] shadow-2xl dark:shadow-[0_16px_48px_0_rgba(0,0,0,0.5)]"
    >
      <CommandInput aria-label="Search commands" placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Pages">
          {pages.map((page) => (
            <CommandItem
              key={page.href}
              onSelect={() => handlePageSelect(page.href)}
            >
              <page.icon className="size-4 shrink-0 opacity-70" />
              <span>{page.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Quick Actions">
          {quickActions.map((action) => (
            <CommandItem
              key={action.action}
              onSelect={() => handleQuickAction(action.action)}
            >
              <action.icon className="size-4 shrink-0 opacity-70" />
              <span>{action.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
