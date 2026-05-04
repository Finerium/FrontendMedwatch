"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Plus, Search, Eye, Trash2, Loader2, Users } from "lucide-react";
import { useHydratedPatientStore } from "@/lib/use-hydrated-store";
import { formatTanggalLong } from "@/lib/patient-format";
import { useAuthStore } from "@/lib/auth-store";
import { toast } from "sonner";

export default function PatientsPage() {
  const { patients, loading, error, hydrated, remove } = useHydratedPatientStore();
  const role = useAuthStore((s) => s.user?.role);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter(
      (p) =>
        p.nama?.toLowerCase().includes(q) ||
        p.id?.toLowerCase().includes(q) ||
        p.kategori?.toLowerCase().includes(q),
    );
  }, [patients, search]);

  const handleDelete = async (id: string, nama: string) => {
    if (!confirm(`Yakin hapus pasien ${nama} (${id})?`)) return;
    try {
      await remove(id);
      toast.success(`Pasien ${id} dihapus`);
    } catch (e) {
      toast.error(`Gagal hapus: ${e}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6 text-purple-500" />
            Data Pasien
          </h1>
          <p className="text-sm text-slate-500 mt-1">{patients.length} pasien terdaftar</p>
        </div>
        <Link
          href="/patients/new"
          className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" />
          Tambah Pasien
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama / ID / kategori..."
          className="w-full pl-10 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-purple-500"
        />
      </div>

      {loading && !hydrated && (
        <div className="flex items-center justify-center py-12 text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          Memuat data pasien...
        </div>
      )}

      {error && (
        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
          Gagal memuat data: {error}
        </div>
      )}

      {hydrated && filtered.length === 0 && (
        <div className="text-center py-16 border border-dashed border-white/10 rounded-2xl">
          <Users className="w-12 h-12 mx-auto text-slate-600 mb-3" />
          <p className="text-slate-500 mb-3">{patients.length === 0 ? "Belum ada pasien terdaftar." : "Tidak ada pasien yang cocok."}</p>
          {patients.length === 0 && (
            <Link href="/patients/new" className="text-purple-400 hover:text-purple-300 text-sm">
              Tambah pasien pertama
            </Link>
          )}
        </div>
      )}

      {filtered.length > 0 && (
        <div className="overflow-x-auto bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase text-slate-500">
                <th className="text-left p-3 px-4">ID</th>
                <th className="text-left p-3">Nama</th>
                <th className="text-left p-3">Umur</th>
                <th className="text-left p-3">Tgl Kunjungan</th>
                <th className="text-left p-3">Kategori</th>
                <th className="text-right p-3 px-4">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="p-3 px-4 font-mono text-xs text-purple-400">{p.id}</td>
                  <td className="p-3 font-medium">{p.nama}</td>
                  <td className="p-3 text-slate-400">{p.umur || "-"} thn</td>
                  <td className="p-3 text-slate-400">{formatTanggalLong(p.tanggal_kunjungan)}</td>
                  <td className="p-3">
                    <span className="text-xs px-2 py-1 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      {p.kategori || "Umum"}
                    </span>
                  </td>
                  <td className="p-3 px-4 text-right">
                    <Link
                      href={`/patients/${p.id}`}
                      aria-label={`Lihat ${p.nama}`}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg hover:bg-white/10 text-slate-400 hover:text-purple-400 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                    {role === "admin" && (
                      <button
                        onClick={() => handleDelete(p.id, p.nama)}
                        aria-label={`Hapus ${p.nama}`}
                        className="ml-1 inline-flex items-center justify-center w-8 h-8 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
