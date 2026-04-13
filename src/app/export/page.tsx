"use client";

import { useState, useCallback } from "react";
import { PageTransition } from "@/components/layout/PageTransition";
import { GlassCard } from "@/components/shared/GlassCard";
import { motion, AnimatePresence } from "framer-motion";
import { useHydratedPatientStore } from "@/lib/use-hydrated-store";
import { generateReport, type ReportOptions } from "@/lib/pdf-generator";
import {
  FileDown,
  Download,
  RotateCcw,
  Loader2,
  CheckCircle,
  FileText,
  Shield,
  BarChart3,
  Check,
  ChevronDown,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";

/* -------------------------------------------------------------------------- */
/*  Types & Config                                                            */
/* -------------------------------------------------------------------------- */

interface ReportTypeOption {
  label: string;
  value: ReportOptions["reportType"];
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const reportTypes: ReportTypeOption[] = [
  { label: "Rekap Pasien Bulanan", value: "monthly", icon: FileText, description: "Daftar pasien dan ringkasan kunjungan" },
  { label: "Profil Keamanan Obat", value: "drug-profile", icon: Shield, description: "Top obat dan profil keamanan" },
  { label: "Laporan Lengkap", value: "complete", icon: BarChart3, description: "Semua data dalam satu laporan" },
];

/* -------------------------------------------------------------------------- */
/*  Custom Glass Select Dropdown                                              */
/* -------------------------------------------------------------------------- */

interface GlassSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: { label: string; value: string; icon?: React.ComponentType<{ className?: string }>; description?: string }[];
  placeholder: string;
}

function GlassSelect({ value, onChange, options, placeholder }: GlassSelectProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <div className={`relative ${open ? "z-50" : ""}`}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
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
          <span className={selected ? "text-slate-900 dark:text-slate-50 truncate" : "text-slate-400 dark:text-slate-500 truncate"}>
            {selected ? selected.label : placeholder}
          </span>
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="absolute z-50 mt-2 w-full bg-white/80 dark:bg-slate-900/90 backdrop-blur-2xl border border-black/[0.08] dark:border-white/[0.12] rounded-2xl shadow-2xl overflow-hidden py-1"
            >
              {options.map((option) => {
                const isSelected = option.value === value;
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => { onChange(option.value); setOpen(false); }}
                    className={
                      "w-full flex items-center gap-2.5 px-4 py-2.5 text-left transition-colors " +
                      (isSelected ? "bg-blue-500/10 text-blue-600 dark:text-blue-400" : "text-slate-700 dark:text-slate-300 hover:bg-black/[0.04] dark:hover:bg-white/[0.06]")
                    }
                  >
                    {Icon && <Icon className={`w-4 h-4 shrink-0 ${isSelected ? "text-blue-500" : "text-slate-400"}`} />}
                    <div className="min-w-0">
                      <span className="text-sm block truncate">{option.label}</span>
                      {option.description && <span className="text-xs text-slate-400 block">{option.description}</span>}
                    </div>
                    {isSelected && <Check className="w-4 h-4 ml-auto text-blue-500 shrink-0" />}
                  </button>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Custom Checkbox                                                           */
/* -------------------------------------------------------------------------- */

function GlassCheckbox({ checked, onChange, label, id }: { checked: boolean; onChange: (c: boolean) => void; label: string; id: string }) {
  return (
    <label htmlFor={id} className="flex items-center gap-3 cursor-pointer group select-none">
      <button type="button" id={id} role="checkbox" aria-checked={checked} onClick={() => onChange(!checked)}
        className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all shrink-0 ${
          checked ? "bg-blue-600 border-blue-600 shadow-sm shadow-blue-600/25"
            : "bg-white/50 dark:bg-white/[0.05] border-black/[0.15] dark:border-white/[0.15] group-hover:border-blue-400"
        }`}
      >
        <AnimatePresence>
          {checked && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ duration: 0.15 }}>
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
/*  Main Page Component                                                       */
/* -------------------------------------------------------------------------- */

export default function ExportPage() {
  const { patients, hydrated } = useHydratedPatientStore();

  const [reportType, setReportType] = useState<ReportOptions["reportType"] | "">("");
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [includeSafety, setIncludeSafety] = useState(true);

  const [isGenerating, setIsGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const canGenerate = reportType !== "" && hydrated;

  const handleGenerate = useCallback(async () => {
    if (!canGenerate || !reportType) return;
    setIsGenerating(true);
    setPreviewUrl(null);

    try {
      const filteredPatients = patients.filter((p) => {
        const visitDate = new Date(p.visitDate);
        return visitDate >= new Date(startDate) && visitDate <= new Date(endDate);
      });

      const options: ReportOptions = {
        reportType: reportType as ReportOptions["reportType"],
        startDate,
        endDate,
        includeCharts: false,
        includeSafety,
      };

      const doc = await generateReport(filteredPatients, options);
      const blob = doc.output("blob");
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);

      toast.success("PDF berhasil di-generate");
    } catch (error) {
      console.error(error);
      toast.error("Gagal generate PDF. Coba lagi.");
    } finally {
      setIsGenerating(false);
    }
  }, [canGenerate, reportType, patients, startDate, endDate, includeSafety]);

  const handleDownload = useCallback(() => {
    if (!previewUrl) return;
    const link = document.createElement("a");
    link.href = previewUrl;
    link.download = `medwatch-report-${new Date().toISOString().slice(0, 10)}.pdf`;
    link.click();
    toast.success("PDF berhasil diunduh");
  }, [previewUrl]);

  const handleReset = useCallback(() => {
    setReportType("");
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    setStartDate(d.toISOString().slice(0, 10));
    setEndDate(new Date().toISOString().slice(0, 10));
    setIncludeSafety(true);
    setIsGenerating(false);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  }, [previewUrl]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" as const } },
  };

  if (!hydrated) {
    return (
      <PageTransition>
        <div className="space-y-8">
          <div className="h-8 w-48 rounded-lg bg-white/50 dark:bg-white/[0.05] animate-pulse" />
          <div className="h-64 rounded-2xl bg-white/50 dark:bg-white/[0.05] animate-pulse" />
          <div className="h-96 rounded-2xl bg-white/50 dark:bg-white/[0.05] animate-pulse" />
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <motion.div className="space-y-8" variants={containerVariants} initial="hidden" animate="visible">
        {/* Header */}
        <motion.div variants={itemVariants}>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Export PDF
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Generate dan export laporan dalam format PDF
          </p>
        </motion.div>

        {/* Export Form */}
        <motion.div variants={itemVariants} className="relative z-20">
          <GlassCard className="overflow-visible">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                  Export Laporan PDF
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {patients.length} pasien tersedia untuk laporan
                </p>
              </div>

              {/* Jenis Laporan */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Jenis Laporan <span className="text-red-500">*</span>
                </label>
                <GlassSelect
                  value={reportType}
                  onChange={(v) => setReportType(v as ReportOptions["reportType"])}
                  options={reportTypes}
                  placeholder="Pilih jenis laporan..."
                />
              </div>

              {/* Periode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="start-date" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    <Calendar className="w-3.5 h-3.5 inline-block mr-1.5 -mt-0.5" />
                    Dari Tanggal
                  </label>
                  <input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-3 bg-white/50 dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/[0.08] rounded-xl text-sm text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
                  />
                </div>
                <div>
                  <label htmlFor="end-date" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    <Calendar className="w-3.5 h-3.5 inline-block mr-1.5 -mt-0.5" />
                    Sampai Tanggal
                  </label>
                  <input
                    id="end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-3 bg-white/50 dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/[0.08] rounded-xl text-sm text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
                  />
                </div>
              </div>

              {/* Opsi Tambahan */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                  Opsi Tambahan
                </label>
                <GlassCheckbox
                  id="include-safety"
                  label="Sertakan ringkasan keamanan obat"
                  checked={includeSafety}
                  onChange={setIncludeSafety}
                />
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Action Buttons */}
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
            {previewUrl && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9, x: -8 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                type="button"
                onClick={handleDownload}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/25 transition-colors active:scale-[0.98]"
              >
                <Download className="w-4 h-4" />
                Download PDF
              </motion.button>
            )}
          </AnimatePresence>

          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
        </motion.div>

        {/* Preview Area */}
        <motion.div variants={itemVariants}>
          <GlassCard>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">
              Preview Laporan
            </h2>

            <AnimatePresence mode="wait">
              {!previewUrl ? (
                <motion.div
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl"
                >
                  <FileDown className="w-12 h-12 text-slate-400 dark:text-slate-500 mb-3" />
                  <p className="text-sm text-slate-400 dark:text-slate-500">
                    Preview laporan akan muncul setelah generate
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="preview"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                >
                  <div className="flex items-center gap-2 mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
                    <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                    <p className="text-sm text-green-700 dark:text-green-400">
                      PDF berhasil di-generate. Klik Download untuk menyimpan.
                    </p>
                  </div>
                  <iframe
                    src={previewUrl}
                    className="w-full h-[600px] rounded-xl border border-black/[0.06] dark:border-white/[0.08]"
                    title="PDF Preview"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </GlassCard>
        </motion.div>
      </motion.div>
    </PageTransition>
  );
}
