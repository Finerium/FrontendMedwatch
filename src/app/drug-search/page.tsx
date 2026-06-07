/**
 * Searchable drug directory. Search-first: the catalog has 20,828 rows, so
 * the page never loads them all. On entry it shows a small default page; as
 * the user types it queries the backend FTS5 index (debounced, aborting the
 * previous request) and renders only the handful of matches. Selecting a drug
 * fetches its full profile for the detail panel.
 */
"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { apiUrl, authHeaders } from "@/lib/api-base";
import { backendToDisplayDrug, type BackendDrug, type DisplayDrug } from "@/lib/drug-format";
import { NavIcon } from "@/components/shell/NavIcon";

const PAGE_SIZE = 15;
const DEBOUNCE_MS = 280;

export default function DrugSearchPage() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "otc" | "rx">("all");
  const [selected, setSelected] = useState<DisplayDrug | null>(null);
  const [results, setResults] = useState<DisplayDrug[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Total catalog size for the header, fetched once without pulling rows.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const c = await api.get<{ total: number }>("/api/drugs/count");
        if (!cancelled) setTotal(c?.total ?? null);
      } catch {
        if (!cancelled) setTotal(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Run a bounded query: the default page when q is empty, FTS5 search otherwise.
  // Aborts any in-flight request so keystrokes never pile up.
  const runQuery = useCallback(async (q: string) => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    setLoadError(null);
    const path = q
      ? `/api/drugs/search?q=${encodeURIComponent(q)}&limit=${PAGE_SIZE}`
      : `/api/drugs?limit=${PAGE_SIZE}`;
    try {
      const r = await fetch(apiUrl(path), { headers: authHeaders(), signal: ctrl.signal });
      if (!r.ok) throw new ApiError(r.status, null, `HTTP ${r.status}`);
      const data = (await r.json()) as BackendDrug[];
      // Drop this response if a newer query has since started, so a slower
      // default/earlier request can never overwrite the latest query result.
      if (ctrl !== abortRef.current) return;
      const display = (data || [])
        .filter((d): d is BackendDrug => !!d && typeof d === "object")
        .map((d, i) => backendToDisplayDrug(d, i));
      setResults(display);
      setLoading(false);
    } catch (e) {
      if ((e as { name?: string })?.name === "AbortError") return; // superseded
      setResults([]);
      setLoadError(e instanceof ApiError && e.status === 503 ? "Katalog obat tidak ter-load." : "Gagal memuat data obat");
      setLoading(false);
    }
  }, []);

  // One effect drives both the initial default page and the debounced search,
  // so a second request never races the first. An empty query loads the
  // default page immediately; typing is debounced. Changing the query aborts
  // any in-flight request before starting the next.
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      runQuery("");
      return () => abortRef.current?.abort();
    }
    const t = setTimeout(() => runQuery(q), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [query, runQuery]);

  // Fetch the full profile for the detail panel when a drug is picked.
  const selectDrug = useCallback(async (d: DisplayDrug) => {
    setSelected(d);
    try {
      const full = await api.get<BackendDrug>(`/api/drugs/${encodeURIComponent(d.lookupName)}`);
      if (full) setSelected(backendToDisplayDrug(full));
    } catch {
      // Keep the light record already shown.
    }
  }, []);

  const visible = filter === "all" ? results : results.filter((d) => (filter === "otc" ? d.otc : !d.otc));

  return (
    <div
      className="page-in"
      style={{ padding: "120px 24px 80px", position: "relative", maxWidth: 1440, margin: "0 auto" }}
    >
      <div
        style={{
          position: "absolute",
          top: 90,
          right: -120,
          width: 380,
          height: 180,
          borderRadius: 999,
          background: "var(--teal)",
          opacity: 0.85,
          zIndex: 0,
          transform: "rotate(-12deg)",
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
          Direktori obat · {total != null ? total.toLocaleString("id-ID") : "..."} entri
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
          Cari <em style={{ fontStyle: "italic" }}>obat</em>.
        </h1>

        <div
          className="glass"
          style={{
            padding: 18,
            marginBottom: 18,
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ketik nama obat, kelas, atau zat aktif…"
            style={{
              flex: 1,
              minWidth: 220,
              border: "none",
              outline: "none",
              background: "transparent",
              fontSize: 18,
              color: "var(--ink)",
              fontFamily: '"Inter Tight", sans-serif',
            }}
          />
          <span className="kbd">/</span>
          <span style={{ width: 1, height: 22, background: "var(--line)" }} />
          <div style={{ display: "flex", gap: 4 }}>
            {(
              [
                ["all", "Semua"],
                ["otc", "OTC"],
                ["rx", "Resep"],
              ] as const
            ).map(([k, l]) => (
              <button
                key={k}
                onClick={() => setFilter(k)}
                style={{
                  padding: "8px 12px",
                  borderRadius: 999,
                  background: filter === k ? "var(--ink)" : "transparent",
                  color: filter === k ? "var(--bg)" : "var(--ink-2)",
                  border: "1px solid " + (filter === k ? "var(--ink)" : "var(--line)"),
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 240ms",
                }}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div
          className="ds-grid"
          style={{ display: "grid", gap: 16, gridTemplateColumns: selected ? "1fr 1.1fr" : "1fr" }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 10, minHeight: 480 }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "0 4px" }}>
              <span
                className="mono"
                style={{ fontSize: 11, color: "var(--ink-3)", letterSpacing: "0.08em" }}
              >
                {loading ? "MEMUAT…" : `${visible.length} HASIL`}
              </span>
              <span
                className="mono"
                style={{ fontSize: 11, color: "var(--ink-3)", letterSpacing: "0.08em" }}
              >
                {query ? "PERINGKAT RELEVANSI" : "A→Z"}
              </span>
            </div>
            {loading
              ? Array.from({ length: PAGE_SIZE }).map((_, i) => (
                  <div
                    key={i}
                    className="skel"
                    style={{ height: 86, borderRadius: 18 }}
                    aria-hidden
                  />
                ))
              : visible.map((d) => {
                  const isSel = selected?.key === d.key;
                  return (
                    <div
                      key={d.key}
                      onClick={() => selectDrug(d)}
                      className="lift"
                      style={{
                        padding: 18,
                        borderRadius: 18,
                        background: isSel ? "var(--ink)" : "var(--bg-2)",
                        color: isSel ? "var(--bg)" : "var(--ink)",
                        border: "1px solid " + (isSel ? "var(--ink)" : "var(--line)"),
                        cursor: "pointer",
                        display: "grid",
                        gridTemplateColumns: "44px 1fr auto",
                        gap: 14,
                        alignItems: "center",
                        transition: "all 320ms cubic-bezier(0.22,1,0.36,1)",
                      }}
                    >
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 12,
                          background: isSel ? "var(--teal)" : "var(--bg)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={isSel ? "var(--ink)" : "var(--ink-2)"} strokeWidth="1.4">
                          <rect x="3" y="9" width="18" height="6" rx="3" />
                          <path d="M12 9v6" />
                        </svg>
                      </div>
                      <div>
                        <div style={{ display: "flex", gap: 10, alignItems: "baseline", flexWrap: "wrap" }}>
                          <span className="serif" style={{ fontSize: 22, fontWeight: 400 }}>
                            {d.name}
                          </span>
                          <span className="mono" style={{ fontSize: 11, opacity: 0.7 }}>
                            {d.generic}
                          </span>
                        </div>
                        <div style={{ fontSize: 13, opacity: 0.75, marginTop: 4 }}>{d.class}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <span className={"chip " + (d.otc ? "chip-teal" : "")}>{d.otc ? "OTC" : "Rx"}</span>
                      </div>
                    </div>
                  );
                })}
            {!loading && visible.length === 0 && (
              <div className="glass" style={{ padding: 40, textAlign: "center" }}>
                <p style={{ color: "var(--ink-3)" }}>
                  {loadError
                    ? loadError
                    : query
                      ? `Tidak ada obat yang cocok dengan "${query}".`
                      : "Direktori obat kosong."}
                </p>
              </div>
            )}
          </div>

          {selected && (
            <div
              className="glass"
              style={{ padding: 28, position: "sticky", top: 100, alignSelf: "flex-start" }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 18,
                }}
              >
                <div>
                  <span className={"chip " + (selected.otc ? "chip-teal" : "")}>
                    {selected.otc ? "OTC" : "Wajib Resep"}
                  </span>
                  <h2
                    className="serif"
                    style={{ fontSize: "2.4rem", fontWeight: 300, marginTop: 14 }}
                  >
                    {selected.name}
                  </h2>
                  <div style={{ color: "var(--ink-3)", marginTop: 4 }}>
                    {selected.generic} · {selected.class}
                  </div>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="btn btn-ghost"
                  style={{ padding: 8 }}
                  aria-label="Tutup"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d="m6 6 12 12M18 6 6 18" />
                  </svg>
                </button>
              </div>

              <p style={{ color: "var(--ink-2)", marginBottom: 22, fontSize: 15, lineHeight: 1.6 }}>
                {selected.summary || "Detail klinis belum tersedia."}
              </p>

              {selected.ingredients.length > 0 && (
                <>
                  <h3
                    className="mono"
                    style={{
                      fontSize: 11,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: "var(--ink-3)",
                      marginBottom: 10,
                    }}
                  >
                    Bahan aktif
                  </h3>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
                    {selected.ingredients.map((ing, i) => (
                      <span key={i} className="chip chip-teal">
                        {ing}
                      </span>
                    ))}
                  </div>
                </>
              )}

              <div
                className="mono"
                style={{
                  fontSize: 11,
                  color: "var(--ink-3)",
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 14,
                  alignItems: "center",
                  marginBottom: 22,
                }}
              >
                {selected.rxcui && (
                  <span>
                    RXCUI{" "}
                    <a
                      href={`https://mor.nlm.nih.gov/RxNav/search?searchBy=RXCUI&searchTerm=${selected.rxcui}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: "var(--ink-2)" }}
                    >
                      {selected.rxcui}
                    </a>
                  </span>
                )}
                {selected.splSetId && (
                  <a
                    href={`https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=${selected.splSetId}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: "var(--ink-2)" }}
                  >
                    Label DailyMed (SPL)
                  </a>
                )}
                <span>Sumber: {selected.sources.join(" + ")}</span>
              </div>

              {selected.forms.length > 0 && (
                <>
                  <h3
                    className="mono"
                    style={{
                      fontSize: 11,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: "var(--ink-3)",
                      marginBottom: 10,
                    }}
                  >
                    Sediaan
                  </h3>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 22 }}>
                    {selected.forms.map((f, i) => (
                      <span key={i} className="chip">
                        {f}
                      </span>
                    ))}
                  </div>
                </>
              )}

              {selected.warnings.length > 0 && (
                <>
                  <h3
                    className="mono"
                    style={{
                      fontSize: 11,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: "var(--ink-3)",
                      marginBottom: 10,
                    }}
                  >
                    Peringatan
                  </h3>
                  <ul
                    style={{
                      paddingLeft: 0,
                      listStyle: "none",
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                      marginBottom: 22,
                    }}
                  >
                    {selected.warnings.map((w, i) => (
                      <li
                        key={i}
                        style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 14 }}
                      >
                        <span
                          style={{
                            width: 4,
                            height: 4,
                            borderRadius: "50%",
                            background: "var(--warn)",
                            marginTop: 8,
                            flexShrink: 0,
                          }}
                        />
                        {w}
                      </li>
                    ))}
                  </ul>
                </>
              )}

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Link
                  href={`/safety-checker?drug=${encodeURIComponent(selected.lookupName)}`}
                  className="btn btn-primary"
                  style={{ textDecoration: "none" }}
                >
                  <NavIcon name="shield" />
                  Cek interaksi obat ini
                </Link>
                <Link
                  href={`/drug-comparison?initial=${encodeURIComponent(selected.lookupName)}`}
                  className="btn"
                  style={{ textDecoration: "none" }}
                >
                  Bandingkan
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 1080px) {
          .ds-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
