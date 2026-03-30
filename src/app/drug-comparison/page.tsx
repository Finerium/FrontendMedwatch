"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { PageTransition } from "@/components/layout/PageTransition";
import { GlassCard } from "@/components/shared/GlassCard";
import { motion, AnimatePresence } from "framer-motion";
import { drugs } from "@/data/drugs";
import type { Drug, DrugCategory } from "@/data/drugs";
import { GitCompare, ChevronDown, RotateCcw } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
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

const drugColors = ["#3b82f6", "#8b5cf6", "#06b6d4"];

const radarAxes = [
  "Mual",
  "Pusing",
  "Sakit Kepala",
  "Diare",
  "Nyeri Lambung",
];

/* ───── Custom Tooltip ───── */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ComparisonTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white/80 dark:bg-slate-900/90 backdrop-blur-xl border border-black/[0.08] dark:border-white/[0.08] rounded-xl shadow-xl px-4 py-3 text-sm">
      <p className="font-medium text-slate-900 dark:text-slate-50 mb-2">
        {label}
      </p>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {payload.map((entry: any) => (
        <p key={entry.name} className="text-slate-600 dark:text-slate-400">
          <span style={{ color: entry.color }}>●</span> {entry.name}:{" "}
          <span className="font-mono font-medium">{entry.value}%</span>
        </p>
      ))}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function RadarTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white/80 dark:bg-slate-900/90 backdrop-blur-xl border border-black/[0.08] dark:border-white/[0.08] rounded-xl shadow-xl px-4 py-3 text-sm">
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {payload.map((entry: any) => (
        <p key={entry.name} className="text-slate-600 dark:text-slate-400">
          <span style={{ color: entry.color }}>●</span> {entry.name}:{" "}
          <span className="font-mono font-medium">{entry.value}%</span>
        </p>
      ))}
    </div>
  );
}

/* ───── Drug Selector Dropdown ───── */

interface DrugSelectorProps {
  label: string;
  selectedDrug: Drug | null;
  onSelect: (drug: Drug | null) => void;
  isOpen: boolean;
  onToggle: () => void;
  excludeIds: string[];
}

