/**
 * Create-patient form. Marked `"use client"` because it manages a deep
 * SOAP form state, runs numeric validation live (B03 fix), and pushes
 * the user to the detail page once the backend POST returns. Required
 * fields mirror the backend contract so a successful client submit is
 * always accepted by the API.
 */
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, ApiError } from "@/lib/api";
import { todayDDMMYYYY, type Patient } from "@/lib/patient-format";
import {
  NUMERIC_RANGES,
  validateField,
  validateObjective,
  type ObjectiveNumericKey,
} from "@/lib/patient-validation";

/**
 * Return a blank SOAP form pre-filled with today's date so the bidan
 * does not have to retype it for the common path.
 *
 * @returns Empty patient record sans id.
 */
function emptyPatient(): Omit<Patient, "id"> {
  return {
    nama: "",
    umur: "",
    alamat: "",
    kategori: "",
    tanggal_kunjungan: todayDDMMYYYY(),
    S: { keluhan: "", riwayat: "" },
    O: {
      tekanan_darah: "",
      nadi: "",
      suhu_c: "",
      respirasi: "",
      bb_kg: "",
      tb_cm: "",
      lila_cm: "",
      catatan: "",
    },
    A: { diagnosa: "" },
    P: { tindakan: "", resep: "", jadwal_kontrol: "" },
  };
}

/**
 * Render the SOAP creation wizard. Live-validates the Objective block,
 * surfaces inline error messages in Bahasa Indonesia, and POSTs the
 * record once the user clicks "Simpan SOAP".
 */
