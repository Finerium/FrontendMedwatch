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
  display_name?: string;
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
  // Multi-source enrichment fields (openFDA + RxNorm + DailyMed).
  rxcui?: string | number | null;
  rxnorm_name?: string;
  sumber?: string;
  sumber_list?: string[];
  spl_setid?: string;
  spl_title?: string;
};

/** UI-side drug shape consumed by drug search, comparison, and safety. */
export type DisplayDrug = {
  id: string;
  name: string;
  /** Raw catalog name (generic/brand) used for backend lookups and deep links;
   * the clean `name` (display_name) is for showing only and may not match. */
  lookupName: string;
  generic: string;
  class: string;
  forms: string[];
  otc: boolean;
  popularity: number;
  summary: string;
  warnings: string[];
  interactions: number;
  // Multi-source enrichment fields surfaced in the detail panel.
  ingredients: string[];
  rxcui: string | null;
  sources: string[];
  splSetId: string;
  splTitle: string;
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
    name: b.display_name || b.nama_obat,
    lookupName: b.nama_obat,
    generic,
    class: b.kategori || "Obat",
    forms: b.dosis_umum ? [b.dosis_umum] : [],
    otc: OTC_KATEGORI.has((b.kategori || "").toLowerCase()),
    popularity: Math.max(1, 100 - idx),
    summary: (b.indikasi || []).join(", ") || "Informasi klinis belum tersedia untuk obat ini.",
    warnings: b.peringatan || [],
    interactions: (b.interaksi || []).length,
    ingredients: b.bahan_aktif || [],
    rxcui: b.rxcui != null && b.rxcui !== "" ? String(b.rxcui) : null,
    sources: b.sumber_list && b.sumber_list.length > 0
      ? b.sumber_list
      : (b.sumber ? b.sumber.split(" + ") : ["openFDA"]),
    splSetId: b.spl_setid || "",
    splTitle: b.spl_title || "",
  };
}
