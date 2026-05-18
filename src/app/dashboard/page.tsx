/**
 * Bidan/masyarakat/admin landing dashboard. Marked `"use client"` because
 * KPI sparklines and the count-up animation hook into the browser's
 * `requestAnimationFrame` and the greeting depends on the local clock.
 *
 * The role-driven copy (KPIs, quick actions, side panel) keeps the UI
 * coherent for each of the three demo personas defined by the kelompok
 * B5 mission.
 */
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/auth-store";
import { NavIcon } from "@/components/shell/NavIcon";

/** Series of integers consumed by the KPI sparkline SVG. */
type Sparkline = number[];

/** Single KPI card definition. */
type Kpi = {
  label: string;
  value: number;
  delta: string;
  deltaDir: "up" | "down" | "flat";
  accent?: string;
  sparkline?: Sparkline;
  big?: boolean;
};

/**
 * Eased count-up animation used by KPI cards. Plays once on mount.
 *
 * @param props.to - Final integer value to display.
 * @param props.duration - Animation length in milliseconds; defaults to 1400.
 * @returns Inline span with the locale-formatted current value.
 */
function CountUp({ to, duration = 1400 }: { to: number; duration?: number }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const start = performance.now();
    let raf = 0;
    const step = (t: number) => {
      const p = Math.min((t - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.floor(eased * to));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to, duration]);
  return <>{val.toLocaleString("id-ID")}</>;
}

/**
 * Render a small filled-area sparkline from an arbitrary integer series.
 *
 * @param props.data - Values to plot left-to-right.
 * @param props.color - Stroke and fill color (defaults to brand teal).
 * @returns Inline SVG sized to fill its parent.
 */
function Sparkline({ data, color = "var(--teal)" }: { data: Sparkline; color?: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const w = 100;
  const h = 30;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / (max - min || 1)) * h;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} preserveAspectRatio="none">
      <polyline fill="none" stroke={color} strokeWidth="1.4" points={pts} />
      <polygon fill={color} opacity="0.12" points={`0,${h} ${pts} ${w},${h}`} />
    </svg>
  );
}

/**
 * Single KPI card. Composed from a label, animated value, delta chip, and
 * optional sparkline. Layout occupies one or two grid columns based on
 * the `big` flag.
 *
 * @param props - KPI definition; see the `Kpi` type for field meanings.
 * @returns Glassy KPI card.
 */
function KpiCard({ label, value, delta, deltaDir, sparkline, accent, big }: Kpi) {
  return (
    <div
      className="glass lift"
      style={{
        padding: 22,
        display: "flex",
        flexDirection: "column",
        gap: 14,
        gridColumn: big ? "span 2" : "span 1",
        minHeight: 168,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span
          className="mono"
          style={{
            fontSize: 10,
            letterSpacing: "0.1em",
            color: "var(--ink-3)",
            textTransform: "uppercase",
          }}
        >
          {label}
        </span>
        {accent && (
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: accent }} />
        )}
      </div>
      <div
        className="serif"
        style={{
          fontSize: big ? "3.6rem" : "2.6rem",
          lineHeight: 1,
          fontWeight: 300,
          letterSpacing: "-0.03em",
        }}
      >
        <CountUp to={value} />
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            fontSize: 12,
            fontWeight: 500,
            color:
              deltaDir === "up"
                ? "var(--safe-deep)"
                : deltaDir === "down"
                  ? "var(--crit-deep)"
                  : "var(--ink-3)",
          }}
        >
          {deltaDir === "up" ? "↗" : deltaDir === "down" ? "↘" : "→"} {delta}
        </span>
        {sparkline && (
          <div style={{ width: "60%", maxWidth: 140 }}>
            <Sparkline data={sparkline} color={accent || "var(--teal)"} />
          </div>
        )}
      </div>
    </div>
  );
}

type ActivityKind = "visit" | "drug" | "alert" | "soap";
type Severity = "ringan" | "sedang" | "serius" | null;

/**
 * One row of the "Aktivitas terbaru" feed.
 *
 * @param props.time - Display timestamp (e.g. "14:32").
 * @param props.kind - Activity icon family.
 * @param props.text - Indonesian description line.
 * @param props.severity - Severity tag or null when not applicable.
 */
