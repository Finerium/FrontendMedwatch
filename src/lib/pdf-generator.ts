/**
 * PDF generator delegates to backend /api/pdf/* endpoints.
 */
import { downloadBlob } from "@/lib/api";

export type ReportOptions = {
  reportType: "rekam-medis" | "laporan-bulanan";
  pasienId?: string;
  month?: string;
};

export async function generateReport(opts: ReportOptions): Promise<void> {
  if (opts.reportType === "rekam-medis") {
    if (!opts.pasienId) throw new Error("pasienId required for rekam-medis");
    await downloadBlob(
      "/api/pdf/generate-rekam-medis",
      { pasien_id: opts.pasienId },
      `rekam-medis-${opts.pasienId}.pdf`,
    );
    return;
  }
  await downloadBlob(
    "/api/pdf/generate-laporan-bulanan",
    { month: opts.month || "" },
    `laporan-bulanan-${opts.month || "semua"}.pdf`,
  );
}
