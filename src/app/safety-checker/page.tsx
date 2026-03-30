"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { PageTransition } from "@/components/layout/PageTransition";
import { GlassCard } from "@/components/shared/GlassCard";
import { AnimatedCounter } from "@/components/shared/AnimatedCounter";
import { motion, AnimatePresence } from "framer-motion";
import { drugs } from "@/data/drugs";
import type { Drug, SideEffect } from "@/data/drugs";
import { interactionNetwork } from "@/data/interactions";
import type { DrugEdge } from "@/data/interactions";
import {
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  XCircle,
  X,
  RotateCcw,
  Search,
} from "lucide-react";

/* ───── Helpers ───── */

function findInteractions(selectedIds: string[]): DrugEdge[] {
  if (selectedIds.length < 2) return [];
  const idSet = new Set(selectedIds);
  return interactionNetwork.edges.filter(
    (edge) => idSet.has(edge.source) && idSet.has(edge.target)
  );
}

function calculateSafetyScore(
  selectedDrugs: Drug[],
  interactions: DrugEdge[]
): number {
  let score = 100;
  for (const drug of selectedDrugs) {
    if (drug.recallStatus === "recalled") score -= 40;
    if (drug.recallStatus === "watch") score -= 15;
  }
  for (const interaction of interactions) {
    if (interaction.severity === "Major") score -= 20;
    else if (interaction.severity === "Moderate") score -= 10;
    else if (interaction.severity === "Minor") score -= 5;
  }
  return Math.max(0, Math.min(100, score));
}

function getScoreColor(score: number): string {
  // Hex values used for SVG stroke attributes where Tailwind classes cannot apply
  if (score >= 90) return "#22c55e";
  if (score >= 70) return "#f59e0b";
  if (score >= 40) return "#f59e0b";
  return "#ef4444";
}

function getScoreTailwindColor(score: number): string {
  if (score >= 90) return "text-green-500";
  if (score >= 70) return "text-amber-500";
  if (score >= 40) return "text-amber-500";
  return "text-red-500";
}

function getScoreLabel(score: number): string {
  if (score >= 90) return "Aman";
  if (score >= 70) return "Perhatian Ringan";
  if (score >= 40) return "Perhatian Sedang";
  return "Berbahaya";
}

function getDrugNameById(id: string): string {
  const drug = drugs.find((d) => d.id === id);
  return drug?.name ?? id;
}

function groupSideEffectsBySeverity(
  sideEffects: SideEffect[]
): Record<string, SideEffect[]> {
  const groups: Record<string, SideEffect[]> = {
    Severe: [],
    Moderate: [],
    Mild: [],
  };
  for (const effect of sideEffects) {
    groups[effect.severity]?.push(effect);
  }
  return groups;
}

const severityConfig = {
  Severe: {
    color: "text-red-500",
    bullet: "bg-red-500",
    label: "Berat",
  },
  Moderate: {
    color: "text-amber-500",
    bullet: "bg-amber-500",
    label: "Sedang",
  },
  Mild: {
    color: "text-green-500",
    bullet: "bg-green-500",
    label: "Ringan",
  },
} as const;

const interactionBorderColor: Record<string, string> = {
  Major: "border-l-red-500",
  Moderate: "border-l-amber-500",
  Minor: "border-l-blue-500",
};

const interactionBadgeColor: Record<string, string> = {
  Major: "bg-red-500/10 text-red-500 border-red-500/20",
  Moderate: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  Minor: "bg-blue-500/10 text-blue-500 border-blue-500/20",
};

/* ───── SVG Safety Gauge ───── */

interface SafetyGaugeProps {
  score: number;
}

