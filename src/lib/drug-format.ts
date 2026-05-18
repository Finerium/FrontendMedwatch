/**
 * Adapter between the Indonesian backend drug schema (built by anggota4)
 * and the camelCase display shape consumed by the redesigned drug search
 * and safety checker pages. Keeping the translation here means the UI can
 * be reskinned without touching the backend payload contract.
 *
 * Key exports: `BackendDrug`, `DisplayDrug`, `slugifyDrugId`, and
 * `backendToDisplayDrug`.
 */

/** Shape returned by GET /api/drugs/* (Indonesian field names). */
export type BackendDrug = {
  nama_obat: string;
  alias?: string[];
  kategori?: string;
  bahan_aktif?: string[];
  indikasi?: string[];
  dosis_umum?: string;
  kehamilan?: string;
  peringatan?: string[];
  kontraindikasi?: string[];
  interaksi?: string[];
  efek_samping?: string[];
};

/** UI-side drug shape consumed by drug search, comparison, and safety. */
export type DisplayDrug = {
  id: string;
  name: string;
  generic: string;
  class: string;
  forms: string[];
  otc: boolean;
  popularity: number;
  summary: string;
  warnings: string[];
  interactions: number;
};

const OTC_KATEGORI = new Set([
  "analgesik dan antipiretik",
  "antihistamin",
  "antasida",
  "vitamin dan mineral",
]);

/**
 * Convert a free-form drug name into a URL-safe identifier used as the
 * stable React key and (where applicable) the route parameter.
 *
 * @param name - Drug name as it appears in the backend payload.
 * @returns Lowercase, hyphenated, ASCII-only slug.
 */
export function slugifyDrugId(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

/**
 * Translate a backend drug payload into the camelCase display shape.
 * Popularity is synthesised from the original list index so the most
 * recent backend ordering is preserved when the UI sorts by popularity.
 *
 * @param b - Backend payload row.
 * @param idx - Zero-based position in the original list; used to derive
 *   the synthetic popularity score.
 * @returns DisplayDrug ready for the search/comparison UI.
 */
export function backendToDisplayDrug(b: BackendDrug, idx = 0): DisplayDrug {
  const generic =
    (b.alias && b.alias.length > 0 ? b.alias[0] : "") ||
    (b.bahan_aktif && b.bahan_aktif.length > 0 ? b.bahan_aktif.join(", ") : b.nama_obat);
  return {
    id: slugifyDrugId(b.nama_obat),
    name: b.nama_obat,
    generic,
    class: b.kategori || "Obat",
    forms: b.dosis_umum ? [b.dosis_umum] : [],
    otc: OTC_KATEGORI.has((b.kategori || "").toLowerCase()),
    popularity: Math.max(1, 100 - idx),
    summary: (b.indikasi || []).join(", ") || (b.kehamilan || ""),
    warnings: b.peringatan || [],
    interactions: (b.interaksi || []).length,
  };
}
