"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { PageTransition } from "@/components/layout/PageTransition";
import { GlassCard } from "@/components/shared/GlassCard";
import { motion, AnimatePresence } from "framer-motion";
import { drugs } from "@/data/drugs";
import type { Drug, SideEffect, DrugCategory } from "@/data/drugs";
import {
  Search,
  X,
  AlertTriangle,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

/* ───── Constants ───── */

const categoryColors: Record<DrugCategory, string> = {
  Analgesic: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  Antibiotic: "bg-green-500/10 text-green-500 border-green-500/20",
  Antihypertensive: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  Antihistamine: "bg-teal-500/10 text-teal-500 border-teal-500/20",
  NSAID: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  Gastrointestinal: "bg-pink-500/10 text-pink-500 border-pink-500/20",
  Antidiabetic: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  Antidepressant: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
  Bronchodilator: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
  Corticosteroid: "bg-red-500/10 text-red-500 border-red-500/20",
};

const recallStatusConfig: Record<
  string,
  { label: string; className: string }
> = {
  none: {
    label: "Aman",
    className: "bg-green-500/10 text-green-500 border-green-500/20",
  },
  watch: {
    label: "Dalam Pengawasan",
    className: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  },
  recalled: {
    label: "DITARIK",
    className: "bg-red-500/10 text-red-500 border-red-500/20",
  },
};

const severityBadgeClass: Record<string, string> = {
  Mild: "bg-green-500/10 text-green-500 border-green-500/20",
  Moderate: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  Severe: "bg-red-500/10 text-red-500 border-red-500/20",
};

function severityBarColor(severity: string): string {
  switch (severity) {
    case "Mild":
      return "#22c55e";
    case "Moderate":
      return "#f59e0b";
    case "Severe":
      return "#ef4444";
    default:
      return "#3b82f6";
  }
}

const severityTextClass: Record<string, string> = {
  Mild: "text-green-500",
  Moderate: "text-amber-500",
  Severe: "text-red-500",
};

/* ───── Custom Tooltip ───── */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function BarTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const data = payload[0];
  return (
    <div className="bg-white/80 dark:bg-slate-900/90 backdrop-blur-xl border border-black/[0.08] dark:border-white/[0.08] rounded-xl shadow-xl px-4 py-3 text-sm">
      <p className="font-medium text-slate-900 dark:text-slate-50">
        {data.payload.name}
      </p>
      <p className="text-slate-600 dark:text-slate-400 mt-1">
        Frekuensi:{" "}
        <span className="font-mono font-medium">{data.value}%</span>
      </p>
      <p className="text-slate-600 dark:text-slate-400">
        Severity:{" "}
        <span
          className={`font-medium ${severityTextClass[data.payload.severity] ?? "text-blue-500"}`}
        >
          {data.payload.severity}
        </span>
      </p>
    </div>
  );
}

/* ───── Main Component ───── */

