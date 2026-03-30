export interface ProvinceData {
  id: string;
  name: string;
  clinicCount: number;
  patientCount: number;
  density: "Very Low" | "Low" | "Medium" | "High" | "Very High";
}

export const provinceData: ProvinceData[] = [
  { id: "ID-AC", name: "Aceh", clinicCount: 12, patientCount: 89, density: "Low" },
  { id: "ID-SU", name: "Sumatera Utara", clinicCount: 28, patientCount: 215, density: "Medium" },
  { id: "ID-SB", name: "Sumatera Barat", clinicCount: 15, patientCount: 112, density: "Low" },
  { id: "ID-RI", name: "Riau", clinicCount: 14, patientCount: 98, density: "Low" },
  { id: "ID-JA", name: "Jambi", clinicCount: 8, patientCount: 56, density: "Very Low" },
  { id: "ID-SS", name: "Sumatera Selatan", clinicCount: 18, patientCount: 134, density: "Medium" },
  { id: "ID-BE", name: "Bengkulu", clinicCount: 5, patientCount: 32, density: "Very Low" },
  { id: "ID-LA", name: "Lampung", clinicCount: 16, patientCount: 120, density: "Medium" },
  { id: "ID-BB", name: "Kep. Bangka Belitung", clinicCount: 4, patientCount: 24, density: "Very Low" },
  { id: "ID-KR", name: "Kep. Riau", clinicCount: 6, patientCount: 42, density: "Very Low" },
  { id: "ID-JK", name: "DKI Jakarta", clinicCount: 65, patientCount: 520, density: "Very High" },
  { id: "ID-JB", name: "Jawa Barat", clinicCount: 78, patientCount: 680, density: "Very High" },
  { id: "ID-JT", name: "Jawa Tengah", clinicCount: 55, patientCount: 445, density: "Very High" },
  { id: "ID-YO", name: "DI Yogyakarta", clinicCount: 22, patientCount: 178, density: "High" },
  { id: "ID-JI", name: "Jawa Timur", clinicCount: 62, patientCount: 510, density: "Very High" },
  { id: "ID-BT", name: "Banten", clinicCount: 30, patientCount: 240, density: "High" },
  { id: "ID-BA", name: "Bali", clinicCount: 18, patientCount: 145, density: "Medium" },
  { id: "ID-NB", name: "Nusa Tenggara Barat", clinicCount: 10, patientCount: 72, density: "Low" },
  { id: "ID-NT", name: "Nusa Tenggara Timur", clinicCount: 8, patientCount: 48, density: "Very Low" },
  { id: "ID-KB", name: "Kalimantan Barat", clinicCount: 9, patientCount: 64, density: "Low" },
  { id: "ID-KT", name: "Kalimantan Tengah", clinicCount: 6, patientCount: 38, density: "Very Low" },
  { id: "ID-KS", name: "Kalimantan Selatan", clinicCount: 11, patientCount: 82, density: "Low" },
  { id: "ID-KI", name: "Kalimantan Timur", clinicCount: 13, patientCount: 95, density: "Low" },
  { id: "ID-KU", name: "Kalimantan Utara", clinicCount: 3, patientCount: 18, density: "Very Low" },
  { id: "ID-SA", name: "Sulawesi Utara", clinicCount: 10, patientCount: 75, density: "Low" },
  { id: "ID-ST", name: "Sulawesi Tengah", clinicCount: 7, patientCount: 45, density: "Very Low" },
  { id: "ID-SN", name: "Sulawesi Selatan", clinicCount: 25, patientCount: 198, density: "Medium" },
  { id: "ID-SG", name: "Sulawesi Tenggara", clinicCount: 6, patientCount: 35, density: "Very Low" },
  { id: "ID-GO", name: "Gorontalo", clinicCount: 4, patientCount: 22, density: "Very Low" },
  { id: "ID-SR", name: "Sulawesi Barat", clinicCount: 3, patientCount: 15, density: "Very Low" },
  { id: "ID-MA", name: "Maluku", clinicCount: 5, patientCount: 28, density: "Very Low" },
  { id: "ID-MU", name: "Maluku Utara", clinicCount: 3, patientCount: 16, density: "Very Low" },
  { id: "ID-PA", name: "Papua", clinicCount: 7, patientCount: 38, density: "Very Low" },
  { id: "ID-PB", name: "Papua Barat", clinicCount: 4, patientCount: 20, density: "Very Low" },
];

// Map from GeoJSON Propinsi names to province data
const geoNameMap: Record<string, string> = {
  "NUSATENGGARA BARAT": "Nusa Tenggara Barat",
  "NUSA TENGGARA BARAT": "Nusa Tenggara Barat",
  "NUSA TENGGARA TIMUR": "Nusa Tenggara Timur",
  "DAERAH ISTIMEWA YOGYAKARTA": "DI Yogyakarta",
  "DKI JAKARTA": "DKI Jakarta",
  "KEPULAUAN RIAU": "Kep. Riau",
  "BANGKA BELITUNG": "Kep. Bangka Belitung",
  "KEPULAUAN BANGKA BELITUNG": "Kep. Bangka Belitung",
  "DI. ACEH": "Aceh",
  "NANGGROE ACEH DARUSSALAM": "Aceh",
  "ACEH": "Aceh",
  "IRIAN JAYA BARAT": "Papua Barat",
  "PAPUA BARAT": "Papua Barat",
};

export function getProvinceByGeoName(geoName: string): ProvinceData | undefined {
  if (!geoName) return undefined;
  // First check explicit mapping
  const mappedName = geoNameMap[geoName.toUpperCase().trim()];
  if (mappedName) {
    return provinceData.find((p) => p.name === mappedName);
  }
  // Fall back to case-insensitive match
  const normalized = geoName.toLowerCase().trim();
  return provinceData.find((p) => p.name.toLowerCase() === normalized);
}