function DrugSelector({
  label,
  selectedDrug,
  onSelect,
  isOpen,
  onToggle,
  excludeIds,
}: DrugSelectorProps) {
  const availableDrugs = drugs.filter((d) => !excludeIds.includes(d.id));

  return (
    <div className="relative">
      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
        {label}
      </label>
      <button
        onClick={onToggle}
        aria-label={`${label}: ${selectedDrug ? selectedDrug.name : 'Pilih obat'}`}
        aria-expanded={isOpen}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl
          bg-white/50 dark:bg-white/[0.03]
          backdrop-blur-lg
          border border-black/[0.06] dark:border-white/[0.08]
          hover:bg-white/70 dark:hover:bg-white/[0.06]
          hover:border-black/[0.1] dark:hover:border-white/[0.12]
          transition-all duration-200 text-left"
      >
        {selectedDrug ? (
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="font-medium text-slate-900 dark:text-slate-50 truncate">
              {selectedDrug.name}
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full border whitespace-nowrap ${categoryColors[selectedDrug.category]}`}
            >
              {selectedDrug.category}
            </span>
          </div>
        ) : (
          <span className="text-slate-400 dark:text-slate-500">
            Pilih obat...
          </span>
        )}
        <ChevronDown
          className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-2 bg-white/80 dark:bg-slate-900/90 backdrop-blur-2xl border border-black/[0.08] dark:border-white/[0.12] rounded-2xl shadow-2xl dark:shadow-[0_16px_48px_0_rgba(0,0,0,0.5)] overflow-hidden max-h-64 overflow-y-auto"
          >
            {selectedDrug && (
              <button
                onClick={() => onSelect(null)}
                aria-label="Hapus pilihan obat"
                className="w-full flex items-center gap-3 px-5 py-3 text-left
                  hover:bg-black/[0.03] dark:hover:bg-white/[0.03] transition-colors
                  text-sm text-slate-400 dark:text-slate-500 italic
                  border-b border-black/[0.04] dark:border-white/[0.04]"
              >
                Hapus pilihan
              </button>
            )}
            {availableDrugs.map((drug) => (
              <button
                key={drug.id}
                onClick={() => onSelect(drug)}
                aria-label={`Pilih ${drug.name} (${drug.category})`}
                className={`w-full flex items-center gap-3 px-5 py-3 text-left transition-colors ${
                  selectedDrug?.id === drug.id
                    ? "bg-blue-500/10 dark:bg-blue-500/10"
                    : "hover:bg-black/[0.03] dark:hover:bg-white/[0.03]"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-slate-900 dark:text-slate-50">
                    {drug.name}
                  </span>
                </div>
                <span
                  className={`text-xs px-2.5 py-1 rounded-full border whitespace-nowrap ${categoryColors[drug.category]}`}
                >
                  {drug.category}
                </span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ───── Main Component ───── */

export default function DrugComparisonPage() {
  const [selectedDrug1, setSelectedDrug1] = useState<Drug | null>(null);
  const [selectedDrug2, setSelectedDrug2] = useState<Drug | null>(null);
  const [selectedDrug3, setSelectedDrug3] = useState<Drug | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset results when drug selection changes
  const handleDrugSelect = useCallback(
    (slot: 1 | 2 | 3) => (drug: Drug | null) => {
      setShowResults(false);
      setOpenDropdown(null);
      if (slot === 1) setSelectedDrug1(drug);
      else if (slot === 2) setSelectedDrug2(drug);
      else setSelectedDrug3(drug);
    },
    []
  );

  const handleReset = useCallback(() => {
    setSelectedDrug1(null);
    setSelectedDrug2(null);
    setSelectedDrug3(null);
    setShowResults(false);
    setOpenDropdown(null);
  }, []);

  const canCompare = selectedDrug1 !== null && selectedDrug2 !== null;

  const selectedDrugs = useMemo(() => {
    const list: Drug[] = [];
    if (selectedDrug1) list.push(selectedDrug1);
    if (selectedDrug2) list.push(selectedDrug2);
    if (selectedDrug3) list.push(selectedDrug3);
    return list;
  }, [selectedDrug1, selectedDrug2, selectedDrug3]);

  // Exclude already-selected drug IDs from each dropdown
  const excludeFor = useCallback(
    (slot: 1 | 2 | 3): string[] => {
      const ids: string[] = [];
      if (slot !== 1 && selectedDrug1) ids.push(selectedDrug1.id);
      if (slot !== 2 && selectedDrug2) ids.push(selectedDrug2.id);
      if (slot !== 3 && selectedDrug3) ids.push(selectedDrug3.id);
      return ids;
    },
    [selectedDrug1, selectedDrug2, selectedDrug3]
  );

  // Grouped bar chart data: one entry per unique side effect across selected drugs
  const barChartData = useMemo(() => {
    if (!showResults || selectedDrugs.length < 2) return [];

    const allEffectNames = new Set<string>();
    selectedDrugs.forEach((drug) =>
      drug.sideEffects.forEach((se) => allEffectNames.add(se.name))
    );

    return Array.from(allEffectNames)
      .map((effectName) => {
        const entry: Record<string, string | number> = { name: effectName };
        selectedDrugs.forEach((drug) => {
          const se = drug.sideEffects.find((s) => s.name === effectName);
          entry[drug.name] = se ? se.frequencyPercent : 0;
        });
        return entry;
      })
      .sort((a, b) => {
        // Sort by max frequency across all drugs, descending
        const maxA = selectedDrugs.reduce(
          (max, d) => Math.max(max, (a[d.name] as number) || 0),
          0
        );
        const maxB = selectedDrugs.reduce(
          (max, d) => Math.max(max, (b[d.name] as number) || 0),
          0
        );
        return maxB - maxA;
      });
  }, [showResults, selectedDrugs]);

  // Radar chart data
  const radarChartData = useMemo(() => {
    if (!showResults || selectedDrugs.length < 2) return [];

    return radarAxes.map((axis) => {
      const entry: Record<string, string | number> = { subject: axis };
      selectedDrugs.forEach((drug) => {
        const se = drug.sideEffects.find((s) => s.name === axis);
        entry[drug.name] = se ? se.frequencyPercent : 0;
      });
      return entry;
    });
  }, [showResults, selectedDrugs]);

  return (
    <PageTransition>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            Drug Comparison
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Bandingkan profil obat secara side-by-side
          </p>
        </div>

        {/* Drug Selector Section */}
        <GlassCard>
          <div ref={containerRef} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <DrugSelector
                label="Obat 1"
                selectedDrug={selectedDrug1}
                onSelect={handleDrugSelect(1)}
                isOpen={openDropdown === 1}
                onToggle={() =>
                  setOpenDropdown((prev) => (prev === 1 ? null : 1))
                }
                excludeIds={excludeFor(1)}
              />
              <DrugSelector
                label="Obat 2"
                selectedDrug={selectedDrug2}
                onSelect={handleDrugSelect(2)}
                isOpen={openDropdown === 2}
                onToggle={() =>
                  setOpenDropdown((prev) => (prev === 2 ? null : 2))
                }
                excludeIds={excludeFor(2)}
              />
              <DrugSelector
                label="Obat 3 (opsional)"
                selectedDrug={selectedDrug3}
                onSelect={handleDrugSelect(3)}
                isOpen={openDropdown === 3}
                onToggle={() =>
                  setOpenDropdown((prev) => (prev === 3 ? null : 3))
                }
                excludeIds={excludeFor(3)}
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  if (canCompare) setShowResults(true);
                }}
                disabled={!canCompare}
                aria-label="Bandingkan obat yang dipilih"
                className={`px-6 py-2.5 rounded-xl font-medium shadow-lg transition-all duration-200 ${
                  canCompare
                    ? "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer hover:shadow-blue-500/25"
                    : "bg-blue-600/30 text-white/50 cursor-not-allowed shadow-none"
                }`}
              >
                Bandingkan
              </button>
              <button
                onClick={handleReset}
                aria-label="Reset pilihan obat"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium
                  text-slate-600 dark:text-slate-400
                  hover:bg-white/50 dark:hover:bg-white/[0.05]
                  transition-all duration-200"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
            </div>
          </div>
        </GlassCard>

        {/* Content Area */}
        <AnimatePresence mode="wait">
          {showResults && selectedDrugs.length >= 2 ? (
            <motion.div
              key="comparison-results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Grouped Bar Chart */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.4 }}
              >
                <GlassCard>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">
                    Perbandingan Efek Samping
                  </h2>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart
                      data={barChartData}
                      margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(148,163,184,0.1)"
                      />
                      <XAxis
                        dataKey="name"
                        tick={{ fill: "#94a3b8", fontSize: 11 }}
                        axisLine={{ stroke: "rgba(148,163,184,0.2)" }}
                        tickLine={false}
                        angle={-30}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis
                        tick={{ fill: "#94a3b8", fontSize: 12 }}
                        axisLine={{ stroke: "rgba(148,163,184,0.2)" }}
                        tickLine={false}
                        unit="%"
                        domain={[0, 30]}
                      />
                      <Tooltip content={<ComparisonTooltip />} />
                      <Legend
                        verticalAlign="top"
                        height={36}
                        iconType="circle"
                        iconSize={8}
                        formatter={(value: string) => (
                          <span className="text-sm text-slate-600 dark:text-slate-400">
                            {value}
                          </span>
                        )}
                      />
                      {selectedDrugs.map((drug, index) => (
                        <Bar
                          key={drug.id}
                          dataKey={drug.name}
                          fill={drugColors[index]}
                          radius={[4, 4, 0, 0]}
                          barSize={selectedDrugs.length === 2 ? 24 : 18}
                        />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </GlassCard>
              </motion.div>

              {/* Comparison Summary Table */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.4 }}
              >
                <GlassCard>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">
                    Ringkasan Perbandingan
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-black/[0.06] dark:border-white/[0.06]">
                          <th className="text-left py-3 px-4 font-medium text-slate-500 dark:text-slate-400 bg-white/30 dark:bg-white/[0.03] rounded-tl-xl">
                            Aspek
                          </th>
                          {selectedDrugs.map((drug, index) => (
                            <th
                              key={drug.id}
                              className={`text-left py-3 px-4 font-medium bg-white/30 dark:bg-white/[0.03] ${
                                index === selectedDrugs.length - 1
                                  ? "rounded-tr-xl"
                                  : ""
                              }`}
                              style={{ color: drugColors[index] }}
                            >
                              {drug.name}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {/* Nama Generik */}
                        <tr className="border-b border-black/[0.03] dark:border-white/[0.03]">
                          <td className="py-3 px-4 font-medium text-slate-500 dark:text-slate-400">
                            Nama Generik
                          </td>
                          {selectedDrugs.map((drug) => (
                            <td
                              key={drug.id}
                              className="py-3 px-4 text-slate-900 dark:text-slate-50"
                            >
                              {drug.genericName}
                            </td>
                          ))}
                        </tr>

                        {/* Kategori */}
                        <tr className="border-b border-black/[0.03] dark:border-white/[0.03]">
                          <td className="py-3 px-4 font-medium text-slate-500 dark:text-slate-400">
                            Kategori
                          </td>
                          {selectedDrugs.map((drug) => (
                            <td key={drug.id} className="py-3 px-4">
                              <span
                                className={`text-xs px-2.5 py-1 rounded-full border ${categoryColors[drug.category]}`}
                              >
                                {drug.category}
                              </span>
                            </td>
                          ))}
                        </tr>

                        {/* Bentuk Sediaan */}
                        <tr className="border-b border-black/[0.03] dark:border-white/[0.03]">
                          <td className="py-3 px-4 font-medium text-slate-500 dark:text-slate-400">
                            Bentuk Sediaan
                          </td>
                          {selectedDrugs.map((drug) => (
                            <td
                              key={drug.id}
                              className="py-3 px-4 text-slate-900 dark:text-slate-50"
                            >
                              {drug.dosageForm}
                            </td>
                          ))}
                        </tr>

                        {/* Kekuatan */}
                        <tr className="border-b border-black/[0.03] dark:border-white/[0.03]">
                          <td className="py-3 px-4 font-medium text-slate-500 dark:text-slate-400">
                            Kekuatan
                          </td>
                          {selectedDrugs.map((drug) => (
                            <td
                              key={drug.id}
                              className="py-3 px-4 text-slate-900 dark:text-slate-50 font-mono"
                            >
                              {drug.strength}
                            </td>
                          ))}
                        </tr>

                        {/* Total Efek Samping */}
                        <tr className="border-b border-black/[0.03] dark:border-white/[0.03]">
                          <td className="py-3 px-4 font-medium text-slate-500 dark:text-slate-400">
                            Total Efek Samping
                          </td>
                          {selectedDrugs.map((drug) => (
                            <td
                              key={drug.id}
                              className="py-3 px-4 text-slate-900 dark:text-slate-50 font-mono font-bold"
                            >
                              {drug.sideEffects.length}
                            </td>
                          ))}
                        </tr>

                        {/* Efek Samping Serius */}
                        <tr className="border-b border-black/[0.03] dark:border-white/[0.03]">
                          <td className="py-3 px-4 font-medium text-slate-500 dark:text-slate-400">
                            Efek Samping Serius
                          </td>
                          {selectedDrugs.map((drug) => {
                            const severeCount = drug.sideEffects.filter(
                              (se) => se.severity === "Severe"
                            ).length;
                            return (
                              <td
                                key={drug.id}
                                className={`py-3 px-4 font-mono font-bold ${
                                  severeCount > 0
                                    ? "text-red-500"
                                    : "text-green-500"
                                }`}
                              >
                                {severeCount}
                              </td>
                            );
                          })}
                        </tr>

                        {/* Status Recall */}
                        <tr className="border-b border-black/[0.03] dark:border-white/[0.03]">
                          <td className="py-3 px-4 font-medium text-slate-500 dark:text-slate-400">
                            Status Recall
                          </td>
                          {selectedDrugs.map((drug) => {
                            const config =
                              recallStatusConfig[drug.recallStatus];
                            return (
                              <td
                                key={drug.id}
                                className={`py-3 px-4 ${
                                  drug.recallStatus === "recalled"
                                    ? "bg-red-500/10"
                                    : ""
                                }`}
                              >
                                <span
                                  className={`text-xs px-2.5 py-1 rounded-full border font-medium ${config.className}`}
                                >
                                  {config.label}
                                </span>
                              </td>
                            );
                          })}
                        </tr>

                        {/* Produsen */}
                        <tr>
                          <td className="py-3 px-4 font-medium text-slate-500 dark:text-slate-400">
                            Produsen
                          </td>
                          {selectedDrugs.map((drug) => (
                            <td
                              key={drug.id}
                              className="py-3 px-4 text-slate-900 dark:text-slate-50"
                            >
                              {drug.manufacturer}
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </GlassCard>
              </motion.div>

              {/* Radar Chart */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.4 }}
              >
                <GlassCard>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">
                    Profil Risiko
                  </h2>
                  <ResponsiveContainer width="100%" height={400}>
                    <RadarChart data={radarChartData}>
                      <PolarGrid stroke="rgba(148,163,184,0.2)" />
                      <PolarAngleAxis
                        dataKey="subject"
                        tick={{ fill: "#94a3b8", fontSize: 12 }}
                      />
                      <PolarRadiusAxis
                        tick={{ fill: "#94a3b8", fontSize: 10 }}
                        axisLine={false}
                      />
                      <Tooltip content={<RadarTooltip />} />
                      {selectedDrugs.map((drug, index) => (
                        <Radar
                          key={drug.id}
                          name={drug.name}
                          dataKey={drug.name}
                          stroke={drugColors[index]}
                          fill={drugColors[index]}
                          fillOpacity={0.15}
                        />
                      ))}
                      <Legend
                        verticalAlign="bottom"
                        iconType="circle"
                        iconSize={8}
                        formatter={(value: string) => (
                          <span className="text-sm text-slate-600 dark:text-slate-400">
                            {value}
                          </span>
                        )}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </GlassCard>
              </motion.div>
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
                <GitCompare className="w-20 h-20 text-slate-300 dark:text-slate-600" />
              </motion.div>
              <p className="text-lg font-medium text-slate-600 dark:text-slate-400 mt-6">
                Pilih minimal 2 obat untuk membandingkan
              </p>
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">
                Pilih obat dari dropdown di atas untuk melihat perbandingan efek
                samping
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}
