export interface MonthlyVisit {
  month: string;
  visits: number;
  newPatients: number;
}

export interface ComplaintDistribution {
  complaint: string;
  count: number;
  percentage: number;
  color: string;
}

export const monthlyVisits: MonthlyVisit[] = [
  { month: "Apr 2025", visits: 180, newPatients: 22 },
  { month: "May 2025", visits: 210, newPatients: 28 },
  { month: "Jun 2025", visits: 195, newPatients: 18 },
  { month: "Jul 2025", visits: 240, newPatients: 35 },
  { month: "Aug 2025", visits: 225, newPatients: 30 },
  { month: "Sep 2025", visits: 260, newPatients: 32 },
  { month: "Oct 2025", visits: 275, newPatients: 28 },
  { month: "Nov 2025", visits: 290, newPatients: 25 },
  { month: "Dec 2025", visits: 250, newPatients: 20 },
  { month: "Jan 2026", visits: 310, newPatients: 38 },
  { month: "Feb 2026", visits: 298, newPatients: 30 },
  { month: "Mar 2026", visits: 342, newPatients: 42 },
];

export const complaintDistribution: ComplaintDistribution[] = [
  { complaint: "Hipertensi", count: 185, percentage: 22, color: "#3b82f6" },
  { complaint: "Diabetes Mellitus", count: 142, percentage: 17, color: "#8b5cf6" },
  { complaint: "GERD/Dispepsia", count: 118, percentage: 14, color: "#06b6d4" },
  { complaint: "Infeksi Saluran Napas", count: 98, percentage: 12, color: "#ec4899" },
  { complaint: "Nyeri Sendi", count: 82, percentage: 10, color: "#22c55e" },
  { complaint: "Alergi/Dermatitis", count: 68, percentage: 8, color: "#f59e0b" },
  { complaint: "Asma", count: 52, percentage: 6, color: "#ef4444" },
  { complaint: "Migrain", count: 42, percentage: 5, color: "#64748b" },
  { complaint: "Lainnya", count: 48, percentage: 6, color: "#94a3b8" },
];
