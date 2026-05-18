/**
 * Compact PDF export page used by the in-app sidebar shortcut. Marked
 * `"use client"` because the patient picker, toast notifications, and
 * the role-aware admin block depend on client-side state and hooks.
 * The newer `/export-pdf` route (B04 fix) supersedes this layout; this
 * variant is kept for the dashboard quick action.
 */
"use client";

import { useState } from "react";
import { FileDown, Loader2, FileText } from "lucide-react";
import { useHydratedPatientStore } from "@/lib/use-hydrated-store";
import { generateReport } from "@/lib/pdf-generator";
import { useAuthStore } from "@/lib/auth-store";
import { toast } from "sonner";

/**
 * Render the two-card export form (per-patient SOAP and admin monthly
 * aggregate). The monthly card is hidden when the current user is not
 * an admin.
 */
export default function ExportPage() {
  const { patients, hydrated } = useHydratedPatientStore();
  const role = useAuthStore((s) => s.user?.role);

  const [pasienId, setPasienId] = useState("");
  const [month, setMonth] = useState("");
  const [busy, setBusy] = useState(false);

  const handleRekamMedis = async () => {
    if (!pasienId) {
      toast.error("Pilih pasien dulu");
      return;
    }
    setBusy(true);
    try {
      await generateReport({ reportType: "rekam-medis", pasienId });
      toast.success("PDF rekam medis diunduh");
    } catch (e) {
      toast.error(`Gagal: ${e}`);
    } finally {
      setBusy(false);
    }
  };

  const handleBulanan = async () => {
    if (role !== "admin") {
      toast.error("Hanya admin yang bisa generate laporan bulanan");
      return;
    }
    setBusy(true);
    try {
      await generateReport({ reportType: "laporan-bulanan", month });
      toast.success("PDF laporan bulanan diunduh");
    } catch (e) {
      toast.error(`Gagal: ${e}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileDown className="w-6 h-6 text-purple-500" />
          Ekspor Laporan PDF
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Generate PDF dari backend (anggota5/export_pdf via api/pdf endpoints).
        </p>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="w-5 h-5 text-purple-400" />
          <h2 className="font-semibold">Rekam Medis Pasien</h2>
        </div>
        <p className="text-sm text-slate-500">PDF satu pasien dengan layout SOAP lengkap.</p>
        <select
          value={pasienId}
          onChange={(e) => setPasienId(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-purple-500"
          disabled={!hydrated}
        >
          <option value="">Pilih pasien...</option>
          {patients.map((p) => (
            <option key={p.id} value={p.id}>{p.id} - {p.nama}</option>
          ))}
        </select>
        <button onClick={handleRekamMedis} disabled={busy || !pasienId} className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
          Generate PDF Rekam Medis
        </button>
      </div>

      {role === "admin" && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-5 h-5 text-amber-400" />
            <h2 className="font-semibold">Laporan Bulanan (Admin)</h2>
          </div>
          <p className="text-sm text-slate-500">PDF agregat semua pasien dalam bulan tertentu.</p>
          <input
            type="text"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            placeholder="Format: YYYY-MM (contoh: 2026-04). Kosongkan untuk semua."
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-purple-500"
          />
          <button onClick={handleBulanan} disabled={busy} className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
            Generate PDF Laporan Bulanan
          </button>
        </div>
      )}
    </div>
  );
}
