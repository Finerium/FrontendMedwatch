"use client";

import { useState } from "react";
import { PageTransition } from "@/components/layout/PageTransition";
import { GlassCard } from "@/components/shared/GlassCard";
import { AnimatedCounter } from "@/components/shared/AnimatedCounter";
import { SkeletonLoader } from "@/components/shared/SkeletonLoader";
import { motion } from "framer-motion";
import { dashboardStats, sparklineData } from "@/data/dashboard";
import { monthlyVisits, complaintDistribution } from "@/data/visualization";
import { activities } from "@/data/activity";
import {
  Pill,
  Users,
  AlertTriangle,
  Activity as ActivityIcon,
  XCircle,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Search,
  UserPlus,
  FileDown,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Sector,
} from "recharts";
import Link from "next/link";

/* ───── Constants ───── */

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Pill,
  Users,
  AlertTriangle,
  Activity: ActivityIcon,
  XCircle,
  ShieldCheck,
};

const colorMap: Record<string, { bg: string; text: string; hex: string }> = {
  blue: { bg: "bg-blue-500/10", text: "text-blue-500", hex: "#3b82f6" },
  purple: { bg: "bg-purple-500/10", text: "text-purple-500", hex: "#8b5cf6" },
  teal: { bg: "bg-teal-500/10", text: "text-teal-500", hex: "#14b8a6" },
  pink: { bg: "bg-pink-500/10", text: "text-pink-500", hex: "#ec4899" },
  green: { bg: "bg-green-500/10", text: "text-green-500", hex: "#22c55e" },
  amber: { bg: "bg-amber-500/10", text: "text-amber-500", hex: "#f59e0b" },
};

const activityIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  UserPlus,
  Search,
  AlertTriangle,
  XCircle,
  FileDown,
  Activity: ActivityIcon,
};

const severityColorMap: Record<string, { bg: string; text: string }> = {
  info: { bg: "bg-blue-500/10", text: "text-blue-500" },
  warning: { bg: "bg-amber-500/10", text: "text-amber-500" },
  danger: { bg: "bg-red-500/10", text: "text-red-500" },
  success: { bg: "bg-green-500/10", text: "text-green-500" },
};

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" as const },
  },
};

const quickActions = [
  { label: "Cari Obat", icon: Search, href: "/drug-search" },
  { label: "Tambah Pasien", icon: UserPlus, href: "/patients/new" },
  { label: "Safety Check", icon: ShieldCheck, href: "/safety-checker" },
  { label: "Export Laporan", icon: FileDown, href: "/export" },
];

/* ───── Helpers ───── */

const NOW = new Date("2026-03-30T17:00:00");

