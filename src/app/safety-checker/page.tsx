/**
 * Drug-safety screening page. Marked `"use client"` because the patient
 * picker, drug chip input, and verdict panel rely on local state and on
 * the live backend interaction engine at /api/safety/check. Bidan and
 * masyarakat roles see slightly different copy; B05 active-meds
 * awareness is implemented by the effect that watches `patient`.
 *
 * Static-export note: `useSearchParams` is already wrapped in a
 * Suspense boundary below, so no `dynamic = "force-dynamic"` flag is
 * needed. The `?drug=` deep link still works because parameters are
 * read on the client at runtime.
 */
"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { apiUrl, authHeaders } from "@/lib/api-base";
import { useAuthStore } from "@/lib/auth-store";
import { backendToDisplayDrug, type BackendDrug, type DisplayDrug } from "@/lib/drug-format";
import { parseResepToMeds, type Patient } from "@/lib/patient-format";
import { NavIcon } from "@/components/shell/NavIcon";

/** Small default page size and debounce window for the search-first picker. */
const PAGE_SIZE = 15;
const DEBOUNCE_MS = 280;

/** Severity words shown to the user. */
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
  pasien_active_meds?: string[];
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

/**
 * Coerce the backend's `tingkat_keparahan` string into one of the four
 * fixed severity tokens used by the UI. Defaults to "ringan" so an
 * unknown value still renders as a visible chip rather than disappearing.
 *
 * @param raw - Raw severity string from the backend payload.
 * @returns Normalised severity token.
 */
function normalizeSeverity(raw: string): SeverityWord {
  const v = (raw || "").toLowerCase();
  if (v.startsWith("seri")) return "serius";
  if (v.startsWith("sed")) return "sedang";
  if (v.startsWith("rin")) return "ringan";
  return "ringan";
}

/**
 * Map the backend's overall severity level to a UI severity word,
 * accounting for the case where no interactions were returned.
 *
 * @param level - Severity level returned by /api/safety/check.
 * @param hasResults - Whether the verdict actually carries entries.
 * @returns Severity word used to drive the verdict card style.
 */
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
    sub: "Interaksi minor; pantau sendiri",
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

/**
 * Page-level Suspense wrapper required by `useSearchParams` under the
 * App Router. All interactive logic lives in `SafetyCheckerInner`.
 */
export default function SafetyCheckerPage() {
  return (
    <Suspense fallback={null}>
      <SafetyCheckerInner />
    </Suspense>
  );
}

/**
 * Interactive body of the safety checker. The drug picker is search-first:
 * the backend catalog has more than 20,000 rows, so the page never loads
 * them all. On entry it shows a small default page and, as the user types,
 * it queries the backend FTS5 index (debounced, aborting superseded
 * requests). Selected drugs are tracked by their raw `lookupName` so the
 * interaction engine can match them; their clean `name` is used only for
 * display. The effect that watches `patient` still surfaces B05 active
 * meds, and the `?drug=` deep link still prefills the list.
 */
