"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { PageTransition } from "@/components/layout/PageTransition";
import { GlassCard } from "@/components/shared/GlassCard";
import { AnimatedCounter } from "@/components/shared/AnimatedCounter";
import { motion, AnimatePresence } from "framer-motion";
import {
  monthlyVisits,
  complaintDistribution,
} from "@/data/visualization";
import {
  Activity,
  TrendingUp,
  UserPlus,
  AlertCircle,
  Calendar,
  ChevronDown,
  BarChart3,
  PieChart as PieChartIcon,
} from "lucide-react";
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
  Sector,
  BarChart,
  Bar,
} from "recharts";

/* ───── Constants ───── */

const months = monthlyVisits.map((m) => m.month);

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

/* ───── Custom Dropdown Component ───── */

interface GlassDropdownProps {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}

function GlassDropdown({ label, value, options, onChange }: GlassDropdownProps) {
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
      <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">
        {label}
      </span>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`${label}: ${value}`}
        aria-expanded={isOpen}
        className="flex items-center justify-between gap-2 w-full min-w-[160px] px-3.5 py-2.5 rounded-xl text-sm font-medium
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
              max-h-[240px] overflow-y-auto"
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

/* ───── Custom Tooltip for Visit Chart ───── */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function VisitTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white/80 dark:bg-slate-900/90 backdrop-blur-xl border border-black/[0.08] dark:border-white/[0.08] rounded-xl shadow-xl px-4 py-3 text-sm">
      <p className="font-medium text-slate-900 dark:text-slate-50 mb-2">{label}</p>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
          <span className="text-slate-600 dark:text-slate-400">Total Kunjungan:</span>
          <span className="font-mono font-semibold text-slate-900 dark:text-slate-50">
            {payload[0]?.value?.toLocaleString("id-ID")}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
          <span className="text-slate-600 dark:text-slate-400">Pasien Baru:</span>
          <span className="font-mono font-semibold text-slate-900 dark:text-slate-50">
            {payload[1]?.value?.toLocaleString("id-ID")}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ───── Custom Tooltip for Bar Chart ───── */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ComplaintBarTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const data = payload[0]?.payload;
  if (!data) return null;
  return (
    <div className="bg-white/80 dark:bg-slate-900/90 backdrop-blur-xl border border-black/[0.08] dark:border-white/[0.08] rounded-xl shadow-xl px-4 py-3 text-sm">
      <p className="font-medium text-slate-900 dark:text-slate-50">{data.complaint}</p>
      <div className="flex items-center gap-2 mt-1">
        <span className="text-slate-600 dark:text-slate-400">Jumlah:</span>
        <span className="font-mono font-semibold text-slate-900 dark:text-slate-50">
          {data.count}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-slate-600 dark:text-slate-400">Persentase:</span>
        <span className="font-mono font-semibold text-slate-900 dark:text-slate-50">
          {data.percentage}%
        </span>
      </div>
    </div>
  );
}

/* ───── Active Pie Sector Shape ───── */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderActiveShape(props: any) {
  const {
    cx,
    cy,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    fill,
  } = props;

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

/* ───── Custom Legend for Pie ───── */

interface PieLegendProps {
  data: typeof complaintDistribution;
  activeIndex: number;
  onHover: (index: number) => void;
  onLeave: () => void;
}

function PieLegend({ data, activeIndex, onHover, onLeave }: PieLegendProps) {
  return (
    <div className="flex flex-col gap-2 text-sm">
      {data.map((item, index) => (
        <div
          key={item.complaint}
          onMouseEnter={() => onHover(index)}
          onMouseLeave={onLeave}
          className={`flex items-center gap-3 px-3 py-1.5 rounded-lg cursor-pointer transition-all duration-200 ${
            activeIndex === index
              ? "bg-white/60 dark:bg-white/[0.06] scale-[1.02]"
              : "hover:bg-white/40 dark:hover:bg-white/[0.03]"
          }`}
        >
          <span
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: item.color }}
          />
          <span className="flex-1 text-slate-700 dark:text-slate-300 truncate">
            {item.complaint}
          </span>
          <span className="font-mono font-medium text-slate-900 dark:text-slate-50 tabular-nums">
            {item.count}
          </span>
          <span className="text-slate-400 dark:text-slate-500 text-xs tabular-nums">
            {item.percentage}%
          </span>
        </div>
      ))}
    </div>
  );
}

/* ───── Main Page Component ───── */