function formatRelativeTime(timestamp: string): string {
  const date = new Date(timestamp);
  const diffMs = NOW.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) return "Baru saja";
  if (diffHours < 24) return `${diffHours} jam lalu`;
  if (diffDays === 1) return "Kemarin";
  if (diffDays < 7) return `${diffDays} hari lalu`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} minggu lalu`;
  return `${Math.floor(diffDays / 30)} bulan lalu`;
}

function trendPercent(current: number, previous: number): number {
  return Number((((current - previous) / previous) * 100).toFixed(1));
}

/* ───── Custom Recharts Components ───── */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white/80 dark:bg-slate-900/90 backdrop-blur-xl border border-black/[0.08] dark:border-white/[0.08] rounded-xl shadow-xl px-4 py-3 text-sm">
      <p className="font-medium text-slate-900 dark:text-slate-50 mb-1">{label}</p>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-slate-600 dark:text-slate-400">
            {entry.name}:
          </span>
          <span className="font-mono font-medium text-slate-900 dark:text-slate-50">
            {entry.value.toLocaleString("id-ID")}
          </span>
        </div>
      ))}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function PieTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const data = payload[0];
  return (
    <div className="bg-white/80 dark:bg-slate-900/90 backdrop-blur-xl border border-black/[0.08] dark:border-white/[0.08] rounded-xl shadow-xl px-4 py-3 text-sm">
      <div className="flex items-center gap-2">
        <div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: data.payload.color }}
        />
        <span className="font-medium text-slate-900 dark:text-slate-50">
          {data.name}
        </span>
      </div>
      <p className="text-slate-600 dark:text-slate-400 mt-1">
        {data.value.toLocaleString("id-ID")} pasien ({data.payload.percentage}%)
      </p>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } =
    props;
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
      />
    </g>
  );
};

/* ───── Main Component ───── */

export default function DashboardPage() {
  const [showAllActivities, setShowAllActivities] = useState(false);

  const displayedActivities = showAllActivities
    ? activities
    : activities.slice(0, 10);
  const totalComplaints = complaintDistribution.reduce(
    (sum, item) => sum + item.count,
    0,
  );

  return (
    <PageTransition>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            Dashboard
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Overview keamanan obat dan statistik klinik
          </p>
        </div>

        {/* Stats Grid */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {dashboardStats.map((stat) => {
            const Icon = iconMap[stat.icon];
            const colors = colorMap[stat.color];
            const trend = trendPercent(stat.value, stat.previousValue);
            const isPositive = trend >= 0;
            const isGood =
              stat.id === "active-warnings" || stat.id === "recall-alerts"
                ? !isPositive
                : isPositive;

            return (
              <motion.div key={stat.id} variants={itemVariants}>
                <SkeletonLoader className="h-36">
                  <GlassCard hover>
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`${colors.bg} rounded-xl p-3`}>
                            {Icon && (
                              <Icon className={`w-5 h-5 ${colors.text}`} />
                            )}
                          </div>
                          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
                            {stat.label}
                          </p>
                        </div>
                        <div className="flex items-end gap-3">
                          <AnimatedCounter
                            value={stat.value}
                            format={stat.format}
                            className="text-3xl font-bold font-mono text-slate-900 dark:text-slate-50"
                          />
                          <div
                            className={`flex items-center gap-1 text-xs font-medium mb-1 ${
                              isGood ? "text-green-500" : "text-red-500"
                            }`}
                          >
                            {isPositive ? (
                              <TrendingUp className="w-3 h-3" />
                            ) : (
                              <TrendingDown className="w-3 h-3" />
                            )}
                            <span>{Math.abs(trend)}%</span>
                          </div>
                        </div>
                      </div>
                      <div className="w-20 h-10 flex-shrink-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={sparklineData[stat.id]}>
                            <defs>
                              <linearGradient
                                id={`spark-${stat.id}`}
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                              >
                                <stop
                                  offset="5%"
                                  stopColor={colors.hex}
                                  stopOpacity={0.3}
                                />
                                <stop
                                  offset="95%"
                                  stopColor={colors.hex}
                                  stopOpacity={0}
                                />
                              </linearGradient>
                            </defs>
                            <Area
                              type="monotone"
                              dataKey="value"
                              stroke={colors.hex}
                              fill={`url(#spark-${stat.id})`}
                              strokeWidth={2}
                              dot={false}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </GlassCard>
                </SkeletonLoader>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          className="flex gap-3 overflow-x-auto pb-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.3 }}
        >
          {quickActions.map((action) => (
            <Link key={action.href} href={action.href}>
              <motion.div
                whileHover={{ y: -2 }}
                className="flex items-center gap-2 px-5 py-3 rounded-xl
                  bg-white/70 dark:bg-white/[0.05] backdrop-blur-xl
                  border border-black/[0.06] dark:border-white/[0.08]
                  shadow-sm hover:shadow-lg
                  transition-all duration-300
                  hover:bg-white/80 dark:hover:bg-white/[0.08]
                  cursor-pointer whitespace-nowrap text-sm font-medium
                  text-slate-700 dark:text-slate-300"
              >
                <action.icon className="w-4 h-4 text-blue-500" />
                {action.label}
              </motion.div>
            </Link>
          ))}
        </motion.div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Area Chart - Visit Trend */}
          <SkeletonLoader className="h-[420px]">
            <GlassCard>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-6">
                Tren Kunjungan Pasien
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={monthlyVisits}>
                  <defs>
                    <linearGradient
                      id="gradVisits"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="#3b82f6"
                        stopOpacity={0.2}
                      />
                      <stop
                        offset="95%"
                        stopColor="#3b82f6"
                        stopOpacity={0}
                      />
                    </linearGradient>
                    <linearGradient
                      id="gradNew"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="#8b5cf6"
                        stopOpacity={0.2}
                      />
                      <stop
                        offset="95%"
                        stopColor="#8b5cf6"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(148,163,184,0.1)"
                  />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                    axisLine={{ stroke: "rgba(148,163,184,0.2)" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="visits"
                    name="Kunjungan"
                    stroke="#3b82f6"
                    fill="url(#gradVisits)"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{
                      r: 4,
                      fill: "#3b82f6",
                      stroke: "#fff",
                      strokeWidth: 2,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="newPatients"
                    name="Pasien Baru"
                    stroke="#8b5cf6"
                    fill="url(#gradNew)"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{
                      r: 4,
                      fill: "#8b5cf6",
                      stroke: "#fff",
                      strokeWidth: 2,
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
              <div className="flex items-center justify-center gap-6 mt-4">
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <div className="w-3 h-1 rounded-full bg-blue-500" />
                  Kunjungan
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <div className="w-3 h-1 rounded-full bg-purple-500" />
                  Pasien Baru
                </div>
              </div>
            </GlassCard>
          </SkeletonLoader>

          {/* Donut Chart - Complaint Distribution */}
          <SkeletonLoader className="h-[420px]">
            <GlassCard>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-6">
                Distribusi Keluhan
              </h2>
              <div className="flex flex-col lg:flex-row items-center gap-6">
                <div className="relative flex-shrink-0">
                  <ResponsiveContainer width={220} height={220}>
                    <PieChart>
                      <Pie
                        data={complaintDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        dataKey="count"
                        nameKey="complaint"
                        activeShape={renderActiveShape}
                      >
                        {complaintDistribution.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<PieTooltip />} wrapperStyle={{ zIndex: 20 }} position={{ x: 220, y: 0 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                      <p className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-50">
                        {totalComplaints.toLocaleString("id-ID")}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Total
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2 flex-1 w-full">
                  {complaintDistribution.map((item) => (
                    <div
                      key={item.complaint}
                      className="flex items-center gap-2 text-sm"
                    >
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-slate-600 dark:text-slate-400 truncate">
                        {item.complaint}
                      </span>
                      <span className="ml-auto font-mono text-xs text-slate-900 dark:text-slate-50 flex-shrink-0">
                        {item.percentage}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </GlassCard>
          </SkeletonLoader>
        </div>

        {/* Activity Feed */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
        >
          <SkeletonLoader className="h-[400px]">
            <GlassCard>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-6">
                Aktivitas Terakhir
              </h2>
              <div className="max-h-[400px] overflow-y-auto pr-2 space-y-1">
                {displayedActivities.map((activity, index) => {
                  const Icon = activityIconMap[activity.icon];
                  const severity = activity.severity || "info";
                  const colors = severityColorMap[severity];

                  return (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                      className={`flex items-start gap-4 py-3 ${
                        index < displayedActivities.length - 1
                          ? "border-b border-black/[0.04] dark:border-white/[0.04]"
                          : ""
                      }`}
                    >
                      <div
                        className={`${colors.bg} rounded-full p-2 flex-shrink-0 mt-0.5`}
                      >
                        {Icon && (
                          <Icon className={`w-4 h-4 ${colors.text}`} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-slate-900 dark:text-slate-50">
                          {activity.title}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                          {activity.description}
                        </p>
                      </div>
                      <span className="text-xs text-slate-400 dark:text-slate-500 flex-shrink-0 whitespace-nowrap">
                        {formatRelativeTime(activity.timestamp)}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
              {!showAllActivities && activities.length > 10 && (
                <button
                  onClick={() => setShowAllActivities(true)}
                  className="w-full mt-4 py-2 text-sm font-medium text-blue-500 hover:text-blue-400 transition-colors"
                >
                  Lihat Semua ({activities.length})
                </button>
              )}
            </GlassCard>
          </SkeletonLoader>
        </motion.div>
      </div>
    </PageTransition>
  );
}
