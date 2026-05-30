/**
 * Drug-by-side-effect heatmap section. Marked `"use client"` because the
 * grid is built from two server fetches stitched together, then sorted and
 * color-scaled with d3 utilities in the browser. The section renders an
 * honest fallback grid when the backend endpoints are unavailable so the
 * visualisation never goes blank.
 *
 * This component was extracted from the former standalone `/heatmap` page so
 * the matrix can live as an additional section inside `/visualization`
 * without losing any behaviour.
 */
"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import {
  buildColorScale,
  buildGradientCss,
  getContrastingTextColor,
} from "@/lib/heatmap-colors";

const FALLBACK_DRUGS = [
  "Paracetamol",
  "Ibuprofen",
  "Amoxicillin",
  "Captopril",
  "Cetirizine",
  "Metformin",
];
const FALLBACK_EFFECTS = [
  "Mual",
  "Pusing",
  "Ruam kulit",
  "Diare",
  "Sakit kepala",
  "Tukak lambung",
  "Hipertensi",
];

type HeatmapResponse = {
  drugs: string[];
  effects: string[];
  values: number[][];
};

type SeverityLevel = "ringan" | "sedang" | "serius";

type TopEffectItem = {
  nama_efek: string;
  count: number;
  kategori: string;
  tingkat_keparahan: SeverityLevel | string;
};

const SEVERITY_WEIGHT: Record<SeverityLevel, number> = {
  ringan: 1,
  sedang: 2,
  serius: 4,
};

/** Build a fallback severity-weighted matrix when the backend is offline. */
function fallbackMatrix(drugs: string[], effects: string[]): number[][] {
  // Deterministic but visually rich fallback: weighted by drug class indexes.
  return drugs.map((_, i) =>
    effects.map((_, j) => {
      const base = (i * 3 + j * 5) % 7;
      return base === 0 ? 0 : base; // keep zeros to exercise the zero-tint path
    })
  );
}

/**
 * Render the drug-by-effect intensity matrix with a gradient legend.
 * Cells use the WCAG luminance helper to pick a readable text color,
 * and rows/columns are sorted so the highest totals land at top-left.
 */
