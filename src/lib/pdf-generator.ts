import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Patient } from "./store";
import { drugs } from "@/data/drugs";

export type ReportOptions = {
  reportType: "monthly" | "drug-profile" | "complete";
  startDate: string;
  endDate: string;
  includeCharts: boolean;
  includeSafety: boolean;
};

function formatDateID(dateStr: string): string {
  const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  const d = new Date(dateStr);
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function addHeader(doc: jsPDF, options: ReportOptions) {
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("MedWatch", 14, 22);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120, 120, 120);
  doc.text("Sistem Monitoring Keamanan Obat & Manajemen Klinik Bidan", 14, 28);

  doc.setDrawColor(59, 130, 246);
  doc.setLineWidth(0.5);
  doc.line(14, 32, pageWidth - 14, 32);

  let title = "";
  switch (options.reportType) {
    case "monthly":
      title = "Rekap Pasien Bulanan";
      break;
    case "drug-profile":
      title = "Profil Keamanan Obat";
      break;
    case "complete":
      title = "Laporan Lengkap";
      break;
  }

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 41, 59);
  doc.text(title, 14, 42);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text(`Periode: ${formatDateID(options.startDate)} - ${formatDateID(options.endDate)}`, 14, 48);
  doc.text(`Tanggal generate: ${formatDateID(new Date().toISOString())}`, 14, 53);
}

function addMonthlyReport(doc: jsPDF, patients: Patient[], options: ReportOptions) {
  const filtered = patients.filter((p) => {
    const d = new Date(p.visitDate);
    return d >= new Date(options.startDate) && d <= new Date(options.endDate);
  });

  const totalPatients = filtered.length;
  const avgAge = totalPatients > 0 ? Math.round(filtered.reduce((s, p) => s + p.age, 0) / totalPatients) : 0;
  const femaleCount = filtered.filter((p) => p.gender === "Perempuan").length;
  const maleCount = filtered.filter((p) => p.gender === "Laki-laki").length;

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 41, 59);
  doc.text("Ringkasan", 14, 63);

  autoTable(doc, {
    startY: 67,
    head: [["Metrik", "Nilai"]],
    body: [
      ["Total Pasien", String(totalPatients)],
      ["Rata-rata Usia", `${avgAge} tahun`],
      ["Laki-laki", String(maleCount)],
      ["Perempuan", String(femaleCount)],
    ],
    theme: "grid",
    headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: "bold" },
    styles: { fontSize: 9, cellPadding: 4 },
    columnStyles: { 0: { fontStyle: "bold" } },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const afterSummaryY = (doc as any).lastAutoTable?.finalY ?? 100;

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 41, 59);
  doc.text("Daftar Pasien", 14, afterSummaryY + 10);

  const tableData = filtered.map((p, i) => [
    String(i + 1),
    p.id.slice(0, 12),
    p.name,
    `${p.age} / ${p.gender === "Laki-laki" ? "L" : "P"}`,
    formatDateID(p.visitDate),
    p.diagnosis,
  ]);

  autoTable(doc, {
    startY: afterSummaryY + 14,
    head: [["No", "ID", "Nama", "Usia/JK", "Tgl Kunjungan", "Diagnosa"]],
    body: tableData,
    theme: "striped",
    headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: "bold" },
    styles: { fontSize: 8, cellPadding: 3, overflow: "linebreak" },
    columnStyles: {
      0: { cellWidth: 12 },
      1: { cellWidth: 28, font: "courier" },
      2: { cellWidth: 40 },
      3: { cellWidth: 22 },
      4: { cellWidth: 30 },
      5: { cellWidth: 40 },
    },
  });
}

function addDrugProfileReport(doc: jsPDF, patients: Patient[], options: ReportOptions) {
  const filtered = patients.filter((p) => {
    const d = new Date(p.visitDate);
    return d >= new Date(options.startDate) && d <= new Date(options.endDate);
  });

  const drugCounts: Record<string, number> = {};
  for (const p of filtered) {
    for (const drug of p.prescribedDrugs) {
      drugCounts[drug] = (drugCounts[drug] ?? 0) + 1;
    }
  }

  const sorted = Object.entries(drugCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let startY = (doc as any).lastAutoTable?.finalY ?? 58;
  if (startY > 240) {
    doc.addPage();
    startY = 20;
  }

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 41, 59);
  doc.text("Top 10 Obat yang Diresepkan", 14, startY + 10);

  autoTable(doc, {
    startY: startY + 14,
    head: [["Ranking", "Nama Obat", "Jumlah Resep", "Kategori"]],
    body: sorted.map(([name, count], i) => {
      const drug = drugs.find((d) => d.name === name);
      return [String(i + 1), name, String(count), drug?.category ?? "-"];
    }),
    theme: "grid",
    headStyles: { fillColor: [139, 92, 246], textColor: 255, fontStyle: "bold" },
    styles: { fontSize: 9, cellPadding: 4 },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let afterTableY = (doc as any).lastAutoTable?.finalY ?? startY + 60;
  if (afterTableY > 220) {
    doc.addPage();
    afterTableY = 20;
  }

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 41, 59);
  doc.text("Profil Keamanan Obat", 14, afterTableY + 10);

  const profileData = sorted.slice(0, 10).map(([name]) => {
    const drug = drugs.find((d) => d.name === name);
    if (!drug) return [name, "-", "-", "-", "-"];
    const severeCount = drug.sideEffects.filter((se) => se.severity === "Severe").length;
    const totalSideEffects = drug.sideEffects.length;
    return [
      drug.name,
      drug.category,
      drug.recallStatus === "recalled" ? "DITARIK" : drug.recallStatus === "watch" ? "Pengawasan" : "Aman",
      String(totalSideEffects),
      String(severeCount),
    ];
  });

  autoTable(doc, {
    startY: afterTableY + 14,
    head: [["Obat", "Kategori", "Status", "Total ES", "ES Berat"]],
    body: profileData,
    theme: "striped",
    headStyles: { fillColor: [139, 92, 246], textColor: 255, fontStyle: "bold" },
    styles: { fontSize: 8, cellPadding: 3 },
  });
}

function addFooter(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(148, 163, 184);

    doc.text(`Klinik MedWatch`, 14, pageHeight - 10);
    doc.text(`medwatch-frontend.vercel.app`, pageWidth / 2, pageHeight - 10, { align: "center" });
    doc.text(`Halaman ${i} dari ${pageCount}`, pageWidth - 14, pageHeight - 10, { align: "right" });
  }
}

export async function generateReport(
  patients: Patient[],
  options: ReportOptions
): Promise<jsPDF> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  addHeader(doc, options);

  switch (options.reportType) {
    case "monthly":
      addMonthlyReport(doc, patients, options);
      break;
    case "drug-profile":
      addDrugProfileReport(doc, patients, options);
      break;
    case "complete":
      addMonthlyReport(doc, patients, options);
      doc.addPage();
      addHeader(doc, { ...options, reportType: "drug-profile" });
      addDrugProfileReport(doc, patients, options);
      break;
  }

  addFooter(doc);

  return doc;
}
