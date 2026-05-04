"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type SystemStats = {
  users_count: number;
  patients_count: number;
  drugs_count: number;
  last_scrape: { drugs_updated?: number; timestamp?: string } | null;
  users_by_role: { tenaga_kesehatan: number; masyarakat: number; admin: number };
};

type StatRow = { label: string; n: string; d: string };

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

  const rows: StatRow[] | null = stats
    ? [
        {
          label: "Pengguna aktif",
          n: stats.users_count.toLocaleString("id-ID"),
          d: `${stats.users_by_role.tenaga_kesehatan} bidan · ${stats.users_by_role.masyarakat} masyarakat`,
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
        { label: "Uptime API", n: "99.94%", d: "30 hari" },
      ]
    : null;

  const auditLog = [
    { t: "14:32", who: "bidan_siti", act: "Login dari IP 103.8.xx.xx" },
    { t: "14:18", who: "admin_ghaisan", act: "Approve user request — bidan_rina" },
    { t: "13:55", who: "system", act: "Scrape BPOM cron berjalan — 132 entri baru" },
    { t: "13:02", who: "umum_budi", act: "Cek interaksi paracetamol × cetirizine" },
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
