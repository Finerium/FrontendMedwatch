"use client";

import { useEffect, useMemo, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { backendToDisplayDrug, type BackendDrug, type DisplayDrug } from "@/lib/drug-format";
import type { Patient } from "@/lib/patient-format";
import { NavIcon } from "@/components/shell/NavIcon";

type SeverityWord = "aman" | "ringan" | "sedang" | "serius";

type BackendInteraction = {
  nama_efek: string;
  obat_terkait: string[];
  tingkat_tertinggi: string;
};

type BackendSafetyResult = {
  drugs: Array<{
    obat: { nama_obat: string; kategori: string };
    skor_risiko: number;
    label_risiko: string;
    ringkasan_keparahan: { serius: number; sedang: number; ringan: number };
    efek_dikenali: Array<{
      nama_efek: string;
      tingkat_keparahan: string;
      rekomendasi: string;
    }>;
  }>;
  interactions: BackendInteraction[];
  severity_score: number;
  severity_level: "low" | "medium" | "high";
  warnings: string[];
  obat_tidak_ditemukan: string[];
  pasien_context: { id: string; nama: string; kategori?: string; diagnosa?: string } | null;
};

type ResultCard = {
  kind: "pair" | "allergy" | "current";
  a: string;
  b?: string;
  sev: SeverityWord;
  reason: string;
};

const SEVERITY_ORDER: Record<SeverityWord, number> = {
  serius: 0,
  sedang: 1,
  ringan: 2,
  aman: 3,
};

function normalizeSeverity(raw: string): SeverityWord {
  const v = (raw || "").toLowerCase();
  if (v.startsWith("seri")) return "serius";
  if (v.startsWith("sed")) return "sedang";
  if (v.startsWith("rin")) return "ringan";
  return "ringan";
}

function levelToOverall(level: "low" | "medium" | "high", hasResults: boolean): SeverityWord {
  if (level === "high") return "serius";
  if (level === "medium") return "sedang";
  if (level === "low" && hasResults) return "ringan";
  return "aman";
}

const OVERALL_STYLE: Record<SeverityWord, { color: string; bg: string; label: string; sub: string }> = {
  aman: {
    color: "var(--safe-deep)",
    bg: "color-mix(in oklab, var(--safe) 15%, transparent)",
    label: "AMAN",
    sub: "Tidak ada interaksi terdeteksi",
  },
  ringan: {
    color: "var(--safe-deep)",
    bg: "color-mix(in oklab, var(--safe) 18%, transparent)",
    label: "PERHATIAN RINGAN",
    sub: "Interaksi minor; pantau pasien",
  },
  sedang: {
    color: "var(--warn-deep)",
    bg: "color-mix(in oklab, var(--warn) 22%, transparent)",
    label: "PERHATIAN SEDANG",
    sub: "Sesuaikan dosis atau pantau ketat",
  },
  serius: {
    color: "var(--crit-deep)",
    bg: "color-mix(in oklab, var(--crit) 18%, transparent)",
    label: "BAHAYA SERIUS",
    sub: "Hindari kombinasi atau ganti obat",
  },
};

export default function SafetyCheckerPage() {
  const [drugDb, setDrugDb] = useState<DisplayDrug[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [drugs, setDrugs] = useState<string[]>([]);
  const [drugQuery, setDrugQuery] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [result, setResult] = useState<BackendSafetyResult | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api.get<BackendDrug[]>("/api/drugs");
        if (cancelled) return;
        setDrugDb((data || []).map((d, i) => backendToDisplayDrug(d, i)));
      } catch {
        if (cancelled) return;
        setDrugDb([]);
      }
    })();
    (async () => {
      try {
        const data = await api.get<Patient[]>("/api/patients");
        if (cancelled) return;
        setPatients(data || []);
      } catch {
        if (cancelled) return;
        setPatients([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const drugLookup = useMemo(
    () => Object.fromEntries(drugDb.map((d) => [d.name.toLowerCase(), d])),
    [drugDb],
  );

  const drugSuggestions = useMemo(() => {
    if (!drugQuery) return [];
    const q = drugQuery.toLowerCase();
    return drugDb
      .filter(
        (d) =>
          !drugs.includes(d.name) &&
          (d.name.toLowerCase().includes(q) || d.generic.toLowerCase().includes(q)),
      )
      .slice(0, 6);
  }, [drugQuery, drugs, drugDb]);

  const cards: ResultCard[] = useMemo(() => {
    if (!result) return [];
    const out: ResultCard[] = [];
    for (const it of result.interactions || []) {
      const a = it.obat_terkait[0] || "obat";
      const b = it.obat_terkait[1];
      out.push({
        kind: "pair",
        a,
        b,
        sev: normalizeSeverity(it.tingkat_tertinggi),
        reason: it.nama_efek,
      });
    }
    for (const drug of result.drugs || []) {
      for (const ef of drug.efek_dikenali || []) {
        out.push({
          kind: "current",
          a: drug.obat.nama_obat,
          sev: normalizeSeverity(ef.tingkat_keparahan),
          reason: `${ef.nama_efek}. ${ef.rekomendasi}`.trim(),
        });
      }
    }
    out.sort((x, y) => SEVERITY_ORDER[x.sev] - SEVERITY_ORDER[y.sev]);
    return out;
  }, [result]);

  const counts: Record<string, number> = cards.reduce<Record<string, number>>((acc, r) => {
    acc[r.sev] = (acc[r.sev] || 0) + 1;
    return acc;
  }, {});
  const overall: SeverityWord = result
    ? levelToOverall(result.severity_level, cards.length > 0)
    : "aman";
  const overallStyle = OVERALL_STYLE[overall];

  const runScan = async () => {
    if (!patient || drugs.length < 1) return;
    setScanning(true);
    setScanError(null);
    setScanned(false);
    try {
      const data = await api.post<BackendSafetyResult>("/api/safety/check", {
        drugs,
        pasien_id: patient.id,
      });
      setResult(data);
      setScanned(true);
    } catch (e) {
      setScanError(e instanceof ApiError ? e.message : "Gagal memindai keamanan");
    } finally {
      setScanning(false);
    }
  };

  const addDrug = (name: string) => {
    setDrugs([...drugs, name]);
    setDrugQuery("");
    setScanned(false);
    setResult(null);
  };

  const removeDrug = (name: string) => {
    setDrugs(drugs.filter((d) => d !== name));
    setScanned(false);
    setResult(null);
  };

  return (
    <div
      className="page-in"
      style={{ padding: "120px 24px 80px", position: "relative", maxWidth: 1440, margin: "0 auto" }}
    >
      <div
        style={{
          position: "absolute",
          top: 80,
          left: -80,
          width: 280,
          height: 280,
          borderRadius: "50%",
          background: "var(--ink)",
          opacity: 0.92,
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 140,
          right: -60,
          width: 200,
          height: 200,
          background: "var(--teal)",
          opacity: 0.85,
          zIndex: 0,
          clipPath: "polygon(50% 0, 100% 50%, 50% 100%, 0 50%)",
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
          Severity engine · cross-reference 1.4M interaksi
        </span>
        <h1
          className="serif"
          style={{
            fontSize: "clamp(2.6rem, 5.5vw, 4.4rem)",
            fontWeight: 300,
            letterSpacing: "-0.03em",
            marginTop: 8,
            marginBottom: 28,
          }}
        >
          Cek <em style={{ fontStyle: "italic" }}>keamanan</em> kombinasi.
        </h1>

        <div className="sc-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 18 }}>
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
              1 · Pilih pasien
            </h3>
            {!patient ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 24 }}>
                {patients.length === 0 && (
                  <div className="glass-thin" style={{ padding: 16, fontSize: 13, color: "var(--ink-3)" }}>
                    Memuat daftar pasien…
                  </div>
                )}
                {patients.slice(0, 4).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPatient(p)}
                    className="lift"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "52px 1fr auto",
                      gap: 12,
                      alignItems: "center",
                      padding: 12,
                      borderRadius: 14,
                      border: "1px solid var(--line)",
                      background: "var(--bg-2)",
                      cursor: "pointer",
                      textAlign: "left",
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
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{p.nama}</div>
                      <div style={{ fontSize: 12, color: "var(--ink-3)" }}>
                        {p.umur || "-"} thn · {p.kategori || p.A?.diagnosa || "—"}
                      </div>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <path d="m9 6 6 6-6 6" />
                    </svg>
                  </button>
                ))}
              </div>
            ) : (
              <div
                className="glass-thin"
                style={{
                  padding: 16,
                  marginBottom: 24,
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                    <span className="mono" style={{ fontSize: 12, color: "var(--teal-deep)", fontWeight: 600 }}>
                      {patient.id}
                    </span>
                    <span style={{ fontWeight: 500 }}>{patient.nama}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 4 }}>
                    {patient.umur || "-"} tahun
                    {patient.kategori ? ` · ${patient.kategori}` : ""}
                    {patient.A?.diagnosa ? ` · ${patient.A.diagnosa}` : ""}
                  </div>
                </div>
                <button
                  className="btn btn-ghost"
                  onClick={() => {
                    setPatient(null);
                    setScanned(false);
                    setResult(null);
                  }}
                  style={{ alignSelf: "flex-start", padding: 6 }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d="m6 6 12 12M18 6 6 18" />
                  </svg>
                </button>
              </div>
            )}

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
              2 · Tambah obat untuk diskrining
            </h3>
            <div style={{ position: "relative" }}>
              <input
                value={drugQuery}
                onChange={(e) => setDrugQuery(e.target.value)}
                placeholder="paracetamol, amoxicillin…"
                className="input"
                style={{ marginBottom: 8 }}
              />
              {drugSuggestions.length > 0 && (
                <div
                  className="glass"
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    zIndex: 10,
                    padding: 6,
                    marginTop: 4,
                  }}
                >
                  {drugSuggestions.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => addDrug(d.name)}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: 10,
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        textAlign: "left",
                        color: "var(--ink)",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-2)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <span>
                        <strong>{d.name}</strong>{" "}
                        <span style={{ color: "var(--ink-3)", fontSize: 12 }}>· {d.class}</span>
                      </span>
                      <span className="mono" style={{ fontSize: 10, color: "var(--ink-3)" }}>
                        + tambah
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
              {drugs.map((name) => (
                <span
                  key={name}
                  className="chip"
                  style={{ background: "var(--ink)", color: "var(--bg)", borderColor: "var(--ink)" }}
                >
                  {drugLookup[name.toLowerCase()]?.name || name}
                  <button
                    onClick={() => removeDrug(name)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "inherit",
                      cursor: "pointer",
                      marginLeft: 4,
                      opacity: 0.7,
                    }}
                  >
                    ×
                  </button>
                </span>
              ))}
              {drugs.length === 0 && (
                <span style={{ fontSize: 12, color: "var(--ink-3)" }}>
                  Belum ada obat ditambahkan.
                </span>
              )}
            </div>

            <button
              onClick={runScan}
              disabled={!patient || drugs.length < 1 || scanning}
              className="btn btn-primary"
              style={{
                marginTop: 24,
                width: "100%",
                justifyContent: "center",
                padding: "16px 22px",
                opacity: !patient || drugs.length < 1 ? 0.5 : 1,
              }}
            >
              {scanning ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.3" />
                    <path d="M12 2 a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" fill="none">
                      <animateTransform
                        attributeName="transform"
                        type="rotate"
                        from="0 12 12"
                        to="360 12 12"
                        dur="0.8s"
                        repeatCount="indefinite"
                      />
                    </path>
                  </svg>
                  Memindai 1.4M interaksi…
                </>
              ) : (
                <>
                  <NavIcon name="shield" />
                  Pindai keamanan
                </>
              )}
            </button>

            {scanError && (
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
                {scanError}
              </div>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {scanned ? (
              <>
                <div className="glass" style={{ padding: 28, position: "relative", overflow: "hidden" }}>
                  <div
                    style={{
                      position: "absolute",
                      top: -40,
                      right: -40,
                      width: 200,
                      height: 200,
                      borderRadius: "50%",
                      background: overallStyle.bg,
                      zIndex: 0,
                    }}
                  />
                  <div style={{ position: "relative", zIndex: 2 }}>
                    <span
                      className="mono"
                      style={{
                        fontSize: 11,
                        letterSpacing: "0.1em",
                        color: "var(--ink-3)",
                      }}
                    >
                      VERDIKT
                    </span>
                    <h2
                      className="serif"
                      style={{
                        fontSize: "3rem",
                        fontWeight: 300,
                        letterSpacing: "-0.03em",
                        marginTop: 8,
                        color: overallStyle.color,
                      }}
                    >
                      {overallStyle.label}
                    </h2>
                    <p style={{ marginTop: 8, color: "var(--ink-2)", fontSize: 15 }}>
                      {overallStyle.sub}
                    </p>
                    <div style={{ display: "flex", gap: 8, marginTop: 18, flexWrap: "wrap" }}>
                      {(["serius", "sedang", "ringan"] as const).map(
                        (s) =>
                          counts[s] > 0 && (
                            <span key={s} className={`sev sev-${s}`}>
                              <span className="sev-dot" />
                              {counts[s]} {s}
                            </span>
                          ),
                      )}
                      {cards.length === 0 && (
                        <span className="sev sev-ringan">
                          <span className="sev-dot" />0 interaksi
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {cards.length > 0 && (
                  <div className="glass" style={{ padding: 4 }}>
                    {cards.map((r, i) => {
                      const sevStyle =
                        r.sev === "serius"
                          ? {
                              border: "2px solid color-mix(in oklab, var(--crit) 50%, transparent)",
                            }
                          : r.sev === "sedang"
                            ? {
                                border:
                                  "1px solid color-mix(in oklab, var(--warn) 40%, transparent)",
                              }
                            : { border: "1px solid var(--line)" };
                      const aName = drugLookup[r.a.toLowerCase()]?.name || r.a;
                      const bName = r.b
                        ? drugLookup[r.b.toLowerCase()]?.name || r.b
                        : null;
                      return (
                        <div
                          key={i}
                          className="lift"
                          style={{
                            padding: 18,
                            margin: 6,
                            borderRadius: 14,
                            background: "var(--bg-2)",
                            ...sevStyle,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                              gap: 14,
                              marginBottom: 8,
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                flexWrap: "wrap",
                              }}
                            >
                              <span style={{ fontWeight: 600, fontSize: 15 }}>{aName}</span>
                              {bName && (
                                <>
                                  <span style={{ color: "var(--ink-3)" }}>×</span>
                                  <span style={{ fontWeight: 600, fontSize: 15 }}>{bName}</span>
                                </>
                              )}
                              {r.kind === "allergy" && (
                                <span className="chip" style={{ borderColor: "var(--crit)" }}>
                                  ALERGI
                                </span>
                              )}
                              {r.kind === "current" && <span className="chip">vs obat aktif</span>}
                            </div>
                            <span className={`sev sev-${r.sev}`}>
                              <span className="sev-dot" />
                              {r.sev}
                            </span>
                          </div>
                          <p
                            style={{
                              fontSize: 14,
                              color: "var(--ink-2)",
                              lineHeight: 1.55,
                              marginTop: 6,
                            }}
                          >
                            {r.reason}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <div
                className="glass"
                style={{
                  padding: 60,
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 18,
                  minHeight: 360,
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: "50%",
                    background: "var(--bg-2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1px dashed var(--line)",
                  }}
                >
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--ink-3)" strokeWidth="1.2">
                    <path d="M12 3l8 3v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V6l8-3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="serif" style={{ fontSize: "1.5rem", fontWeight: 400 }}>
                    Menunggu pemindaian
                  </h3>
                  <p style={{ color: "var(--ink-3)", marginTop: 8, maxWidth: 360 }}>
                    Pilih pasien dan tambahkan obat. Sistem akan cross-reference terhadap
                    riwayat alergi, obat aktif, dan database interaksi BPOM.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 1080px) {
          .sc-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
