/**
 * Patient SOAP schema (matches backend api/storage canonical shape).
 * Helper functions for bidan-style display rendering.
 */

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

export type PatientSummary = {
  id: string;
  nama: string;
  umur?: string;
  tanggal_kunjungan?: string;
  kategori?: string;
};

const NAMA_BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export function formatTanggalLong(tanggal: string | undefined): string {
  if (!tanggal) return "-";
  const parts = tanggal.split("-");
  if (parts.length !== 3) return tanggal;
  const [d, m, y] = parts;
  const monthIdx = parseInt(m) - 1;
  if (monthIdx < 0 || monthIdx > 11) return tanggal;
  return `${parseInt(d)} ${NAMA_BULAN[monthIdx]} ${y}`;
}

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

export function todayDDMMYYYY(): string {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = d.getFullYear();
  return `${dd}-${mm}-${yy}`;
}
