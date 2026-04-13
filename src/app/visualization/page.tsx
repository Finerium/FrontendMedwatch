"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { PageTransition } from "@/components/layout/PageTransition";
import { GlassCard } from "@/components/shared/GlassCard";
import { AnimatedCounter } from "@/components/shared/AnimatedCounter";
import { useHydratedPatientStore } from "@/lib/use-hydrated-store";
import type { Patient } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  TrendingUp,
  UserPlus,
  Stethoscope,
  Calendar,
  ChevronDown,
  BarChart3,
  PlusCircle,
} from "lucide-react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Sector,
  BarChart,
  Bar,
  Legend,
} from "recharts";

/* ───── Constants ───── */

const DATE_RANGE_OPTIONS = [
  "Semua",
  "7 Hari Terakhir",
  "30 Hari Terakhir",
  "3 Bulan Terakhir",
  "6 Bulan Terakhir",
  "1 Tahun Terakhir",
] as const;

type DateRange = (typeof DATE_RANGE_OPTIONS)[number];

const PIE_COLORS = [
  "#3b82f6",
  "#8b5cf6",
  "#06b6d4",
  "#ec4899",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#64748b",
  "#94a3b8",
];

const MONTH_NAMES_ID = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

const AGE_RANGES = ["0-12", "13-17", "18-30", "31-50", "51-65", "65+"] as const;

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" as const },
  },
};

/* ───── Helpers ───── */

function getAgeRange(age: number): (typeof AGE_RANGES)[number] {
  if (age <= 12) return "0-12";
  if (age <= 17) return "13-17";
  if (age <= 30) return "18-30";
  if (age <= 50) return "31-50";
  if (age <= 65) return "51-65";
  return "65+";
}

function filterPatientsByRange(patients: Patient[], range: DateRange): Patient[] {
  if (range === "Semua") return patients;

  const now = new Date();
  let cutoff: Date;

  switch (range) {
    case "7 Hari Terakhir":
      cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "30 Hari Terakhir":
      cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case "3 Bulan Terakhir":
      cutoff = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
      break;
    case "6 Bulan Terakhir":
      cutoff = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
      break;
    case "1 Tahun Terakhir":
      cutoff = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      break;
    default:
      return patients;
  }

  return patients.filter((p) => new Date(p.visitDate) >= cutoff);
}

function formatMonthLabel(year: number, month: number): string {
  const yy = String(year).slice(-2);
  return `${MONTH_NAMES_ID[month]} ${yy}`;
}

/* ───── Glass Dropdown ───── */

interface GlassDropdownProps {
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}

