/**
 * Type definitions plus the POST helper that hits the backend interaction
 * engine at /api/safety/check. All scoring and Indonesian explanation
 * text is produced server-side; the client only renders the response.
 *
 * Key exports: `SafetyResult` and `checkDrugSafety`.
 */
import { api } from "@/lib/api";

/** Response shape returned by POST /api/safety/check. */
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

/**
 * Ask the backend to score a list of drugs for interaction risk, optionally
 * tightening the analysis with the patient's clinical context (B05 active
 * meds awareness depends on this).
 *
 * @param drugs - Drug names exactly as entered by the user.
 * @param pasienId - Optional patient identifier; when present the backend
 *   merges the patient's active medication list into the analysis.
 * @returns Backend-computed safety result.
 */
export async function checkDrugSafety(drugs: string[], pasienId?: string): Promise<SafetyResult> {
  return await api.post<SafetyResult>("/api/safety/check", {
    drugs,
    pasien_id: pasienId,
  });
}
