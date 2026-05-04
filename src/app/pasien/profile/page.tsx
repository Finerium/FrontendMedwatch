"use client";

import Link from "next/link";
import { Search, ShieldCheck, User } from "lucide-react";
import { useHydratedAuth } from "@/lib/use-hydrated-store";

export default function PasienProfilePage() {
  const { user } = useHydratedAuth();

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
          <User className="w-8 h-8 text-purple-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold">{user?.name || user?.username || "Pasien"}</h1>
          <p className="text-xs text-slate-500">Akses Masyarakat</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/drug-search" className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-5 transition-colors">
          <Search className="w-6 h-6 text-blue-400 mb-2" />
          <h3 className="font-semibold mb-1">Cari Obat</h3>
          <p className="text-sm text-slate-500">Cek profil obat dan informasi keamanan</p>
        </Link>
        <Link href="/safety-checker" className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-5 transition-colors">
          <ShieldCheck className="w-6 h-6 text-green-400 mb-2" />
          <h3 className="font-semibold mb-1">Cek Keamanan</h3>
          <p className="text-sm text-slate-500">Periksa interaksi obat sebelum konsumsi</p>
        </Link>
      </div>

      <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-5 text-sm text-slate-400">
        <p className="font-semibold text-blue-400 mb-2">Informasi</p>
        <p>
          Akun masyarakat memiliki akses terbatas: hanya bisa mencari obat dan cek keamanan obat. Untuk konsultasi lebih lanjut, silakan kunjungi Faskes 1 terdekat.
        </p>
      </div>
    </div>
  );
}