function ActivityRow({
  time,
  kind,
  text,
  severity,
}: {
  time: string;
  kind: ActivityKind;
  text: string;
  severity: Severity;
}) {
  const kindIcon: Record<ActivityKind, React.ReactNode> = {
    visit: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M3 21h18M5 21V8l7-4 7 4v13M9 14h6M9 17h6" />
      </svg>
    ),
    drug: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <rect x="3" y="9" width="18" height="6" rx="3" />
        <path d="M12 9v6" />
      </svg>
    ),
    alert: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M12 3l10 18H2L12 3z" />
        <path d="M12 10v5M12 18v.5" />
      </svg>
    ),
    soap: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M5 4h12l4 4v12H5z" />
        <path d="M9 12h8M9 16h6" />
      </svg>
    ),
  };
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "64px 28px 1fr auto",
        alignItems: "center",
        gap: 14,
        padding: "14px 4px",
        borderBottom: "1px solid var(--line-2)",
      }}
    >
      <span className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>
        {time}
      </span>
      <span
        style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          background: "var(--bg-2)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--ink-2)",
        }}
      >
        {kindIcon[kind]}
      </span>
      <span style={{ fontSize: 14, color: "var(--ink)" }}>{text}</span>
      {severity && (
        <span className={`sev sev-${severity}`}>
          <span className="sev-dot" />
          {severity}
        </span>
      )}
    </div>
  );
}

/**
 * Role-aware landing dashboard. Reads the hydrated auth state to choose
 * the right copy block, KPI grid, quick actions, and side panel. While
 * the auth store is still hydrating, a skeleton grid is rendered so the
 * page lays out without flashing wrong values.
 */
