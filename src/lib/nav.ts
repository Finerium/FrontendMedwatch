/**
 * Static role-keyed navigation manifest consumed by the shell NavBar.
 * Centralising the menus here keeps the desktop top nav and the mobile
 * bottom nav perfectly in sync; all three role menus live in this single
 * source of truth so a label or href only ever changes in one place.
 *
 * Key exports: `NavIconName`, `NavItem`, and the `NAV_ITEMS` map.
 */
import type { Role } from "@/lib/auth-store";

/** Names of every nav-bar icon supported by `NavIcon`. */
export type NavIconName =
  | "home"
  | "search"
  | "shield"
  | "users"
  | "chart"
  | "user"
  | "gear"
  | "spider";

/** Single entry in the sidebar/topbar navigation. */
export type NavItem = {
  id: string;
  label: string;
  icon: NavIconName;
  href: string;
};

/** Per-role menus. Order in the array is the on-screen order. */
export const NAV_ITEMS: Record<Role, NavItem[]> = {
  tenaga_kesehatan: [
    { id: "dashboard", label: "Beranda", icon: "home", href: "/dashboard" },
    { id: "drug-search", label: "Cari Obat", icon: "search", href: "/drug-search" },
    { id: "safety-checker", label: "Cek Keamanan", icon: "shield", href: "/safety-checker" },
    { id: "patients", label: "Pasien", icon: "users", href: "/patients" },
    { id: "visualization", label: "Visualisasi", icon: "chart", href: "/visualization" },
    { id: "drugs-visualization", label: "Visualisasi Obat", icon: "gear", href: "/drugs-visualization" },
    { id: "export-pdf", label: "Export", icon: "spider", href: "/export-pdf" },
  ],
  masyarakat: [
    { id: "dashboard", label: "Beranda", icon: "home", href: "/dashboard" },
    { id: "drug-search", label: "Cari Obat", icon: "search", href: "/drug-search" },
    { id: "safety-checker", label: "Cek Keamanan", icon: "shield", href: "/safety-checker" },
    { id: "profile", label: "Profil", icon: "user", href: "/pasien/profile" },
  ],
  admin: [
    { id: "admin", label: "Beranda", icon: "home", href: "/admin/dashboard" },
    { id: "users", label: "Pengguna", icon: "users", href: "/admin/users" },
    { id: "scraper", label: "Scraper", icon: "spider", href: "/admin/scraper" },
    { id: "visualization", label: "Visualisasi", icon: "chart", href: "/visualization" },
  ],
};