export default function DrugSearchPage() {
  const [query, setQuery] = useState("");
  const [selectedDrug, setSelectedDrug] = useState<Drug | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>([
    "Paracetamol",
    "Ibuprofen",
    "Amoxicillin",
  ]);
  const [sortField, setSortField] = useState<keyof SideEffect | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredDrugs = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return drugs
      .filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.genericName.toLowerCase().includes(q),
      )
      .slice(0, 5);
  }, [query]);

  const sortedSideEffects = useMemo(() => {
    if (!selectedDrug) return [];
    const effects = [...selectedDrug.sideEffects];
    if (sortField) {
      effects.sort((a, b) => {
        const aVal = a[sortField];
        const bVal = b[sortField];
        if (typeof aVal === "number" && typeof bVal === "number") {
          return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
        }
        return sortDirection === "asc"
          ? String(aVal).localeCompare(String(bVal))
          : String(bVal).localeCompare(String(aVal));
      });
    }
    return effects;
  }, [selectedDrug, sortField, sortDirection]);

  const topSideEffects = useMemo(() => {
    if (!selectedDrug) return [];
    return [...selectedDrug.sideEffects]
      .sort((a, b) => b.frequencyPercent - a.frequencyPercent)
      .slice(0, 10);
  }, [selectedDrug]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = useCallback((drug: Drug) => {
    setSelectedDrug(drug);
    setQuery(drug.name);
    setShowDropdown(false);
    setHighlightedIndex(-1);
    setSortField(null);
    setRecentSearches((prev) => {
      const filtered = prev.filter((s) => s !== drug.name);
      return [drug.name, ...filtered].slice(0, 5);
    });
  }, []);

  const handleClear = useCallback(() => {
    setQuery("");
    setSelectedDrug(null);
    setShowDropdown(false);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!showDropdown || !filteredDrugs.length) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredDrugs.length - 1 ? prev + 1 : 0,
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredDrugs.length - 1,
        );
      } else if (e.key === "Enter" && highlightedIndex >= 0) {
        e.preventDefault();
        handleSelect(filteredDrugs[highlightedIndex]);
      } else if (e.key === "Escape") {
        setShowDropdown(false);
        setHighlightedIndex(-1);
      }
    },
    [showDropdown, filteredDrugs, highlightedIndex, handleSelect],
  );

  const handleSort = (field: keyof SideEffect) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setShowDropdown(val.trim().length > 0);
    setHighlightedIndex(-1);
    if (selectedDrug && val !== selectedDrug.name) {
      setSelectedDrug(null);
    }
  };

  return (
    <PageTransition>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            Drug Search
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Cari dan telusuri database obat
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <GlassCard>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={() => {
                  if (query.trim() && !selectedDrug) setShowDropdown(true);
                }}
                placeholder="Cari nama obat... (contoh: Paracetamol, Ibuprofen)"
                aria-label="Cari obat berdasarkan nama"
                className="w-full pl-12 pr-10 py-3 bg-transparent text-slate-900 dark:text-slate-50 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none text-base"
              />
              {query && (
                <button
                  onClick={handleClear}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </GlassCard>

          {/* Autocomplete Dropdown */}
          <AnimatePresence>
            {showDropdown && query.trim() && !selectedDrug && (
              <motion.div
                ref={dropdownRef}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="absolute z-50 w-full mt-2 bg-white/80 dark:bg-slate-900/90 backdrop-blur-2xl border border-black/[0.08] dark:border-white/[0.12] rounded-2xl shadow-2xl dark:shadow-[0_16px_48px_0_rgba(0,0,0,0.5)] overflow-hidden"
              >
                {filteredDrugs.length > 0 ? (
                  filteredDrugs.map((drug, index) => (
                    <button
                      key={drug.id}
                      onClick={() => handleSelect(drug)}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      aria-label={`Pilih obat ${drug.name} — ${drug.genericName}, kategori ${drug.category}`}
                      className={`w-full flex items-center gap-3 px-5 py-3 text-left transition-colors ${
                        index === highlightedIndex
                          ? "bg-blue-500/10 dark:bg-blue-500/10"
                          : "hover:bg-black/[0.03] dark:hover:bg-white/[0.03]"
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-slate-900 dark:text-slate-50">
                          {drug.name}
                        </span>
                        <span className="text-sm text-slate-500 dark:text-slate-400 ml-2">
                          {drug.genericName}
                        </span>
                      </div>
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full border ${categoryColors[drug.category]}`}
                      >
                        {drug.category}
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="px-5 py-4 text-sm text-slate-500 dark:text-slate-400">
                    Tidak ada obat yang cocok untuk &quot;{query}&quot;
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Content Area */}
        <AnimatePresence mode="wait">
          {selectedDrug ? (
            /* Drug Detail */
            <motion.div
              key="drug-detail"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Header Section */}
              <GlassCard>
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                        {selectedDrug.name}
                      </h2>
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full border ${categoryColors[selectedDrug.category]}`}
                      >
                        {selectedDrug.category}
                      </span>
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full border font-medium ${recallStatusConfig[selectedDrug.recallStatus].className}`}
                      >
                        {recallStatusConfig[selectedDrug.recallStatus].label}
                      </span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                      {selectedDrug.genericName}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                      {selectedDrug.manufacturer}
                    </p>
                  </div>
                  {selectedDrug.recallStatus !== "none" &&
                    selectedDrug.recallNote && (
                      <div
                        className={`flex items-start gap-2 p-3 rounded-xl text-sm max-w-md ${
                          selectedDrug.recallStatus === "recalled"
                            ? "bg-red-500/10 text-red-600 dark:text-red-400"
                            : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        }`}
                      >
                        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <p>{selectedDrug.recallNote}</p>
                      </div>
                    )}
                </div>
              </GlassCard>

              {/* Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <GlassCard variant="subtle">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Bentuk & Dosis
                  </p>
                  <p className="text-slate-900 dark:text-slate-50 font-medium">
                    {selectedDrug.dosageForm} &mdash; {selectedDrug.strength}
                  </p>
                </GlassCard>
                <GlassCard variant="subtle">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Aturan Pakai
                  </p>
                  <p className="text-slate-900 dark:text-slate-50 font-medium">
                    {selectedDrug.usage}
                  </p>
                </GlassCard>
              </div>

              {/* Side Effects Table */}
              <GlassCard>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">
                  Efek Samping
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-black/[0.06] dark:border-white/[0.06]">
                        {(
                          [
                            { key: "name", label: "Efek Samping" },
                            { key: "frequency", label: "Frekuensi" },
                            { key: "frequencyPercent", label: "Persentase" },
                            { key: "severity", label: "Severity" },
                          ] as const
                        ).map((col) => (
                          <th
                            key={col.key}
                            onClick={() =>
                              handleSort(col.key as keyof SideEffect)
                            }
                            className="text-left py-3 px-4 font-medium text-slate-500 dark:text-slate-400 cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 transition-colors select-none"
                          >
                            <div className="flex items-center gap-1.5">
                              {col.label}
                              {sortField === col.key ? (
                                sortDirection === "asc" ? (
                                  <ChevronUp className="w-3 h-3 text-blue-500" />
                                ) : (
                                  <ChevronDown className="w-3 h-3 text-blue-500" />
                                )
                              ) : (
                                <ArrowUpDown className="w-3 h-3 text-slate-400" />
                              )}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sortedSideEffects.map((effect) => (
                        <tr
                          key={effect.name}
                          className="border-b border-black/[0.03] dark:border-white/[0.03] hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
                        >
                          <td className="py-3 px-4 font-medium text-slate-900 dark:text-slate-50">
                            {effect.name}
                          </td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                            {effect.frequency}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-900 dark:text-slate-50">
                            {effect.frequencyPercent}%
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`text-xs px-2.5 py-1 rounded-full border ${severityBadgeClass[effect.severity]}`}
                            >
                              {effect.severity}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </GlassCard>

              {/* Bar Chart */}
              <GlassCard>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">
                  Top Efek Samping (Frekuensi %)
                </h3>
                <div role="img" aria-label={`Grafik batang menampilkan top ${topSideEffects.length} efek samping berdasarkan frekuensi untuk ${selectedDrug.name}`}>
                  <ResponsiveContainer
                    width="100%"
                    height={Math.max(topSideEffects.length * 44, 200)}
                  >
                    <BarChart
                      layout="vertical"
                      data={topSideEffects}
                      margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(148,163,184,0.1)"
                        horizontal={false}
                      />
                      <XAxis
                        type="number"
                        tick={{ fill: "#94a3b8", fontSize: 12 }}
                        axisLine={{ stroke: "rgba(148,163,184,0.2)" }}
                        tickLine={false}
                        unit="%"
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={140}
                        tick={{ fill: "#94a3b8", fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip content={<BarTooltip />} />
                      <Bar
                        dataKey="frequencyPercent"
                        radius={[0, 4, 4, 0]}
                        barSize={20}
                      >
                        {topSideEffects.map((entry, index) => (
                          <Cell
                            key={index}
                            fill={severityBarColor(entry.severity)}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>
            </motion.div>
          ) : (
            /* Empty State */
            <motion.div
              key="empty-state"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Recent Searches */}
              {recentSearches.length > 0 && !query && (
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">
                    Pencarian Terakhir
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((term) => (
                      <button
                        key={term}
                        onClick={() => {
                          const drug = drugs.find(
                            (d) =>
                              d.name.toLowerCase() === term.toLowerCase(),
                          );
                          if (drug) handleSelect(drug);
                        }}
                        className="px-4 py-2 rounded-full text-sm font-medium
                          bg-white/70 dark:bg-white/[0.05] backdrop-blur-xl
                          border border-black/[0.06] dark:border-white/[0.08]
                          text-slate-700 dark:text-slate-300
                          hover:bg-white/80 dark:hover:bg-white/[0.08]
                          hover:border-black/[0.1] dark:hover:border-white/[0.12]
                          transition-all duration-200"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty Illustration */}
              <div className="flex flex-col items-center justify-center py-20">
                {query.trim() && filteredDrugs.length === 0 ? (
                  <>
                    <Search className="w-20 h-20 text-slate-300 dark:text-slate-600" />
                    <p className="text-lg font-medium text-slate-600 dark:text-slate-400 mt-6">
                      Tidak ditemukan obat untuk &quot;{query}&quot;
                    </p>
                    <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">
                      Coba kata kunci lain atau periksa ejaan
                    </p>
                  </>
                ) : (
                  <>
                    <motion.div
                      animate={{ opacity: [0.3, 0.6, 0.3] }}
                      transition={{
                        repeat: Infinity,
                        duration: 3,
                        ease: "easeInOut",
                      }}
                    >
                      <Search className="w-20 h-20 text-slate-300 dark:text-slate-600" />
                    </motion.div>
                    <p className="text-lg font-medium text-slate-600 dark:text-slate-400 mt-6">
                      Ketik nama obat untuk mulai pencarian
                    </p>
                    <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">
                      Database berisi {drugs.length} obat dengan informasi efek
                      samping lengkap
                    </p>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}