export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const hydrated = useAuthStore((s) => s.hydrated);

  useEffect(() => {
    if (!hydrated) fetchMe();
  }, [hydrated, fetchMe]);

  const role = user?.role;
  const isBidan = role === "tenaga_kesehatan";
  const isMasy = role === "masyarakat";
  const isAdmin = role === "admin";

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 11) return "Selamat pagi";
    if (h < 15) return "Selamat siang";
    if (h < 19) return "Selamat sore";
    return "Selamat malam";
  })();

  const displayName = user?.name || user?.username || "—";
  const subtitle = isBidan
    ? "Klinik Posyandu Cibiru · Bandung"
    : isMasy
      ? "Akun Masyarakat · Self-medication tracker"
      : isAdmin
        ? "Pusat Administrasi MedWatch"
        : "Sinkronisasi sesi…";

  const kpis: Kpi[] = isBidan
    ? [
        { label: "Pasien aktif", value: 248, delta: "+12 minggu ini", deltaDir: "up", accent: "var(--teal)", sparkline: [10, 14, 12, 18, 22, 21, 28] },
        { label: "Kunjungan hari ini", value: 17, delta: "3 menunggu", deltaDir: "flat", accent: "var(--ink)", sparkline: [4, 6, 8, 5, 12, 15, 17] },
        { label: "Resep di-skrining", value: 423, delta: "+8% bulan ini", deltaDir: "up", accent: "var(--teal)", sparkline: [22, 28, 30, 35, 40, 38, 45] },
        { label: "Peringatan keamanan", value: 6, delta: "2 perlu tindakan", deltaDir: "down", accent: "var(--crit)", sparkline: [3, 5, 4, 8, 6, 7, 6] },
      ]
    : isMasy
      ? [
          { label: "Obat dilacak", value: 4, delta: "aktif", deltaDir: "flat", accent: "var(--teal)" },
          { label: "Pengecekan keamanan", value: 12, delta: "+3 minggu ini", deltaDir: "up", accent: "var(--teal)" },
          { label: "Konsultasi mendatang", value: 1, delta: "Senin 09:00", deltaDir: "flat", accent: "var(--ink)" },
          { label: "Pengingat dosis", value: 8, delta: "hari ini", deltaDir: "flat", accent: "var(--warn)" },
        ]
      : [
          { label: "Pengguna sistem", value: 1247, delta: "+34 bulan ini", deltaDir: "up", accent: "var(--teal)" },
          { label: "Faskes terhubung", value: 38, delta: "+2 minggu ini", deltaDir: "up", accent: "var(--teal)" },
          { label: "Scrape jobs", value: 89, delta: "7 berjalan", deltaDir: "flat", accent: "var(--ink)" },
          { label: "Error rate", value: 2, delta: "-0.4% hari ini", deltaDir: "up", accent: "var(--safe)" },
        ];

  const activities: { time: string; kind: ActivityKind; text: string; severity: Severity }[] = [
    { time: "14:32", kind: "soap", text: "SOAP P012 — Tn. Wahyudi · diagnosa hipertensi grade 1", severity: null },
    { time: "14:18", kind: "alert", text: "Interaksi sedang: warfarin × ibuprofen pada P008", severity: "sedang" },
    { time: "13:45", kind: "drug", text: "Paracetamol 500mg di-skrining untuk P024 — Ny. Murni", severity: null },
    { time: "13:02", kind: "visit", text: "Kunjungan baru: Ny. Hartini (P031) · keluhan demam 3 hari", severity: null },
    { time: "12:30", kind: "alert", text: "Peringatan serius: amiodarone × ciprofloxacin pada P003", severity: "serius" },
    { time: "11:54", kind: "soap", text: "SOAP P005 diperbarui — kontrol kehamilan trimester 2", severity: null },
    { time: "10:12", kind: "drug", text: "Amoxicillin 500mg untuk P017 — interaksi diperiksa", severity: "ringan" },
  ];

  const upcomingPatients = [
    { id: "P024", name: "Ny. Murni Aspariati", time: "15:00", reason: "kontrol diabetes", status: "menunggu" },
    { id: "P031", name: "Ny. Hartini Wulandari", time: "15:20", reason: "demam, batuk pilek", status: "menunggu" },
    { id: "P008", name: "Tn. Bambang Wijaya", time: "15:45", reason: "pasca-resep warfarin", status: "tinjau ulang" },
    { id: "P019", name: "An. Rendi Prasetyo", time: "16:00", reason: "imunisasi DPT", status: "menunggu" },
  ];

  type QuickAction = { id: string; label: string; icon: "shield" | "user" | "search" | "gear" | "spider"; primary?: boolean; href: string };
  const quickActions: QuickAction[] = isBidan
    ? [
        { id: "safety-checker", label: "Cek keamanan obat", icon: "shield", primary: true, href: "/safety-checker" },
        { id: "patients", label: "Pasien baru", icon: "user", href: "/patients/new" },
        { id: "drug-search", label: "Cari obat", icon: "search", href: "/drug-search" },
      ]
    : isMasy
      ? [
          { id: "safety-checker", label: "Cek interaksi obat saya", icon: "shield", primary: true, href: "/safety-checker" },
          { id: "drug-search", label: "Cari informasi obat", icon: "search", href: "/drug-search" },
        ]
      : [
          { id: "admin", label: "Panel admin", icon: "gear", primary: true, href: "/admin/dashboard" },
          { id: "scraper", label: "Lihat scraper", icon: "spider", href: "/admin/scraper" },
        ];

  return (
    <div
      className="page-in"
      style={{ padding: "120px 24px 80px", position: "relative", maxWidth: 1440, margin: "0 auto" }}
    >
      <div
        style={{
          position: "absolute",
          top: 80,
          right: -40,
          width: 220,
          height: 220,
          borderRadius: "50%",
          background: "var(--teal)",
          opacity: 0.85,
          zIndex: 0,
        }}
      />

      <div className="stagger" style={{ position: "relative", zIndex: 2 }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 18,
            marginBottom: 36,
          }}
        >
          <div>
            <span
              className="mono"
              style={{
                fontSize: 11,
                letterSpacing: "0.1em",
                color: "var(--ink-3)",
                textTransform: "uppercase",
              }}
            >
              {new Date().toLocaleDateString("id-ID", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
            <h1
              className="serif"
              style={{
                fontSize: "clamp(2.4rem, 5vw, 4rem)",
                fontWeight: 300,
                letterSpacing: "-0.03em",
                marginTop: 8,
              }}
            >
              {greeting}, <em style={{ fontStyle: "italic" }}>{displayName}</em>.
            </h1>
            <p style={{ color: "var(--ink-3)", marginTop: 8, fontSize: 15 }}>{subtitle}</p>
          </div>
          {isBidan && (
            <div
              className="glass-thin"
              style={{
                padding: "10px 14px",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  background: "var(--teal-soft)",
                  color: "var(--teal-deep)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M12 22s8-7 8-13a8 8 0 1 0-16 0c0 6 8 13 8 13z" />
                  <circle cx="12" cy="9" r="3" />
                </svg>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "var(--ink-3)" }}>Sinkronisasi BPOM</div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>3 menit lalu · 12.428 obat</div>
              </div>
            </div>
          )}
        </div>

        <div
          className="kpi-grid"
          style={{
            display: "grid",
            gap: 16,
            gridTemplateColumns: "repeat(4, 1fr)",
            marginBottom: 36,
            minHeight: 168,
          }}
        >
          {!role
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="glass" style={{ padding: 22, minHeight: 168 }}>
                  <div className="skel" style={{ height: 12, width: 100, borderRadius: 4 }} aria-hidden />
                  <div className="skel" style={{ height: 48, width: 140, borderRadius: 6, marginTop: 18 }} aria-hidden />
                  <div className="skel" style={{ height: 12, width: 80, borderRadius: 4, marginTop: 18 }} aria-hidden />
                </div>
              ))
            : kpis.map((k, i) => <KpiCard key={i} {...k} />)}
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 36 }}>
          {quickActions.map((a) => (
            <Link
              key={a.id}
              href={a.href}
              className={"btn " + (a.primary ? "btn-primary" : "")}
              style={{ textDecoration: "none" }}
            >
              <NavIcon name={a.icon} />
              {a.label}
            </Link>
          ))}
        </div>

        <div
          className="dash-grid"
          style={{ display: "grid", gap: 16, gridTemplateColumns: "1.4fr 1fr" }}
        >
          <div className="glass" style={{ padding: 24 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                marginBottom: 18,
              }}
            >
              <h2 className="serif" style={{ fontSize: "1.5rem" }}>
                Aktivitas terbaru
              </h2>
              <Link
                href="/dashboard/aktivitas"
                className="btn btn-ghost"
                data-testid="lihat-semua-aktivitas"
                style={{ fontSize: 12, textDecoration: "none" }}
              >
                Lihat semua &rarr;
              </Link>
            </div>
            <div>
              {activities.map((a, i) => (
                <ActivityRow key={i} {...a} />
              ))}
            </div>
          </div>

          {isBidan && (
            <div className="glass" style={{ padding: 24 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  marginBottom: 18,
                }}
              >
                <h2 className="serif" style={{ fontSize: "1.5rem" }}>
                  Antrean sore
                </h2>
                <span className="chip">{upcomingPatients.length} menunggu</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {upcomingPatients.map((p) => (
                  <div
                    key={p.id}
                    className="lift"
                    style={{
                      padding: 14,
                      borderRadius: 14,
                      background: "var(--bg-2)",
                      border: "1px solid var(--line-2)",
                      display: "grid",
                      gridTemplateColumns: "52px 1fr auto",
                      gap: 12,
                      alignItems: "center",
                      cursor: "pointer",
                    }}
                  >
                    <span
                      className="mono"
                      style={{
                        fontSize: 11,
                        color: "var(--teal-deep)",
                        fontWeight: 600,
                        background: "var(--teal-soft)",
                        padding: "6px 8px",
                        borderRadius: 8,
                        textAlign: "center",
                      }}
                    >
                      {p.id}
                    </span>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{p.name}</div>
                      <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>
                        {p.reason}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div className="mono" style={{ fontSize: 12, fontWeight: 600 }}>
                        {p.time}
                      </div>
                      <div style={{ fontSize: 10, color: "var(--ink-3)", marginTop: 2 }}>
                        {p.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!isBidan && (
            <div
              className="glass"
              style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14 }}
            >
              <h2 className="serif" style={{ fontSize: "1.5rem" }}>
                {isMasy ? "Obat saya" : "Tugas administrasi"}
              </h2>
              {(isMasy
                ? [
                    { name: "Paracetamol 500mg", schedule: "3x sehari · setelah makan", next: "18:00" },
                    { name: "Vitamin D3 1000 IU", schedule: "Pagi hari", next: "besok 07:00" },
                    { name: "Amoxicillin 500mg", schedule: "3x sehari · 5 hari", next: "20:00" },
                  ]
                : [
                    { name: "Tinjau permintaan akun (4)", schedule: "Antrean approval", next: "→" },
                    { name: "Audit log scraper minggu ini", schedule: "Cron: Senin 06:00", next: "→" },
                    { name: "Backup database", schedule: "Otomatis nightly", next: "→" },
                  ]).map((t, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "12px 0",
                    borderBottom: "1px solid var(--line-2)",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>
                      {t.schedule}
                    </div>
                  </div>
                  <span className="mono" style={{ fontSize: 12, color: "var(--teal-deep)" }}>
                    {t.next}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 1080px) {
          .kpi-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .dash-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 580px) {
          .kpi-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
