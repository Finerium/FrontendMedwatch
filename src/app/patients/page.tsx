/**
 * Patient roster with sticky SOAP detail panel. Marked `"use client"`
 * because the search box, selected-row state, and the slide-in detail
 * panel all live in component state.
 *
 * The list is search-first and capped, mirroring the drug directory: the
 * backend returns slim summaries ordered newest-created first (by
 * created_at, then id) and paginated with limit/offset. This page never
 * re-sorts by visit date on the client, so the newest patient always
 * stays at the top. Typing in the search box debounces a backend `q`
 * query, and a "Muat lebih banyak" button appends the next page via
 * offset until the unpaged X-Total-Count is reached. Picking a row
 * fetches the full SOAP record for the detail panel, since the summary
 * payload intentionally omits the SOAP blocks.
 */
"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { apiUrl, authHeaders } from "@/lib/api-base";
import type { Patient, PatientObjective, PatientSummary } from "@/lib/patient-format";
import { NavIcon } from "@/components/shell/NavIcon";

/** Display cap matching the backend default page size. */
const PAGE_SIZE = 50;
/** Search debounce window, matching the drug directory feel. */
const DEBOUNCE_MS = 280;

/**
 * Infer gender code (L/P) from Indonesian honorifics so we can render an
 * appropriate label in the detail panel.
 *
 * @param nama - Raw patient name.
 * @returns "L", "P", or empty string when unknown.
 */
function inferGender(nama: string): "L" | "P" | "" {
  const n = (nama || "").trim().toLowerCase();
  if (n.startsWith("ny.") || n.startsWith("nona") || n.startsWith("ny ")) return "P";
  if (n.startsWith("tn.") || n.startsWith("tn ")) return "L";
  if (n.startsWith("an.") || n.startsWith("an ")) return "";
  return "";
}

/**
 * Flatten the SOAP Objective block into a `[label, value]` list that the
 * presentation layer can iterate over.
 *
 * @param o - Objective block from a patient record.
 * @returns Label/value pairs in display order.
 */
function objectiveFields(o: PatientObjective | undefined): [string, string][] {
  if (!o) return [];
  const out: [string, string][] = [];
  if (o.tekanan_darah) out.push(["td.", o.tekanan_darah]);
  if (o.bb_kg) out.push(["BB", o.bb_kg + " kg"]);
  if (o.tb_cm) out.push(["tb", o.tb_cm + " cm"]);
  if (o.lila_cm) out.push(["lila", o.lila_cm + " cm"]);
  if (o.nadi) out.push(["nadi", o.nadi + " x/m"]);
  if (o.suhu_c) out.push(["suhu", o.suhu_c + "°C"]);
  if (o.respirasi) out.push(["resp.", o.respirasi + " x/m"]);
  return out;
}

/**
 * Render one section of the SOAP detail panel (Subjective, Objective,
 * Assessment, Plan).
 *
 * @param props.letter - SOAP letter badge (S/O/A/P).
 * @param props.title - Section heading.
 * @param props.content - Free-text body for the section.
 * @param props.fields - Extra key/value chips rendered under the body.
 */
