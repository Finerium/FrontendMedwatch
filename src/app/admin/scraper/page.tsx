"use client";

import { useState } from "react";
import { Database, Loader2, CheckCircle } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

type ScrapeResult = {
  status: string;
  drugs_updated: number;
  recalls_added: number;
  source: string;
  timestamp: string;
};

export default function AdminScraperPage() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ScrapeResult | null>(null);

  const trigger = async () => {
    setBusy(true);
    setResult(null);
    try {
      const r = await api.post<ScrapeResult>("/api/admin/scrape");
      setResult(r);
      toast.success("Scraper berhasil dijalankan");
    } catch (e) {
      toast.error(`Gagal: ${e}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Database className="w-6 h-6 text-amber-500" />
          Trigger Scraper Data Obat
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Jalankan scraper anggota1 untuk update drug_database.json dari drugs.com dan FDA recall feed.
          Dalam mode demo ini scraper di-mock (3 detik delay, return cached data).
        </p>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <button
          onClick={trigger}
          disabled={busy}
          className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-medium rounded-xl text-lg"
        >
          {busy ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Sedang scraping... (estimasi 3 detik)
            </>
          ) : (
            <>
              <Database className="w-5 h-5" />
              Mulai Scraping Sekarang
            </>
          )}
        </button>
      </div>

      {result && (
        <div className="bg-green-500/5 border border-green-500/20 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <p className="font-semibold text-green-400">Scraping Selesai</p>
          </div>
          <dl className="grid grid-cols-2 gap-y-2 text-sm">
            <dt className="text-slate-500">Status:</dt><dd className="font-mono">{result.status}</dd>
            <dt className="text-slate-500">Obat di-update:</dt><dd className="font-mono">{result.drugs_updated}</dd>
            <dt className="text-slate-500">Recall ditambahkan:</dt><dd className="font-mono">{result.recalls_added}</dd>
            <dt className="text-slate-500">Source:</dt><dd className="font-mono">{result.source}</dd>
            <dt className="text-slate-500">Waktu:</dt><dd className="font-mono text-xs">{new Date(result.timestamp).toLocaleString("id-ID")}</dd>
          </dl>
        </div>
      )}
    </div>
  );
}
