"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore, landingForRole, type Role } from "@/lib/auth-store";
import { Stethoscope, User, ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

type TabKey = "tenaga_kesehatan" | "masyarakat" | "admin";

const TABS: { key: TabKey; label: string; icon: typeof Stethoscope; demo: { username: string; password: string }[] }[] = [
  {
    key: "tenaga_kesehatan",
    label: "Tenaga Kesehatan",
    icon: Stethoscope,
    demo: [
      { username: "bidan_siti", password: "siti2026" },
      { username: "bidan_putri", password: "putri2026" },
    ],
  },
  {
    key: "masyarakat",
    label: "Pasien / Masyarakat",
    icon: User,
    demo: [
      { username: "umum_budi", password: "budi2026" },
      { username: "umum_dewi", password: "dewi2026" },
    ],
  },
  {
    key: "admin",
    label: "Admin",
    icon: ShieldCheck,
    demo: [
      { username: "admin_ghaisan", password: "admin2026" },
      { username: "admin_sistem", password: "system2026" },
    ],
  },
];

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-slate-400">Memuat...</div>}>
      <LoginInner />
    </Suspense>
  );
}

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const fromPath = params.get("from") || "";

  const [tab, setTab] = useState<TabKey>("tenaga_kesehatan");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const login = useAuthStore((s) => s.login);

  const activeTab = TABS.find((t) => t.key === tab)!;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const result = await login(username, password);
    setBusy(false);
    if (!result.ok) {
      setError(result.error || "Login gagal");
      return;
    }
    const role = useAuthStore.getState().user?.role;
    if (role) {
      const dest = fromPath && fromPath !== "/login" ? fromPath : landingForRole(role as Role);
      router.replace(dest);
    }
  };

  const fillDemo = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-slate-950 via-purple-950/30 to-slate-950">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gradient">MedWatch</h1>
          <p className="text-sm text-slate-400 mt-1">Sistem Monitoring Keamanan Obat</p>
        </div>

        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl p-6 shadow-2xl">
          <div className="grid grid-cols-3 gap-1 p-1 bg-white/5 rounded-xl mb-6">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = t.key === tab;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  className={
                    "flex flex-col items-center gap-1 py-2.5 px-2 rounded-lg text-xs font-medium transition-all " +
                    (active
                      ? "bg-purple-600 text-white shadow-md"
                      : "text-slate-400 hover:text-white hover:bg-white/5")
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-[10px] leading-tight">{t.label}</span>
                </button>
              );
            })}
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            {error && (
              <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition-colors"
            >
              {busy ? "Memproses..." : "Login"}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-white/10">
            <p className="text-[11px] uppercase tracking-wider text-slate-500 mb-2 font-medium">Akun demo {activeTab.label}</p>
            <div className="space-y-1">
              {activeTab.demo.map((d) => (
                <button
                  key={d.username}
                  type="button"
                  onClick={() => fillDemo(d.username, d.password)}
                  className="w-full text-left text-xs font-mono text-slate-400 hover:text-purple-400 px-2 py-1 rounded hover:bg-white/5 transition-colors"
                >
                  {d.username} / {d.password}
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-500 mt-6">
          Kelompok B5 | D4 Teknik Informatika POLBAN | Proyek 1 PPL Desktop 2025/2026
        </p>
      </div>
    </div>
  );
}
