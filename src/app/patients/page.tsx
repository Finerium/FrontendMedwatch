"use client";

import { useState, useMemo, useCallback } from "react";
import { PageTransition } from "@/components/layout/PageTransition";
import { GlassCard } from "@/components/shared/GlassCard";
import { motion, AnimatePresence } from "framer-motion";
import { useHydratedPatientStore } from "@/lib/use-hydrated-store";
import type { Patient } from "@/lib/store";
import Link from "next/link";
import {
  Users,
  Plus,
  Search,
  Filter,
  X,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Pencil,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/* ───── Constants ───── */

const complaintColors: Record<string, string> = {
  "Hipertensi": "bg-red-500/10 text-red-500 border-red-500/20",
  "Diabetes Mellitus": "bg-amber-500/10 text-amber-500 border-amber-500/20",
  "GERD": "bg-pink-500/10 text-pink-500 border-pink-500/20",
  "Asma": "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
  "Migrain": "bg-purple-500/10 text-purple-500 border-purple-500/20",
  "Alergi": "bg-orange-500/10 text-orange-500 border-orange-500/20",
  "Demam": "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  "Infeksi Saluran Napas": "bg-green-500/10 text-green-500 border-green-500/20",
  "Nyeri Sendi": "bg-blue-500/10 text-blue-500 border-blue-500/20",
  "Dermatitis": "bg-rose-500/10 text-rose-500 border-rose-500/20",
  "Dispepsia": "bg-pink-500/10 text-pink-500 border-pink-500/20",
  "Bronkitis": "bg-teal-500/10 text-teal-500 border-teal-500/20",
  "Anemia": "bg-red-500/10 text-red-400 border-red-500/20",
  "Gangguan Kecemasan": "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
  "Infeksi Saluran Kemih": "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
};

const ITEMS_PER_PAGE = 10;

/* ───── Helpers ───── */

function formatDate(dateStr: string): string {
  const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  const date = new Date(dateStr);
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

/* ───── Skeleton Loader ───── */

function SkeletonCard() {
  return (
    <GlassCard variant="subtle">
      <div className="flex items-center gap-3 animate-pulse">
        <div className="p-2 rounded-lg bg-slate-300/20 dark:bg-slate-600/20 w-9 h-9" />
        <div className="space-y-2">
          <div className="h-6 w-12 rounded bg-slate-300/30 dark:bg-slate-600/30" />
          <div className="h-3 w-20 rounded bg-slate-300/20 dark:bg-slate-600/20" />
        </div>
      </div>
    </GlassCard>
  );
}

const SKELETON_WIDTHS = ["75%", "90%", "60%", "80%", "70%", "85%"];

function SkeletonRow() {
  return (
    <tr className="border-b border-black/[0.03] dark:border-white/[0.03]">
      {SKELETON_WIDTHS.map((w, i) => (
        <td key={i} className="py-3 px-4 first:pl-6 last:pr-6">
          <div className="h-4 rounded bg-slate-300/30 dark:bg-slate-600/30 animate-pulse" style={{ width: w }} />
        </td>
      ))}
    </tr>
  );
}

/* ───── Sort types ───── */

type SortField = "name" | "age" | "visitDate" | null;

/* ───── Main Component ───── */

export default function PatientsPage() {
  const { patients, deletePatient, hydrated } = useHydratedPatientStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [genderFilter, setGenderFilter] = useState<"all" | "Perempuan" | "Laki-laki">("all");
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<Patient | null>(null);

  const resetPage = useCallback(() => setCurrentPage(1), []);

  // Stats
  const totalPatients = patients.length;
  const lakiLakiCount = useMemo(() => patients.filter((p) => p.gender === "Laki-laki").length, [patients]);
  const perempuanCount = useMemo(() => patients.filter((p) => p.gender === "Perempuan").length, [patients]);

  // Filtered & sorted patients
  const filteredPatients = useMemo(() => {
    let result = [...patients];

    // Search by name, address, or diagnosis
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.address.toLowerCase().includes(q) ||
          p.diagnosis.toLowerCase().includes(q)
      );
    }

    // Gender filter
    if (genderFilter !== "all") {
      result = result.filter((p) => p.gender === genderFilter);
    }

    // Sort
    if (sortField) {
      result.sort((a, b) => {
        let aVal: string | number;
        let bVal: string | number;

        switch (sortField) {
          case "name":
            aVal = a.name;
            bVal = b.name;
            break;
          case "age":
            aVal = a.age;
            bVal = b.age;
            break;
          case "visitDate":
            aVal = new Date(a.visitDate).getTime();
            bVal = new Date(b.visitDate).getTime();
            break;
          default:
            return 0;
        }

        if (typeof aVal === "number" && typeof bVal === "number") {
          return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
        }
        return sortDirection === "asc"
          ? String(aVal).localeCompare(String(bVal))
          : String(bVal).localeCompare(String(aVal));
      });
    } else {
      // Default sort by createdAt desc
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return result;
  }, [patients, searchQuery, genderFilter, sortField, sortDirection]);

  // Pagination
  const showPagination = filteredPatients.length > ITEMS_PER_PAGE;
  const totalPages = Math.max(1, Math.ceil(filteredPatients.length / ITEMS_PER_PAGE));
  const paginatedPatients = useMemo(() => {
    if (!showPagination) return filteredPatients;
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPatients.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredPatients, currentPage, showPagination]);

  const startItem = filteredPatients.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endItem = Math.min(currentPage * ITEMS_PER_PAGE, filteredPatients.length);

  // Sort handler
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Delete handler
  const handleDelete = () => {
    if (!deleteTarget) return;
    deletePatient(deleteTarget.id);
    toast.success("Pasien berhasil dihapus");
    setDeleteTarget(null);
  };

  // Page number buttons
  const getPageNumbers = (): (number | "ellipsis")[] => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | "ellipsis")[] = [];

    if (currentPage <= 3) {
      pages.push(1, 2, 3, 4, "ellipsis", totalPages);
    } else if (currentPage >= totalPages - 2) {
      pages.push(1, "ellipsis", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, "ellipsis", currentPage - 1, currentPage, currentPage + 1, "ellipsis", totalPages);
    }

    return pages;
  };

  // Stagger animation variants
  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.08 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
  };

  // Sort indicator helper
  const renderSortIndicator = (field: SortField) => {
    if (sortField === field) {
      return sortDirection === "asc" ? (
        <ChevronUp className="w-3.5 h-3.5 text-blue-500" />
      ) : (
        <ChevronDown className="w-3.5 h-3.5 text-blue-500" />
      );
    }
    return <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />;
  };

  // Active filter count
  const activeFilterCount = [
    genderFilter !== "all",
    searchQuery.trim() !== "",
  ].filter(Boolean).length;

  const resetFilters = () => {
    setSearchQuery("");
    setGenderFilter("all");
  };

  /* ───── Skeleton state ───── */
  if (!hydrated) {
    return (
      <PageTransition>
        <div className="space-y-8">
          {/* Header skeleton */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="h-8 w-40 rounded-lg bg-slate-300/30 dark:bg-slate-600/30 animate-pulse" />
              <div className="h-4 w-56 rounded bg-slate-300/20 dark:bg-slate-600/20 animate-pulse mt-2" />
            </div>
            <div className="h-10 w-36 rounded-xl bg-slate-300/20 dark:bg-slate-600/20 animate-pulse" />
          </div>

          {/* Stats skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>

          {/* Table skeleton */}
          <GlassCard className="p-0">
            <div className="p-6">
              <div className="h-10 w-full rounded-xl bg-slate-300/20 dark:bg-slate-600/20 animate-pulse" />
            </div>
            <table className="w-full text-sm">
              <tbody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <SkeletonRow key={i} />
                ))}
              </tbody>
            </table>
          </GlassCard>
        </div>
      </PageTransition>
    );
  }

  /* ───── Empty state (no patients at all) ───── */
  if (patients.length === 0) {
    return (
      <PageTransition>
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                Data Pasien
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Daftar dan manajemen data pasien
              </p>
            </div>
            <Link
              href="/patients/new"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-medium shadow-lg flex items-center gap-2 transition-colors w-fit"
            >
              <Plus className="w-4 h-4" />
              Tambah Pasien
            </Link>
          </div>

          {/* Empty card */}
          <GlassCard className="flex flex-col items-center justify-center py-20 px-6">
            <div className="p-4 rounded-2xl bg-blue-500/10 mb-6">
              <UserPlus className="w-12 h-12 text-blue-500" />
            </div>
            <p className="text-lg font-medium text-slate-600 dark:text-slate-400">
              Belum ada data pasien
            </p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">
              Mulai dengan menambahkan data pasien pertama Anda
            </p>
            <Link
              href="/patients/new"
              className="mt-6 px-5 py-2.5 rounded-xl text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-lg flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Tambah Pasien
            </Link>
          </GlassCard>
        </div>
      </PageTransition>
    );
  }

  /* ───── Main render ───── */
  return (
    <PageTransition>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
              Data Pasien
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Daftar dan manajemen data pasien
            </p>
          </div>
          <Link
            href="/patients/new"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-medium shadow-lg flex items-center gap-2 transition-colors w-fit"
          >
            <Plus className="w-4 h-4" />
            Tambah Pasien
          </Link>
        </div>

        {/* Stats Row */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          <motion.div variants={itemVariants}>
            <GlassCard variant="subtle">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Users className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-50">
                    {totalPatients}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Total Pasien</p>
                </div>
              </div>
            </GlassCard>
          </motion.div>
          <motion.div variants={itemVariants}>
            <GlassCard variant="subtle">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <span className="text-blue-500 text-lg font-bold leading-none block w-5 h-5 flex items-center justify-center">&#9794;</span>
                </div>
                <div>
                  <p className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-50">
                    {lakiLakiCount}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Laki-laki</p>
                </div>
              </div>
            </GlassCard>
          </motion.div>
          <motion.div variants={itemVariants}>
            <GlassCard variant="subtle">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-pink-500/10">
                  <span className="text-pink-500 text-lg font-bold leading-none block w-5 h-5 flex items-center justify-center">&#9792;</span>
                </div>
                <div>
                  <p className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-50">
                    {perempuanCount}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Perempuan</p>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </motion.div>

        {/* Filters & Search */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <GlassCard>
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); resetPage(); }}
                placeholder="Cari nama, alamat, atau diagnosa..."
                aria-label="Cari nama, alamat, atau diagnosa"
                className="w-full pl-12 pr-10 py-3 bg-white/50 dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-slate-50 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => { setSearchQuery(""); resetPage(); }}
                  aria-label="Hapus pencarian"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filter Dropdown */}
            <div className="flex flex-wrap items-center gap-3 mt-4">
              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <Filter className="w-4 h-4" />
                <span>Filter:</span>
              </div>

              <select
                value={genderFilter}
                onChange={(e) => { setGenderFilter(e.target.value as "all" | "Perempuan" | "Laki-laki"); resetPage(); }}
                aria-label="Filter gender pasien"
                className="bg-white/50 dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.08] rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-50 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all pr-8 bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:12px] bg-[right_8px_center] bg-no-repeat"
              >
                <option value="all">Semua Gender</option>
                <option value="Perempuan">Perempuan</option>
                <option value="Laki-laki">Laki-laki</option>
              </select>

              {activeFilterCount > 0 && (
                <>
                  <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-0.5 font-medium">
                    {activeFilterCount}
                  </span>
                  <button
                    onClick={() => { resetFilters(); resetPage(); }}
                    aria-label="Reset semua filter"
                    className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors font-medium"
                  >
                    Reset Filter
                  </button>
                </>
              )}
            </div>
          </GlassCard>
        </motion.div>

        {/* Data Table */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <GlassCard className="p-0">
            <AnimatePresence mode="wait">
              {filteredPatients.length === 0 ? (
                /* No results for current filters */
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col items-center justify-center py-20 px-6"
                >
                  <Search className="w-16 h-16 text-slate-300 dark:text-slate-600" />
                  <p className="text-lg font-medium text-slate-600 dark:text-slate-400 mt-6">
                    Tidak ada pasien yang cocok dengan filter
                  </p>
                  <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">
                    Coba ubah kata kunci atau filter pencarian
                  </p>
                  <button
                    onClick={() => { resetFilters(); resetPage(); }}
                    className="mt-6 px-4 py-2 rounded-xl text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-lg"
                  >
                    Reset Filter
                  </button>
                </motion.div>
              ) : (
                /* Table */
                <motion.div
                  key="table"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm" role="table" aria-label="Daftar data pasien">
                      <thead>
                        <tr className="border-b border-black/[0.06] dark:border-white/[0.06]">
                          <th className="text-left py-3 px-4 font-medium text-slate-500 dark:text-slate-400 select-none first:pl-6">
                            ID Pasien
                          </th>
                          <th
                            onClick={() => handleSort("name")}
                            role="button"
                            aria-label={`Urutkan berdasarkan nama ${sortField === "name" ? (sortDirection === "asc" ? "menurun" : "menaik") : ""}`}
                            className="text-left py-3 px-4 font-medium text-slate-500 dark:text-slate-400 cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 transition-colors select-none"
                          >
                            <div className="flex items-center gap-1.5">
                              Nama
                              {renderSortIndicator("name")}
                            </div>
                          </th>
                          <th
                            onClick={() => handleSort("age")}
                            role="button"
                            aria-label={`Urutkan berdasarkan umur ${sortField === "age" ? (sortDirection === "asc" ? "menurun" : "menaik") : ""}`}
                            className="text-left py-3 px-4 font-medium text-slate-500 dark:text-slate-400 cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 transition-colors select-none"
                          >
                            <div className="flex items-center gap-1.5">
                              Umur/Gender
                              {renderSortIndicator("age")}
                            </div>
                          </th>
                          <th
                            onClick={() => handleSort("visitDate")}
                            role="button"
                            aria-label={`Urutkan berdasarkan tanggal kunjungan ${sortField === "visitDate" ? (sortDirection === "asc" ? "menurun" : "menaik") : ""}`}
                            className="text-left py-3 px-4 font-medium text-slate-500 dark:text-slate-400 cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 transition-colors select-none"
                          >
                            <div className="flex items-center gap-1.5">
                              Tanggal Kunjungan
                              {renderSortIndicator("visitDate")}
                            </div>
                          </th>
                          <th className="text-left py-3 px-4 font-medium text-slate-500 dark:text-slate-400 select-none">
                            Diagnosa
                          </th>
                          <th className="text-left py-3 px-4 font-medium text-slate-500 dark:text-slate-400 select-none last:pr-6">
                            Aksi
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedPatients.map((patient, index) => (
                          <motion.tr
                            key={patient.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2, delay: index * 0.02 }}
                            className="border-b border-black/[0.03] dark:border-white/[0.03] hover:bg-black/[0.03] dark:hover:bg-white/[0.04] transition-colors duration-200 ease-out"
                          >
                            <td className="py-3 px-4 first:pl-6">
                              <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                                {patient.id}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-medium text-slate-900 dark:text-slate-50">
                                {patient.name}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-slate-900 dark:text-slate-50">
                                  {patient.age}
                                </span>
                                <span className="text-slate-400 dark:text-slate-500">/</span>
                                {patient.gender === "Laki-laki" ? (
                                  <span className="text-blue-500" title="Laki-laki">&#9794;</span>
                                ) : (
                                  <span className="text-pink-500" title="Perempuan">&#9792;</span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                              {formatDate(patient.visitDate)}
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`text-xs px-2.5 py-1 rounded-full border whitespace-nowrap ${
                                  complaintColors[patient.diagnosis] ??
                                  "bg-slate-500/10 text-slate-500 border-slate-500/20"
                                }`}
                                title={patient.diagnosis}
                              >
                                {patient.diagnosis.length > 30
                                  ? patient.diagnosis.slice(0, 30) + "..."
                                  : patient.diagnosis}
                              </span>
                            </td>
                            <td className="py-3 px-4 last:pr-6">
                              <div className="flex items-center gap-1">
                                <Link
                                  href={`/patients/${patient.id}`}
                                  className="p-2 rounded-lg hover:bg-black/[0.05] dark:hover:bg-white/[0.05] transition-colors text-slate-500 hover:text-emerald-500"
                                  title="Lihat"
                                  aria-label={`Lihat data ${patient.name}`}
                                >
                                  <Eye className="w-4 h-4" />
                                </Link>
                                <Link
                                  href={`/patients/${patient.id}/edit`}
                                  className="p-2 rounded-lg hover:bg-black/[0.05] dark:hover:bg-white/[0.05] transition-colors text-slate-500 hover:text-blue-500"
                                  title="Edit"
                                  aria-label={`Edit data ${patient.name}`}
                                >
                                  <Pencil className="w-4 h-4" />
                                </Link>
                                <button
                                  onClick={() => setDeleteTarget(patient)}
                                  className="p-2 rounded-lg hover:bg-black/[0.05] dark:hover:bg-white/[0.05] transition-colors text-slate-500 hover:text-red-500"
                                  title="Hapus"
                                  aria-label={`Hapus data ${patient.name}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {showPagination && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-black/[0.06] dark:border-white/[0.06]">
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Menampilkan {startItem}-{endItem} dari {filteredPatients.length} pasien
                      </p>
                      <div className="flex items-center gap-2">
                        {/* Previous button */}
                        <button
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          aria-label="Halaman sebelumnya"
                          className="p-1.5 rounded-lg bg-white/50 dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.08] hover:bg-white/70 dark:hover:bg-white/[0.08] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-slate-600 dark:text-slate-400"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>

                        {/* Page numbers */}
                        {getPageNumbers().map((page, i) =>
                          page === "ellipsis" ? (
                            <span
                              key={`ellipsis-${i}`}
                              className="px-2 py-1.5 text-sm text-slate-400 dark:text-slate-500"
                            >
                              ...
                            </span>
                          ) : (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              aria-label={`Halaman ${page}`}
                              aria-current={currentPage === page ? "page" : undefined}
                              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                                currentPage === page
                                  ? "bg-blue-600 text-white shadow-md"
                                  : "bg-white/50 dark:bg-white/[0.05] hover:bg-white/70 dark:hover:bg-white/[0.08] text-slate-600 dark:text-slate-400 border border-black/[0.06] dark:border-white/[0.08]"
                              }`}
                            >
                              {page}
                            </button>
                          )
                        )}

                        {/* Next button */}
                        <button
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                          aria-label="Halaman berikutnya"
                          className="p-1.5 rounded-lg bg-white/50 dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.08] hover:bg-white/70 dark:hover:bg-white/[0.08] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-slate-600 dark:text-slate-400"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </GlassCard>
        </motion.div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
          <AlertDialogContent
            className="bg-white/90 dark:bg-slate-900/95 backdrop-blur-2xl border border-black/[0.08] dark:border-white/[0.12] rounded-2xl shadow-2xl"
          >
            <AlertDialogHeader>
              <AlertDialogTitle className="text-slate-900 dark:text-slate-50 text-lg font-semibold">
                Hapus Pasien?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-slate-500 dark:text-slate-400">
                Apakah Anda yakin ingin menghapus data{" "}
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {deleteTarget?.name}
                </span>
                ? Data yang sudah dihapus tidak dapat dikembalikan.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 text-white border-transparent"
              >
                Hapus
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PageTransition>
  );
}
