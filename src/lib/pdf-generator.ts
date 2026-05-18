/**
 * Thin facade over the backend PDF endpoints. The Python service does the
 * actual rendering (anggota5/export_pdf, exposed under /api/pdf/*); this
 * module just chooses the right endpoint, builds the JSON body, and
 * streams the binary back through `downloadBlob`.
 *
 * Key exports: `ReportOptions` and `generateReport`.
 */
import { downloadBlob } from "@/lib/api";

/** Inputs accepted by `generateReport`. */
export type ReportOptions = {
  reportType: "rekam-medis" | "laporan-bulanan";
  pasienId?: string;
  month?: string;
};

/**
 * Trigger a PDF download for either a single-patient SOAP record or the
 * admin monthly aggregate. The filename hint helps the browser save the
 * file with a meaningful name.
 *
 * @param opts - Report selector plus optional patient id or month.
 * @throws When pasienId is missing for the rekam-medis report type.
 */
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
