export interface DashboardStat {
  id: string;
  label: string;
  value: number;
  previousValue: number;
  format: "number" | "percent";
  icon: string;
  color: "blue" | "purple" | "teal" | "pink" | "green" | "amber";
}

export interface SparklinePoint {
  date: string;
  value: number;
}

export const dashboardStats: DashboardStat[] = [
  { id: "total-drugs", label: "Total Obat di Database", value: 127, previousValue: 115, format: "number", icon: "Pill", color: "blue" },
  { id: "total-patients", label: "Total Pasien Terdaftar", value: 1243, previousValue: 1180, format: "number", icon: "Users", color: "purple" },
  { id: "active-warnings", label: "Peringatan Aktif", value: 18, previousValue: 22, format: "number", icon: "AlertTriangle", color: "amber" },
  { id: "monthly-visits", label: "Kunjungan Bulan Ini", value: 342, previousValue: 298, format: "number", icon: "Activity", color: "teal" },
  { id: "recall-alerts", label: "Alert Recall Obat", value: 5, previousValue: 3, format: "number", icon: "XCircle", color: "pink" },
  { id: "safety-checks", label: "Safety Check Hari Ini", value: 47, previousValue: 38, format: "number", icon: "ShieldCheck", color: "green" },
];

export const sparklineData: Record<string, SparklinePoint[]> = {
  "total-drugs": [
    { date: "Mar 24", value: 122 },
    { date: "Mar 25", value: 123 },
    { date: "Mar 26", value: 124 },
    { date: "Mar 27", value: 125 },
    { date: "Mar 28", value: 126 },
    { date: "Mar 29", value: 126 },
    { date: "Mar 30", value: 127 },
  ],
  "total-patients": [
    { date: "Mar 24", value: 1210 },
    { date: "Mar 25", value: 1218 },
    { date: "Mar 26", value: 1225 },
    { date: "Mar 27", value: 1230 },
    { date: "Mar 28", value: 1235 },
    { date: "Mar 29", value: 1240 },
    { date: "Mar 30", value: 1243 },
  ],
  "active-warnings": [
    { date: "Mar 24", value: 20 },
    { date: "Mar 25", value: 22 },
    { date: "Mar 26", value: 21 },
    { date: "Mar 27", value: 19 },
    { date: "Mar 28", value: 18 },
    { date: "Mar 29", value: 18 },
    { date: "Mar 30", value: 18 },
  ],
  "monthly-visits": [
    { date: "Mar 24", value: 280 },
    { date: "Mar 25", value: 295 },
    { date: "Mar 26", value: 305 },
    { date: "Mar 27", value: 318 },
    { date: "Mar 28", value: 330 },
    { date: "Mar 29", value: 335 },
    { date: "Mar 30", value: 342 },
  ],
  "recall-alerts": [
    { date: "Mar 24", value: 3 },
    { date: "Mar 25", value: 3 },
    { date: "Mar 26", value: 4 },
    { date: "Mar 27", value: 4 },
    { date: "Mar 28", value: 5 },
    { date: "Mar 29", value: 5 },
    { date: "Mar 30", value: 5 },
  ],
  "safety-checks": [
    { date: "Mar 24", value: 35 },
    { date: "Mar 25", value: 42 },
    { date: "Mar 26", value: 38 },
    { date: "Mar 27", value: 45 },
    { date: "Mar 28", value: 40 },
    { date: "Mar 29", value: 44 },
    { date: "Mar 30", value: 47 },
  ],
};
