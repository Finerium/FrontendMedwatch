import type { Role } from "@/lib/auth-store";

export type NavIconName =
  | "home"
  | "search"
  | "shield"
  | "users"
  | "chart"
  | "user"
  | "gear"
  | "spider";

export type NavItem = {
  id: string;
  label: string;
  icon: NavIconName;
  href: string;
};

export const NAV_ITEMS: Record<Role, NavItem[]> = {
  tenaga_kesehatan: [
    { id: "dashboard", label: "Beranda", icon: "home", href: "/dashboard" },
    { id: "drug-search", label: "Cari Obat", icon: "search", href: "/drug-search" },
    { id: "safety-checker", label: "Cek Keamanan", icon: "shield", href: "/safety-checker" },
    { id: "patients", label: "Pasien", icon: "users", href: "/patients" },
    { id: "visualization", label: "Visualisasi", icon: "chart", href: "/visualization" },
    { id: "heatmap", label: "Heatmap", icon: "gear", href: "/heatmap" },
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
