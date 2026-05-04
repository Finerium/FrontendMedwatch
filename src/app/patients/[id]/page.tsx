"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Printer, FileDown, Loader2 } from "lucide-react";
import { usePatientStore, type Patient } from "@/lib/store";
import { composeO, formatTanggalLong } from "@/lib/patient-format";
import { generateReport } from "@/lib/pdf-generator";
import { toast } from "sonner";

export default function PatientDetailPage() {
  const params = useParams<{ id: string }>();
  const fetchOne = usePatientStore((s) => s.fetchOne);

  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchOne(params.id).then((p) => {
      if (mounted) {
        setPatient(p);
        setLoading(false);
      }
    });
    return () => { mounted = false; };
  }, [params.id, fetchOne]);

  const handlePdf = async () => {
    if (!patient) return;
    setExporting(true);
    try {
      await generateReport({ reportType: "rekam-medis", pasienId: patient.id });
      toast.success("PDF diunduh");
    } catch (e) {
      toast.error(`Gagal generate PDF: ${e}`);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-500">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Memuat...
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="space-y-4">
        <Link href="/patients" className="text-sm text-slate-400 hover:text-white inline-flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Kembali
        </Link>
        <p className="text-red-400">Pasien tidak ditemukan.</p>
      </div>
    );
  }

  const tindakanLines = patient.P.tindakan.split("\n").map((s) => s.trim()).filter(Boolean);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; color: black !important; }
          .print-card { background: white !important; color: black !important; border: 1px solid #999 !important; }
        }
      `}</style>

      <div className="no-print flex items-center justify-between">
        <Link href="/patients" className="text-sm text-slate-400 hover:text-white inline-flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Kembali
        </Link>
        <div className="flex gap-2">
          <button onClick={() => window.print()} className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-white/5 border border-white/10 hover:bg-white/10">
            <Printer className="w-4 h-4" /> Print
          </button>
          <button onClick={handlePdf} disabled={exporting} className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white">
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
            Ekspor PDF
          </button>
        </div>
      </div>

      <article className="print-card bg-white/5 border border-white/10 rounded-2xl p-8 font-mono text-sm leading-relaxed">
        <header className="mb-4 pb-3 border-b border-white/10">
          <p>Tgl <strong>{formatTanggalLong(patient.tanggal_kunjungan)}</strong></p>
          <p>Nama   : {patient.nama}</p>
          <p>Umur   : {patient.umur || "-"} THN</p>
          <p>Alamat : {patient.alamat || "-"}</p>
          {patient.kategori && <p>Kategori: {patient.kategori}</p>}
        </header>

        <section className="mb-4">
          <p><strong>S</strong> : {patient.S.keluhan}</p>
          {patient.S.riwayat && <p className="ml-5">{patient.S.riwayat}</p>}
        </section>

        <section className="mb-4">
          <p><strong>O</strong> : {composeO(patient.O)}</p>
        </section>

        <section className="mb-4">
          <p><strong>A</strong> : {patient.A.diagnosa}</p>
        </section>

        <section>
          <p><strong>P</strong> :</p>
          <ul className="ml-5 list-none">
            {tindakanLines.map((line, i) => (<li key={i}>{line}</li>))}
            {patient.P.resep && <li className="mt-2">Resep: {patient.P.resep}</li>}
            {patient.P.jadwal_kontrol && <li>Kontrol: {patient.P.jadwal_kontrol}</li>}
          </ul>
        </section>

        <footer className="mt-8 pt-3 border-t border-white/10 text-xs text-slate-500">
          ID Pasien: {patient.id}
        </footer>
      </article>
    </div>
  );
}
