"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type SystemStats = {
  users_count: number;
  patients_count: number;
  drugs_count: number;
  last_scrape: { drugs_updated?: number; timestamp?: string } | null;
  users_by_role: { tenaga_kesehatan: number; masyarakat: number; admin: number };
  process_started_at?: string;
  uptime_seconds?: number;
};

type StatRow = { label: string; n: string; d: string };

function formatUptime(seconds: number): { n: string; d: string } {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return { n: "-", d: "tidak tersedia" };
  }
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) {
    return { n: `${days}h ${hours}j`, d: "sejak proses berjalan" };
  }
  if (hours > 0) {
    return { n: `${hours}j ${minutes}m`, d: "sejak proses berjalan" };
  }
  return { n: `${minutes}m`, d: "sejak proses berjalan" };
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api.get<SystemStats>("/api/admin/system-stats");
        if (!cancelled) setStats(data);
      } catch {
        if (!cancelled) setStats(null);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const uptime = stats && typeof stats.uptime_seconds === "number"
    ? formatUptime(stats.uptime_seconds)
    : { n: "-", d: "tidak tersedia" };

  const rows: StatRow[] | null = stats
    ? [
        {
          label: "Pengguna aktif",
          n: stats.users_count.toLocaleString("id-ID"),
          d: `${stats.users_by_role.tenaga_kesehatan} bidan, ${stats.users_by_role.masyarakat} masyarakat`,
        },
        {
          label: "Pasien terdaftar",
          n: stats.patients_count.toLocaleString("id-ID"),
          d: "rekam medis SOAP",
        },
        {
          label: "Obat di katalog",
          n: stats.drugs_count.toLocaleString("id-ID"),
          d: stats.last_scrape?.drugs_updated
            ? `update terakhir ${stats.last_scrape.drugs_updated}`
            : "katalog BPOM",
        },
        { label: "Uptime API", n: uptime.n, d: uptime.d },
      ]
    : null;

  const auditLog = [
    { t: "14:32", who: "bidan_siti", act: "Login dari IP 103.8.xx.xx" },
    { t: "14:18", who: "admin_ghaisan", act: "Approve user request, bidan_rina" },
    { t: "13:55", who: "system", act: "Scrape BPOM cron berjalan, 132 entri baru" },
    { t: "13:02", who: "umum_budi", act: "Cek interaksi paracetamol x cetirizine" },
    { t: "12:30", who: "bidan_siti", act: "Update SOAP P024" },
  ];

  return (
    <div
      className="page-in"
      style={{ padding: "120px 24px 80px", maxWidth: 1440, margin: "0 auto", position: "relative" }}
    >
      <div
        style={{
          position: "absolute",
          top: 90,
          right: -60,
          width: 200,
          height: 200,
          borderRadius: "50%",
          background: "var(--ink)",
          opacity: 0.92,
          zIndex: 0,
        }}
      />
      <div className="stagger" style={{ position: "relative", zIndex: 2 }}>
        <span
          className="mono"
          style={{
            fontSize: 11,
            letterSpacing: "0.1em",
            color: "var(--ink-3)",
            textTransform: "uppercase",
          }}
        >
          Panel Administrasi
        </span>
        <h1
          className="serif"
          style={{
            fontSize: "clamp(2.6rem, 5vw, 4rem)",
            fontWeight: 300,
            letterSpacing: "-0.03em",
            marginTop: 8,
            marginBottom: 28,
          }}
        >
          Sistem <em style={{ fontStyle: "italic" }}>sehat</em>.
        </h1>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
            marginBottom: 24,
            minHeight: 152,
          }}
        >
          {!loaded || !rows
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="glass" style={{ padding: 22 }}>
                  <div className="skel" style={{ height: 12, width: 100, borderRadius: 4 }} aria-hidden />
                  <div className="skel" style={{ height: 36, width: 120, borderRadius: 6, marginTop: 14 }} aria-hidden />
                  <div className="skel" style={{ height: 12, width: 140, borderRadius: 4, marginTop: 10 }} aria-hidden />
                </div>
              ))
            : rows.map((s, i) => (
                <div key={i} className="glass lift" style={{ padding: 22 }}>
                  <span
                    className="mono"
                    style={{
                      fontSize: 10,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: "var(--ink-3)",
                    }}
                  >
                    {s.label}
                  </span>
                  <div className="serif" style={{ fontSize: "2.4rem", fontWeight: 300, marginTop: 8 }}>
                    {s.n}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 6 }}>{s.d}</div>
                </div>
              ))}
        </div>
        <div
          className="glass lift"
          data-testid="admin-quick-actions"
          style={{
            padding: 24,
            marginBottom: 24,
            display: "grid",
            gridTemplateColumns: "1fr auto",
            gap: 18,
            alignItems: "center",
          }}
        >
          <div>
            <span
              className="mono"
              style={{
                fontSize: 10,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--ink-3)",
              }}
            >
              Aksi cepat
            </span>
            <h3
              className="serif"
              style={{ fontSize: "1.5rem", fontWeight: 400, marginTop: 6, marginBottom: 4 }}
            >
              Jalankan Scraper Obat
            </h3>
            <p style={{ fontSize: 13, color: "var(--ink-3)", margin: 0, maxWidth: 560 }}>
              Buka panel scraper untuk memicu sinkronisasi katalog obat dari sumber resmi dan
              memantau riwayat eksekusi cron BPOM.
            </p>
          </div>
          <Link
            href="/admin/scraper"
            className="btn btn-primary"
            data-testid="cta-scraper"
            style={{ textDecoration: "none", whiteSpace: "nowrap" }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              aria-hidden
            >
              <ellipse cx="12" cy="6" rx="8" ry="3" />
              <path d="M4 6v6c0 1.66 3.58 3 8 3s8-1.34 8-3V6" />
              <path d="M4 12v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6" />
            </svg>
            Buka panel scraper
          </Link>
        </div>
        <div className="glass" style={{ padding: 24 }}>
          <h3 className="serif" style={{ fontSize: "1.4rem", marginBottom: 14 }}>
            Audit log
          </h3>
          {auditLog.map((l, i) => (
            <div
              key={i}
              style={{
                display: "grid",
                gridTemplateColumns: "60px 140px 1fr",
                gap: 14,
                padding: "10px 0",
                borderBottom: "1px solid var(--line-2)",
                fontSize: 13,
              }}
            >
              <span className="mono" style={{ color: "var(--ink-3)" }}>
                {l.t}
              </span>
              <span className="mono" style={{ color: "var(--teal-deep)" }}>
                {l.who}
              </span>
              <span style={{ color: "var(--ink-2)" }}>{l.act}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
