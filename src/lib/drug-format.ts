/**
 * Map backend drug payload (Indonesian schema from anggota4) to the display
 * shape expected by the redesigned drug search and safety checker pages.
 */

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

export function slugifyDrugId(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

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