export function HeatmapSection() {
  const [loaded, setLoaded] = useState(false);
  const [missing, setMissing] = useState(false);
  const [drugs, setDrugs] = useState<string[]>(FALLBACK_DRUGS);
  const [effects, setEffects] = useState<string[]>(FALLBACK_EFFECTS);
  const [values, setValues] = useState<number[][] | null>(null);
  const [severityByEffect, setSeverityByEffect] = useState<Record<string, SeverityLevel>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [grid, topEffects] = await Promise.all([
          api.get<HeatmapResponse>("/api/visualizations/heatmap-efek"),
          api.get<TopEffectItem[]>("/api/visualizations/top-efek-samping").catch(() => []),
        ]);
        if (cancelled) return;

        // Build severity index from the top-effects endpoint for weighting.
        const sevIndex: Record<string, SeverityLevel> = {};
        if (Array.isArray(topEffects)) {
          for (const item of topEffects) {
            const sev = (item.tingkat_keparahan || "").toLowerCase() as SeverityLevel;
            if (sev === "ringan" || sev === "sedang" || sev === "serius") {
              sevIndex[item.nama_efek] = sev;
            }
          }
        }

        if (
          grid &&
          Array.isArray(grid.drugs) &&
          grid.drugs.length > 0 &&
          Array.isArray(grid.effects) &&
          grid.effects.length > 0 &&
          Array.isArray(grid.values) &&
          grid.values.length > 0
        ) {
          setDrugs(grid.drugs);
          setEffects(grid.effects);
          setValues(grid.values);
          setSeverityByEffect(sevIndex);
        } else {
          setMissing(true);
        }
      } catch {
        setMissing(true);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * Compute the displayed matrix:
   *   - if backend responded with binary presence/absence, weight each cell
   *     by the effect severity so the heatmap shows risk intensity, not just
   *     presence. Result is on a 0..4 integer scale.
   *   - if backend missing entirely, use a deterministic local fallback that
   *     still exercises zero and high values for visual sanity.
   * Then sort rows by row-total desc and columns by column-total desc, so
   * the most-impacted drugs and most-common effects rise to the top-left.
   */
  const sorted = useMemo(() => {
    const baseDrugs = values ? drugs : FALLBACK_DRUGS;
    const baseEffects = values ? effects : FALLBACK_EFFECTS;
    const rawMatrix = values ?? fallbackMatrix(baseDrugs, baseEffects);

    // Apply severity weighting per effect (column). Missing severity defaults
    // to 1 so the cell still shows presence (1) rather than collapsing to 0.
    const weighted: number[][] = rawMatrix.map((row) =>
      row.map((v, j) => {
        if (v === 0) return 0;
        const sev = severityByEffect[baseEffects[j]];
        const weight = sev ? SEVERITY_WEIGHT[sev] : 1;
        // If the raw value already encodes magnitude (>1), preserve it; otherwise scale by severity.
        return v <= 1 ? weight : Math.round(v * weight);
      })
    );

    const rowTotals = weighted.map((r) => r.reduce((a, b) => a + b, 0));
    const colTotals = baseEffects.map((_, j) =>
      weighted.reduce((sum, r) => sum + (r[j] ?? 0), 0)
    );

    const rowOrder = baseDrugs
      .map((d, i) => ({ d, i, total: rowTotals[i] }))
      .sort((a, b) => b.total - a.total || a.d.localeCompare(b.d, "id"));
    const colOrder = baseEffects
      .map((e, j) => ({ e, j, total: colTotals[j] }))
      .sort((a, b) => b.total - a.total || a.e.localeCompare(b.e, "id"));

    const orderedDrugs = rowOrder.map((r) => r.d);
    const orderedEffects = colOrder.map((c) => c.e);
    const orderedMatrix: number[][] = rowOrder.map(({ i }) =>
      colOrder.map(({ j }) => weighted[i][j])
    );

    const flat = orderedMatrix.flat();
    const minV = Math.min(...flat, 0);
    const maxV = Math.max(...flat, 1);

    return {
      drugs: orderedDrugs,
      effects: orderedEffects,
      matrix: orderedMatrix,
      min: minV,
      max: maxV,
    };
  }, [drugs, effects, values, severityByEffect]);

  const colorScale = useMemo(
    () => buildColorScale(sorted.min, sorted.max),
    [sorted.min, sorted.max]
  );

  const showCellLabels = sorted.drugs.length <= 10 && sorted.effects.length <= 10;
  const cellSize = 56;
  const cellHeight = 44;

  const gradientCss = buildGradientCss();
  const midValue = Math.round((sorted.min + sorted.max) / 2);

  return (
    <div className="glass" style={{ padding: 28, overflowX: "auto" }}>
      {!loaded ? (
        <div
          className="skel"
          style={{ width: "100%", maxWidth: 720, height: 360, margin: "0 auto" }}
          aria-hidden
        />
      ) : (
        <>
          <div style={{ display: "inline-block", minWidth: "100%" }}>
            <table
              data-testid="heatmap-grid"
              style={{
                borderCollapse: "separate",
                borderSpacing: 3,
                fontSize: 12,
                margin: "0 auto",
              }}
            >
              <thead>
                <tr>
                  <th
                    style={{
                      padding: 8,
                      textAlign: "right",
                      fontSize: 10,
                      fontWeight: 500,
                      color: "var(--ink-3)",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                    }}
                  >
                    Obat \ Efek
                  </th>
                  {sorted.effects.map((e) => (
                    <th
                      key={e}
                      scope="col"
                      style={{
                        padding: "8px 4px",
                        textAlign: "center",
                        fontSize: 11,
                        fontWeight: 500,
                        color: "var(--ink-2)",
                        verticalAlign: "bottom",
                        minWidth: cellSize,
                        maxWidth: cellSize,
                      }}
                      title={e}
                    >
                      <div
                        style={{
                          display: "inline-block",
                          transform: "rotate(-35deg)",
                          transformOrigin: "left bottom",
                          whiteSpace: "nowrap",
                          maxWidth: 140,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {e}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.drugs.map((drug, i) => (
                  <tr key={drug}>
                    <th
                      scope="row"
                      style={{
                        textAlign: "right",
                        padding: "4px 14px 4px 4px",
                        fontSize: 12,
                        fontWeight: 500,
                        color: "var(--ink)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {drug}
                    </th>
                    {sorted.effects.map((eff, j) => {
                      const v = sorted.matrix[i][j];
                      const isMissingData = missing && !values;
                      // Treat as "missing" only when the cell is structurally absent.
                      // In our enriched matrix every cell has a number (0 inclusive),
                      // so this branch fires only if data is undefined.
                      const cellIsNA = typeof v !== "number" || Number.isNaN(v);
                      if (cellIsNA) {
                        return (
                          <td
                            key={eff}
                            aria-label={`${drug} × ${eff}: data tidak tersedia`}
                            title={`${drug} × ${eff}: N/A`}
                            style={{
                              width: cellSize,
                              height: cellHeight,
                              borderRadius: 6,
                              textAlign: "center",
                              fontSize: 11,
                              fontWeight: 500,
                              color: "var(--ink-3)",
                              border: "1px dashed var(--ink-4)",
                              background:
                                "repeating-linear-gradient(45deg, var(--bg-2) 0 6px, var(--bg-3) 6px 12px)",
                            }}
                          >
                            N/A
                          </td>
                        );
                      }
                      const bg = colorScale(v);
                      const fg = getContrastingTextColor(bg);
                      const label = `${drug} × ${eff}: ${v}${isMissingData ? " (fallback)" : ""}`;
                      return (
                        <td
                          key={eff}
                          data-testid="heatmap-cell"
                          data-value={v}
                          aria-label={label}
                          title={label}
                          style={{
                            width: cellSize,
                            height: cellHeight,
                            borderRadius: 6,
                            background: bg,
                            color: fg,
                            textAlign: "center",
                            cursor: "default",
                            border: "1px solid rgba(26, 24, 21, 0.08)",
                            fontWeight: 600,
                            fontSize: 12,
                            fontVariantNumeric: "tabular-nums",
                            transition:
                              "transform 220ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 220ms",
                          }}
                          onMouseEnter={(ev) => {
                            (ev.currentTarget as HTMLTableCellElement).style.transform =
                              "scale(1.08)";
                            (ev.currentTarget as HTMLTableCellElement).style.boxShadow =
                              "0 6px 18px -6px rgba(26,24,21,0.35)";
                            (ev.currentTarget as HTMLTableCellElement).style.zIndex = "5";
                            (ev.currentTarget as HTMLTableCellElement).style.position =
                              "relative";
                          }}
                          onMouseLeave={(ev) => {
                            (ev.currentTarget as HTMLTableCellElement).style.transform = "";
                            (ev.currentTarget as HTMLTableCellElement).style.boxShadow = "";
                            (ev.currentTarget as HTMLTableCellElement).style.zIndex = "";
                          }}
                        >
                          {showCellLabels ? v : ""}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Gradient legend with min / mid / max ticks */}
          <div
            data-testid="heatmap-legend"
            style={{
              marginTop: 28,
              display: "flex",
              flexDirection: "column",
              gap: 8,
              maxWidth: 520,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
              }}
            >
              <span
                className="mono"
                style={{
                  fontSize: 11,
                  color: "var(--ink-3)",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
              >
                Skala intensitas
              </span>
              <span
                className="mono"
                style={{
                  fontSize: 11,
                  color: "var(--ink-4)",
                }}
              >
                rendah ke tinggi
              </span>
            </div>
            <div
              aria-hidden
              style={{
                height: 14,
                borderRadius: 999,
                background: gradientCss,
                border: "1px solid var(--line)",
              }}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 11,
                color: "var(--ink-2)",
                fontVariantNumeric: "tabular-nums",
              }}
              className="mono"
            >
              <span>{sorted.min}</span>
              <span>{midValue}</span>
              <span>{sorted.max}</span>
            </div>
            <div
              style={{
                marginTop: 4,
                display: "flex",
                gap: 18,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 11,
                  color: "var(--ink-3)",
                }}
              >
                <span
                  aria-hidden
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 4,
                    border: "1px dashed var(--ink-4)",
                    background:
                      "repeating-linear-gradient(45deg, var(--bg-2) 0 4px, var(--bg-3) 4px 8px)",
                  }}
                />
                Data tidak tersedia (N/A)
              </span>
              <span
                style={{
                  fontSize: 11,
                  color: "var(--ink-3)",
                  maxWidth: 520,
                }}
              >
                Tiap sel menyatakan intensitas tertimbang efek samping per
                obat per jenis efek (presensi x bobot keparahan; ringan=1,
                sedang=2, serius=4). Sumber: agregasi data obat MedWatch dan
                referensi openFDA.
              </span>
            </div>
          </div>

          {missing && (
            <p
              role="status"
              style={{
                marginTop: 16,
                fontSize: 12,
                color: "var(--warn-deep)",
              }}
            >
              Data backend tidak tersedia. Menampilkan contoh fallback.
            </p>
          )}
        </>
      )}
    </div>
  );
}
