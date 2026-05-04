"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldCheck, Users, Pill, Database, UserCog, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

type Stats = {
  users_count: number;
  patients_count: number;
  drugs_count: number;
  last_scrape: { timestamp: string; drugs_updated: number } | null;
  users_by_role: { tenaga_kesehatan: number; masyarakat: number; admin: number };
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<Stats>("/api/admin/system-stats")
      .then(setStats)
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-500">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Memuat statistik...
      </div>
    );
  }

  if (error) return <p className="text-red-400">{error}</p>;
  if (!stats) return null;

  const Stat = ({ icon: Icon, label, value, color }: { icon: typeof Users; label: string; value: number | string; color: string }) => (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="text-xs uppercase tracking-wider text-slate-500">{label}</div>
      </div>
      <div className="text-3xl font-bold">{value}</div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-amber-500" /> Admin Dashboard
        </h1>
        <p className="text-sm text-slate-500 mt-1">System overview dan quick actions.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon={Users} label="Total Users" value={stats.users_count} color="bg-blue-500/10 text-blue-400" />
        <Stat icon={Users} label="Total Pasien" value={stats.patients_count} color="bg-purple-500/10 text-purple-400" />
        <Stat icon={Pill} label="Drug Catalog" value={stats.drugs_count} color="bg-green-500/10 text-green-400" />
        <Stat
          icon={Database}
          label="Last Scrape"
          value={stats.last_scrape ? new Date(stats.last_scrape.timestamp).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" }) : "Belum pernah"}
          color="bg-amber-500/10 text-amber-400"
        />
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
        <h2 className="font-semibold mb-3">Users by Role</h2>
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div><span className="text-slate-500">Tenaga Kesehatan:</span> <span className="font-mono font-bold">{stats.users_by_role.tenaga_kesehatan}</span></div>
          <div><span className="text-slate-500">Masyarakat:</span> <span className="font-mono font-bold">{stats.users_by_role.masyarakat}</span></div>
          <div><span className="text-slate-500">Admin:</span> <span className="font-mono font-bold">{stats.users_by_role.admin}</span></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/admin/scraper" className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-5 transition-colors">
          <Database className="w-6 h-6 text-amber-400 mb-2" />
          <h3 className="font-semibold mb-1">Trigger Scraper</h3>
          <p className="text-sm text-slate-500">Update drug database from drugs.com + FDA</p>
        </Link>
        <Link href="/admin/users" className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-5 transition-colors">
          <UserCog className="w-6 h-6 text-blue-400 mb-2" />
          <h3 className="font-semibold mb-1">Manage Users</h3>
          <p className="text-sm text-slate-500">Add or remove tenaga kesehatan accounts</p>
        </Link>
      </div>
    </div>
  );
}
