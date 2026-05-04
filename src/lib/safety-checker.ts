/**
 * Safety checker now calls the backend /api/safety/check.
 */
import { api } from "@/lib/api";

export type SafetyResult = {
  drugs: Array<{
    obat: { nama_obat: string; kategori: string };
    skor_risiko: number;
    label_risiko: "rendah" | "sedang" | "tinggi";
    ringkasan_keparahan: { serius: number; sedang: number; ringan: number };
    efek_dikenali: Array<{ nama_efek: string; tingkat_keparahan: string; rekomendasi: string }>;
  }>;
  interactions: Array<{ nama_efek: string; obat_terkait: string[]; tingkat_tertinggi: string }>;
  severity_score: number;
  severity_level: "low" | "medium" | "high";
  warnings: string[];
  obat_tidak_ditemukan: string[];
  pasien_context: { id: string; nama: string; kategori?: string; diagnosa?: string } | null;
};

export async function checkDrugSafety(drugs: string[], pasienId?: string): Promise<SafetyResult> {
  return await api.post<SafetyResult>("/api/safety/check", {
    drugs,
    pasien_id: pasienId,
  });
}