function SafetyCheckerInner() {
  const params = useSearchParams();
  const initialDrugParam = params.get("drug") || "";

  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const isMasyarakat = user?.role === "masyarakat";

  // Search-first drug picker state. `suggestions` holds the current bounded
  // result set (default page when the query is empty, FTS5 matches otherwise).
  // `pickeLoaded` flips true once the first default page resolves so the chip
  // area can swap its placeholder copy. `nameMap` accumulates clean display
  // names keyed by lowercased lookupName, so chips and result cards keep a
  // readable label even after the suggestion list changes underneath them.
  const [suggestions, setSuggestions] = useState<DisplayDrug[]>([]);
  const [pickerLoaded, setPickerLoaded] = useState(false);
  const [nameMap, setNameMap] = useState<Record<string, string>>({});
  const pickerAbortRef = useRef<AbortController | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientsLoaded, setPatientsLoaded] = useState(false);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [activeMeds, setActiveMeds] = useState<string[]>([]);
  // `drugs` holds raw lookupName values; those are exactly what the backend
  // interaction engine matches on and what /api/safety/check expects.
  const [drugs, setDrugs] = useState<string[]>([]);
  const [prefillApplied, setPrefillApplied] = useState(false);
  const [drugQuery, setDrugQuery] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [result, setResult] = useState<BackendSafetyResult | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    if (!hydrated) fetchMe();
  }, [hydrated, fetchMe]);

  // Record clean display names keyed by lowercased lookupName so chips and
  // result cards stay readable regardless of which suggestion set is loaded.
  const rememberNames = useCallback((items: DisplayDrug[]) => {
    if (items.length === 0) return;
    setNameMap((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const d of items) {
        const key = d.lookupName.toLowerCase();
        if (next[key] !== d.name) {
          next[key] = d.name;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, []);

  // Run one bounded picker query: the small default page when the term is
  // empty, the FTS5 search otherwise. Aborts any in-flight request so rapid
  // keystrokes never pile up. Uses apiUrl()/authHeaders() only, so it works
  // both on the Vercel proxy and the Electron loopback backend (offline).
  const runPickerQuery = useCallback(
    async (term: string) => {
      pickerAbortRef.current?.abort();
      const ctrl = new AbortController();
      pickerAbortRef.current = ctrl;
      const path = term
        ? `/api/drugs/search?q=${encodeURIComponent(term)}&limit=${PAGE_SIZE}`
        : `/api/drugs?limit=${PAGE_SIZE}`;
      try {
        const r = await fetch(apiUrl(path), { headers: authHeaders(), signal: ctrl.signal });
        if (!r.ok) throw new ApiError(r.status, null, `HTTP ${r.status}`);
        const data = (await r.json()) as BackendDrug[];
        // Drop a superseded response so a slower earlier request never
        // overwrites the latest query's suggestions.
        if (ctrl !== pickerAbortRef.current) return;
        const display = (data || [])
          .filter((d): d is BackendDrug => !!d && typeof d === "object")
          .map((d, i) => backendToDisplayDrug(d, i));
        setSuggestions(display);
        rememberNames(display);
        setPickerLoaded(true);
      } catch (e) {
        if ((e as { name?: string })?.name === "AbortError") return; // superseded
        setSuggestions([]);
        setPickerLoaded(true);
      }
    },
    [rememberNames],
  );

  // One effect for both the initial default page and the debounced search,
  // so a second request never races the first. Empty loads immediately;
  // typing is debounced. Changing the query aborts any in-flight request.
  useEffect(() => {
    const q = drugQuery.trim();
    if (!q) {
      runPickerQuery("");
      return () => pickerAbortRef.current?.abort();
    }
    const t = setTimeout(() => runPickerQuery(q), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [drugQuery, runPickerQuery]);

  useEffect(() => {
    if (!hydrated) return;
    if (isMasyarakat) {
      setPatients([]);
      setPatientsLoaded(true);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const data = await api.get<Patient[]>("/api/patients");
        if (!cancelled) setPatients(data || []);
      } catch {
        if (!cancelled) setPatients([]);
      } finally {
        if (!cancelled) setPatientsLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hydrated, isMasyarakat]);

  // Resolve a lookupName to its clean display label, falling back to the raw
  // name when it has not been seen yet (offline-safe, no extra request).
  const displayName = useCallback(
    (lookupName: string) => nameMap[lookupName.toLowerCase()] || lookupName,
    [nameMap],
  );

  // Prefill from the `?drug=` deep link. Tokens are catalog names (lookupName,
  // as emitted by the drug-search page), so each is stored directly into the
  // drug list. We also fetch each profile by lookupName to learn its clean
  // display name for the chip; failure leaves the raw name visible.
  useEffect(() => {
    if (prefillApplied) return;
    if (!initialDrugParam) {
      setPrefillApplied(true);
      return;
    }
    const lookupNames = initialDrugParam
      .split(",")
      .map((s) => decodeURIComponent(s.trim()))
      .filter(Boolean);
    if (lookupNames.length > 0 && drugs.length === 0) {
      setDrugs(lookupNames);
      let cancelled = false;
      (async () => {
        const resolved = await Promise.all(
          lookupNames.map(async (ln) => {
            try {
              const full = await api.get<BackendDrug>(`/api/drugs/${encodeURIComponent(ln)}`);
              return full ? backendToDisplayDrug(full) : null;
            } catch {
              return null;
            }
          }),
        );
        if (cancelled) return;
        rememberNames(resolved.filter((d): d is DisplayDrug => d != null));
      })();
      setPrefillApplied(true);
      return () => {
        cancelled = true;
      };
    }
    setPrefillApplied(true);
  }, [initialDrugParam, drugs.length, prefillApplied, rememberNames]);

  // B05: when a patient is picked, fetch the full SOAP record to read
  // `P.resep`, parse it into a list of active medications, surface them in
  // the UI, and auto-populate the drug input list so the bidan can see
  // what is being cross-referenced.
  useEffect(() => {
    if (!patient) {
      setActiveMeds([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const full = await api.get<Patient>(`/api/patients/${patient.id}`);
        if (cancelled) return;
        const meds = parseResepToMeds(full?.P?.resep);
        setActiveMeds(meds);
        if (meds.length > 0) {
          setDrugs((prev) => {
            const seen = new Set(prev.map((d) => d.toLowerCase()));
            const merged = [...prev];
            for (const m of meds) {
              if (!seen.has(m.toLowerCase())) {
                merged.push(m);
                seen.add(m.toLowerCase());
              }
            }
            return merged;
          });
          setScanned(false);
          setResult(null);
        }
      } catch {
        if (!cancelled) setActiveMeds([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [patient]);

  // Suggestions come straight from the backend (default page or FTS5 search);
  // we only drop drugs already in the list and cap the dropdown height. Matching
  // by lookupName keeps the dedupe aligned with what is stored in `drugs`.
  const drugSuggestions = useMemo(() => {
    if (!drugQuery) return [];
    const chosen = new Set(drugs.map((d) => d.toLowerCase()));
    return suggestions.filter((d) => !chosen.has(d.lookupName.toLowerCase())).slice(0, 6);
  }, [drugQuery, drugs, suggestions]);

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

  const canScan = isMasyarakat ? drugs.length >= 1 : Boolean(patient) && drugs.length >= 1;

  const runScan = async () => {
    if (!canScan) return;
    setScanning(true);
    setScanError(null);
    setScanned(false);
    try {
      // `drugs` already holds lookupName values, which is what the backend
      // interaction engine matches on.
      const payload: { drugs: string[]; pasien_id?: string } = { drugs };
      if (patient) payload.pasien_id = patient.id;
      const data = await api.post<BackendSafetyResult>("/api/safety/check", payload);
      setResult(data);
      setScanned(true);
    } catch (e) {
      setScanError(e instanceof ApiError ? e.message : "Gagal memindai keamanan");
    } finally {
      setScanning(false);
    }
  };

  // Add a picked suggestion: store its raw lookupName (sent to the backend),
  // remember its clean display name, and avoid duplicates.
  const addDrug = (d: DisplayDrug) => {
    const ln = d.lookupName;
    if (drugs.some((x) => x.toLowerCase() === ln.toLowerCase())) {
      setDrugQuery("");
      return;
    }
    rememberNames([d]);
    setDrugs([...drugs, ln]);
    setDrugQuery("");
    setScanned(false);
    setResult(null);
  };

  const removeDrug = (lookupName: string) => {
    setDrugs(drugs.filter((d) => d !== lookupName));
    setScanned(false);
    setResult(null);
  };

  const subtitleCopy = isMasyarakat
    ? "Self-check engine · cocokkan obat dengan riwayat alergi pribadi"
    : "Severity engine · cross-reference 1.4M interaksi";
  const headingItalic = isMasyarakat ? "obat-obat" : "keamanan";
  const headingPrefix = isMasyarakat ? "Cek " : "Cek ";
  const headingSuffix = isMasyarakat ? " saya." : " kombinasi.";

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
          {subtitleCopy}
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
          {headingPrefix}<em style={{ fontStyle: "italic" }}>{headingItalic}</em>{headingSuffix}
        </h1>

        <div className="sc-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 18 }}>
          <div className="glass" style={{ padding: 24 }}>
            {!isMasyarakat && (
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
                  1 · Pilih pasien
                </h3>
                {!patient ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 24, minHeight: 232 }}>
                    {!patientsLoaded
                      ? Array.from({ length: 4 }).map((_, i) => (
                          <div
                            key={i}
                            className="skel"
                            style={{ height: 52, borderRadius: 14 }}
                            aria-hidden
                          />
                        ))
                      : patients.length === 0
                        ? (
                            <div
                              className="glass-thin"
                              style={{ padding: 16, fontSize: 13, color: "var(--ink-3)" }}
                            >
                              Tidak ada pasien terdaftar.
                            </div>
                          )
                        : patients.slice(0, 4).map((p) => (
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
                                  {p.umur || "-"} thn · {p.kategori || p.A?.diagnosa || "-"}
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
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                    }}
                  >
                    <div
                      style={{
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
                          setActiveMeds([]);
                          setScanned(false);
                          setResult(null);
                        }}
                        style={{ alignSelf: "flex-start", padding: 6 }}
                        aria-label="Lepas pasien"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                          <path d="m6 6 12 12M18 6 6 18" />
                        </svg>
                      </button>
                    </div>
                    <div
                      data-testid="active-meds-panel"
                      style={{
                        borderTop: "1px dashed var(--line)",
                        paddingTop: 10,
                      }}
                    >
                      <div
                        className="mono"
                        style={{
                          fontSize: 10,
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          color: "var(--ink-3)",
                          marginBottom: 6,
                        }}
                      >
                        Obat aktif pasien
                      </div>
                      {activeMeds.length > 0 ? (
                        <>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {activeMeds.map((m) => (
                              <span
                                key={m}
                                className="chip"
                                style={{
                                  background: "var(--teal-soft)",
                                  borderColor: "var(--teal-soft)",
                                  color: "var(--teal-deep)",
                                  fontSize: 12,
                                }}
                              >
                                {m}
                              </span>
                            ))}
                          </div>
                          <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 6 }}>
                            Diambil dari resep kunjungan terakhir dan otomatis dimasukkan ke daftar obat di bawah.
                          </div>
                        </>
                      ) : (
                        <div style={{ fontSize: 12, color: "var(--ink-3)" }}>
                          Tidak ada resep aktif tercatat pada kunjungan terakhir.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
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
              {isMasyarakat ? "1 · Tambah obat yang Anda konsumsi" : "2 · Tambah obat untuk diskrining"}
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
                      key={d.key}
                      onClick={() => addDrug(d)}
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

            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8, minHeight: 28 }}>
              {drugs.map((lookupName) => (
                <span
                  key={lookupName}
                  className="chip"
                  style={{ background: "var(--ink)", color: "var(--bg)", borderColor: "var(--ink)" }}
                >
                  {displayName(lookupName)}
                  <button
                    onClick={() => removeDrug(lookupName)}
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
                  {!pickerLoaded ? "Memuat katalog obat…" : "Belum ada obat ditambahkan."}
                </span>
              )}
            </div>

            <button
              onClick={runScan}
              disabled={!canScan || scanning}
              className="btn btn-primary"
              style={{
                marginTop: 24,
                width: "100%",
                justifyContent: "center",
                padding: "16px 22px",
                opacity: !canScan ? 0.5 : 1,
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

          <div style={{ display: "flex", flexDirection: "column", gap: 18, minHeight: 360 }}>
            <div
              data-testid="safety-help-panel"
              className="glass-thin"
              style={{ padding: 14, borderRadius: 14 }}
            >
              <button
                type="button"
                onClick={() => setHelpOpen((v) => !v)}
                aria-expanded={helpOpen}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  border: "none",
                  background: "transparent",
                  padding: 0,
                  cursor: "pointer",
                  color: "var(--ink)",
                  textAlign: "left",
                }}
              >
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 13,
                    fontWeight: 500,
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 8v.01M11 12h1v4h1" />
                  </svg>
                  Cara membaca verdikt dan obat aktif
                </span>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  style={{
                    transform: helpOpen ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 160ms ease",
                  }}
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
              {helpOpen && (
                <div
                  style={{
                    marginTop: 12,
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                    fontSize: 13,
                    lineHeight: 1.55,
                    color: "var(--ink-2)",
                  }}
                >
                  <div>
                    <strong style={{ color: "var(--ink)" }}>Apa itu obat aktif?</strong>{" "}
                    Obat aktif adalah obat yang sedang dikonsumsi pasien berdasarkan resep pada kunjungan terakhir. Sistem mengambilnya otomatis dari catatan SOAP (bagian P, baris resep) dan memasukkannya ke daftar obat agar selalu ikut dicek bersama obat baru.
                  </div>
                  <div>
                    <strong style={{ color: "var(--ink)" }}>Bagaimana VERDIKT dihitung?</strong>{" "}
                    Setiap efek samping yang dikenali diberi bobot keparahan: <em>ringan = 1</em>, <em>sedang = 2</em>, <em>serius = 4</em>. Total bobot dibagi bobot maksimum (jumlah efek dikali 4) menghasilkan skor 0-100. Skor di bawah 40 = label <em>rendah</em>, 40-69 = <em>sedang</em>, 70 ke atas = <em>tinggi</em>. VERDIKT di kartu utama adalah label tertinggi di antara semua obat dan interaksi yang dicek.
                  </div>
                  <div>
                    <strong style={{ color: "var(--ink)" }}>Kenapa muncul banyak kartu?</strong>{" "}
                    Tiap kartu mewakili satu pasangan obat atau satu efek samping dari satu obat yang dikenali. Jika Anda mengecek tiga obat, sistem menampilkan kartu untuk setiap kombinasi yang berisiko (pasangan A-B, B-C, A-C) plus kartu per efek samping yang relevan. Warna kartu menandakan tingkat keparahan: hijau = ringan, kuning = sedang, merah = serius.
                  </div>
                </div>
              )}
            </div>
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
                      const aName = displayName(r.a);
                      const bName = r.b ? displayName(r.b) : null;
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
                    {isMasyarakat
                      ? "Tambahkan obat yang Anda konsumsi. Sistem akan cocokkan dengan database interaksi BPOM."
                      : "Pilih pasien dan tambahkan obat. Sistem akan cross-reference terhadap riwayat alergi, obat aktif, dan database interaksi BPOM."}
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
