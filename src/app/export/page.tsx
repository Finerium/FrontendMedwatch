"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { PageTransition } from "@/components/layout/PageTransition";
import { GlassCard } from "@/components/shared/GlassCard";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileDown,
  Download,
  RotateCcw,
  Loader2,
  CheckCircle,
  FileText,
  BarChart3,
  Shield,
  Map,
  AlertTriangle,
  Check,
  ChevronDown,
  Calendar,
  Clock,
  HardDrive,
} from "lucide-react";
import { toast } from "sonner";

/* -------------------------------------------------------------------------- */
/*  Types & Data                                                              */
/* -------------------------------------------------------------------------- */

interface ReportTypeOption {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}

const reportTypes: ReportTypeOption[] = [
  { label: "Rekap Pasien Bulanan", value: "rekap-pasien", icon: FileText },
  { label: "Profil Keamanan Obat", value: "profil-keamanan", icon: Shield },
  { label: "Laporan Kunjungan", value: "laporan-kunjungan", icon: BarChart3 },
  { label: "Ringkasan Interaksi Obat", value: "ringkasan-interaksi", icon: AlertTriangle },
  { label: "Distribusi Pasien per Provinsi", value: "distribusi-provinsi", icon: Map },
];

const months = [
  "Apr 2025", "Mei 2025", "Jun 2025", "Jul 2025",
  "Agu 2025", "Sep 2025", "Okt 2025", "Nov 2025",
  "Des 2025", "Jan 2026", "Feb 2026", "Mar 2026",
];

interface CheckboxOption {
  id: string;
  label: string;
  defaultChecked: boolean;
}

const checkboxOptions: CheckboxOption[] = [
  { id: "charts", label: "Sertakan grafik visualisasi", defaultChecked: true },
  { id: "warnings", label: "Sertakan peringatan obat", defaultChecked: true },
  { id: "side-effects", label: "Sertakan data efek samping", defaultChecked: true },
  { id: "map", label: "Sertakan peta distribusi", defaultChecked: true },
];

interface RecentReport {
  type: string;
  period: string;
  generatedDate: string;
  size: string;
}

const recentReports: RecentReport[] = [
  { type: "Rekap Pasien Bulanan", period: "Mar 2026", generatedDate: "28 Mar 2026", size: "2.4 MB" },
  { type: "Profil Keamanan Obat", period: "Feb 2026", generatedDate: "25 Mar 2026", size: "1.8 MB" },
  { type: "Laporan Kunjungan", period: "Jan-Mar 2026", generatedDate: "20 Mar 2026", size: "3.1 MB" },
  { type: "Ringkasan Interaksi Obat", period: "Q1 2026", generatedDate: "15 Mar 2026", size: "1.2 MB" },
  { type: "Distribusi Pasien per Provinsi", period: "2025-2026", generatedDate: "10 Mar 2026", size: "4.5 MB" },
];

/* -------------------------------------------------------------------------- */
/*  Custom Glass Select Dropdown                                              */
/* -------------------------------------------------------------------------- */

interface GlassSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: { label: string; value: string; icon?: React.ComponentType<{ className?: string }> }[];
  placeholder: string;
  id?: string;
}