function SoapBlock({
  letter,
  title,
  content,
  fields,
}: {
  letter: string;
  title: string;
  content: string;
  fields: [string, string][];
}) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "36px 1fr", gap: 14, alignItems: "flex-start" }}>
      <span
        className="serif"
        style={{
          fontSize: 28,
          fontWeight: 400,
          color: "var(--teal-deep)",
          background: "var(--teal-soft)",
          width: 36,
          height: 36,
          borderRadius: 10,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {letter}
      </span>
      <div>
        <span
          className="mono"
          style={{
            fontSize: 10,
            letterSpacing: "0.1em",
            color: "var(--ink-3)",
            textTransform: "uppercase",
          }}
        >
          {title}
        </span>
        {content && (
          <p
            style={{
              marginTop: 6,
              fontSize: 14,
              lineHeight: 1.6,
              color: "var(--ink-2)",
              whiteSpace: "pre-line",
            }}
          >
            {content}
          </p>
        )}
        {fields.length > 0 && (
          <div
            style={{
              marginTop: 6,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
              gap: 8,
            }}
          >
            {fields.map(([k, v]) => (
              <div key={k} style={{ padding: "8px 10px", background: "var(--bg-2)", borderRadius: 8 }}>
                <div className="mono" style={{ fontSize: 10, color: "var(--ink-3)" }}>
                  {k}
                </div>
                <div style={{ fontSize: 14, fontWeight: 500, marginTop: 2 }}>{v}</div>
              </div>
            ))}
          </div>
        )}
        {!content && fields.length === 0 && (
          <p style={{ marginTop: 6, fontSize: 13, color: "var(--ink-4)", fontStyle: "italic" }}>
            - kosong -
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Render the patient roster plus the slide-in SOAP detail panel. The
 * backend returns capped, newest-created-first summaries; this component
 * adds debounced backend search, a load-more pager, and selection state.
 */
export default function PatientsPage() {
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selected, setSelected] = useState<Patient | null>(null);
  const [query, setQuery] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  /**
   * Fetch one capped page of patient summaries. When `offset` is 0 the
   * page replaces the list; otherwise it appends (load-more). Reads the
   * X-Total-Count header so the pager knows when to stop. Aborts any
   * in-flight request so keystrokes never pile up. The backend already
   * orders results newest-created first, so the response is rendered in
   * the order received without any client-side re-sort.
   */
  const fetchPage = useCallback(async (q: string, offset: number) => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    if (offset === 0) setLoaded(false);
    else setLoadingMore(true);
    setLoadError(null);
    const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(offset) });
    if (q) params.set("q", q);
    try {
      const r = await fetch(apiUrl(`/api/patients?${params.toString()}`), {
        headers: authHeaders(),
        signal: ctrl.signal,
      });
      if (!r.ok) throw new ApiError(r.status, null, `HTTP ${r.status}`);
      const data = ((await r.json()) as PatientSummary[]) || [];
      const totalHeader = r.headers.get("X-Total-Count");
      const parsedTotal = totalHeader != null ? Number(totalHeader) : NaN;
      setTotal(Number.isFinite(parsedTotal) ? parsedTotal : null);
      setPatients((prev) => (offset === 0 ? data : [...prev, ...data]));
    } catch (e) {
      if ((e as { name?: string })?.name === "AbortError") return; // superseded
      if (offset === 0) setPatients([]);
      setLoadError(e instanceof Error ? e.message : "Gagal memuat pasien");
    } finally {
      setLoaded(true);
      setLoadingMore(false);
    }
  }, []);

  // Initial page on mount (and on remount when navigating back to the list,
  // so a freshly created patient appears at the top).
  useEffect(() => {
    fetchPage("", 0);
    return () => abortRef.current?.abort();
  }, [fetchPage]);

  // Debounced backend search: refetch the first page whenever the term changes.
  const trimmed = query.trim();
  useEffect(() => {
    const t = setTimeout(() => fetchPage(trimmed, 0), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [trimmed, fetchPage]);

  // Fetch the full SOAP record for the detail panel; the summary omits it.
  const selectPatient = useCallback(async (id: string) => {
    try {
      const full = await api.get<Patient>(`/api/patients/${encodeURIComponent(id)}`);
      setSelected(full);
    } catch {
      // Leave the panel as-is on failure rather than blanking the screen.
    }
  }, []);

  const hasMore = total != null && patients.length < total;

  return (
    <div
      className="page-in"
      style={{ padding: "120px 24px 80px", position: "relative", maxWidth: 1440, margin: "0 auto" }}
    >
      <div
        style={{
          position: "absolute",
          top: 100,
          right: -90,
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
          top: 200,
          right: 80,
          width: 90,
          height: 90,
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
          Rekam medis SOAP · {total != null ? total : loaded ? patients.length : "..."} pasien aktif
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
          Daftar <em style={{ fontStyle: "italic" }}>pasien</em>.
        </h1>

        <div
          className="glass"
          style={{
            padding: 14,
            marginBottom: 18,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari berdasar nama atau ID (P001…)"
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              background: "transparent",
              fontSize: 15,
              color: "var(--ink)",
              fontFamily: "inherit",
            }}
          />
          <Link
            href="/patients/new"
            className="btn btn-primary"
            style={{ padding: "8px 14px", fontSize: 13, textDecoration: "none" }}
          >
            + Pasien Baru
          </Link>
        </div>

        <div
          className="pat-grid"
          style={{
            display: "grid",
            gridTemplateColumns: selected ? "1fr 1.4fr" : "1fr",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 8, minHeight: 360 }}>
            {loadError && (
              <div className="glass" style={{ padding: 18, fontSize: 13, color: "var(--crit-deep)" }}>
                {loadError}
              </div>
            )}
            {!loaded && !loadError && (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="skel" style={{ height: 64, borderRadius: 14 }} aria-hidden />
              ))
            )}
            {loaded && !loadError && patients.length === 0 && (
              <div className="glass" style={{ padding: 18, fontSize: 13, color: "var(--ink-3)" }}>
                {trimmed
                  ? `Tidak ada pasien yang cocok dengan "${trimmed}".`
                  : "Belum ada pasien terdaftar."}
              </div>
            )}
            {loaded && patients.map((p) => {
              const isSel = selected?.id === p.id;
              const gender = inferGender(p.nama);
              const condition = p.kategori || "";
              return (
                <div
                  key={p.id}
                  onClick={() => selectPatient(p.id)}
                  className="lift"
                  style={{
                    padding: 14,
                    borderRadius: 14,
                    background: isSel ? "var(--ink)" : "var(--bg-2)",
                    color: isSel ? "var(--bg)" : "var(--ink)",
                    border: "1px solid " + (isSel ? "var(--ink)" : "var(--line)"),
                    cursor: "pointer",
                    display: "grid",
                    gridTemplateColumns: "52px 1fr auto",
                    gap: 12,
                    alignItems: "center",
                    transition: "all 320ms cubic-bezier(0.22,1,0.36,1)",
                  }}
                >
                  <span
                    className="mono"
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      background: isSel ? "var(--teal)" : "var(--teal-soft)",
                      color: isSel ? "var(--ink)" : "var(--teal-deep)",
                      padding: "6px 8px",
                      borderRadius: 8,
                      textAlign: "center",
                    }}
                  >
                    {p.id}
                  </span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{p.nama}</div>
                    <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>
                      {gender && `${gender} · `}
                      {p.umur ? `${p.umur} thn` : ""}
                      {condition ? ` · ${condition}` : ""}
                    </div>
                  </div>
                  <span className="mono" style={{ fontSize: 10, opacity: 0.6 }}>
                    {p.tanggal_kunjungan || "-"}
                  </span>
                </div>
              );
            })}
            {loaded && !loadError && hasMore && (
              <button
                type="button"
                className="btn"
                onClick={() => fetchPage(trimmed, patients.length)}
                disabled={loadingMore}
                style={{ justifyContent: "center", marginTop: 4 }}
              >
                {loadingMore ? "Memuat…" : `Muat lebih banyak (${patients.length}/${total})`}
              </button>
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
                  <span className="chip chip-teal">{selected.id}</span>
                  <h2 className="serif" style={{ fontSize: "2.2rem", fontWeight: 400, marginTop: 12 }}>
                    {selected.nama}
                  </h2>
                  <div style={{ color: "var(--ink-3)", marginTop: 4 }}>
                    {(() => {
                      const g = inferGender(selected.nama);
                      const genderLabel = g === "P" ? "Perempuan" : g === "L" ? "Laki-laki" : "-";
                      return (
                        <>
                          {genderLabel} · {selected.umur || "-"} tahun
                        </>
                      );
                    })()}
                  </div>
                  {selected.alamat && (
                    <div style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 6 }}>
                      {selected.alamat}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="btn btn-ghost"
                  style={{ padding: 8 }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d="m6 6 12 12M18 6 6 18" />
                  </svg>
                </button>
              </div>

              <h3
                className="mono"
                style={{
                  fontSize: 11,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--ink-3)",
                  marginBottom: 14,
                }}
              >
                SOAP · kunjungan {selected.tanggal_kunjungan || "-"}
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <SoapBlock
                  letter="S"
                  title="Subjective"
                  content={selected.S?.keluhan || ""}
                  fields={selected.S?.riwayat ? [["riwayat", selected.S.riwayat]] : []}
                />
                <SoapBlock
                  letter="O"
                  title="Objective"
                  content={selected.O?.catatan || ""}
                  fields={objectiveFields(selected.O)}
                />
                <SoapBlock
                  letter="A"
                  title="Assessment"
                  content={selected.A?.diagnosa || ""}
                  fields={[]}
                />
                <SoapBlock
                  letter="P"
                  title="Plan"
                  content={selected.P?.tindakan || ""}
                  fields={
                    [
                      selected.P?.resep ? ["resep", selected.P.resep] : null,
                      selected.P?.jadwal_kontrol ? ["kontrol", selected.P.jadwal_kontrol] : null,
                    ].filter(Boolean) as [string, string][]
                  }
                />
              </div>

              <div style={{ display: "flex", gap: 8, marginTop: 22, flexWrap: "wrap" }}>
                <Link
                  href="/safety-checker"
                  className="btn btn-primary"
                  style={{ textDecoration: "none" }}
                >
                  <NavIcon name="shield" /> Cek interaksi obat
                </Link>
                <Link
                  href={`/patients/edit/?id=${encodeURIComponent(selected.id)}`}
                  className="btn"
                  style={{ textDecoration: "none" }}
                >
                  Edit SOAP
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 1080px) { .pat-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
}
