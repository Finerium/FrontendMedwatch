/**
 * Side-by-side drug comparison page. Marked `"use client"` because the
 * user assembles up to three drugs interactively, the URL prefill via
 * `?initial=` must update local state, and the search-with-suggestions
 * box hosts a live filtered dropdown.
 *
 * `force-dynamic` prevents Next from caching the route output since the
 * search params drive an immediate selection update.
 */
"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import type { BackendDrug } from "@/lib/drug-format";
import { NavIcon } from "@/components/shell/NavIcon";

export const dynamic = "force-dynamic";

/** Maximum drugs the side-by-side table can show without becoming unreadable. */
const MAX_DRUGS = 3;

const TABLE_ROWS: { key: keyof BackendDrug; label: string; mode: "scalar" | "list" }[] = [
  { key: "kategori", label: "Kelas / kategori", mode: "scalar" },
  { key: "bahan_aktif", label: "Bahan aktif", mode: "list" },
  { key: "dosis_umum", label: "Dosis umum", mode: "scalar" },
  { key: "kehamilan", label: "Kehamilan", mode: "scalar" },
  { key: "indikasi", label: "Indikasi", mode: "list" },
  { key: "kontraindikasi", label: "Kontraindikasi", mode: "list" },
  { key: "peringatan", label: "Peringatan", mode: "list" },
];

/**
 * Page-level wrapper. `useSearchParams` needs a Suspense boundary; the
 * inner component owns all interactive state.
 */
export default function DrugComparisonPage() {
  return (
    <Suspense fallback={null}>
      <DrugComparisonInner />
    </Suspense>
  );
}

/**
 * Interactive comparison body. Fetches the full drug catalog once,
 * builds a lowercased lookup for instant suggestions, and renders the
 * comparison table plus the aggregated side-effect strip chart.
 */