export default function NewPatientPage() {
  const router = useRouter();
  const [form, setForm] = useState<Omit<Patient, "id">>(emptyPatient);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<ObjectiveNumericKey, string>>>({});

  const update = <K extends keyof Omit<Patient, "id">>(key: K, value: Omit<Patient, "id">[K]) =>
    setForm((s) => ({ ...s, [key]: value }));
  const updateO = (key: keyof Patient["O"], value: string) => {
    setForm((s) => ({ ...s, O: { ...s.O, [key]: value } }));
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
    setForm((s) => ({ ...s, S: { ...s.S, [key]: value } }));
  const updateA = (key: keyof Patient["A"], value: string) =>
    setForm((s) => ({ ...s, A: { ...s.A, [key]: value } }));
  const updateP = (key: keyof Patient["P"], value: string) =>
    setForm((s) => ({ ...s, P: { ...s.P, [key]: value } }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nama.trim() || !form.S.keluhan.trim() || !form.A.diagnosa.trim() || !form.P.tindakan.trim()) {
      setError("Field nama, keluhan (S), diagnosa (A), dan tindakan (P) wajib diisi.");
      return;
    }
    const errs = validateObjective(form.O);
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      setError("Periksa kembali nilai numerik pada bagian Objective.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const created = await api.post<Patient>("/api/patients", form);
      router.replace(`/patients/${created.id}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Gagal menyimpan pasien");
      setSubmitting(false);
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
          Tambah pasien · SOAP baru
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
          Pasien <em style={{ fontStyle: "italic" }}>baru</em>.
        </h1>

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="glass" style={{ padding: 24 }}>
            <h3 className="mono" style={sectionTitleStyle}>1 · Identitas</h3>
            <div style={twoColStyle}>
              <Field label="Nama (wajib)">
                <input
                  className="input"
                  value={form.nama}
                  onChange={(e) => update("nama", e.target.value)}
                  placeholder="Ny. Sumarni Pertiwi"
                  required
                />
              </Field>
              <Field label="Umur">
                <input
                  className="input"
                  value={form.umur || ""}
                  onChange={(e) => update("umur", e.target.value)}
                  placeholder="52"
                />
              </Field>
              <Field label="Alamat">
                <input
                  className="input"
                  value={form.alamat || ""}
                  onChange={(e) => update("alamat", e.target.value)}
                  placeholder="Kp. Selang Cau"
                />
              </Field>
              <Field label="Kategori">
                <input
                  className="input"
                  value={form.kategori || ""}
                  onChange={(e) => update("kategori", e.target.value)}
                  placeholder="Ibu Hamil, KB, Anak…"
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
            <h3 className="mono" style={sectionTitleStyle}>2 · S - Subjective (wajib)</h3>
            <Field label="Keluhan">
              <textarea
                className="input"
                rows={3}
                value={form.S.keluhan}
                onChange={(e) => updateS("keluhan", e.target.value)}
                placeholder="mengeluh mual, muntah, telat mens…"
                required
              />
            </Field>
            <Field label="Riwayat">
              <textarea
                className="input"
                rows={2}
                value={form.S.riwayat || ""}
                onChange={(e) => updateS("riwayat", e.target.value)}
                placeholder="riwayat kehamilan / penyakit"
              />
            </Field>
          </div>

          <div className="glass" style={{ padding: 24 }}>
            <h3 className="mono" style={sectionTitleStyle}>3 · O - Objective</h3>
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
                  placeholder="50"
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
                  placeholder="150"
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
                  placeholder="23"
                  aria-invalid={fieldErrors.lila_cm ? true : undefined}
                />
              </Field>
              <Field label="Nadi (x/menit)" error={fieldErrors.nadi}>
                <input
                  className="input"
                  type="number"
                  min={NUMERIC_RANGES.nadi.min}
                  max={NUMERIC_RANGES.nadi.max}
                  step={NUMERIC_RANGES.nadi.step}
                  inputMode="numeric"
                  value={form.O.nadi || ""}
                  onChange={(e) => updateO("nadi", e.target.value)}
                  placeholder="80"
                  aria-invalid={fieldErrors.nadi ? true : undefined}
                />
              </Field>
              <Field label="Suhu (°C)" error={fieldErrors.suhu_c}>
                <input
                  className="input"
                  type="number"
                  min={NUMERIC_RANGES.suhu_c.min}
                  max={NUMERIC_RANGES.suhu_c.max}
                  step={NUMERIC_RANGES.suhu_c.step}
                  inputMode="decimal"
                  value={form.O.suhu_c || ""}
                  onChange={(e) => updateO("suhu_c", e.target.value)}
                  placeholder="36.5"
                  aria-invalid={fieldErrors.suhu_c ? true : undefined}
                />
              </Field>
              <Field label="Respirasi (x/menit)" error={fieldErrors.respirasi}>
                <input
                  className="input"
                  type="number"
                  min={NUMERIC_RANGES.respirasi.min}
                  max={NUMERIC_RANGES.respirasi.max}
                  step={NUMERIC_RANGES.respirasi.step}
                  inputMode="numeric"
                  value={form.O.respirasi || ""}
                  onChange={(e) => updateO("respirasi", e.target.value)}
                  placeholder="20"
                  aria-invalid={fieldErrors.respirasi ? true : undefined}
                />
              </Field>
            </div>
            <Field label="Catatan tambahan">
              <textarea
                className="input"
                rows={2}
                value={form.O.catatan || ""}
                onChange={(e) => updateO("catatan", e.target.value)}
                placeholder="tespek positif, DJJ 140 x/menit…"
              />
            </Field>
          </div>

          <div className="glass" style={{ padding: 24 }}>
            <h3 className="mono" style={sectionTitleStyle}>4 · A - Assessment (wajib)</h3>
            <Field label="Diagnosa">
              <textarea
                className="input"
                rows={2}
                value={form.A.diagnosa}
                onChange={(e) => updateA("diagnosa", e.target.value)}
                placeholder="G1P0A0 hamil 5 mg"
                required
              />
            </Field>
          </div>

          <div className="glass" style={{ padding: 24 }}>
            <h3 className="mono" style={sectionTitleStyle}>5 · P - Plan (wajib)</h3>
            <Field label="Tindakan (multi-baris)">
              <textarea
                className="input"
                rows={4}
                value={form.P.tindakan}
                onChange={(e) => updateP("tindakan", e.target.value)}
                placeholder={"Istirahat cukup\nMakan sedikit tapi sering\nAsam folat 1x1 sehari"}
                required
              />
            </Field>
            <Field label="Resep">
              <input
                className="input"
                value={form.P.resep || ""}
                onChange={(e) => updateP("resep", e.target.value)}
                placeholder="Asam folat 1x1, vitamin"
              />
            </Field>
            <Field label="Jadwal Kontrol">
              <input
                className="input"
                value={form.P.jadwal_kontrol || ""}
                onChange={(e) => updateP("jadwal_kontrol", e.target.value)}
                placeholder="2 minggu lagi"
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

          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button
              type="button"
              className="btn"
              onClick={() => router.push("/patients")}
              disabled={submitting}
            >
              Batal
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
              style={{ minWidth: 160, justifyContent: "center" }}
            >
              {submitting ? "Menyimpan…" : "Simpan SOAP"}
            </button>
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
