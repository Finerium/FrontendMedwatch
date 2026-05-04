"use client";

import { useState } from "react";
import { ShieldCheck, Plus, X, Loader2, AlertTriangle, Check, AlertCircle } from "lucide-react";
import { checkDrugSafety, type SafetyResult } from "@/lib/safety-checker";
import { toast } from "sonner";

const SEVERITY_STYLE: Record<string, { color: string; bg: string; label: string; icon: typeof Check }> = {
  low: { color: "text-green-400", bg: "bg-green-500/10 border-green-500/20", label: "Risiko Rendah", icon: Check },
  medium: { color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", label: "Risiko Sedang", icon: AlertCircle },
  high: { color: "text-red-400", bg: "bg-red-500/10 border-red-500/20", label: "Risiko Tinggi", icon: AlertTriangle },
};

export default function SafetyCheckerPage() {
  const [drugs, setDrugs] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [result, setResult] = useState<SafetyResult | null>(null);
  const [loading, setLoading] = useState(false);

  const addDrug = () => {
    const v = input.trim();
    if (!v) return;
    if (drugs.includes(v)) {
      toast.error("Obat sudah ditambahkan");
      return;
    }
    setDrugs([...drugs, v]);
    setInput("");
  };

  const removeDrug = (d: string) => {
    setDrugs(drugs.filter((x) => x !== d));
    setResult(null);
  };

  const check = async () => {
    if (drugs.length === 0) {
      toast.error("Tambahkan minimal 1 obat");
      return;
    }
    setLoading(true);
    try {
      const r = await checkDrugSafety(drugs);
      setResult(r);
    } catch (e) {
      toast.error(`Gagal cek keamanan: ${e}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-purple-500" />
          Safety Checker Obat
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Cek keamanan obat dan deteksi efek tumpang tindih untuk satu atau beberapa obat sekaligus.
        </p>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addDrug())}
            placeholder="contoh: paracetamol, ibuprofen, amoxicillin"
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-purple-500"
          />
          <button onClick={addDrug} className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg">
            <Plus className="w-4 h-4" /> Tambah
          </button>
        </div>

        {drugs.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {drugs.map((d) => (
              <span key={d} className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 text-purple-300 text-sm rounded-lg">
                {d}
                <button onClick={() => removeDrug(d)} aria-label={`Remove ${d}`} className="ml-1 hover:text-red-400">
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>
        )}

        <button onClick={check} disabled={loading || drugs.length === 0} className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-medium rounded-lg">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
          Cek Keamanan
        </button>
      </div>

      {result && (
        <div className="space-y-4">
          {(() => {
            const sev = SEVERITY_STYLE[result.severity_level] || SEVERITY_STYLE.low;
            const Icon = sev.icon;
            return (
              <div className={`p-5 border rounded-2xl ${sev.bg}`}>
                <div className="flex items-center gap-3">
                  <Icon className={`w-8 h-8 ${sev.color}`} />
                  <div>
                    <p className={`text-lg font-bold ${sev.color}`}>{sev.label}</p>
                    <p className="text-sm text-slate-400">Skor agregat: {result.severity_score}/100</p>
                  </div>
                </div>
              </div>
            );
          })()}

          {result.warnings.length > 0 && (
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5">
              <p className="text-sm font-semibold text-amber-400 mb-2">Peringatan Prioritas</p>
              <ul className="space-y-1 text-sm text-slate-300 list-disc list-inside">
                {result.warnings.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            </div>
          )}

          {result.interactions.length > 0 && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <p className="text-sm font-semibold mb-3">Efek Tumpang Tindih ({result.interactions.length})</p>
              <ul className="space-y-2">
                {result.interactions.map((i, idx) => (
                  <li key={idx} className="text-sm text-slate-300">
                    <span className="font-medium">{i.nama_efek}</span>
                    <span className="text-slate-500"> [{i.tingkat_tertinggi}] </span>
                    <span className="text-slate-400">muncul pada: {i.obat_terkait.join(", ")}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {result.drugs.map((d, idx) => (
              <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <p className="font-semibold">{d.obat.nama_obat}</p>
                <p className="text-xs text-slate-500 mb-2">{d.obat.kategori}</p>
                <div className="text-sm">
                  <p>Skor: <span className="font-mono">{d.skor_risiko}/100</span> ({d.label_risiko})</p>
                  <p className="text-xs text-slate-400 mt-1">
                    serius: {d.ringkasan_keparahan.serius}, sedang: {d.ringkasan_keparahan.sedang}, ringan: {d.ringkasan_keparahan.ringan}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {result.obat_tidak_ditemukan.length > 0 && (
            <div className="text-sm text-red-400 bg-red-500/5 border border-red-500/20 rounded-lg p-3">
              Obat tidak ditemukan di database: {result.obat_tidak_ditemukan.join(", ")}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