export default function VisualizationPage() {
  const [fromMonth, setFromMonth] = useState(months[0]);
  const [toMonth, setToMonth] = useState(months[months.length - 1]);
  const [appliedFrom, setAppliedFrom] = useState(months[0]);
  const [appliedTo, setAppliedTo] = useState(months[months.length - 1]);
  const [chartView, setChartView] = useState<"donut" | "bar">("donut");
  const [activePieIndex, setActivePieIndex] = useState(-1);

  /* Derive filtered data */
  const filteredVisits = useMemo(() => {
    const fromIdx = months.indexOf(appliedFrom);
    const toIdx = months.indexOf(appliedTo);
    if (fromIdx === -1 || toIdx === -1 || fromIdx > toIdx) return monthlyVisits;
    return monthlyVisits.slice(fromIdx, toIdx + 1);
  }, [appliedFrom, appliedTo]);

  /* Computed stats */
  const totalVisits = useMemo(
    () => filteredVisits.reduce((sum, m) => sum + m.visits, 0),
    [filteredVisits]
  );

  const avgVisits = useMemo(
    () => Math.round(totalVisits / (filteredVisits.length || 1)),
    [totalVisits, filteredVisits.length]
  );

  const totalNewPatients = useMemo(
    () => filteredVisits.reduce((sum, m) => sum + m.newPatients, 0),
    [filteredVisits]
  );

  const topComplaint = useMemo(() => {
    return complaintDistribution.reduce((max, c) =>
      c.count > max.count ? c : max
    );
  }, []);

  const totalComplaints = useMemo(
    () => complaintDistribution.reduce((sum, c) => sum + c.count, 0),
    []
  );

  const sortedComplaints = useMemo(
    () => [...complaintDistribution].sort((a, b) => b.count - a.count),
    []
  );

  /* "Sampai" options: only months >= fromMonth */
  const toMonthOptions = useMemo(() => {
    const fromIdx = months.indexOf(fromMonth);
    return fromIdx >= 0 ? months.slice(fromIdx) : months;
  }, [fromMonth]);

  /* Apply filter */
  const handleApply = useCallback(() => {
    setAppliedFrom(fromMonth);
    const fromIdx = months.indexOf(fromMonth);
    const toIdx = months.indexOf(toMonth);
    if (toIdx < fromIdx) {
      setToMonth(fromMonth);
      setAppliedTo(fromMonth);
    } else {
      setAppliedTo(toMonth);
    }
  }, [fromMonth, toMonth]);

  /* When fromMonth changes, ensure toMonth is still valid */
  const handleFromChange = useCallback(
    (val: string) => {
      setFromMonth(val);
      const fromIdx = months.indexOf(val);
      const toIdx = months.indexOf(toMonth);
      if (toIdx < fromIdx) {
        setToMonth(val);
      }
    },
    [toMonth]
  );

  /* Stat card config */
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
        label: "Rata-rata/Bulan",
        value: avgVisits,
        icon: TrendingUp,
        color: "text-purple-500",
        bgColor: "bg-purple-500/10",
      },
      {
        label: "Pasien Baru",
        value: totalNewPatients,
        icon: UserPlus,
        color: "text-teal-500",
        bgColor: "bg-teal-500/10",
      },
      {
        label: "Keluhan Terbanyak",
        value: topComplaint.count,
        icon: AlertCircle,
        color: "text-pink-500",
        bgColor: "bg-pink-500/10",
        suffix: topComplaint.complaint,
      },
    ],
    [totalVisits, avgVisits, totalNewPatients, topComplaint]
  );

  /* Custom legend renderer for the visit chart */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderVisitLegend = useCallback((props: any) => {
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
  }, []);

  return (
    <PageTransition>
      <div className="space-y-8">
        {/* ── Header ── */}
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            Visualization
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Tren kunjungan pasien dan distribusi keluhan
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
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              <div className="flex items-center gap-2 mr-2">
                <Calendar className="w-5 h-5 text-blue-500" />
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  Periode
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 flex-1">
                <GlassDropdown
                  label="Dari"
                  value={fromMonth}
                  options={months}
                  onChange={handleFromChange}
                />
                <span className="hidden sm:block text-slate-400 dark:text-slate-500 pb-2.5">
                  —
                </span>
                <GlassDropdown
                  label="Sampai"
                  value={toMonth}
                  options={toMonthOptions}
                  onChange={setToMonth}
                />
                <button
                  onClick={handleApply}
                  aria-label="Terapkan filter periode"
                  className="px-4 py-2.5 rounded-xl text-sm font-medium
                    bg-blue-600 hover:bg-blue-700
                    text-white shadow-lg shadow-blue-600/25
                    transition-all duration-200 hover:shadow-xl hover:shadow-blue-600/30
                    active:scale-[0.98]"
                >
                  Terapkan
                </button>
              </div>
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

        {/* ── Visit Trend Chart ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <GlassCard>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                  Tren Kunjungan Pasien
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  Data {appliedFrom} &mdash; {appliedTo}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="w-3 h-0.5 bg-blue-500 rounded" />
                  Total Kunjungan
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="w-3 h-0.5 rounded border-t-2 border-dashed border-purple-500 bg-transparent" />
                  Pasien Baru
                </div>
              </div>
            </div>

            <div role="img" aria-label="Grafik tren kunjungan pasien per bulan">
            <ResponsiveContainer width="100%" height={350}>
              <ComposedChart
                data={filteredVisits}
                margin={{ top: 5, right: 10, left: -10, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="visitGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(148,163,184,0.1)"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                  axisLine={{ stroke: "rgba(148,163,184,0.2)" }}
                  tickLine={false}
                  tickMargin={8}
                />
                <YAxis
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  tickMargin={4}
                />
                <Tooltip content={<VisitTooltip />} />
                <Legend content={renderVisitLegend} />
                <Area
                  type="monotone"
                  dataKey="visits"
                  name="Total Kunjungan"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  fill="url(#visitGradient)"
                  dot={false}
                  activeDot={{
                    r: 6,
                    stroke: "#3b82f6",
                    strokeWidth: 2,
                    fill: "#fff",
                  }}
                  animationDuration={1200}
                  animationEasing="ease-out"
                />
                <Line
                  type="monotone"
                  dataKey="newPatients"
                  name="Pasien Baru"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  strokeDasharray="6 4"
                  dot={{
                    r: 4,
                    stroke: "#8b5cf6",
                    strokeWidth: 2,
                    fill: "#fff",
                  }}
                  activeDot={{
                    r: 6,
                    stroke: "#8b5cf6",
                    strokeWidth: 2,
                    fill: "#fff",
                  }}
                  animationDuration={1500}
                  animationEasing="ease-out"
                />
              </ComposedChart>
            </ResponsiveContainer>
            </div>
          </GlassCard>
        </motion.div>

        {/* ── Complaint Distribution ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.3, delay: 0.15 }}
        >
          <GlassCard>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                Distribusi Keluhan Pasien
              </h2>

              {/* Toggle Tabs */}
              <div className="inline-flex p-1 rounded-xl bg-white/50 dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06]">
                <button
                  onClick={() => setChartView("donut")}
                  aria-label="Tampilkan donut chart"
                  aria-pressed={chartView === "donut"}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    chartView === "donut"
                      ? "bg-white dark:bg-white/[0.1] text-blue-600 dark:text-blue-400 shadow-sm"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  }`}
                >
                  <PieChartIcon className="w-4 h-4" />
                  Donut Chart
                </button>
                <button
                  onClick={() => setChartView("bar")}
                  aria-label="Tampilkan bar chart"
                  aria-pressed={chartView === "bar"}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    chartView === "bar"
                      ? "bg-white dark:bg-white/[0.1] text-blue-600 dark:text-blue-400 shadow-sm"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  Bar Chart
                </button>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {chartView === "donut" ? (
                <motion.div
                  key="donut"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.25 }}
                  className="flex flex-col lg:flex-row items-center gap-6"
                >
                  {/* Donut Chart */}
                  <div className="relative flex-shrink-0" role="img" aria-label="Donut chart distribusi keluhan pasien">
                    <ResponsiveContainer width={280} height={280}>
                      <PieChart>
                        <Pie
                          data={complaintDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={70}
                          outerRadius={120}
                          dataKey="count"
                          nameKey="complaint"
                          activeShape={renderActiveShape}
                          onMouseEnter={(_, index) => setActivePieIndex(index)}
                          onMouseLeave={() => setActivePieIndex(-1)}
                          animationDuration={800}
                          animationEasing="ease-out"
                          stroke="none"
                        >
                          {complaintDistribution.map((entry, index) => (
                            <Cell
                              key={index}
                              fill={entry.color}
                              opacity={
                                activePieIndex === -1 || activePieIndex === index
                                  ? 1
                                  : 0.4
                              }
                              style={{ transition: "opacity 200ms ease" }}
                            />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Center Label */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      {activePieIndex >= 0 ? (
                        <>
                          <span className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                            {complaintDistribution[activePieIndex].count}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 max-w-[100px] text-center leading-tight">
                            {complaintDistribution[activePieIndex].complaint}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                            {totalComplaints}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            Total
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="flex-1 w-full lg:w-auto">
                    <PieLegend
                      data={complaintDistribution}
                      activeIndex={activePieIndex}
                      onHover={setActivePieIndex}
                      onLeave={() => setActivePieIndex(-1)}
                    />
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="bar"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                >
                  <div role="img" aria-label="Bar chart distribusi keluhan pasien">
                  <ResponsiveContainer width="100%" height={sortedComplaints.length * 48 + 20}>
                    <BarChart
                      layout="vertical"
                      data={sortedComplaints}
                      margin={{ top: 0, right: 60, left: 0, bottom: 0 }}
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
                      />
                      <YAxis
                        type="category"
                        dataKey="complaint"
                        width={160}
                        tick={{ fill: "#94a3b8", fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip content={<ComplaintBarTooltip />} />
                      <Bar
                        dataKey="count"
                        radius={[0, 6, 6, 0]}
                        barSize={24}
                        animationDuration={1000}
                        animationEasing="ease-out"
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        label={({ x, y, width, height, index }: any) => {
                          const entry = sortedComplaints[index];
                          return (
                            <text
                              x={x + width + 8}
                              y={y + height / 2}
                              fill="#94a3b8"
                              fontSize={12}
                              dominantBaseline="central"
                              fontFamily="monospace"
                            >
                              {entry?.percentage}%
                            </text>
                          );
                        }}
                      >
                        {sortedComplaints.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </GlassCard>
        </motion.div>
      </div>
    </PageTransition>
  );
}