function GlassDropdown({ value, options, onChange }: GlassDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`relative ${isOpen ? "z-50" : ""}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Periode: ${value}`}
        aria-expanded={isOpen}
        className="flex items-center justify-between gap-2 w-full min-w-[200px] px-3.5 py-2.5 rounded-xl text-sm font-medium
          bg-white/60 dark:bg-white/[0.05] backdrop-blur-lg
          border border-black/[0.06] dark:border-white/[0.08]
          text-slate-900 dark:text-slate-50
          hover:bg-white/80 dark:hover:bg-white/[0.08]
          hover:border-black/[0.1] dark:hover:border-white/[0.12]
          transition-all duration-200"
      >
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span>{value}</span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-1.5 py-1
              bg-white/90 dark:bg-slate-900/95 backdrop-blur-2xl
              border border-black/[0.08] dark:border-white/[0.12]
              rounded-xl shadow-2xl dark:shadow-[0_16px_48px_0_rgba(0,0,0,0.5)]
              max-h-[280px] overflow-y-auto"
          >
            {options.map((option) => (
              <button
                key={option}
                onClick={() => {
                  onChange(option);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3.5 py-2 text-sm transition-colors ${
                  value === option
                    ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium"
                    : "text-slate-700 dark:text-slate-300 hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
                }`}
              >
                {option}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ───── Custom Tooltips ───── */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function VisitBarTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white/80 dark:bg-slate-900/90 backdrop-blur-xl border border-black/[0.08] dark:border-white/[0.08] rounded-xl shadow-xl px-4 py-3 text-sm">
      <p className="font-medium text-slate-900 dark:text-slate-50 mb-1">Bulan: {label}</p>
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
        <span className="text-slate-600 dark:text-slate-400">Jumlah Kunjungan:</span>
        <span className="font-mono font-semibold text-slate-900 dark:text-slate-50">
          {payload[0]?.value?.toLocaleString("id-ID")}
        </span>
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function DrugBarTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const data = payload[0]?.payload;
  if (!data) return null;
  return (
    <div className="bg-white/80 dark:bg-slate-900/90 backdrop-blur-xl border border-black/[0.08] dark:border-white/[0.08] rounded-xl shadow-xl px-4 py-3 text-sm">
      <p className="font-medium text-slate-900 dark:text-slate-50">{data.drug}</p>
      <div className="flex items-center gap-2 mt-1">
        <span className="text-slate-600 dark:text-slate-400">Diresepkan:</span>
        <span className="font-mono font-semibold text-slate-900 dark:text-slate-50">
          {data.count}x
        </span>
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function GenderAgeTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white/80 dark:bg-slate-900/90 backdrop-blur-xl border border-black/[0.08] dark:border-white/[0.08] rounded-xl shadow-xl px-4 py-3 text-sm">
      <p className="font-medium text-slate-900 dark:text-slate-50 mb-2">Usia: {label}</p>
      <div className="space-y-1">
        {payload.map(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (entry: any) => (
            <div key={entry.name} className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: entry.fill || entry.color }}
              />
              <span className="text-slate-600 dark:text-slate-400">{entry.name}:</span>
              <span className="font-mono font-semibold text-slate-900 dark:text-slate-50">
                {entry.value}
              </span>
            </div>
          )
        )}
      </div>
    </div>
  );
}

/* ───── Active Pie Sector Shape ───── */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderActiveShape(props: any) {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius - 2}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.2))" }}
      />
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius - 2}
        outerRadius={innerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
    </g>
  );
}

/* ───── Skeleton Loaders ───── */

function SkeletonCard() {
  return (
    <GlassCard variant="subtle">
      <div className="animate-pulse flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-white/[0.06]" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-20 rounded bg-slate-200 dark:bg-white/[0.06]" />
          <div className="h-7 w-16 rounded bg-slate-200 dark:bg-white/[0.06]" />
        </div>
      </div>
    </GlassCard>
  );
}

function SkeletonChart() {
  return (
    <GlassCard>
      <div className="animate-pulse space-y-4">
        <div className="h-5 w-48 rounded bg-slate-200 dark:bg-white/[0.06]" />
        <div className="h-[300px] rounded-xl bg-slate-200/50 dark:bg-white/[0.03]" />
      </div>
    </GlassCard>
  );
}

/* ───── Main Page Component ───── */

export default function VisualizationPage() {
  const { patients, hydrated } = useHydratedPatientStore();
  const [dateRange, setDateRange] = useState<DateRange>("Semua");
  const [activePieIndex, setActivePieIndex] = useState(-1);

  /* ── Filtered patients ── */
  const filtered = useMemo(
    () => filterPatientsByRange(patients, dateRange),
    [patients, dateRange]
  );

  /* ── Chart 1: Monthly visit trend (last 12 months, sliding window) ── */
  const monthlyVisitData = useMemo(() => {
    const now = new Date();
    const months: { key: string; label: string; count: number }[] = [];

    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = formatMonthLabel(d.getFullYear(), d.getMonth());
      months.push({ key, label, count: 0 });
    }

    for (const p of filtered) {
      const vd = new Date(p.visitDate);
      const key = `${vd.getFullYear()}-${String(vd.getMonth() + 1).padStart(2, "0")}`;
      const entry = months.find((m) => m.key === key);
      if (entry) entry.count++;
    }

    return months;
  }, [filtered]);

  /* ── Chart 2: Diagnosis distribution (top 8 + Lainnya) ── */
  const diagnosisData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of filtered) {
      counts[p.diagnosis] = (counts[p.diagnosis] || 0) + 1;
    }

    const sorted = Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    if (sorted.length <= 9) {
      return sorted.map((d, i) => ({ ...d, color: PIE_COLORS[i % PIE_COLORS.length] }));
    }

    const top8 = sorted.slice(0, 8);
    const restCount = sorted.slice(8).reduce((sum, d) => sum + d.count, 0);

    return [
      ...top8.map((d, i) => ({ ...d, color: PIE_COLORS[i] })),
      { name: "Lainnya", count: restCount, color: PIE_COLORS[8] },
    ];
  }, [filtered]);

  const totalDiagnosis = useMemo(
    () => diagnosisData.reduce((sum, d) => sum + d.count, 0),
    [diagnosisData]
  );

  /* ── Chart 3: Top 10 prescribed drugs ── */
  const drugData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of filtered) {
      for (const drug of p.prescribedDrugs) {
        counts[drug] = (counts[drug] || 0) + 1;
      }
    }

    return Object.entries(counts)
      .map(([drug, count]) => ({ drug, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [filtered]);

  /* ── Chart 4: Gender + Age distribution ── */
  const genderAgeData = useMemo(() => {
    const grid: Record<string, { Perempuan: number; "Laki-laki": number }> = {};
    for (const range of AGE_RANGES) {
      grid[range] = { Perempuan: 0, "Laki-laki": 0 };
    }

    for (const p of filtered) {
      const range = getAgeRange(p.age);
      grid[range][p.gender]++;
    }

    return AGE_RANGES.map((range) => ({
      ageRange: range,
      Perempuan: grid[range].Perempuan,
      "Laki-laki": grid[range]["Laki-laki"],
    }));
  }, [filtered]);

  /* ── Summary stats ── */
  const totalVisits = filtered.length;

  const avgAge = useMemo(() => {
    if (filtered.length === 0) return 0;
    const sum = filtered.reduce((acc, p) => acc + p.age, 0);
    return Math.round(sum / filtered.length);
  }, [filtered]);

  const newPatients = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    return filtered.filter((p) => new Date(p.createdAt) >= cutoff).length;
  }, [filtered]);

  const topDiagnosis = useMemo(() => {
    if (diagnosisData.length === 0) return "-";
    return diagnosisData[0].name;
  }, [diagnosisData]);

  const stats = useMemo(
    () => [
      {
        label: "Total Kunjungan",
        value: totalVisits,
        icon: Activity,
        color: "text-blue-500",
        bgColor: "bg-blue-500/10",
      },
      {
        label: "Rata-rata Umur",
        value: avgAge,
        icon: TrendingUp,
        color: "text-purple-500",
        bgColor: "bg-purple-500/10",
        suffix: "tahun",
      },
      {
        label: "Pasien Baru",
        value: newPatients,
        icon: UserPlus,
        color: "text-teal-500",
        bgColor: "bg-teal-500/10",
        suffix: "30 hari terakhir",
      },
      {
        label: "Diagnosis Terbanyak",
        value: diagnosisData.length > 0 ? diagnosisData[0].count : 0,
        icon: Stethoscope,
        color: "text-pink-500",
        bgColor: "bg-pink-500/10",
        suffix: topDiagnosis,
      },
    ],
    [totalVisits, avgAge, newPatients, diagnosisData, topDiagnosis]
  );

  /* ── Loading State ── */
  if (!hydrated) {
    return (
      <PageTransition>
        <div className="space-y-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
              Visualisasi Data
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Memuat data pasien...
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonChart key={i} />
            ))}
          </div>
        </div>
      </PageTransition>
    );
  }

  /* ── Empty State ── */
  if (patients.length === 0) {
    return (
      <PageTransition>
        <div className="space-y-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
              Visualisasi Data
            </h1>
          </div>
          <div className="flex items-center justify-center min-h-[400px]">
            <GlassCard className="max-w-md text-center">
              <div className="p-2">
                <BarChart3 className="w-12 h-12 text-slate-400 dark:text-slate-500 mx-auto mb-4" />
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-2">
                  Belum ada data pasien untuk divisualisasikan
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                  Tambahkan data pasien terlebih dahulu untuk melihat visualisasi statistik.
                </p>
                <Link
                  href="/patients/new"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium
                    bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/25
                    transition-all duration-200 hover:shadow-xl hover:shadow-blue-600/30 active:scale-[0.98]"
                >
                  <PlusCircle className="w-4 h-4" />
                  Tambah Pasien
                </Link>
              </div>
            </GlassCard>
          </div>
        </div>
      </PageTransition>
    );
  }

  /* ── Pie Label Renderer ── */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.04) return null;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5 + 20;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
      <text
        x={x}
        y={y}
        fill="#94a3b8"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        fontSize={12}
        fontFamily="monospace"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <PageTransition>
      <div className="space-y-8">
        {/* ── Header ── */}
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            Visualisasi Data
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Analisis tren kunjungan, diagnosis, dan demografi pasien
          </p>
        </div>

        {/* ── Date Range Filter ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="relative z-20"
        >
          <GlassCard className="overflow-visible">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-500" />
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  Periode
                </span>
              </div>
              <GlassDropdown
                value={dateRange}
                options={DATE_RANGE_OPTIONS}
                onChange={(v) => setDateRange(v as DateRange)}
              />
              {dateRange !== "Semua" && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-xs text-slate-500 dark:text-slate-400"
                >
                  {filtered.length} dari {patients.length} data ditampilkan
                </motion.span>
              )}
            </div>
          </GlassCard>
        </motion.div>

        {/* ── Summary Stats ── */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <motion.div key={stat.label} variants={itemVariants}>
                <GlassCard variant="subtle" hover className="flex items-start gap-4">
                  <div className={`p-2.5 rounded-xl ${stat.bgColor}`}>
                    <Icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {stat.label}
                    </p>
                    <AnimatedCounter
                      value={stat.value}
                      duration={1500}
                      className="text-2xl font-bold text-slate-900 dark:text-slate-50 block mt-0.5"
                    />
                    {"suffix" in stat && stat.suffix && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                        {stat.suffix}
                      </p>
                    )}
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </motion.div>

        {/* ── Charts Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ── Chart 1: Tren Kunjungan Pasien per Bulan ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <GlassCard className="h-full">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                  Tren Kunjungan Pasien per Bulan
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  12 bulan terakhir
                </p>
              </div>

              <div role="img" aria-label="Bar chart tren kunjungan pasien per bulan">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={monthlyVisitData}
                    margin={{ top: 5, right: 10, left: -10, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="barBlueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.5} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(148,163,184,0.1)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: "#94a3b8", fontSize: 11 }}
                      axisLine={{ stroke: "rgba(148,163,184,0.2)" }}
                      tickLine={false}
                      tickMargin={8}
                    />
                    <YAxis
                      tick={{ fill: "#94a3b8", fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                      tickMargin={4}
                      allowDecimals={false}
                    />
                    <Tooltip content={<VisitBarTooltip />} />
                    <Bar
                      dataKey="count"
                      fill="url(#barBlueGradient)"
                      radius={[6, 6, 0, 0]}
                      barSize={28}
                      animationDuration={1000}
                      animationEasing="ease-out"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          </motion.div>

          {/* ── Chart 2: Distribusi Diagnosis ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.3, delay: 0.15 }}
          >
            <GlassCard className="h-full">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                  Distribusi Diagnosis
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  Persentase berdasarkan jenis diagnosis
                </p>
              </div>

              {diagnosisData.length === 0 ? (
                <div className="flex items-center justify-center h-[300px] text-sm text-slate-400">
                  Tidak ada data
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="relative" role="img" aria-label="Donut chart distribusi diagnosis">
                    <ResponsiveContainer width={300} height={300}>
                      <PieChart>
                        <Pie
                          data={diagnosisData}
                          cx="50%"
                          cy="50%"
                          innerRadius={65}
                          outerRadius={110}
                          dataKey="count"
                          nameKey="name"
                          activeShape={renderActiveShape}
                          onMouseEnter={(_, index) => setActivePieIndex(index)}
                          onMouseLeave={() => setActivePieIndex(-1)}
                          label={renderPieLabel}
                          animationDuration={800}
                          animationEasing="ease-out"
                          stroke="none"
                        >
                          {diagnosisData.map((entry, index) => (
                            <Cell
                              key={index}
                              fill={entry.color}
                              opacity={
                                activePieIndex === -1 || activePieIndex === index ? 1 : 0.4
                              }
                              style={{ transition: "opacity 200ms ease" }}
                            />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Center label */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      {activePieIndex >= 0 && activePieIndex < diagnosisData.length ? (
                        <>
                          <span className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                            {diagnosisData[activePieIndex].count}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 max-w-[100px] text-center leading-tight">
                            {diagnosisData[activePieIndex].name}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                            {totalDiagnosis}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            Total
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Pie Legend */}
                  <div className="w-full mt-4 grid grid-cols-2 gap-x-4 gap-y-1.5">
                    {diagnosisData.map((item, index) => (
                      <div
                        key={item.name}
                        onMouseEnter={() => setActivePieIndex(index)}
                        onMouseLeave={() => setActivePieIndex(-1)}
                        className={`flex items-center gap-2 px-2 py-1 rounded-lg cursor-pointer transition-all duration-200 text-sm ${
                          activePieIndex === index
                            ? "bg-white/60 dark:bg-white/[0.06]"
                            : "hover:bg-white/40 dark:hover:bg-white/[0.03]"
                        }`}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="flex-1 text-slate-700 dark:text-slate-300 truncate text-xs">
                          {item.name}
                        </span>
                        <span className="font-mono text-xs font-medium text-slate-900 dark:text-slate-50 tabular-nums">
                          {item.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </GlassCard>
          </motion.div>

          {/* ── Chart 3: Top 10 Obat yang Diresepkan ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <GlassCard className="h-full">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                  Top 10 Obat yang Diresepkan
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  Obat paling sering diresepkan
                </p>
              </div>

              {drugData.length === 0 ? (
                <div className="flex items-center justify-center h-[300px] text-sm text-slate-400">
                  Tidak ada data
                </div>
              ) : (
                <div role="img" aria-label="Horizontal bar chart obat yang diresepkan">
                  <ResponsiveContainer width="100%" height={Math.max(300, drugData.length * 40 + 20)}>
                    <BarChart
                      layout="vertical"
                      data={drugData}
                      margin={{ top: 0, right: 40, left: 0, bottom: 0 }}
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
                        allowDecimals={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="drug"
                        width={120}
                        tick={{ fill: "#94a3b8", fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip content={<DrugBarTooltip />} />
                      <Bar
                        dataKey="count"
                        radius={[0, 6, 6, 0]}
                        barSize={24}
                        animationDuration={1000}
                        animationEasing="ease-out"
                      >
                        {drugData.map((_, index) => (
                          <Cell
                            key={index}
                            fill={index === 0 ? "#8b5cf6" : `rgba(139, 92, 246, ${0.9 - index * 0.06})`}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </GlassCard>
          </motion.div>

          {/* ── Chart 4: Distribusi Gender & Umur ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.3, delay: 0.25 }}
          >
            <GlassCard className="h-full">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                  Distribusi Gender dan Umur
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  Persebaran pasien berdasarkan rentang usia dan jenis kelamin
                </p>
              </div>

              <div role="img" aria-label="Stacked bar chart distribusi gender dan umur">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={genderAgeData}
                    margin={{ top: 5, right: 10, left: -10, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(148,163,184,0.1)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="ageRange"
                      tick={{ fill: "#94a3b8", fontSize: 12 }}
                      axisLine={{ stroke: "rgba(148,163,184,0.2)" }}
                      tickLine={false}
                      tickMargin={8}
                      label={{
                        value: "Rentang Usia",
                        position: "insideBottom",
                        offset: -4,
                        fill: "#94a3b8",
                        fontSize: 11,
                      }}
                    />
                    <YAxis
                      tick={{ fill: "#94a3b8", fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                      tickMargin={4}
                      allowDecimals={false}
                    />
                    <Tooltip content={<GenderAgeTooltip />} />
                    <Legend
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      content={(props: any) => {
                        const { payload } = props;
                        return (
                          <div className="flex items-center justify-center gap-6 mt-2">
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            {payload?.map((entry: any, index: number) => (
                              <div key={index} className="flex items-center gap-2 text-sm">
                                <span
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: entry.color }}
                                />
                                <span className="text-slate-600 dark:text-slate-400">
                                  {entry.value}
                                </span>
                              </div>
                            ))}
                          </div>
                        );
                      }}
                    />
                    <Bar
                      dataKey="Perempuan"
                      stackId="gender"
                      fill="#ec4899"
                      radius={[0, 0, 0, 0]}
                      barSize={36}
                      animationDuration={1000}
                      animationEasing="ease-out"
                    />
                    <Bar
                      dataKey="Laki-laki"
                      stackId="gender"
                      fill="#3b82f6"
                      radius={[6, 6, 0, 0]}
                      barSize={36}
                      animationDuration={1200}
                      animationEasing="ease-out"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
}
