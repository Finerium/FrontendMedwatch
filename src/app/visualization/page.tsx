"use client";

import { useEffect, useState } from "react";
import { BarChart3, Loader2 } from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend,
} from "recharts";
import { api } from "@/lib/api";

type TrendPoint = { month: string; count: number };
type KeluhanPoint = { kategori: string; count: number };
type EfekPoint = { nama_efek: string; count: number; kategori: string; tingkat_keparahan: string };

const COLORS = ["#7c3aed", "#a78bfa", "#3b82f6", "#22c55e", "#f59e0b", "#ec4899", "#06b6d4", "#facc15"];

export default function VisualizationPage() {
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [keluhan, setKeluhan] = useState<KeluhanPoint[]>([]);
  const [efek, setEfek] = useState<EfekPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.get<TrendPoint[]>("/api/visualizations/kunjungan-trend"),
      api.get<KeluhanPoint[]>("/api/visualizations/keluhan-distribution"),
      api.get<EfekPoint[]>("/api/visualizations/top-efek-samping"),
    ])
      .then(([t, k, e]) => { setTrend(t); setKeluhan(k); setEfek(e); })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-500">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Memuat visualisasi...
      </div>
    );
  }

  if (error) return <p className="text-red-400">{error}</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-purple-500" /> Visualisasi Data
        </h1>
        <p className="text-sm text-slate-500 mt-1">Data live dari backend api/visualizations.</p>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
        <h2 className="font-semibold mb-3">Tren Kunjungan Bulanan</h2>
        <div className="h-64">
          <ResponsiveContainer>
            <AreaChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="month" stroke="#9ca3af" fontSize={11} />
              <YAxis stroke="#9ca3af" fontSize={11} />
              <Tooltip contentStyle={{ background: "#14141f", border: "1px solid #2a2a3a", borderRadius: 8 }} />
              <Area type="monotone" dataKey="count" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <h2 className="font-semibold mb-3">Distribusi Keluhan</h2>
          <div className="h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={keluhan} dataKey="count" nameKey="kategori" cx="50%" cy="50%" outerRadius={80} label>
                  {keluhan.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "#14141f", border: "1px solid #2a2a3a", borderRadius: 8 }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <h2 className="font-semibold mb-3">Top 10 Efek Samping</h2>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={efek} layout="vertical" margin={{ left: 80 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis type="number" stroke="#9ca3af" fontSize={11} />
                <YAxis dataKey="nama_efek" type="category" stroke="#9ca3af" fontSize={10} width={80} />
                <Tooltip contentStyle={{ background: "#14141f", border: "1px solid #2a2a3a", borderRadius: 8 }} />
                <Bar dataKey="count" fill="#a78bfa" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
