"use client";

import { useEffect, useState } from "react";
import { api, downloadBlob } from "@/lib/api";
import type { Patient } from "@/lib/patient-format";

type ReportType = {
  id: "rekam-medis" | "laporan-bulanan" | "efek-samping" | "inventaris";
  label: string;
  desc: string;
};

const TYPES: ReportType[] = [
  { id: "rekam-medis", label: "Riwayat SOAP per pasien", desc: "Cetak rekam medis lengkap satu pasien" },
  { id: "laporan-bulanan", label: "Rekap kunjungan bulanan", desc: "Total kunjungan, demografi, top keluhan" },
  { id: "efek-samping", label: "Laporan efek samping obat", desc: "Top efek samping dan severitas per obat" },
  { id: "inventaris", label: "Inventaris obat", desc: "Daftar obat, kategori, dosis, dan peringatan" },
];

export default function ExportPdfPage() {
  const [type, setType] = useState<ReportType["id"]>("rekam-medis");
  const [from, setFrom] = useState("2026-04-01");
  const [to, setTo] = useState("2026-04-30");
  const [pasienId, setPasienId] = useState<string>("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [generating, setGenerating] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api.get<Patient[]>("/api/patients");
        if (!cancelled) {
          setPatients(data || []);
          if (data && data.length > 0) setPasienId(data[0].id);
        }
      } catch {
        if (!cancelled) setPatients([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const generate = async () => {
    setGenerating(true);
    setDone(false);
    setError(null);
    try {
      if (type === "rekam-medis") {
        if (!pasienId) {
          setError("Pilih pasien terlebih dahulu");
          return;
        }
        await downloadBlob(
          "/api/pdf/generate-rekam-medis",
          { pasien_id: pasienId },
          `rekam-medis-${pasienId}.pdf`,
        );
      } else if (type === "laporan-bulanan") {
        const month = from.slice(0, 7);
        await downloadBlob(
          "/api/pdf/generate-laporan-bulanan",
          { month },
          `laporan-bulanan-${month}.pdf`,
        );
      } else if (type === "efek-samping") {
        await downloadBlob(
          "/api/pdf/generate-efek-samping",
          {},
          `laporan-efek-samping.pdf`,
        );
      } else if (type === "inventaris") {
        await downloadBlob(
          "/api/pdf/generate-inventaris",
          {},
          `laporan-inventaris-obat.pdf`,
        );
      }
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal membuat PDF");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div
      className="page-in"
      style={{ padding: "120px 24px 80px", position: "relative", maxWidth: 1100, margin: "0 auto" }}
    >
      <div
        style={{
          position: "absolute",
          top: 80,
          right: -60,
          width: 220,
          height: 220,
          borderRadius: "50%",
          background: "var(--teal)",
          opacity: 0.85,
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
          Export · Laporan PDF
        </span>
        <h1
          className="serif"
          style={{
            fontSize: "clamp(2.4rem, 5vw, 4rem)",
            fontWeight: 300,
            letterSpacing: "-0.03em",
            marginTop: 8,
            marginBottom: 28,
          }}
        >
          Buat <em style={{ fontStyle: "italic" }}>laporan</em>.
        </h1>

        <div className="ep-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div className="glass" style={{ padding: 24 }}>
            <h3
              className="mono"
              style={{
                fontSize: 11,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--ink-3)",
                marginBottom: 12,
              }}
            >
              1 · Jenis laporan
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 22 }}>
              {TYPES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setType(t.id)}
                  className="lift"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "20px 1fr",
                    gap: 12,
                    alignItems: "flex-start",
                    padding: 14,
                    borderRadius: 12,
                    textAlign: "left",
                    background: type === t.id ? "var(--bg-2)" : "transparent",
                    border: "1px solid " + (type === t.id ? "var(--ink)" : "var(--line)"),
                    cursor: "pointer",
                  }}
                >
                  <span
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: "50%",
                      border: "1.5px solid var(--ink)",
                      marginTop: 2,
                      position: "relative",
                    }}
                  >
                    {type === t.id && (
                      <span
                        style={{
                          position: "absolute",
                          inset: 3,
                          borderRadius: "50%",
                          background: "var(--ink)",
                        }}
                      />
                    )}
                  </span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{t.label}</div>
                    <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>{t.desc}</div>
                  </div>
                </button>
              ))}
            </div>

            <div style={{ minHeight: 110, marginBottom: 22 }}>
              {type === "rekam-medis" ? (
                <>
                  <h3
                    className="mono"
                    style={{
                      fontSize: 11,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: "var(--ink-3)",
                      marginBottom: 12,
                    }}
                  >
                    2 · Pilih pasien
                  </h3>
                  <select
                    className="input"
                    value={pasienId}
                    onChange={(e) => setPasienId(e.target.value)}
                  >
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.id} - {p.nama}
                      </option>
                    ))}
                  </select>
                </>
              ) : type === "laporan-bulanan" ? (
                <>
                  <h3
                    className="mono"
                    style={{
                      fontSize: 11,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: "var(--ink-3)",
                      marginBottom: 12,
                    }}
                  >
                    2 · Periode
                  </h3>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 10,
                    }}
                  >
                    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <span className="mono" style={{ fontSize: 10, color: "var(--ink-3)" }}>
                        DARI
                      </span>
                      <input
                        type="date"
                        value={from}
                        onChange={(e) => setFrom(e.target.value)}
                        className="input"
                      />
                    </label>
                    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <span className="mono" style={{ fontSize: 10, color: "var(--ink-3)" }}>
                        SAMPAI
                      </span>
                      <input
                        type="date"
                        value={to}
                        onChange={(e) => setTo(e.target.value)}
                        className="input"
                      />
                    </label>
                  </div>
                </>
              ) : (
                <>
                  <h3
                    className="mono"
                    style={{
                      fontSize: 11,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: "var(--ink-3)",
                      marginBottom: 12,
                    }}
                  >
                    2 · Cakupan
                  </h3>
                  <div
                    style={{
                      padding: 12,
                      borderRadius: 10,
                      background: "var(--bg-2)",
                      border: "1px solid var(--line)",
                      fontSize: 13,
                      color: "var(--ink-2)",
                      lineHeight: 1.5,
                    }}
                  >
                    {type === "efek-samping"
                      ? "Laporan ini mengagregasi seluruh basis data keamanan obat dan resep pasien. Tidak perlu memilih pasien atau periode."
                      : "Laporan ini mencetak seluruh katalog obat di Faskes 1 saat ini. Tidak perlu memilih pasien atau periode."}
                  </div>
                </>
              )}
            </div>

            <button
              className="btn btn-primary"
              onClick={generate}
              disabled={generating}
              style={{ width: "100%", padding: "14px 22px", justifyContent: "center" }}
            >
              {generating ? "Menyusun PDF…" : done ? "Unduh PDF (regenerate)" : "Generate Laporan"}
            </button>

            {error && (
              <div
                style={{
                  marginTop: 12,
                  padding: "10px 14px",
                  borderRadius: 10,
                  background: "color-mix(in oklab, var(--crit) 12%, transparent)",
                  color: "var(--crit-deep)",
                  fontSize: 13,
                  border: "1px solid color-mix(in oklab, var(--crit) 30%, transparent)",
                }}
              >
                {error}
              </div>
            )}
          </div>

          <div className="glass" style={{ padding: 24, display: "flex", flexDirection: "column" }}>
            <h3
              className="mono"
              style={{
                fontSize: 11,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--ink-3)",
                marginBottom: 12,
              }}
            >
              Preview
            </h3>
            <div
              style={{
                flex: 1,
                minHeight: 360,
                background: "#fff",
                color: "#1A1815",
                borderRadius: 10,
                padding: 24,
                fontSize: 11,
                boxShadow: "0 20px 60px -20px rgba(0,0,0,0.3)",
                fontFamily: "Inter Tight, sans-serif",
              }}
            >
              <div style={{ borderBottom: "1px solid #ccc", paddingBottom: 10, marginBottom: 12 }}>
                <strong style={{ fontFamily: "Fraunces, serif", fontSize: 16 }}>
                  MedWatch - {TYPES.find((t) => t.id === type)?.label}
                </strong>
                <div style={{ color: "#666", fontSize: 10, marginTop: 4 }}>
                  {type === "rekam-medis"
                    ? `Pasien: ${pasienId || "(pilih pasien)"}`
                    : type === "laporan-bulanan"
                      ? `Periode: ${from} s/d ${to}`
                      : type === "efek-samping"
                        ? `Cakupan: seluruh basis data keamanan obat`
                        : `Cakupan: seluruh inventaris obat Faskes 1`}
                </div>
                <div style={{ color: "#666", fontSize: 10 }}>
                  Klinik Posyandu Cibiru · Bidan Siti
                </div>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 8,
                  marginBottom: 14,
                }}
              >
                {(
                  [
                    ["Total", "124"],
                    ["Pasien baru", "18"],
                    ["Resep", "89"],
                  ] as const
                ).map((kv, i) => (
                  <div key={i} style={{ background: "#f4f1ea", padding: 8, borderRadius: 6 }}>
                    <div
                      style={{
                        color: "#666",
                        fontSize: 9,
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                      }}
                    >
                      {kv[0]}
                    </div>
                    <div style={{ fontSize: 18, fontFamily: "Fraunces, serif" }}>{kv[1]}</div>
                  </div>
                ))}
              </div>
              <div
                style={{
                  height: 70,
                  background: "linear-gradient(180deg, #c8e2dd 30%, transparent)",
                  borderRadius: 6,
                  marginBottom: 12,
                }}
              />
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "4px 0",
                    borderBottom: "1px solid #eee",
                    fontSize: 10,
                  }}
                >
                  <span>Pasien P0{(i + 1).toString().padStart(2, "0")}</span>
                  <span style={{ color: "#666" }}>Hipertensi · {12 + i * 3} kunjungan</span>
                </div>
              ))}
              {done && (
                <div
                  style={{
                    marginTop: 16,
                    padding: 10,
                    background: "#e6f4f1",
                    borderRadius: 6,
                    color: "var(--teal-deep)",
                    fontSize: 11,
                    textAlign: "center",
                  }}
                >
                  ✓ PDF siap diunduh
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <style>{`@media (max-width: 880px) { .ep-grid { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}
