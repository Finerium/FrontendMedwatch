"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { PageTransition } from "@/components/layout/PageTransition";
import { GlassCard } from "@/components/shared/GlassCard";
import { AnimatedCounter } from "@/components/shared/AnimatedCounter";
import { motion, AnimatePresence } from "framer-motion";
import { drugs } from "@/data/drugs";
import type { Drug } from "@/data/drugs";
import { checkDrugSafety } from "@/lib/safety-checker";
import type { SafetyResult } from "@/lib/safety-checker";
import { useHydratedPatientStore } from "@/lib/use-hydrated-store";
import {
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  XCircle,
  X,
  RotateCcw,
  Search,
  User,
  ChevronDown,
} from "lucide-react";

/* ───── Helpers ───── */

function getScoreColor(score: number): string {
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

const interactionBadgeColor: Record<string, string> = {
  Major: "bg-red-500/10 text-red-500 border-red-500/20",
  Moderate: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  Minor: "bg-blue-500/10 text-blue-500 border-blue-500/20",
};

/* ───── Severity styling for SafetyResult cards ───── */

const resultSeverityStyles: Record<SafetyResult["severity"], string> = {
  safe: "border-green-500/30 bg-green-500/5",
  caution: "border-yellow-500/30 bg-yellow-500/5",
  warning: "border-orange-500/30 bg-orange-500/5",
  danger: "border-red-500/30 bg-red-500/5",
};

const resultSeverityBadge: Record<SafetyResult["severity"], string> = {
  safe: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
  caution: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
  warning: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
  danger: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
};

const resultSeverityLabel: Record<SafetyResult["severity"], string> = {
  safe: "Aman",
  caution: "Perhatian",
  warning: "Peringatan",
  danger: "Berbahaya",
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
        {/* Foreground animated circle -- hex color required for SVG stroke */}
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

/* ───── Safety Score from SafetyResults ───── */

function calculateSafetyScoreFromResults(results: SafetyResult[]): number {
  let score = 100;
  for (const r of results) {
    if (r.severity === "danger") score -= 30;
    else if (r.severity === "warning") score -= 15;
    else if (r.severity === "caution") score -= 8;
    if (r.recallStatus === "recalled") score -= 10;
    for (const interaction of r.interactions) {
      if (interaction.severity === "Major") score -= 5;
      else if (interaction.severity === "Moderate") score -= 3;
    }
  }
  return Math.max(0, Math.min(100, score));
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

/* ───── Tab Type ───── */

type Tab = "manual" | "patient";

/* ───── Result Cards Component ───── */

function SafetyResultCards({ results }: { results: SafetyResult[] }) {
  const score = calculateSafetyScoreFromResults(results);

  return (
    <motion.div
      key="results"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Safety Score Gauge */}
      <GlassCard className="flex justify-center py-8">
        <SafetyGauge score={score} />
      </GlassCard>

      {/* Per-drug result cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-4"
      >
        {results.map((result, index) => (
          <motion.div key={`${result.drugName}-${index}`} variants={itemVariants}>
            <div
              className={`rounded-2xl border p-5 backdrop-blur-sm ${resultSeverityStyles[result.severity]}`}
            >
              {/* Header: drug name + severity badge */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                  {result.drugName}
                </h3>
                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-full border flex-shrink-0 ${resultSeverityBadge[result.severity]}`}
                >
                  {resultSeverityLabel[result.severity]}
                </span>
              </div>

              {/* Recall status */}
              {result.recallStatus === "recalled" && (
                <div className="flex items-center gap-2 mb-3 text-sm text-red-600 dark:text-red-400">
                  <XCircle className="w-4 h-4 flex-shrink-0" />
                  <span className="font-medium">Ditarik dari peredaran</span>
                </div>
              )}

              {/* Side effects */}
              {result.sideEffects.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                    Efek Samping
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.sideEffects.slice(0, 6).map((se) => {
                      const sev = se.severity as keyof typeof severityConfig;
                      const config = severityConfig[sev] ?? severityConfig.Mild;
                      return (
                        <span
                          key={se.name}
                          className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-white/40 dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06] text-slate-700 dark:text-slate-300"
                        >
                          <span
                            className={`inline-block w-1.5 h-1.5 rounded-full flex-shrink-0 ${config.bullet}`}
                          />
                          {se.name}
                          <span className="text-slate-400 dark:text-slate-500 font-mono">
                            {se.frequencyPercent}%
                          </span>
                        </span>
                      );
                    })}
                    {result.sideEffects.length > 6 && (
                      <span className="text-xs text-slate-400 dark:text-slate-500 self-center">
                        +{result.sideEffects.length - 6} lainnya
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Interactions */}
              {result.interactions.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                    Interaksi
                  </p>
                  <div className="space-y-1.5">
                    {result.interactions.map((interaction, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300"
                      >
                        <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-amber-500" />
                        <div>
                          <span className="font-medium">{interaction.withDrug}</span>
                          <span className="text-slate-500 dark:text-slate-400">
                            {" "}&mdash; {interaction.description}
                          </span>
                          <span
                            className={`ml-2 text-xs px-1.5 py-0.5 rounded border font-medium ${
                              interactionBadgeColor[interaction.severity] ??
                              "bg-slate-500/10 text-slate-500 border-slate-500/20"
                            }`}
                          >
                            {interaction.severity}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendation */}
              <div className="pt-2 border-t border-black/[0.04] dark:border-white/[0.06]">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  <span className="font-medium text-slate-700 dark:text-slate-300">Rekomendasi:</span>{" "}
                  {result.recommendation}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}

/* ───── Main Component ───── */

export default function SafetyCheckerPage() {
  const [activeTab, setActiveTab] = useState<Tab>("manual");

  // Manual tab state
  const [query, setQuery] = useState("");
  const [selectedDrugs, setSelectedDrugs] = useState<Drug[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [hasChecked, setHasChecked] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [manualResults, setManualResults] = useState<SafetyResult[]>([]);

  // Patient tab state
  const { patients, hydrated } = useHydratedPatientStore();
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [patientResults, setPatientResults] = useState<SafetyResult[]>([]);
  const [isCheckingPatient, setIsCheckingPatient] = useState(false);
  const [hasCheckedPatient, setHasCheckedPatient] = useState(false);

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

  const selectedPatient = useMemo(
    () => patients.find((p) => p.id === selectedPatientId),
    [patients, selectedPatientId]
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

  // Auto-check when patient is selected
  useEffect(() => {
    if (!selectedPatientId || !selectedPatient) {
      const t = setTimeout(() => { setPatientResults([]); setHasCheckedPatient(false); }, 0);
      return () => clearTimeout(t);
    }

    if (selectedPatient.prescribedDrugs.length === 0) {
      const t = setTimeout(() => { setPatientResults([]); setHasCheckedPatient(true); }, 0);
      return () => clearTimeout(t);
    }

    const startTimer = setTimeout(() => setIsCheckingPatient(true), 0);
    const timer = setTimeout(() => {
      const results = checkDrugSafety(selectedPatient.prescribedDrugs);
      setPatientResults(results);
      setHasCheckedPatient(true);
      setIsCheckingPatient(false);
    }, 600);

    return () => { clearTimeout(startTimer); clearTimeout(timer); };
  }, [selectedPatientId, selectedPatient]);

  const handleSelect = useCallback(
    (drug: Drug) => {
      if (selectedDrugs.length >= 5) return;
      setSelectedDrugs((prev) => [...prev, drug]);
      setQuery("");
      setShowDropdown(false);
      setHighlightedIndex(-1);
      setHasChecked(false);
      setManualResults([]);
      inputRef.current?.focus();
    },
    [selectedDrugs.length]
  );

  const handleRemoveDrug = useCallback((drugId: string) => {
    setSelectedDrugs((prev) => prev.filter((d) => d.id !== drugId));
    setHasChecked(false);
    setManualResults([]);
  }, []);

  const handleReset = useCallback(() => {
    setSelectedDrugs([]);
    setQuery("");
    setHasChecked(false);
    setManualResults([]);
    setShowDropdown(false);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  }, []);

  const handleCheck = useCallback(() => {
    if (selectedDrugs.length === 0) return;
    setIsChecking(true);
    // Simulate checking delay for visual polish
    setTimeout(() => {
      const drugNames = selectedDrugs.map((d) => d.name);
      const results = checkDrugSafety(drugNames);
      setManualResults(results);
      setIsChecking(false);
      setHasChecked(true);
    }, 800);
  }, [selectedDrugs]);

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

        {/* Tab Switcher */}
        <div className="inline-flex items-center p-1 rounded-xl bg-white/50 dark:bg-white/[0.04] backdrop-blur-lg border border-black/[0.06] dark:border-white/[0.08]">
          <button
            onClick={() => setActiveTab("manual")}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === "manual"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            Cek Manual
          </button>
          <button
            onClick={() => setActiveTab("patient")}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === "patient"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            Cek Pasien
          </button>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === "manual" ? (
            <motion.div
              key="tab-manual"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
            >
              {/* Input Section */}
              <GlassCard>
                <div className="space-y-4">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                      Cek Manual
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      Pilih obat secara manual untuk diperiksa keamanannya
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
                {hasChecked && manualResults.length > 0 ? (
                  <SafetyResultCards results={manualResults} />
                ) : (
                  <motion.div
                    key="empty-state-manual"
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
            </motion.div>
          ) : (
            <motion.div
              key="tab-patient"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
            >
              {/* Patient Selection */}
              <GlassCard>
                <div className="space-y-4">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                      Cek Pasien
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      Pilih pasien untuk memeriksa keamanan obat yang diresepkan
                    </p>
                  </div>

                  {/* Patient Dropdown */}
                  {!hydrated ? (
                    // Skeleton loader while store is hydrating
                    <div className="space-y-3">
                      <div className="h-12 rounded-xl bg-slate-200/50 dark:bg-white/[0.04] animate-pulse" />
                      <div className="h-24 rounded-xl bg-slate-200/50 dark:bg-white/[0.04] animate-pulse" />
                    </div>
                  ) : (
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none z-10" />
                      <select
                        value={selectedPatientId}
                        onChange={(e) => setSelectedPatientId(e.target.value)}
                        aria-label="Pilih pasien"
                        className="w-full appearance-none pl-12 pr-10 py-3 bg-white/50 dark:bg-white/[0.03] backdrop-blur-lg border border-black/[0.06] dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all text-base cursor-pointer"
                      >
                        <option value="" className="dark:bg-slate-900">Pilih pasien...</option>
                        {patients.map((patient) => (
                          <option key={patient.id} value={patient.id} className="dark:bg-slate-900">
                            {patient.name} ({patient.age} th) - {patient.diagnosis}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                    </div>
                  )}
                </div>
              </GlassCard>

              {/* Patient Info Card */}
              <AnimatePresence mode="wait">
                {selectedPatient && (
                  <motion.div
                    key={`patient-info-${selectedPatient.id}`}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                  >
                    <GlassCard variant="subtle">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                          <User className="w-5 h-5 text-blue-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50">
                            {selectedPatient.name}
                          </h3>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                            <span className="text-sm text-slate-500 dark:text-slate-400">
                              {selectedPatient.age} tahun
                            </span>
                            <span className="text-sm text-slate-500 dark:text-slate-400">
                              {selectedPatient.gender}
                            </span>
                            <span className="text-sm text-slate-500 dark:text-slate-400">
                              {selectedPatient.diagnosis}
                            </span>
                          </div>
                          {selectedPatient.prescribedDrugs.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {selectedPatient.prescribedDrugs.map((drug) => (
                                <span
                                  key={drug}
                                  className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                                >
                                  {drug}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </GlassCard>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Checking indicator */}
              <AnimatePresence mode="wait">
                {isCheckingPatient && (
                  <motion.div
                    key="checking-patient"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center py-16"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    >
                      <ShieldCheck className="w-12 h-12 text-blue-500" />
                    </motion.div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-4">
                      Memeriksa keamanan obat pasien...
                    </p>
                  </motion.div>
                )}

                {/* Patient Results */}
                {!isCheckingPatient && hasCheckedPatient && patientResults.length > 0 && (
                  <SafetyResultCards results={patientResults} />
                )}

                {/* Patient has no drugs */}
                {!isCheckingPatient && hasCheckedPatient && selectedPatient && patientResults.length === 0 && (
                  <motion.div
                    key="no-drugs-patient"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col items-center justify-center py-16"
                  >
                    <CheckCircle className="w-16 h-16 text-slate-300 dark:text-slate-600" />
                    <p className="text-lg font-medium text-slate-600 dark:text-slate-400 mt-4 text-center">
                      Tidak ada obat yang diresepkan
                    </p>
                    <p className="text-sm text-slate-400 dark:text-slate-500 mt-1 text-center">
                      Pasien ini belum memiliki obat yang perlu diperiksa
                    </p>
                  </motion.div>
                )}

                {/* Empty State: no patient selected */}
                {!isCheckingPatient && !selectedPatientId && (
                  <motion.div
                    key="empty-state-patient"
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
                      <User className="w-20 h-20 text-slate-300 dark:text-slate-600" />
                    </motion.div>
                    <p className="text-lg font-medium text-slate-600 dark:text-slate-400 mt-6 text-center">
                      Pilih pasien untuk memeriksa keamanan
                    </p>
                    <p className="text-sm text-slate-400 dark:text-slate-500 mt-2 text-center max-w-md">
                      Obat yang diresepkan pada pasien akan diperiksa secara otomatis
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}
