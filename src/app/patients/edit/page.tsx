/**
 * Edit-patient SOAP form. Uses a query parameter (`?id=`) instead of a
 * dynamic route segment so the page can be statically exported without
 * needing `dynamicParams = true`. The same code previously lived under
 * `src/app/patients/[id]/page.tsx` and is preserved verbatim except for
 * the way the id is read (now via `useSearchParams`).
 *
 * Marked `"use client"` because it hydrates a route-scoped record on
 * mount, runs live numeric validation (B03), and ships PUT/DELETE
 * mutations through the API helper.
 */
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import type { Patient } from "@/lib/patient-format";
import { NavIcon } from "@/components/shell/NavIcon";
import {
  NUMERIC_RANGES,
  validateField,
  validateObjective,
  validateUmur,
  type ObjectiveNumericKey,
} from "@/lib/patient-validation";

/**
 * Route entry point. Suspense-wraps the inner form because
 * `useSearchParams` requires a boundary under the App Router static
 * export.
 *
 * @returns The interactive patient edit form behind a Suspense fallback.
 */
export default function EditPatientPage() {
  return (
    <Suspense fallback={null}>
      <EditPatientInner />
    </Suspense>
  );
}

/**
 * Interactive body of the patient edit page.
 */
function EditPatientInner() {
  const router = useRouter();
  const params = useSearchParams();
  const id = params.get("id") || "";

  const [form, setForm] = useState<Patient | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<ObjectiveNumericKey, string>>>({});
  const [umurError, setUmurError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await api.get<Patient>(`/api/patients/${id}`);
        if (!cancelled) {
          setForm({
            ...data,
            S: { keluhan: data.S?.keluhan || "", riwayat: data.S?.riwayat || "" },
            O: data.O || {},
            A: { diagnosa: data.A?.diagnosa || "" },
            P: {
              tindakan: data.P?.tindakan || "",
              resep: data.P?.resep || "",
              jadwal_kontrol: data.P?.jadwal_kontrol || "",
            },
          });
        }
      } catch (e) {
        if (!cancelled) setLoadError(e instanceof ApiError ? e.message : "Gagal memuat pasien");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (!form) {
    return (
      <div className="page-in" style={{ padding: "160px 24px 80px", maxWidth: 1100, margin: "0 auto" }}>
        <div className="glass" style={{ padding: 40, textAlign: "center" }}>
          <p style={{ color: "var(--ink-3)" }}>{loadError || "Memuat data pasien..."}</p>
        </div>
      </div>
    );
  }

  const update = <K extends keyof Patient>(key: K, value: Patient[K]) => {
    setForm((s) => (s ? { ...s, [key]: value } : s));
    if (key === "umur") {
      setUmurError(validateUmur(value as string));
    }
  };
  const updateO = (key: keyof Patient["O"], value: string) => {
    setForm((s) => (s ? { ...s, O: { ...s.O, [key]: value } } : s));
    if (
      key === "tekanan_darah" ||
      key === "bb_kg" ||
      key === "tb_cm" ||
      key === "lila_cm" ||
      key === "nadi" ||
      key === "suhu_c" ||
      key === "respirasi"
    ) {
      const msg = validateField(key, value);
      setFieldErrors((prev) => {
        const next = { ...prev };
        if (msg) next[key] = msg;
        else delete next[key];
        return next;
      });
    }
  };
  const updateS = (key: keyof Patient["S"], value: string) =>
    setForm((s) => (s ? { ...s, S: { ...s.S, [key]: value } } : s));
  const updateA = (key: keyof Patient["A"], value: string) =>
    setForm((s) => (s ? { ...s, A: { ...s.A, [key]: value } } : s));
  const updateP = (key: keyof Patient["P"], value: string) =>
    setForm((s) => (s ? { ...s, P: { ...s.P, [key]: value } } : s));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    if (!form.nama.trim() || !form.S.keluhan.trim() || !form.A.diagnosa.trim() || !form.P.tindakan.trim()) {
      setError("Field nama, keluhan (S), diagnosa (A), dan tindakan (P) wajib diisi.");
      return;
    }
    const umurMsg = validateUmur(form.umur);
    if (umurMsg) {
      setUmurError(umurMsg);
      setError("Periksa kembali nilai umur.");
      return;
    }
    const errs = validateObjective(form.O);
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      setError("Periksa kembali nilai numerik pada bagian Objective.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api.put(`/api/patients/${id}`, form);
      router.push("/patients");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Gagal menyimpan");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!confirm(`Hapus pasien ${form.id} (${form.nama})? Tindakan ini tidak dapat dibatalkan.`)) return;
    setBusy(true);
    setError(null);
    try {
      await api.delete(`/api/patients/${id}`);
      router.push("/patients");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Gagal menghapus");
      setBusy(false);
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
          top: 100,
          right: -80,
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
          Edit pasien . {form.id}
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
          {form.nama || "Pasien"}<em style={{ fontStyle: "italic", opacity: 0.4 }}>.</em>
        </h1>

        <form onSubmit={save} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="glass" style={{ padding: 24 }}>
            <h3 className="mono" style={sectionTitleStyle}>1 . Identitas</h3>
            <div style={twoColStyle}>
              <Field label="Nama (wajib)">
                <input
                  className="input"
                  value={form.nama}
                  onChange={(e) => update("nama", e.target.value)}
                  required
                />
              </Field>
              <Field label="Umur" error={umurError ?? undefined}>
                <input
                  className="input"
                  value={form.umur || ""}
                  onChange={(e) => update("umur", e.target.value)}
                  aria-invalid={umurError ? true : undefined}
                />
              </Field>
              <Field label="Alamat">
                <input
                  className="input"
                  value={form.alamat || ""}
                  onChange={(e) => update("alamat", e.target.value)}
                />
              </Field>
              <Field label="Kategori">
                <input
                  className="input"
                  value={form.kategori || ""}
                  onChange={(e) => update("kategori", e.target.value)}
                />
              </Field>
              <Field label="Tanggal Kunjungan">
                <input
                  className="input"
                  value={form.tanggal_kunjungan || ""}
                  onChange={(e) => update("tanggal_kunjungan", e.target.value)}
                  placeholder="DD-MM-YYYY"
                />
              </Field>
            </div>
          </div>

          <div className="glass" style={{ padding: 24 }}>
            <h3 className="mono" style={sectionTitleStyle}>2 . S - Subjective</h3>
            <Field label="Keluhan (wajib)">
              <textarea
                className="input"
                rows={3}
                value={form.S.keluhan}
                onChange={(e) => updateS("keluhan", e.target.value)}
                required
              />
            </Field>
            <Field label="Riwayat">
              <textarea
                className="input"
                rows={2}
                value={form.S.riwayat || ""}
                onChange={(e) => updateS("riwayat", e.target.value)}
              />
            </Field>
          </div>

          <div className="glass" style={{ padding: 24 }}>
            <h3 className="mono" style={sectionTitleStyle}>3 . O - Objective</h3>
            <div style={twoColStyle}>
              <Field label="Tekanan darah (td.)" error={fieldErrors.tekanan_darah}>
                <input
                  className="input"
                  inputMode="numeric"
                  pattern="\d{1,3}/\d{1,3}"
                  value={form.O.tekanan_darah || ""}
                  onChange={(e) => updateO("tekanan_darah", e.target.value)}
                  placeholder="110/70"
                  aria-invalid={fieldErrors.tekanan_darah ? true : undefined}
                />
              </Field>
              <Field label="BB (kg)" error={fieldErrors.bb_kg}>
                <input
                  className="input"
                  type="number"
                  min={NUMERIC_RANGES.bb_kg.min}
                  max={NUMERIC_RANGES.bb_kg.max}
                  step={NUMERIC_RANGES.bb_kg.step}
                  inputMode="decimal"
                  value={form.O.bb_kg || ""}
                  onChange={(e) => updateO("bb_kg", e.target.value)}
                  aria-invalid={fieldErrors.bb_kg ? true : undefined}
                />
              </Field>
              <Field label="tb (cm)" error={fieldErrors.tb_cm}>
                <input
                  className="input"
                  type="number"
                  min={NUMERIC_RANGES.tb_cm.min}
                  max={NUMERIC_RANGES.tb_cm.max}
                  step={NUMERIC_RANGES.tb_cm.step}
                  inputMode="decimal"
                  value={form.O.tb_cm || ""}
                  onChange={(e) => updateO("tb_cm", e.target.value)}
                  aria-invalid={fieldErrors.tb_cm ? true : undefined}
                />
              </Field>
              <Field label="lila (cm)" error={fieldErrors.lila_cm}>
                <input
                  className="input"
                  type="number"
                  min={NUMERIC_RANGES.lila_cm.min}
                  max={NUMERIC_RANGES.lila_cm.max}
                  step={NUMERIC_RANGES.lila_cm.step}
                  inputMode="decimal"
                  value={form.O.lila_cm || ""}
                  onChange={(e) => updateO("lila_cm", e.target.value)}
                  aria-invalid={fieldErrors.lila_cm ? true : undefined}
                />
              </Field>
              <Field label="Nadi" error={fieldErrors.nadi}>
                <input
                  className="input"
                  type="number"
                  min={NUMERIC_RANGES.nadi.min}
                  max={NUMERIC_RANGES.nadi.max}
                  step={NUMERIC_RANGES.nadi.step}
                  inputMode="numeric"
                  value={form.O.nadi || ""}
                  onChange={(e) => updateO("nadi", e.target.value)}
                  aria-invalid={fieldErrors.nadi ? true : undefined}
                />
              </Field>
              <Field label="Suhu (C)" error={fieldErrors.suhu_c}>
                <input
                  className="input"
                  type="number"
                  min={NUMERIC_RANGES.suhu_c.min}
                  max={NUMERIC_RANGES.suhu_c.max}
                  step={NUMERIC_RANGES.suhu_c.step}
                  inputMode="decimal"
                  value={form.O.suhu_c || ""}
                  onChange={(e) => updateO("suhu_c", e.target.value)}
                  aria-invalid={fieldErrors.suhu_c ? true : undefined}
                />
              </Field>
              <Field label="Respirasi" error={fieldErrors.respirasi}>
                <input
                  className="input"
                  type="number"
                  min={NUMERIC_RANGES.respirasi.min}
                  max={NUMERIC_RANGES.respirasi.max}
                  step={NUMERIC_RANGES.respirasi.step}
                  inputMode="numeric"
                  value={form.O.respirasi || ""}
                  onChange={(e) => updateO("respirasi", e.target.value)}
                  aria-invalid={fieldErrors.respirasi ? true : undefined}
                />
              </Field>
            </div>
            <Field label="Catatan">
              <textarea
                className="input"
                rows={2}
                value={form.O.catatan || ""}
                onChange={(e) => updateO("catatan", e.target.value)}
              />
            </Field>
          </div>

          <div className="glass" style={{ padding: 24 }}>
            <h3 className="mono" style={sectionTitleStyle}>4 . A - Assessment</h3>
            <Field label="Diagnosa (wajib)">
              <textarea
                className="input"
                rows={2}
                value={form.A.diagnosa}
                onChange={(e) => updateA("diagnosa", e.target.value)}
                required
              />
            </Field>
          </div>

          <div className="glass" style={{ padding: 24 }}>
            <h3 className="mono" style={sectionTitleStyle}>5 . P - Plan</h3>
            <Field label="Tindakan (wajib)">
              <textarea
                className="input"
                rows={4}
                value={form.P.tindakan}
                onChange={(e) => updateP("tindakan", e.target.value)}
                required
              />
            </Field>
            <Field label="Resep">
              <input
                className="input"
                value={form.P.resep || ""}
                onChange={(e) => updateP("resep", e.target.value)}
              />
            </Field>
            <Field label="Jadwal Kontrol">
              <input
                className="input"
                value={form.P.jadwal_kontrol || ""}
                onChange={(e) => updateP("jadwal_kontrol", e.target.value)}
              />
            </Field>
          </div>

          {error && (
            <div
              style={{
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

          <div
            style={{
              display: "flex",
              gap: 8,
              justifyContent: "space-between",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              className="btn"
              onClick={remove}
              disabled={busy}
              style={{
                color: "var(--crit-deep)",
                borderColor: "color-mix(in oklab, var(--crit) 40%, transparent)",
              }}
            >
              Hapus pasien
            </button>
            <div style={{ display: "flex", gap: 8 }}>
              <Link href="/patients" className="btn" style={{ textDecoration: "none" }}>
                Batal
              </Link>
              <Link
                href="/safety-checker"
                className="btn"
                style={{ textDecoration: "none" }}
              >
                <NavIcon name="shield" /> Cek interaksi
              </Link>
              <button type="submit" className="btn btn-primary" disabled={busy}>
                {busy ? "Menyimpan..." : "Simpan perubahan"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "var(--ink-3)",
  marginBottom: 14,
};

const twoColStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 12,
  marginBottom: 12,
};

/**
 * Labelled field wrapper used by every input on the form.
 *
 * @param props.label - Uppercase mono caption above the control.
 * @param props.children - The actual input/textarea control.
 * @param props.error - Optional error string rendered below the control.
 */
function Field({
  label,
  children,
  error,
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
      <span
        className="mono"
        style={{
          fontSize: 10,
          letterSpacing: "0.1em",
          color: "var(--ink-3)",
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
      {children}
      {error && (
        <span
          role="alert"
          style={{
            fontSize: 12,
            color: "var(--crit-deep)",
            marginTop: 2,
          }}
        >
          {error}
        </span>
      )}
    </label>
  );
}
