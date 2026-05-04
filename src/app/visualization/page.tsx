"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

const FALLBACK_VISITS = [42, 51, 48, 62, 70, 68, 81, 75, 88, 92, 85, 96];
const FALLBACK_MONTHS = ["Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des", "Jan", "Feb", "Mar", "Apr", "Mei"];
const FALLBACK_COMPLAINTS = [
  { label: "ISPA", n: 124 },
  { label: "Hipertensi", n: 98 },
  { label: "DM", n: 67 },
  { label: "Diare", n: 54 },
  { label: "Demam", n: 49 },
  { label: "Maag", n: 38 },
];
const FALLBACK_EFFECTS = [
  { drug: "Amoxicillin", effect: "Mual", n: 34 },
  { drug: "Metformin", effect: "Diare", n: 28 },
  { drug: "Simvastatin", effect: "Mialgia", n: 22 },
  { drug: "Amlodipine", effect: "Edema kaki", n: 18 },
  { drug: "Ibuprofen", effect: "Nyeri ulu hati", n: 16 },
];
const AGES = [
  { label: "0–5", n: 42 },
  { label: "6–17", n: 28 },
  { label: "18–34", n: 56 },
  { label: "35–54", n: 78 },
  { label: "55–64", n: 64 },
  { label: "65+", n: 38 },
];

type TrendItem = { month: string; count: number };
type KategoriItem = { kategori: string; count: number };
type EfekSampingItem = { nama_efek: string; count: number; kategori: string };