function GlassSelect({ value, onChange, options, placeholder, id }: GlassSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} className={`relative ${open ? "z-50" : ""}`} id={id}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={selected ? `${placeholder}: ${selected.label}` : placeholder}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={
          "w-full flex items-center justify-between gap-2 px-4 py-3 " +
          "bg-white/50 dark:bg-white/[0.05] " +
          "border border-black/[0.08] dark:border-white/[0.08] " +
          "rounded-xl text-left transition-all duration-200 " +
          "hover:bg-white/60 dark:hover:bg-white/[0.08] " +
          "focus:outline-none focus:ring-2 focus:ring-blue-500/40 " +
          (open ? "ring-2 ring-blue-500/40" : "")
        }
      >
        <span className="flex items-center gap-2.5 min-w-0">
          {selected?.icon && (() => {
            const Icon = selected.icon;
            return <Icon className="w-4 h-4 text-blue-500 shrink-0" />;
          })()}
          <span
            className={
              selected
                ? "text-slate-900 dark:text-slate-50 truncate"
                : "text-slate-400 dark:text-slate-500 truncate"
            }
          >
            {selected ? selected.label : placeholder}
          </span>
        </span>
        <ChevronDown
          className={
            "w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 " +
            (open ? "rotate-180" : "")
          }
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={
              "absolute z-50 mt-2 w-full " +
              "bg-white/80 dark:bg-slate-900/90 " +
              "backdrop-blur-2xl " +
              "border border-black/[0.08] dark:border-white/[0.12] " +
              "rounded-2xl shadow-2xl " +
              "overflow-hidden py-1"
            }
          >
            {options.map((option) => {
              const isSelected = option.value === value;
              const Icon = option.icon;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={
                    "w-full flex items-center gap-2.5 px-4 py-2.5 text-left transition-colors duration-150 " +
                    (isSelected
                      ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                      : "text-slate-700 dark:text-slate-300 hover:bg-black/[0.04] dark:hover:bg-white/[0.06]")
                  }
                >
                  {Icon && (
                    <Icon
                      className={
                        "w-4 h-4 shrink-0 " +
                        (isSelected ? "text-blue-500" : "text-slate-400 dark:text-slate-500")
                      }
                    />
                  )}
                  <span className="truncate text-sm">{option.label}</span>
                  {isSelected && <Check className="w-4 h-4 ml-auto text-blue-500 shrink-0" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Custom Checkbox                                                           */
/* -------------------------------------------------------------------------- */

interface GlassCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  id: string;
}

function GlassCheckbox({ checked, onChange, label, id }: GlassCheckboxProps) {
  return (
    <label
      htmlFor={id}
      className="flex items-center gap-3 cursor-pointer group select-none"
    >
      <button
        type="button"
        id={id}
        role="checkbox"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={
          "w-5 h-5 rounded-md border flex items-center justify-center transition-all duration-200 shrink-0 " +
          (checked
            ? "bg-blue-600 border-blue-600 shadow-sm shadow-blue-600/25"
            : "bg-white/50 dark:bg-white/[0.05] border-black/[0.15] dark:border-white/[0.15] " +
              "group-hover:border-blue-400 dark:group-hover:border-blue-400")
        }
      >
        <AnimatePresence>
          {checked && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
            </motion.div>
          )}
        </AnimatePresence>
      </button>
      <span className="text-sm text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-slate-100 transition-colors">
        {label}
      </span>
    </label>
  );
}

/* -------------------------------------------------------------------------- */
/*  Format Toggle                                                             */
/* -------------------------------------------------------------------------- */

function FormatToggle({
  activeFormat,
  onFormatChange,
}: {
  activeFormat: string;
  onFormatChange: (format: string) => void;
}) {
  return (
    <div className="flex gap-2" role="radiogroup" aria-label="Format output">
      <button
        type="button"
        onClick={() => onFormatChange("pdf")}
        role="radio"
        aria-checked={activeFormat === "pdf"}
        aria-label="Export as PDF"
        className={
          "px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 " +
          (activeFormat === "pdf"
            ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
            : "bg-white/50 dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/[0.08] " +
              "text-slate-600 dark:text-slate-400 hover:bg-white/70 dark:hover:bg-white/[0.08]")
        }
      >
        PDF
      </button>
      <button
        type="button"
        disabled
        aria-label="Export as Excel (coming soon)"
        className={
          "px-5 py-2.5 rounded-xl text-sm font-medium relative " +
          "bg-white/30 dark:bg-white/[0.02] border border-black/[0.05] dark:border-white/[0.05] " +
          "text-slate-400 dark:text-slate-600 cursor-not-allowed"
        }
      >
        Excel
        <span
          className={
            "absolute -top-2 -right-2 text-[10px] font-semibold px-1.5 py-0.5 rounded-full " +
            "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20"
          }
        >
          Soon
        </span>
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Mock Preview                                                              */
/* -------------------------------------------------------------------------- */

interface PreviewContentProps {
  reportType: string;
  fromPeriod: string;
  toPeriod: string;
  includeCharts: boolean;
  includeWarnings: boolean;
}

function PreviewContent({ reportType, fromPeriod, toPeriod, includeCharts, includeWarnings }: PreviewContentProps) {
  const reportLabel = reportTypes.find((r) => r.value === reportType)?.label ?? "Laporan";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="bg-white dark:bg-slate-900/80 rounded-xl p-6 space-y-5 border border-black/[0.04] dark:border-white/[0.04]"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">MedWatch</h3>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mt-1">{reportLabel}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            Periode: {fromPeriod || "–"} s/d {toPeriod || "–"}
          </p>
        </div>
        <div className="text-xs text-slate-400 dark:text-slate-500 text-right">
          <p>Tanggal: 30 Mar 2026</p>
          <p>Ref: MW-2026-0330</p>
        </div>
      </div>

      <div className="border-t border-slate-200 dark:border-slate-700" />

      {/* Simulated text paragraphs */}
      <div className="space-y-2.5">
        <div className="h-3 rounded-full bg-slate-200 dark:bg-slate-700 w-full" />
        <div className="h-3 rounded-full bg-slate-200 dark:bg-slate-700 w-[92%]" />
        <div className="h-3 rounded-full bg-slate-200 dark:bg-slate-700 w-[85%]" />
        <div className="h-3 rounded-full bg-slate-200 dark:bg-slate-700 w-[78%]" />
      </div>

      {/* Chart area */}
      {includeCharts && (
        <div className="bg-slate-100 dark:bg-slate-800 rounded-lg h-32 flex items-center justify-center">
          <BarChart3 className="w-8 h-8 text-slate-300 dark:text-slate-600" />
        </div>
      )}

      {/* More text */}
      <div className="space-y-2.5">
        <div className="h-3 rounded-full bg-slate-200 dark:bg-slate-700 w-[95%]" />
        <div className="h-3 rounded-full bg-slate-200 dark:bg-slate-700 w-[70%]" />
      </div>

      {/* Warning blocks */}
      {includeWarnings && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/30">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            <div className="h-2.5 rounded-full bg-amber-200 dark:bg-amber-700/50 w-[60%]" />
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/30">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
            <div className="h-2.5 rounded-full bg-red-200 dark:bg-red-700/50 w-[45%]" />
          </div>
        </div>
      )}

      <div className="border-t border-slate-200 dark:border-slate-700" />

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
        <span>Halaman 1 dari 3</span>
        <span>Generated by MedWatch</span>
      </div>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Main Page Component                                                       */
/* -------------------------------------------------------------------------- */

export default function ExportPage() {
  /* --- Form state --- */
  const [reportType, setReportType] = useState("");
  const [fromPeriod, setFromPeriod] = useState("");
  const [toPeriod, setToPeriod] = useState("");
  const [checkedOptions, setCheckedOptions] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(checkboxOptions.map((o) => [o.id, o.defaultChecked]))
  );
  const [format, setFormat] = useState("pdf");

  /* --- Generation state --- */
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);

  const canGenerate = reportType !== "";

  const handleToggleCheck = useCallback((id: string, checked: boolean) => {
    setCheckedOptions((prev) => ({ ...prev, [id]: checked }));
  }, []);

  const handleGenerate = useCallback(() => {
    if (!canGenerate) return;
    setIsGenerating(true);
    setIsGenerated(false);
    setTimeout(() => {
      setIsGenerating(false);
      setIsGenerated(true);
      toast("Laporan berhasil di-generate", {
        icon: <CheckCircle className="w-5 h-5 text-green-500" />,
      });
    }, 1500);
  }, [canGenerate]);

  const handleDownload = useCallback(() => {
    toast("Laporan berhasil didownload", {
      icon: <Download className="w-5 h-5 text-blue-500" />,
    });
  }, []);

  const handleReset = useCallback(() => {
    setReportType("");
    setFromPeriod("");
    setToPeriod("");
    setCheckedOptions(Object.fromEntries(checkboxOptions.map((o) => [o.id, o.defaultChecked])));
    setFormat("pdf");
    setIsGenerating(false);
    setIsGenerated(false);
  }, []);

  /* --- Period dropdown options --- */
  const periodOptions = months.map((m) => ({ label: m, value: m }));

  /* --- Stagger animation variants --- */
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" as const } },
  };

  return (
    <PageTransition>
      <motion.div
        className="space-y-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* ---------------------------------------------------------------- */}
        {/*  Header                                                          */}
        {/* ---------------------------------------------------------------- */}
        <motion.div variants={itemVariants}>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Export PDF
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Generate dan export laporan dalam format PDF
          </p>
        </motion.div>

        {/* ---------------------------------------------------------------- */}
        {/*  Export Form                                                      */}
        {/* ---------------------------------------------------------------- */}
        <motion.div variants={itemVariants} className="relative z-20">
          <GlassCard className="overflow-visible">
            <div className="space-y-6">
              {/* Card title */}
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                  Export Laporan PDF
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Generate laporan dalam format PDF
                </p>
              </div>

              {/* Jenis Laporan */}
              <div>
                <label htmlFor="report-type" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Jenis Laporan <span className="text-red-500">*</span>
                </label>
                <GlassSelect
                  value={reportType}
                  onChange={setReportType}
                  options={reportTypes}
                  placeholder="Pilih jenis laporan..."
                  id="report-type"
                />
              </div>

              {/* Periode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="from-period" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    <Calendar className="w-3.5 h-3.5 inline-block mr-1.5 -mt-0.5" />
                    Dari
                  </label>
                  <GlassSelect
                    value={fromPeriod}
                    onChange={setFromPeriod}
                    options={periodOptions}
                    placeholder="Pilih bulan awal..."
                    id="from-period"
                  />
                </div>
                <div>
                  <label htmlFor="to-period" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    <Calendar className="w-3.5 h-3.5 inline-block mr-1.5 -mt-0.5" />
                    Sampai
                  </label>
                  <GlassSelect
                    value={toPeriod}
                    onChange={setToPeriod}
                    options={periodOptions}
                    placeholder="Pilih bulan akhir..."
                    id="to-period"
                  />
                </div>
              </div>

              {/* Opsi Tambahan */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                  Opsi Tambahan
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {checkboxOptions.map((opt) => (
                    <GlassCheckbox
                      key={opt.id}
                      id={opt.id}
                      label={opt.label}
                      checked={checkedOptions[opt.id] ?? false}
                      onChange={(checked) => handleToggleCheck(opt.id, checked)}
                    />
                  ))}
                </div>
              </div>

              {/* Format Output */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                  Format Output
                </label>
                <FormatToggle activeFormat={format} onFormatChange={setFormat} />
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* ---------------------------------------------------------------- */}
        {/*  Action Buttons                                                   */}
        {/* ---------------------------------------------------------------- */}
        <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={!canGenerate || isGenerating}
            onClick={handleGenerate}
            className={
              "inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 " +
              (canGenerate && !isGenerating
                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/25 active:scale-[0.98]"
                : "bg-blue-600/40 text-white/60 cursor-not-allowed")
            }
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileDown className="w-4 h-4" />
                Generate Laporan
              </>
            )}
          </button>

          <AnimatePresence>
            {isGenerated && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9, x: -8 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.9, x: -8 }}
                transition={{ duration: 0.2 }}
                type="button"
                onClick={handleDownload}
                className={
                  "inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold " +
                  "bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/25 " +
                  "transition-colors duration-200 active:scale-[0.98]"
                }
              >
                <Download className="w-4 h-4" />
                Download PDF
              </motion.button>
            )}
          </AnimatePresence>

          <button
            type="button"
            onClick={handleReset}
            className={
              "inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium " +
              "text-slate-600 dark:text-slate-400 " +
              "hover:bg-black/[0.04] dark:hover:bg-white/[0.04] " +
              "transition-colors duration-200"
            }
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
        </motion.div>

        {/* ---------------------------------------------------------------- */}
        {/*  Preview Area                                                     */}
        {/* ---------------------------------------------------------------- */}
        <motion.div variants={itemVariants}>
          <GlassCard>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">
              Preview Laporan
            </h2>

            <AnimatePresence mode="wait">
              {!isGenerated ? (
                <motion.div
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className={
                    "flex flex-col items-center justify-center py-16 " +
                    "border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl"
                  }
                >
                  <FileDown className="w-12 h-12 text-slate-400 dark:text-slate-500 mb-3" />
                  <p className="text-sm text-slate-400 dark:text-slate-500">
                    Preview laporan akan muncul setelah generate
                  </p>
                </motion.div>
              ) : (
                <PreviewContent
                  key="preview"
                  reportType={reportType}
                  fromPeriod={fromPeriod}
                  toPeriod={toPeriod}
                  includeCharts={checkedOptions["charts"] ?? false}
                  includeWarnings={checkedOptions["warnings"] ?? false}
                />
              )}
            </AnimatePresence>
          </GlassCard>
        </motion.div>

        {/* ---------------------------------------------------------------- */}
        {/*  Recent Reports Table                                             */}
        {/* ---------------------------------------------------------------- */}
        <motion.div variants={itemVariants}>
          <GlassCard>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">
              Laporan Terakhir
            </h2>

            <div className="overflow-x-auto -mx-6 px-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-white/30 dark:bg-white/[0.03]">
                    <th className="text-left font-medium text-slate-500 dark:text-slate-400 px-4 py-3 rounded-l-xl">
                      Jenis Laporan
                    </th>
                    <th className="text-left font-medium text-slate-500 dark:text-slate-400 px-4 py-3 hidden sm:table-cell">
                      Periode
                    </th>
                    <th className="text-left font-medium text-slate-500 dark:text-slate-400 px-4 py-3 hidden md:table-cell">
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        Tanggal Generate
                      </span>
                    </th>
                    <th className="text-left font-medium text-slate-500 dark:text-slate-400 px-4 py-3 hidden lg:table-cell">
                      <span className="inline-flex items-center gap-1.5">
                        <HardDrive className="w-3.5 h-3.5" />
                        Ukuran
                      </span>
                    </th>
                    <th className="text-right font-medium text-slate-500 dark:text-slate-400 px-4 py-3 rounded-r-xl">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentReports.map((report, i) => (
                    <tr
                      key={i}
                      className="border-t border-slate-200/50 dark:border-white/[0.04] hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-4 py-3.5">
                        <span className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-medium">
                          <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                          {report.type}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 dark:text-slate-400 hidden sm:table-cell">
                        {report.period}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 dark:text-slate-400 font-mono text-xs hidden md:table-cell">
                        {report.generatedDate}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 dark:text-slate-400 font-mono text-xs hidden lg:table-cell">
                        {report.size}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={handleDownload}
                          className={
                            "inline-flex items-center justify-center w-8 h-8 rounded-lg " +
                            "text-slate-500 dark:text-slate-400 " +
                            "hover:text-blue-600 dark:hover:text-blue-400 " +
                            "hover:bg-blue-500/10 " +
                            "transition-colors duration-200"
                          }
                          aria-label={`Download ${report.type}`}
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </motion.div>
      </motion.div>
    </PageTransition>
  );
}
