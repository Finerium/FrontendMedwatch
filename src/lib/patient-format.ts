/**
 * Patient SOAP type definitions and bidan-friendly display helpers. The
 * types mirror the canonical shape used by the Python backend
 * `api/storage` module so client and server agree about field names.
 *
 * Key exports: types `Patient`, `PatientSummary`, `PatientObjective`;
 * helpers `formatTanggalLong`, `composeO`, `todayDDMMYYYY`,
 * `parseResepToMeds`.
 */

/** Objective vital signs block in the SOAP record. */
export type PatientObjective = {
  tekanan_darah?: string;
  nadi?: string;
  suhu_c?: string;
  respirasi?: string;
  bb_kg?: string;
  tb_cm?: string;
  lila_cm?: string;
  catatan?: string;
};

/** Full SOAP patient record returned by GET /api/patients/{id}. */
export type Patient = {
  id: string;
  tanggal_kunjungan?: string;
  nama: string;
  umur?: string;
  alamat?: string;
  kategori?: string;
  S: { keluhan: string; riwayat?: string };
  O: PatientObjective;
  A: { diagnosa: string };
  P: { tindakan: string; resep?: string; jadwal_kontrol?: string };
  created_by?: string;
  owner_username?: string;
};

/**
 * Lightweight summary returned by the list endpoint. The backend orders
 * these newest-created first (by `created_at`, then id) and paginates them
 * with `limit`/`offset`, so the list never pulls the full SOAP payload.
 */
export type PatientSummary = {
  id: string;
  nama: string;
  umur?: string;
  tanggal_kunjungan?: string;
  kategori?: string;
  created_at?: string;
};

const NAMA_BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

/**
 * Render a dd-MM-yyyy string as "d Bulan yyyy" in Bahasa Indonesia.
 * Falls back to the raw input when the format is unrecognised so the UI
 * never silently drops data.
 *
 * @param tanggal - Date string in dd-MM-yyyy format.
 * @returns Indonesian long-form date or "-" when missing.
 */
export function formatTanggalLong(tanggal: string | undefined): string {
  if (!tanggal) return "-";
  const parts = tanggal.split("-");
  if (parts.length !== 3) return tanggal;
  const [d, m, y] = parts;
  const monthIdx = parseInt(m) - 1;
  if (monthIdx < 0 || monthIdx > 11) return tanggal;
  return `${parseInt(d)} ${NAMA_BULAN[monthIdx]} ${y}`;
}

/**
 * Compose the Objective section of a SOAP record into a single human
 * sentence. Used in patient detail headers and PDF previews where the
 * vitals must be readable at a glance.
 *
 * @param o - Objective block from a Patient record.
 * @returns Single-line summary or "-" when nothing is recorded.
 */
export function composeO(o: PatientObjective | undefined): string {
  if (!o) return "-";
  const parts: string[] = [];
  if (o.tekanan_darah) parts.push(`td. ${o.tekanan_darah}`);
  if (o.nadi) parts.push(`nadi ${o.nadi} x/menit`);
  if (o.suhu_c) parts.push(`suhu ${o.suhu_c}°C`);
  if (o.respirasi) parts.push(`respirasi ${o.respirasi} x/menit`);
  if (o.bb_kg) parts.push(`BB ${o.bb_kg} kg`);
  if (o.tb_cm) parts.push(`tb ${o.tb_cm}`);
  if (o.lila_cm) parts.push(`lila ${o.lila_cm} cm`);
  if (o.catatan) parts.push(o.catatan);
  return parts.length > 0 ? parts.join(", ") : "-";
}

/**
 * Local-time helper that returns today as dd-MM-yyyy. Backend expects the
 * Indonesian locale format on every patient write.
 *
 * @returns Today as a dd-MM-yyyy string.
 */
export function todayDDMMYYYY(): string {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = d.getFullYear();
  return `${dd}-${mm}-${yy}`;
}

/**
 * Parse a bidan-typed `P.resep` field into a clean list of drug names.
 * Mirrors the backend `parse_resep_to_meds` rules so the UI can preview the
 * patient's active medications immediately when a patient is selected, before
 * the safety check API call returns.
 *
 * Rules:
 *  1. Split on newline, semicolon, and comma.
 *  2. Strip dosage hints like `1x1 sehari`, `3x500mg`, `500mg`, parenthetical
 *     notes, and Latin frequency tokens (prn, qd, bid, tid, qid).
 *  3. Collapse whitespace, dedupe case-insensitively, drop empty/numeric.
 */
export function parseResepToMeds(resep: string | undefined | null): string[] {
  if (!resep || typeof resep !== "string") return [];
  const fragments = resep.split(/[\n;,]+/);
  const dosageRe =
    /\s+(\d+\s*x\s*\d+(?:\s*(?:mg|mcg|ml|g|tablet|tab|kaps|kapsul|sdt|sdm|tetes|cc))?(?:\s*(?:sehari|per\s*hari|hari|sebelum|sesudah|pagi|siang|sore|malam))?|\d+\s*(?:mg|mcg|ml|g|tablet|tab|kaps|kapsul|sdt|sdm|tetes|cc)\b(?:\s*(?:sehari|per\s*hari|hari))?|\d+\s*(?:sehari|per\s*hari|hari|kali|x)\b|\(.*?\)).*$/i;
  const trailingNoteRe = /\s+(prn|p\.r\.n|jika\s+perlu|bila\s+perlu|qd|bid|tid|qid)\b.*$/i;
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of fragments) {
    let name = (raw || "").trim();
    if (!name) continue;
    name = name.replace(dosageRe, "");
    name = name.replace(trailingNoteRe, "");
    name = name.replace(/\s+/g, " ").replace(/^[\s.;:-]+|[\s.;:-]+$/g, "");
    if (!name) continue;
    if (/^\d+$/.test(name)) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(name);
  }
  return out;
}
