/**
 * Legacy collapsible sidebar nav with role-aware sections. Marked
 * `"use client"` because the collapsed state persists in localStorage,
 * the theme toggle uses `useTheme`, and the mobile drawer animates via
 * Framer Motion. Used by `ClientShell` only.
 */
"use client";

import { useCallback, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Search,
  GitCompare,
  Users,
  BarChart3,
  ShieldCheck,
  Grid3x3,
  FileDown,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  LogOut,
  UserCog,
  Database,
  User as UserIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { useHydratedAuth } from "@/lib/use-hydrated-store";

interface SidebarProps {
  /** Whether the mobile drawer overlay is currently open. */
  mobileOpen: boolean;
  /** Callback to close the mobile drawer (overlay click / link click). */
  onMobileClose: () => void;
}

/** Single sidebar link entry. */
type NavItem = { label: string; icon: typeof LayoutDashboard; href: string };

const NAV_TKES: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/" },
  { label: "Drug Search", icon: Search, href: "/drug-search" },
  { label: "Drug Comparison", icon: GitCompare, href: "/drug-comparison" },
  { label: "Patients", icon: Users, href: "/patients" },
  { label: "Visualization", icon: BarChart3, href: "/visualization" },
  { label: "Safety Checker", icon: ShieldCheck, href: "/safety-checker" },
  { label: "Heatmap", icon: Grid3x3, href: "/heatmap" },
  { label: "Export PDF", icon: FileDown, href: "/export" },
];

const NAV_ADMIN_EXTRA: NavItem[] = [
  { label: "Admin Dashboard", icon: LayoutDashboard, href: "/admin/dashboard" },
  { label: "Trigger Scraper", icon: Database, href: "/admin/scraper" },
  { label: "Manage Users", icon: UserCog, href: "/admin/users" },
];

const NAV_MASYARAKAT: NavItem[] = [
  { label: "My Profile", icon: UserIcon, href: "/pasien/profile" },
  { label: "Drug Search", icon: Search, href: "/drug-search" },
  { label: "Safety Checker", icon: ShieldCheck, href: "/safety-checker" },
];

/**
 * Pick the right link set for a role string. Defaults to the tenaga
 * kesehatan menu so an unauthenticated state still renders predictably.
 *
 * @param role - Role identifier from the auth store.
 * @returns Ordered list of nav items.
 */
function navForRole(role: string | undefined): NavItem[] {
  if (role === "admin") return [...NAV_ADMIN_EXTRA, ...NAV_TKES];
  if (role === "masyarakat") return NAV_MASYARAKAT;
  if (role === "tenaga_kesehatan") return NAV_TKES;
  return NAV_TKES;
}

/**
 * Render the desktop collapsible sidebar plus the mobile drawer
 * overlay. Persists the collapsed flag in localStorage.
 *
 * @param props - See `SidebarProps`.
 */