function DrugComparisonInner() {
  const params = useSearchParams();
  const initialName = params.get("initial") || "";

  const [drugDb, setDrugDb] = useState<BackendDrug[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [prefillApplied, setPrefillApplied] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api.get<BackendDrug[]>("/api/drugs");
        if (!cancelled) setDrugDb(data || []);
      } catch (e) {
        if (!cancelled) setDrugDb([]);
        if (!cancelled && e instanceof ApiError) console.error(e);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const drugLookup = useMemo(
    () => Object.fromEntries(drugDb.map((d) => [d.nama_obat.toLowerCase(), d])),
    [drugDb],
  );

  useEffect(() => {
    if (prefillApplied) return;
    if (!loaded) return;
    if (initialName) {
      const match = drugLookup[initialName.toLowerCase()];
      if (match && selected.length === 0) {
        setSelected([match.nama_obat]);
      }
    }
    setPrefillApplied(true);
  }, [initialName, loaded, drugLookup, selected.length, prefillApplied]);

  const suggestions = useMemo(() => {
    if (!query) return [];
    const q = query.toLowerCase();
    return drugDb
      .filter(
        (d) =>
          !selected.includes(d.nama_obat) &&
          (d.nama_obat.toLowerCase().includes(q) ||
            (d.bahan_aktif || []).some((b) => b.toLowerCase().includes(q))),
      )
      .slice(0, 6);
  }, [query, drugDb, selected]);

  const selectedDrugs = useMemo(
    () => selected.map((n) => drugLookup[n.toLowerCase()]).filter(Boolean) as BackendDrug[],
    [selected, drugLookup],
  );

  const addDrug = (name: string) => {
    if (selected.length >= MAX_DRUGS) return;
    setSelected([...selected, name]);
    setQuery("");
  };

  const removeDrug = (name: string) => {
    setSelected(selected.filter((n) => n !== name));
  };

  const effectAggregation = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const d of selectedDrugs) {
      for (const e of d.efek_samping || []) {
        counts[e] = (counts[e] || 0) + 1;
      }
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
  }, [selectedDrugs]);

  const drugColors = ["var(--teal)", "var(--warn)", "var(--crit)"];

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
      <div
        style={{
          position: "absolute",
          top: 200,
          left: -60,
          width: 160,
          height: 160,
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
          Direktori obat · perbandingan side-by-side
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
          Bandingkan <em style={{ fontStyle: "italic" }}>obat</em>.
        </h1>

        <div className="glass" style={{ padding: 18, marginBottom: 18 }}>
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
            Pilih hingga {MAX_DRUGS} obat
          </h3>
          <div style={{ position: "relative" }}>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                selected.length >= MAX_DRUGS
                  ? `Maksimal ${MAX_DRUGS} obat`
                  : "paracetamol, amoxicillin, ibuprofen…"
              }
              className="input"
              disabled={selected.length >= MAX_DRUGS}
              style={{ marginBottom: 8 }}
            />
            {suggestions.length > 0 && (
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
                {suggestions.map((d) => (
                  <button
                    key={d.nama_obat}
                    onClick={() => addDrug(d.nama_obat)}
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
                      <strong>{d.nama_obat}</strong>{" "}
                      <span style={{ color: "var(--ink-3)", fontSize: 12 }}>· {d.kategori}</span>
                    </span>
                    <span className="mono" style={{ fontSize: 10, color: "var(--ink-3)" }}>
                      + tambah
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8, minHeight: 28 }}>
            {selected.map((name, i) => (
              <span
                key={name}
                className="chip"
                style={{
                  background: drugColors[i],
                  color: "var(--bg)",
                  borderColor: "transparent",
                }}
              >
                {name}
                <button
                  onClick={() => removeDrug(name)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "inherit",
                    cursor: "pointer",
                    marginLeft: 4,
                    opacity: 0.85,
                  }}
                >
                  ×
                </button>
              </span>
            ))}
            {selected.length === 0 && (
              <span style={{ fontSize: 12, color: "var(--ink-3)" }}>
                {!loaded ? "Memuat katalog obat…" : "Belum ada obat dipilih."}
              </span>
            )}
          </div>
        </div>

        {selectedDrugs.length < 2 ? (
          <div
            className="glass"
            style={{
              padding: 60,
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 18,
              minHeight: 320,
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
                <rect x="3" y="9" width="18" height="6" rx="3" />
                <path d="M12 9v6" />
              </svg>
            </div>
            <div>
              <h3 className="serif" style={{ fontSize: "1.5rem", fontWeight: 400 }}>
                Pilih minimal 2 obat
              </h3>
              <p style={{ color: "var(--ink-3)", marginTop: 8, maxWidth: 380 }}>
                Cari dan tambahkan obat di atas untuk melihat perbandingan kelas, indikasi, dosis,
                kontraindikasi, dan profil efek samping.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div
              className="glass"
              style={{ padding: 0, overflow: "hidden", marginBottom: 16 }}
            >
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "var(--bg-2)" }}>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "14px 18px",
                        fontSize: 10,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: "var(--ink-3)",
                        fontFamily: "JetBrains Mono, monospace",
                        fontWeight: 500,
                        width: 200,
                      }}
                    >
                      Atribut
                    </th>
                    {selectedDrugs.map((d, i) => (
                      <th
                        key={d.nama_obat}
                        style={{
                          textAlign: "left",
                          padding: "14px 18px",
                          fontSize: 14,
                          fontFamily: "Fraunces, serif",
                          fontWeight: 400,
                          color: "var(--ink)",
                        }}
                      >
                        <span
                          style={{
                            display: "inline-block",
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: drugColors[i],
                            marginRight: 8,
                            verticalAlign: "middle",
                          }}
                        />
                        {d.nama_obat}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {TABLE_ROWS.map((row) => (
                    <tr key={row.key as string} style={{ borderTop: "1px solid var(--line-2)" }}>
                      <td
                        style={{
                          padding: "14px 18px",
                          color: "var(--ink-3)",
                          fontSize: 12,
                          verticalAlign: "top",
                        }}
                      >
                        {row.label}
                      </td>
                      {selectedDrugs.map((d) => {
                        const value = d[row.key];
                        return (
                          <td
                            key={d.nama_obat}
                            style={{
                              padding: "14px 18px",
                              verticalAlign: "top",
                              color: "var(--ink-2)",
                              lineHeight: 1.55,
                            }}
                          >
                            {row.mode === "list" ? (
                              Array.isArray(value) && value.length > 0 ? (
                                <ul style={{ paddingLeft: 0, listStyle: "none", margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
                                  {(value as string[]).map((v, vi) => (
                                    <li
                                      key={vi}
                                      style={{ display: "flex", gap: 8, alignItems: "flex-start" }}
                                    >
                                      <span
                                        style={{
                                          width: 4,
                                          height: 4,
                                          borderRadius: "50%",
                                          background: "var(--ink-4)",
                                          marginTop: 8,
                                          flexShrink: 0,
                                        }}
                                      />
                                      <span>{v}</span>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <span style={{ color: "var(--ink-4)", fontStyle: "italic" }}>-</span>
                              )
                            ) : (
                              (value as string) || (
                                <span style={{ color: "var(--ink-4)", fontStyle: "italic" }}>-</span>
                              )
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="glass" style={{ padding: 24 }}>
              <div style={{ marginBottom: 16 }}>
                <h3 className="serif" style={{ fontSize: "1.4rem" }}>
                  Profil efek samping
                </h3>
                <span className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>
                  per obat · top {effectAggregation.length}
                </span>
              </div>
              {effectAggregation.length === 0 ? (
                <p style={{ fontSize: 13, color: "var(--ink-3)" }}>
                  Belum ada efek samping yang terdaftar pada obat-obat ini.
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {effectAggregation.map(([effect]) => (
                    <div
                      key={effect}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "minmax(160px, 220px) 1fr",
                        gap: 14,
                        alignItems: "center",
                      }}
                    >
                      <span style={{ fontSize: 13, color: "var(--ink-2)", fontWeight: 500 }}>
                        {effect}
                      </span>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        {selectedDrugs.map((d, di) => {
                          const has = (d.efek_samping || []).some(
                            (e) => e.toLowerCase() === effect.toLowerCase(),
                          );
                          const allEffects = d.efek_samping?.length || 1;
                          const intensity = has ? 100 / Math.max(1, Math.log2(allEffects + 1)) * 0.9 + 10 : 0;
                          return (
                            <div
                              key={d.nama_obat}
                              style={{
                                display: "grid",
                                gridTemplateColumns: "120px 1fr 30px",
                                gap: 10,
                                alignItems: "center",
                              }}
                            >
                              <span
                                className="mono"
                                style={{ fontSize: 10, color: "var(--ink-3)" }}
                              >
                                {d.nama_obat}
                              </span>
                              <div
                                style={{
                                  height: 8,
                                  borderRadius: 999,
                                  background: "var(--bg-2)",
                                  overflow: "hidden",
                                }}
                              >
                                <div
                                  style={{
                                    height: "100%",
                                    width: `${intensity}%`,
                                    background: drugColors[di],
                                    transition: "width 800ms cubic-bezier(0.22,1,0.36,1)",
                                  }}
                                />
                              </div>
                              <span
                                className="mono"
                                style={{
                                  fontSize: 10,
                                  color: has ? "var(--ink-2)" : "var(--ink-4)",
                                  textAlign: "right",
                                }}
                              >
                                {has ? "ya" : "-"}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div
                style={{
                  display: "flex",
                  gap: 16,
                  marginTop: 18,
                  flexWrap: "wrap",
                  paddingTop: 14,
                  borderTop: "1px solid var(--line-2)",
                }}
              >
                {selectedDrugs.map((d, i) => (
                  <span
                    key={d.nama_obat}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      fontSize: 12,
                      color: "var(--ink-2)",
                    }}
                  >
                    <span
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: 3,
                        background: drugColors[i],
                      }}
                    />
                    {d.nama_obat} · {(d.efek_samping || []).length} efek
                  </span>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 18, flexWrap: "wrap" }}>
              <Link
                href={`/safety-checker?drug=${selected.map(encodeURIComponent).join(",")}`}
                className="btn btn-primary"
                style={{ textDecoration: "none" }}
              >
                <NavIcon name="shield" /> Cek interaksi obat ini
              </Link>
              <button
                className="btn"
                onClick={() => setSelected([])}
                disabled={selected.length === 0}
              >
                Reset pilihan
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
