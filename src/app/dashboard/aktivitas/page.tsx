"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useAuthStore } from "@/lib/auth-store";

type ActivityKind = "visit" | "drug" | "alert" | "soap";
type Severity = "ringan" | "sedang" | "serius" | null;

type ActivityItem = {
  time: string;
  kind: ActivityKind;
  text: string;
  severity: Severity;
};

// Sumber data sama dengan panel "Aktivitas terbaru" di /dashboard.
// Tujuan halaman ini: memberi destinasi nyata untuk tombol "Lihat semua"
// dan menampilkan feed yang sama dalam tampilan penuh (B02).
const ACTIVITIES_BIDAN: ActivityItem[] = [
  { time: "14:32", kind: "soap", text: "SOAP P012 Tn. Wahyudi, diagnosa hipertensi grade 1", severity: null },
  { time: "14:18", kind: "alert", text: "Interaksi sedang: warfarin x ibuprofen pada P008", severity: "sedang" },
  { time: "13:45", kind: "drug", text: "Paracetamol 500mg di-skrining untuk P024 Ny. Murni", severity: null },
  { time: "13:02", kind: "visit", text: "Kunjungan baru: Ny. Hartini (P031), keluhan demam 3 hari", severity: null },
  { time: "12:30", kind: "alert", text: "Peringatan serius: amiodarone x ciprofloxacin pada P003", severity: "serius" },
  { time: "11:54", kind: "soap", text: "SOAP P005 diperbarui, kontrol kehamilan trimester 2", severity: null },
  { time: "10:12", kind: "drug", text: "Amoxicillin 500mg untuk P017, interaksi diperiksa", severity: "ringan" },
  { time: "09:40", kind: "visit", text: "Kunjungan kontrol: Ny. Sumiati (P019), pasca-rawat luka", severity: null },
  { time: "09:05", kind: "soap", text: "SOAP P022 Ny. Lestari, diagnosa anemia ringan", severity: null },
  { time: "08:30", kind: "drug", text: "Tablet Fe untuk P022, edukasi pasca konsumsi", severity: null },
];

const ACTIVITIES_MASYARAKAT: ActivityItem[] = [
  { time: "07:00", kind: "drug", text: "Pengingat dosis: Paracetamol 500mg", severity: null },
  { time: "Senin", kind: "visit", text: "Konsultasi mendatang dengan bidan_siti pukul 09:00", severity: null },
  { time: "Kemarin", kind: "alert", text: "Hasil cek interaksi: paracetamol x cetirizine (ringan)", severity: "ringan" },
  { time: "Kemarin", kind: "drug", text: "Vitamin D3 1000 IU ditambahkan ke daftar obat", severity: null },
  { time: "3 hari", kind: "drug", text: "Pengecekan keamanan amoxicillin selesai", severity: null },
];

const ACTIVITIES_ADMIN: ActivityItem[] = [
  { time: "14:32", kind: "visit", text: "Login: bidan_siti dari IP 103.8.xx.xx", severity: null },
  { time: "14:18", kind: "soap", text: "Approve permintaan akun: bidan_rina", severity: null },
  { time: "13:55", kind: "drug", text: "Cron scrape BPOM berjalan, 132 entri baru", severity: null },
  { time: "13:02", kind: "alert", text: "umum_budi cek interaksi paracetamol x cetirizine", severity: "ringan" },
  { time: "12:30", kind: "soap", text: "bidan_siti memperbarui SOAP P024", severity: null },
  { time: "11:05", kind: "visit", text: "Login: admin_ghaisan dari IP 103.8.xx.xx", severity: null },
];

const KIND_ICON: Record<ActivityKind, React.ReactNode> = {
  visit: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <path d="M3 21h18M5 21V8l7-4 7 4v13M9 14h6M9 17h6" />
    </svg>
  ),
  drug: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <rect x="3" y="9" width="18" height="6" rx="3" />
      <path d="M12 9v6" />
    </svg>
  ),
  alert: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <path d="M12 3l10 18H2L12 3z" />
      <path d="M12 10v5M12 18v.5" />
    </svg>
  ),
  soap: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <path d="M5 4h12l4 4v12H5z" />
      <path d="M9 12h8M9 16h6" />
    </svg>
  ),
};

const KIND_LABEL: Record<ActivityKind, string> = {
  visit: "Kunjungan",
  drug: "Obat",
  alert: "Peringatan",
  soap: "Rekam SOAP",
};

function ActivityFullRow({ time, kind, text, severity }: ActivityItem) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "84px 28px 1fr auto",
        alignItems: "center",
        gap: 14,
        padding: "16px 4px",
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
        title={KIND_LABEL[kind]}
      >
        {KIND_ICON[kind]}
      </span>
      <span style={{ fontSize: 14, color: "var(--ink)" }}>{text}</span>
      {severity ? (
        <span className={`sev sev-${severity}`}>
          <span className="sev-dot" />
          {severity}
        </span>
      ) : (
        <span style={{ fontSize: 11, color: "var(--ink-3)" }}>{KIND_LABEL[kind]}</span>
      )}
    </div>
  );
}

export default function AktivitasPage() {
  const user = useAuthStore((s) => s.user);
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const hydrated = useAuthStore((s) => s.hydrated);

  useEffect(() => {
    if (!hydrated) fetchMe();
  }, [hydrated, fetchMe]);

  const role = user?.role;
  const activities: ActivityItem[] =
    role === "tenaga_kesehatan"
      ? ACTIVITIES_BIDAN
      : role === "masyarakat"
        ? ACTIVITIES_MASYARAKAT
        : role === "admin"
          ? ACTIVITIES_ADMIN
          : ACTIVITIES_BIDAN;

  return (
    <div
      className="page-in"
      style={{ padding: "120px 24px 80px", maxWidth: 1200, margin: "0 auto" }}
      data-testid="aktivitas-page"
    >
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
          Log Aktivitas
        </span>
        <h1
          className="serif"
          style={{
            fontSize: "clamp(2.2rem, 5vw, 3.4rem)",
            fontWeight: 300,
            letterSpacing: "-0.03em",
            marginTop: 8,
            marginBottom: 12,
          }}
        >
          Semua aktivitas <em style={{ fontStyle: "italic" }}>terbaru</em>.
        </h1>
        <p style={{ color: "var(--ink-3)", marginBottom: 24, fontSize: 14, maxWidth: 720 }}>
          Daftar lengkap kegiatan terbaru pada akun Anda. Halaman ini menampilkan riwayat yang
          sama dengan panel ringkas di dashboard, dalam tampilan tanpa pemotongan.
        </p>
        <div style={{ marginBottom: 18 }}>
          <Link
            href="/dashboard"
            className="btn btn-ghost"
            style={{ fontSize: 13, textDecoration: "none" }}
          >
            &larr; Kembali ke dashboard
          </Link>
        </div>
        <div className="glass" style={{ padding: 24 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              marginBottom: 12,
            }}
          >
            <h2 className="serif" style={{ fontSize: "1.4rem", fontWeight: 400 }}>
              Riwayat ({activities.length})
            </h2>
            <span className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>
              urut waktu desc
            </span>
          </div>
          <div data-testid="aktivitas-list">
            {activities.map((a, i) => (
              <ActivityFullRow key={i} {...a} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