function SafetyGauge({ score }: SafetyGaugeProps) {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const color = getScoreColor(score);
  const tailwindColor = getScoreTailwindColor(score);

  return (
    <div
      className="flex flex-col items-center"
      role="img"
      aria-label={`Skor keamanan: ${score} dari 100, status: ${getScoreLabel(score)}`}
    >
      <svg width="160" height="160" viewBox="0 0 160 160" className="-rotate-90" aria-hidden="true">
        {/* Background circle */}
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke="currentColor"
          className="text-slate-200 dark:text-white/[0.08]"
          strokeWidth="10"
        />
        {/* Foreground animated circle — hex color required for SVG stroke */}
        <motion.circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
        />
      </svg>
      {/* Center content overlaid */}
      <div className="flex flex-col items-center -mt-[116px] mb-[40px]" aria-hidden="true">
        <AnimatedCounter
          value={score}
          duration={1200}
          className="text-4xl font-bold font-mono text-slate-900 dark:text-slate-50"
        />
        <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Skor Keamanan
        </span>
        <span
          className={`text-sm font-semibold mt-1 ${tailwindColor}`}
        >
          {getScoreLabel(score)}
        </span>
      </div>
    </div>
  );
}

/* ───── Stagger Variants ───── */

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" as const },
  },
};

/* ───── Main Component ───── */

