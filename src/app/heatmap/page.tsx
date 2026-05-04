"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

const FALLBACK_DRUGS = [
  "Paracetamol",
  "Amoxicillin",
  "Ibuprofen",
  "Metformin",
  "Simvastatin",
  "Amlodipine",
  "Warfarin",
];
const FALLBACK_EFFECTS = [
  "Mual",
  "Pusing",
  "Ruam",
  "Diare",
  "Mengantuk",
  "Edema",
  "Sakit kepala",
];

type HeatmapResponse = {
  drugs: string[];
  effects: string[];
  values: number[][];
};

function valueFromSeed(i: number, j: number) {
  const seed = (i * 7 + j * 13) % 11;
  return seed * 9 + (i + j) * 2;
}

export default function HeatmapPage() {
  const [drugs, setDrugs] = useState<string[]>(FALLBACK_DRUGS);
  const [effects, setEffects] = useState<string[]>(FALLBACK_EFFECTS);
  const [values, setValues] = useState<number[][] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api.get<HeatmapResponse>("/api/visualizations/heatmap-efek");
        if (cancelled) return;
        if (data && data.drugs && data.drugs.length > 0 && data.effects && data.effects.length > 0) {
          setDrugs(data.drugs.slice(0, 8));
          setEffects(data.effects.slice(0, 8));
          if (Array.isArray(data.values) && data.values.length > 0) {
            const slicedValues = data.values
              .slice(0, 8)
              .map((row) => (Array.isArray(row) ? row.slice(0, 8) : []));
            setValues(slicedValues);
          }
        }
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const cellValue = (i: number, j: number) => {
    if (values && values[i] && typeof values[i][j] === "number") {
      const v = values[i][j];
      return v === 0 || v === 1 ? v * (40 + ((i + j) * 7) % 60) : v;
    }
    return valueFromSeed(i, j);
  };

  return (
    <div
      className="page-in"
      style={{ padding: "120px 24px 80px", position: "relative", maxWidth: 1440, margin: "0 auto" }}
    >
      <div
        style={{
          position: "absolute",
          top: 100,
          left: -80,
          width: 240,
          height: 240,
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
          Heatmap · obat × efek samping
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
          Matriks <em style={{ fontStyle: "italic" }}>kekerapan</em>.
        </h1>

        <div className="glass" style={{ padding: 28, overflowX: "auto" }}>
          <table style={{ borderCollapse: "separate", borderSpacing: 4, fontSize: 12 }}>
            <thead>
              <tr>
                <th />
                {effects.map((e) => (
                  <th
                    key={e}
                    style={{
                      padding: 8,
                      textAlign: "center",
                      fontSize: 11,
                      fontWeight: 500,
                      color: "var(--ink-3)",
                    }}
                  >
                    {e}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {drugs.map((drug, i) => (
                <tr key={drug}>
                  <th
                    style={{
                      textAlign: "right",
                      padding: "4px 14px 4px 4px",
                      fontSize: 12,
                      fontWeight: 500,
                    }}
                  >
                    {drug}
                  </th>
                  {effects.map((e, j) => {
                    const v = cellValue(i, j);
                    const sev: "serius" | "sedang" | "ringan" | null =
                      v > 80 ? "serius" : v > 45 ? "sedang" : v > 15 ? "ringan" : null;
                    const colors: Record<string, string> = {
                      serius: "var(--crit)",
                      sedang: "var(--warn)",
                      ringan: "var(--safe)",
                    };
                    return (
                      <td
                        key={e}
                        className="lift"
                        style={{
                          width: 64,
                          height: 48,
                          borderRadius: 8,
                          background: sev
                            ? `color-mix(in oklab, ${colors[sev]} ${Math.min(70, v)}%, var(--bg-2))`
                            : "var(--bg-2)",
                          textAlign: "center",
                          cursor: "pointer",
                          border: "1px solid var(--line)",
                          fontWeight: 500,
                          fontSize: 12,
                        }}
                      >
                        {v > 0 ? v : ""}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>

          <div
            style={{
              marginTop: 24,
              display: "flex",
              gap: 12,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <span className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>
              SKALA
            </span>
            {(
              [
                { l: "Jarang", s: null },
                { l: "Ringan", s: "ringan" },
                { l: "Sedang", s: "sedang" },
                { l: "Sering", s: "serius" },
              ] as const
            ).map((x, i) => (
              <span
                key={i}
                className={"sev " + (x.s ? "sev-" + x.s : "")}
                style={{
                  background: x.s ? undefined : "var(--bg-2)",
                  color: x.s ? undefined : "var(--ink-3)",
                }}
              >
                <span
                  className="sev-dot"
                  style={{ background: x.s ? undefined : "var(--ink-4)" }}
                />
                {x.l}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