function LineChart({ data, labels }: { data: number[]; labels: string[] }) {
  const w = 560;
  const h = 200;
  const pad = 24;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2);
    const y = h - pad - ((v - min) / (max - min || 1)) * (h - pad * 2);
    return [x, y] as [number, number];
  });
  const path = pts.map((p, i) => (i === 0 ? "M" : "L") + p[0] + "," + p[1]).join(" ");
  const area = path + ` L ${pts[pts.length - 1][0]},${h - pad} L ${pts[0][0]},${h - pad} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{ display: "block" }}>
      <defs>
        <linearGradient id="lc-grad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--teal)" stopOpacity="0.4" />
          <stop offset="100%" stopColor="var(--teal)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
        <line
          key={i}
          x1={pad}
          x2={w - pad}
          y1={pad + p * (h - pad * 2)}
          y2={pad + p * (h - pad * 2)}
          stroke="var(--line)"
          strokeWidth="0.5"
        />
      ))}
      <path d={area} fill="url(#lc-grad)" />
      <path d={path} stroke="var(--teal)" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <animate attributeName="stroke-dasharray" from="0 1000" to="1000 0" dur="1.6s" fill="freeze" />
      </path>
      {pts.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r="3" fill="var(--bg)" stroke="var(--teal)" strokeWidth="1.5" />
      ))}
      {labels.map((l, i) => (
        <text
          key={i}
          x={pts[i][0]}
          y={h - 6}
          textAnchor="middle"
          fontSize="9"
          fill="var(--ink-3)"
          fontFamily="JetBrains Mono"
        >
          {l}
        </text>
      ))}
    </svg>
  );
}

function BarChart({ data, color = "var(--teal)" }: { data: { label: string; n: number }[]; color?: string }) {
  const max = Math.max(...data.map((d) => d.n));
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 160 }}>
      {data.map((d, i) => {
        const h = (d.n / max) * 100;
        return (
          <div
            key={i}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span className="mono" style={{ fontSize: 10, color: "var(--ink-3)" }}>
              {d.n}
            </span>
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "flex-end" }}>
              <div
                style={{
                  width: "100%",
                  height: h + "%",
                  background: color,
                  borderRadius: "6px 6px 2px 2px",
                  animation: "barIn 1s cubic-bezier(0.22,1,0.36,1) both",
                  animationDelay: i * 0.08 + "s",
                }}
              />
            </div>
            <span style={{ fontSize: 10, color: "var(--ink-3)" }}>{d.label}</span>
          </div>
        );
      })}
      <style>{`@keyframes barIn { from { height: 0; opacity: 0; } }`}</style>
    </div>
  );
}

export default function VisualizationPage() {
  const [visits, setVisits] = useState<number[]>(FALLBACK_VISITS);
  const [months, setMonths] = useState<string[]>(FALLBACK_MONTHS);
  const [complaints, setComplaints] = useState(FALLBACK_COMPLAINTS);
  const [effects, setEffects] = useState(FALLBACK_EFFECTS);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const t = await api.get<TrendItem[]>("/api/visualizations/kunjungan-trend");
        if (!cancelled && t && t.length > 0) {
          setVisits(t.map((d) => d.count));
          setMonths(t.map((d) => d.month));
        }
      } catch {}
      try {
        const c = await api.get<KategoriItem[]>("/api/visualizations/keluhan-distribution");
        if (!cancelled && c && c.length > 0) {
          setComplaints(c.slice(0, 6).map((d) => ({ label: d.kategori, n: d.count })));
        }
      } catch {}
      try {
        const e = await api.get<EfekSampingItem[]>("/api/visualizations/top-efek-samping");
        if (!cancelled && e && e.length > 0) {
          setEffects(
            e.slice(0, 5).map((d) => ({ drug: d.kategori, effect: d.nama_efek, n: d.count })),
          );
        }
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const totalVisits = visits.reduce((a, b) => a + b, 0);

  return (
    <div
      className="page-in"
      style={{ padding: "120px 24px 80px", position: "relative", maxWidth: 1440, margin: "0 auto" }}
    >
      <div
        style={{
          position: "absolute",
          top: 90,
          right: -100,
          width: 320,
          height: 320,
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
          Statistik Klinik · 12 bulan terakhir
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
          Pola <em style={{ fontStyle: "italic" }}>kunjungan</em>.
        </h1>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))",
            gap: 16,
          }}
        >
          <div className="glass" style={{ padding: 24 }}>
            <div style={{ marginBottom: 16 }}>
              <h3 className="serif" style={{ fontSize: "1.4rem" }}>
                Tren kunjungan
              </h3>
              <span className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>
                monthly · {totalVisits} total
              </span>
            </div>
            <LineChart data={visits} labels={months} />
          </div>

          <div className="glass" style={{ padding: 24 }}>
            <div style={{ marginBottom: 16 }}>
              <h3 className="serif" style={{ fontSize: "1.4rem" }}>
                Top keluhan
              </h3>
              <span className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>
                peringkat · 6 teratas
              </span>
            </div>
            <BarChart data={complaints} />
          </div>

          <div className="glass" style={{ padding: 24 }}>
            <div style={{ marginBottom: 16 }}>
              <h3 className="serif" style={{ fontSize: "1.4rem" }}>
                Efek samping terlapor
              </h3>
              <span className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>
                obat · efek · jumlah
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {effects.map((e, i) => {
                const max = Math.max(...effects.map((x) => x.n));
                const pct = (e.n / max) * 100;
                return (
                  <div key={i} style={{ position: "relative" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>
                        {e.drug}{" "}
                        <span style={{ color: "var(--ink-3)", fontWeight: 400 }}>· {e.effect}</span>
                      </span>
                      <span className="mono" style={{ fontSize: 12, color: "var(--ink-2)" }}>
                        {e.n}
                      </span>
                    </div>
                    <div
                      style={{
                        height: 8,
                        background: "var(--bg-2)",
                        borderRadius: 999,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: pct + "%",
                          background: "var(--teal)",
                          borderRadius: 999,
                          transition: "width 1.2s cubic-bezier(0.22,1,0.36,1)",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="glass" style={{ padding: 24 }}>
            <div style={{ marginBottom: 16 }}>
              <h3 className="serif" style={{ fontSize: "1.4rem" }}>
                Segmentasi usia
              </h3>
              <span className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>
                distribusi pasien
              </span>
            </div>
            <BarChart data={AGES} color="var(--ink)" />
          </div>
        </div>
      </div>
    </div>
  );
}