export function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const router = useRouter();
  const auth = useHydratedAuth();
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("sidebar-collapsed") === "true";
    }
    return false;
  });
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [themeRotation, setThemeRotation] = useState(0);
  const [mounted, setMounted] = useState(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setMounted(true); }, []);

  const handleSetCollapsed = useCallback((v: boolean) => {
    setCollapsed(v);
    localStorage.setItem("sidebar-collapsed", String(v));
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
    setThemeRotation((r) => r + 180);
  }, [theme, setTheme]);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const handleLogout = async () => {
    await auth.logout();
    router.push("/login");
  };

  const navItems = navForRole(auth.user?.role);

  if (pathname === "/login") return null;

  return (
    <>
      {mobileOpen && (
        <div
          role="button"
          aria-label="Close sidebar"
          tabIndex={0}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={onMobileClose}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") onMobileClose();
          }}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-screen flex flex-col",
          "bg-white/50 dark:bg-white/[0.03] backdrop-blur-2xl",
          "border-r border-black/[0.06] dark:border-white/[0.06]",
          "transition-all duration-300 ease-in-out",
          collapsed ? "w-20" : "w-72",
          "hidden lg:flex",
          mobileOpen && "!flex"
        )}
      >
        <div className="flex items-center h-16 px-4 shrink-0">
          {collapsed ? (
            <div className="flex items-center justify-center w-full">
              <span className="text-2xl font-bold text-gradient">M</span>
            </div>
          ) : (
            <div className="flex flex-col overflow-hidden">
              <span className="text-xl font-bold text-gradient whitespace-nowrap">
                MedWatch
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                Drug Safety Monitor
              </span>
            </div>
          )}
        </div>

        {auth.user && !collapsed && (
          <div className="px-4 pb-3 shrink-0">
            <div className="text-[11px] uppercase tracking-wider text-slate-500">{auth.user.role.replace("_", " ")}</div>
            <div className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{auth.user.name || auth.user.username}</div>
          </div>
        )}

        <Separator className="mx-3 w-auto" />

        <nav aria-label="Main navigation" className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            const linkEl = (
              <Link
                href={item.href}
                onClick={onMobileClose}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium",
                  "transition-all duration-200",
                  collapsed && "justify-center px-0",
                  active
                    ? "bg-white/70 dark:bg-white/[0.08] text-blue-600 dark:text-blue-400 shadow-sm border border-black/[0.04] dark:border-white/[0.08]"
                    : "text-slate-600 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-white/[0.06] hover:text-slate-900 dark:hover:text-slate-200 border border-transparent"
                )}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span
                  className={cn(
                    "whitespace-nowrap transition-opacity duration-150",
                    collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
            if (collapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger render={<div />}>{linkEl}</TooltipTrigger>
                  <TooltipContent side="right" sideOffset={8}>{item.label}</TooltipContent>
                </Tooltip>
              );
            }
            return <div key={item.href}>{linkEl}</div>;
          })}
        </nav>

        <div className="px-3 pb-4 space-y-2 shrink-0">
          <Separator className="mx-0 mb-2 w-auto" />

          {auth.user && (
            <button
              onClick={handleLogout}
              aria-label="Logout"
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium w-full",
                "text-red-500 hover:bg-red-500/10 transition-all duration-200",
                collapsed && "justify-center px-0"
              )}
            >
              <LogOut className="w-5 h-5 shrink-0" />
              <span className={cn("whitespace-nowrap transition-opacity duration-150",
                collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100")}>
                Logout
              </span>
            </button>
          )}

          <button
            onClick={toggleTheme}
            aria-label={mounted && theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium w-full",
              "text-slate-600 dark:text-slate-400",
              "hover:bg-white/60 dark:hover:bg-white/[0.06]",
              "hover:text-slate-900 dark:hover:text-slate-200",
              "transition-all duration-200",
              collapsed && "justify-center px-0"
            )}
          >
            <motion.div animate={{ rotate: themeRotation }} transition={{ duration: 0.3, ease: "easeInOut" }} className="shrink-0">
              {mounted && theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </motion.div>
            <span className={cn("whitespace-nowrap transition-opacity duration-150",
              collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100")}>
              {mounted && theme === "dark" ? "Light Mode" : "Dark Mode"}
            </span>
          </button>

          <button
            onClick={() => handleSetCollapsed(!collapsed)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={cn(
              "hidden lg:flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium w-full",
              "bg-white/40 dark:bg-white/[0.04]",
              "border border-black/[0.06] dark:border-white/[0.06]",
              "text-slate-600 dark:text-slate-400",
              "hover:bg-white/70 dark:hover:bg-white/[0.1]",
              "hover:text-slate-900 dark:hover:text-slate-200",
              "transition-all duration-200 cursor-pointer",
              collapsed && "justify-center px-0"
            )}
          >
            {collapsed ? <ChevronRight className="w-5 h-5 shrink-0" /> : <ChevronLeft className="w-5 h-5 shrink-0" />}
            <span className={cn("whitespace-nowrap transition-opacity duration-150",
              collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100")}>
              Collapse
            </span>
          </button>
        </div>
      </aside>

      <div
        className={cn(
          "hidden lg:block shrink-0 transition-all duration-300 ease-in-out",
          collapsed ? "w-20" : "w-72"
        )}
      />
    </>
  );
}