export default function SafetyCheckerPage() {
  const [query, setQuery] = useState("");
  const [selectedDrugs, setSelectedDrugs] = useState<Drug[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [hasChecked, setHasChecked] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedIds = useMemo(
    () => selectedDrugs.map((d) => d.id),
    [selectedDrugs]
  );

  const filteredDrugs = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return drugs
      .filter(
        (d) =>
          !selectedIds.includes(d.id) &&
          (d.name.toLowerCase().includes(q) ||
            d.genericName.toLowerCase().includes(q))
      )
      .slice(0, 6);
  }, [query, selectedIds]);

  const interactions = useMemo(
    () => findInteractions(selectedIds),
    [selectedIds]
  );

  const safetyScore = useMemo(
    () => calculateSafetyScore(selectedDrugs, interactions),
    [selectedDrugs, interactions]
  );

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

  const handleSelect = useCallback(
    (drug: Drug) => {
      if (selectedDrugs.length >= 5) return;
      setSelectedDrugs((prev) => [...prev, drug]);
      setQuery("");
      setShowDropdown(false);
      setHighlightedIndex(-1);
      setHasChecked(false);
      inputRef.current?.focus();
    },
    [selectedDrugs.length]
  );

  const handleRemoveDrug = useCallback((drugId: string) => {
    setSelectedDrugs((prev) => prev.filter((d) => d.id !== drugId));
    setHasChecked(false);
  }, []);

  const handleReset = useCallback(() => {
    setSelectedDrugs([]);
    setQuery("");
    setHasChecked(false);
    setShowDropdown(false);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  }, []);

  const handleCheck = useCallback(() => {
    if (selectedDrugs.length === 0) return;
    setIsChecking(true);
    // Simulate checking delay for visual polish
    setTimeout(() => {
      setIsChecking(false);
      setHasChecked(true);
    }, 800);
  }, [selectedDrugs.length]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!showDropdown || !filteredDrugs.length) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredDrugs.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredDrugs.length - 1
        );
      } else if (e.key === "Enter" && highlightedIndex >= 0) {
        e.preventDefault();
        handleSelect(filteredDrugs[highlightedIndex]);
      } else if (e.key === "Escape") {
        setShowDropdown(false);
        setHighlightedIndex(-1);
      }
    },
    [showDropdown, filteredDrugs, highlightedIndex, handleSelect]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setShowDropdown(val.trim().length > 0);
    setHighlightedIndex(-1);
  };

  return (
    <PageTransition>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            Safety Checker
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Periksa keamanan obat dan potensi interaksi
          </p>
        </div>

        {/* Input Section */}
        <GlassCard>
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                Safety Checker
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Periksa keamanan obat dan potensi interaksi
              </p>
            </div>

            {/* Autocomplete Input */}
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  onFocus={() => {
                    if (query.trim()) setShowDropdown(true);
                  }}
                  placeholder="Masukkan nama obat..."
                  aria-label="Cari nama obat untuk diperiksa keamanannya"
                  disabled={selectedDrugs.length >= 5}
                  className="w-full pl-12 pr-10 py-3 bg-white/50 dark:bg-white/[0.03] backdrop-blur-lg border border-black/[0.06] dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-slate-50 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all text-base disabled:opacity-50 disabled:cursor-not-allowed"
                />
                {query && (
                  <button
                    onClick={() => {
                      setQuery("");
                      setShowDropdown(false);
                      inputRef.current?.focus();
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Autocomplete Dropdown */}
              <AnimatePresence>
                {showDropdown && query.trim() && (
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
                          <span className="text-xs px-2.5 py-1 rounded-full border text-slate-500 dark:text-slate-400 border-black/[0.06] dark:border-white/[0.08]">
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

            {/* Selected Drug Pills */}
            {selectedDrugs.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <AnimatePresence>
                  {selectedDrugs.map((drug) => (
                    <motion.span
                      key={drug.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.2 }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium bg-white/50 dark:bg-white/[0.03] backdrop-blur-lg border border-black/[0.06] dark:border-white/[0.08] text-slate-700 dark:text-slate-300"
                    >
                      {drug.name}
                      <button
                        onClick={() => handleRemoveDrug(drug.id)}
                        className="ml-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </motion.span>
                  ))}
                </AnimatePresence>
                {selectedDrugs.length >= 5 && (
                  <span className="text-xs text-slate-400 dark:text-slate-500 self-center ml-1">
                    Maks. 5 obat
                  </span>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleCheck}
                disabled={selectedDrugs.length === 0 || isChecking}
                aria-label="Periksa keamanan obat yang dipilih"
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white font-medium rounded-xl shadow-lg shadow-blue-600/25 hover:shadow-xl hover:shadow-blue-600/30 transition-all duration-200 text-sm"
              >
                {isChecking ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <ShieldCheck className="w-4 h-4" />
                  </motion.div>
                ) : (
                  <ShieldCheck className="w-4 h-4" />
                )}
                {isChecking ? "Memeriksa..." : "Periksa Keamanan"}
              </button>
              {selectedDrugs.length > 0 && (
                <button
                  onClick={handleReset}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium rounded-xl transition-colors duration-200 text-sm"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset
                </button>
              )}
            </div>
          </div>
        </GlassCard>

        {/* Results or Empty State */}
        <AnimatePresence mode="wait">
          {hasChecked && selectedDrugs.length > 0 ? (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              {/* Safety Score Gauge */}
              <GlassCard className="flex justify-center py-8">
                <SafetyGauge score={safetyScore} />
              </GlassCard>

              {/* Recall Status Cards */}
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">
                  Status Recall
                </h2>
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="space-y-3"
                >
                  {selectedDrugs.map((drug) => (
                    <motion.div key={drug.id} variants={itemVariants}>
                      {drug.recallStatus === "none" && (
                        <div
                          role="status"
                          aria-label={`${drug.name}: Aman, tidak ada recall`}
                          className="flex items-start gap-3 bg-green-500/10 border border-green-500/20 rounded-xl p-4"
                        >
                          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
                          <div>
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-50">
                              {drug.name}{" "}
                              <span className="font-normal text-slate-600 dark:text-slate-400">
                                &mdash; Tidak ada recall. Aman digunakan.
                              </span>
                            </p>
                          </div>
                        </div>
                      )}
                      {drug.recallStatus === "watch" && (
                        <div
                          role="status"
                          aria-label={`${drug.name}: Dalam pengawasan`}
                          className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4"
                        >
                          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
                          <div>
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-50">
                              {drug.name}{" "}
                              <span className="font-normal text-slate-600 dark:text-slate-400">
                                &mdash; Dalam Pengawasan
                              </span>
                            </p>
                            {drug.recallNote && (
                              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                                {drug.recallNote}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                      {drug.recallStatus === "recalled" && (
                        <div
                          role="alert"
                          aria-label={`${drug.name}: Ditarik dari peredaran`}
                          className="relative flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-4"
                        >
                          <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-slate-900 dark:text-slate-50">
                                {drug.name}{" "}
                                <span className="font-normal text-red-600 dark:text-red-400">
                                  &mdash; DITARIK DARI PEREDARAN
                                </span>
                              </p>
                              <motion.span
                                animate={{ opacity: [1, 0.3, 1] }}
                                transition={{
                                  duration: 1.5,
                                  repeat: Infinity,
                                  ease: "easeInOut",
                                }}
                                className="inline-block w-2 h-2 rounded-full bg-red-500"
                                aria-hidden="true"
                              />
                            </div>
                            {drug.recallNote && (
                              <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                                {drug.recallNote}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </motion.div>
              </div>

              {/* Side Effect Summary */}
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">
                  Ringkasan Efek Samping
                </h2>
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                >
                  {selectedDrugs.map((drug) => {
                    const groups = groupSideEffectsBySeverity(drug.sideEffects);
                    return (
                      <motion.div key={drug.id} variants={itemVariants}>
                        <GlassCard className="h-full">
                          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50 mb-4">
                            Efek Samping {drug.name}
                          </h3>
                          <div className="space-y-4">
                            {(
                              ["Severe", "Moderate", "Mild"] as const
                            ).map((severity) => {
                              const effects = groups[severity];
                              if (!effects || effects.length === 0) return null;
                              const config = severityConfig[severity];
                              return (
                                <div key={severity}>
                                  <p
                                    className={`text-xs font-semibold uppercase tracking-wider mb-2 ${config.color}`}
                                  >
                                    {config.label} ({effects.length})
                                  </p>
                                  <ul className="space-y-1.5">
                                    {effects.map((effect) => (
                                      <li
                                        key={effect.name}
                                        className="flex items-center gap-2 text-sm"
                                      >
                                        <span
                                          className={`inline-block w-1.5 h-1.5 rounded-full flex-shrink-0 ${config.bullet}`}
                                        />
                                        <span className="text-slate-700 dark:text-slate-300">
                                          {effect.name}
                                        </span>
                                        <span className="font-mono text-xs text-slate-500 dark:text-slate-400 ml-auto">
                                          {effect.frequencyPercent}%
                                        </span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              );
                            })}
                          </div>
                        </GlassCard>
                      </motion.div>
                    );
                  })}
                </motion.div>
              </div>

              {/* Interaction Warnings */}
              {selectedDrugs.length >= 2 && (
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">
                    Interaksi Obat
                  </h2>
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="space-y-3"
                  >
                    {interactions.length > 0 ? (
                      interactions.map((interaction, index) => (
                        <motion.div key={index} variants={itemVariants}>
                          <GlassCard
                            role={interaction.severity === "Major" ? "alert" : "status"}
                            aria-label={`Interaksi ${interaction.severity}: ${getDrugNameById(interaction.source)} dan ${getDrugNameById(interaction.target)}`}
                            className={`border-l-4 ${interactionBorderColor[interaction.severity]}`}
                          >
                            <div className="flex items-start justify-between gap-3 flex-wrap">
                              <div className="space-y-1">
                                <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                                  {getDrugNameById(interaction.source)} +{" "}
                                  {getDrugNameById(interaction.target)}
                                </p>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                  {interaction.description}
                                </p>
                              </div>
                              <span
                                className={`text-xs px-2.5 py-1 rounded-full border font-medium flex-shrink-0 ${interactionBadgeColor[interaction.severity]}`}
                              >
                                {interaction.severity}
                              </span>
                            </div>
                          </GlassCard>
                        </motion.div>
                      ))
                    ) : (
                      <motion.div variants={itemVariants}>
                        <div
                          role="status"
                          aria-label="Tidak ditemukan interaksi berbahaya"
                          className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 rounded-xl p-4"
                        >
                          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" aria-hidden="true" />
                          <p className="text-sm text-slate-700 dark:text-slate-300">
                            Tidak ditemukan interaksi berbahaya antara obat yang
                            dipilih
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                </div>
              )}
            </motion.div>
          ) : (
            /* Empty State */
            <motion.div
              key="empty-state"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <motion.div
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{
                  repeat: Infinity,
                  duration: 3,
                  ease: "easeInOut",
                }}
              >
                <ShieldCheck className="w-20 h-20 text-slate-300 dark:text-slate-600" />
              </motion.div>
              <p className="text-lg font-medium text-slate-600 dark:text-slate-400 mt-6 text-center">
                Masukkan obat untuk memeriksa keamanan
              </p>
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-2 text-center max-w-md">
                Safety Checker akan memeriksa status recall, efek samping, dan
                interaksi antar obat
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}
