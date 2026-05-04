"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import type { Patient } from "@/lib/patient-format";
import { NavIcon } from "@/components/shell/NavIcon";

export default function EditPatientPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = typeof params.id === "string" ? params.id : "";

  const [form, setForm] = useState<Patient | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          <p style={{ color: "var(--ink-3)" }}>{loadError || "Memuat data pasien…"}</p>
        </div>
      </div>
    );
  }

  const update = <K extends keyof Patient>(key: K, value: Patient[K]) =>
    setForm((s) => (s ? { ...s, [key]: value } : s));
  const updateO = (key: keyof Patient["O"], value: string) =>
    setForm((s) => (s ? { ...s, O: { ...s.O, [key]: value } } : s));
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
          Edit pasien · {form.id}
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
            <h3 className="mono" style={sectionTitleStyle}>1 · Identitas</h3>
            <div style={twoColStyle}>
              <Field label="Nama (wajib)">
                <input
                  className="input"
                  value={form.nama}
                  onChange={(e) => update("nama", e.target.value)}
                  required
                />
              </Field>
              <Field label="Umur">
                <input
                  className="input"
                  value={form.umur || ""}
                  onChange={(e) => update("umur", e.target.value)}
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
            <h3 className="mono" style={sectionTitleStyle}>2 · S — Subjective</h3>
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
            <h3 className="mono" style={sectionTitleStyle}>3 · O — Objective</h3>
            <div style={twoColStyle}>
              <Field label="Tekanan darah (td.)">
                <input
                  className="input"
                  value={form.O.tekanan_darah || ""}
                  onChange={(e) => updateO("tekanan_darah", e.target.value)}
                />
              </Field>
              <Field label="BB (kg)">
                <input
                  className="input"
                  value={form.O.bb_kg || ""}
                  onChange={(e) => updateO("bb_kg", e.target.value)}
                />
              </Field>
              <Field label="tb (cm)">
                <input
                  className="input"
                  value={form.O.tb_cm || ""}
                  onChange={(e) => updateO("tb_cm", e.target.value)}
                />
              </Field>
              <Field label="lila (cm)">
                <input
                  className="input"
                  value={form.O.lila_cm || ""}
                  onChange={(e) => updateO("lila_cm", e.target.value)}
                />
              </Field>
              <Field label="Nadi">
                <input
                  className="input"
                  value={form.O.nadi || ""}
                  onChange={(e) => updateO("nadi", e.target.value)}
                />
              </Field>
              <Field label="Suhu (°C)">
                <input
                  className="input"
                  value={form.O.suhu_c || ""}
                  onChange={(e) => updateO("suhu_c", e.target.value)}
                />
              </Field>
              <Field label="Respirasi">
                <input
                  className="input"
                  value={form.O.respirasi || ""}
                  onChange={(e) => updateO("respirasi", e.target.value)}
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
            <h3 className="mono" style={sectionTitleStyle}>4 · A — Assessment</h3>
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
            <h3 className="mono" style={sectionTitleStyle}>5 · P — Plan</h3>
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
                {busy ? "Menyimpan…" : "Simpan perubahan"}
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
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
    </label>
  );
}
